import { useParams, useNavigate } from 'react-router-dom';
import socketManager from '../utils/socket';
import React, { useState, useEffect, useRef } from 'react';

function GameRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const connectionAttempted = useRef(false);

    const [gameData, setGameData] = useState(null);
    const [roomState, setRoomState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');

    useEffect(() => {
        // Prevent duplicate connections in React StrictMode
        if (connectionAttempted.current) {
            return;
        }

        // Get stored game data
        const storedData = localStorage.getItem('gameData');
        if (!storedData) {
            navigate('/');
            return;
        }

        const data = JSON.parse(storedData);
        if (data.roomId !== roomId) {
            navigate('/');
            return;
        }

        setGameData(data);
        connectionAttempted.current = true;
        connectToRoom(data);

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up GameRoom...');
            socketManager.removeAllListeners();
            socketManager.disconnect();
            connectionAttempted.current = false;
        };
    }, [roomId, navigate]);

    const connectToRoom = async (data) => {
        console.log('🔍 connectToRoom called with:', data);

        try {
            setLoading(true);
            setConnectionStatus('Connecting to server...');

            // Connect socket first
            socketManager.connect();

            // Set up event listeners BEFORE joining room
            socketManager.on('room-updated', (roomData) => {
                console.log('📡 Room updated:', roomData);
                setRoomState(roomData);
                setConnected(true);
                setLoading(false);
                setConnectionStatus('Connected');
            });

            socketManager.on('joined-room', (response) => {
                console.log('✅ Joined room response:', response);
                if (response.success) {
                    setRoomState(response.roomData);
                    setConnected(true);
                    setLoading(false);
                    setConnectionStatus('Connected');
                } else {
                    setError(response.error || 'Failed to join room');
                    setLoading(false);
                }
            });

            socketManager.on('game-started', (roomData) => {
                console.log('🎮 Game started:', roomData);
                setRoomState(roomData);
            });

            socketManager.on('voting-started', (votingData) => {
                console.log('🗳️ Voting started:', votingData);
                // Update room state with voting data
                setRoomState(prev => ({
                    ...prev,
                    status: 'voting',
                    currentChoices: votingData.choices
                }));
            });
            socketManager.on('vote-submitted', (data) => {
                console.log('Vote submitted:', data);
                setRoomState(data.roomData);
            });

            socketManager.on('voting-ended', (data) => {
                console.log('Voting ended:', data);
                setRoomState(data.roomData);
            });

            socketManager.on('story-updated', (storyData) => {
                console.log('📖 Story updated:', storyData);
                setRoomState(prev => ({
                    ...prev,
                    story: storyData.story,
                    status: storyData.status,
                    currentChoices: storyData.choices
                }));
            });

            socketManager.on('error', (error) => {
                console.error('❌ Socket error:', error);
                setError(error.message || error);
                setLoading(false);
                setConnectionStatus('Error');
            });

            socketManager.on('disconnect', () => {
                console.log('🔌 Socket disconnected');
                setConnected(false);
                setConnectionStatus('Disconnected');
            });

            socketManager.on('connect', () => {
                console.log('✅ Socket connected');
                setConnected(true);
                setConnectionStatus('Connected');
            });

            // Now join the room
            setConnectionStatus('Joining room...');
            await socketManager.joinRoom(
                data.roomId,
                data.playerName,
                data.playerId
            );

            // Set a timeout as backup
            setTimeout(() => {
                if (loading) {
                    console.log('⏰ Connection timeout, checking if we actually connected...');
                    // Don't automatically error - server might still be processing
                    setConnectionStatus('Waiting for server response...');
                }
            }, 3000);

        } catch (error) {
            console.error('❌ Failed to connect to room:', error);
            setError(error.message);
            setLoading(false);
            setConnectionStatus('Failed');
        }
    };

    const handleStartGame = async () => {
        if (!gameData?.isHost) {
            setError('Only the host can start the game');
            return;
        }

        try {
            console.log('🎮 Host starting game...');
            await socketManager.startGame(roomId);
        } catch (error) {
            console.error('Failed to start game:', error);
            setError(error.message);
        }
    };

    const handleVote = async (choiceIndex) => {
        if (!connected || !roomState.currentChoices) {
            return;
        }

        try {
            console.log('🗳️ Voting for choice:', choiceIndex);

            // Emit vote to server
            socketManager.socket.emit('vote', {
                roomId: roomId,
                choiceIndex: choiceIndex
            });

        } catch (error) {
            console.error('Error voting:', error);
            setError('Failed to submit vote');
        }
    };

    const handleLeaveRoom = () => {
        socketManager.disconnect();
        navigate('/');
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>⏳ {connectionStatus}</h2>
                <p>Room ID: {roomId}</p>
                {gameData && <p>Player: {gameData.playerName} {gameData.isHost ? '(Host)' : ''}</p>}

                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '10px 20px', marginTop: '20px' }}
                >
                    Cancel & Return Home
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>❌ Connection Error</h2>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={() => navigate('/')} style={{ padding: '10px 20px' }}>
                    Return Home
                </button>
            </div>
        );
    }

    if (!roomState) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>📡 Waiting for room data...</h2>
                <p>Status: {connectionStatus}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '15px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6'
            }}>
                <div>
                    <h2>🏰 Room: {roomId}</h2>
                    <p>Status: {roomState.status} | Players: {roomState.players?.length || 0}</p>
                </div>
                <button
                    onClick={handleLeaveRoom}
                    style={{
                        padding: '8px 15px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Leave Room
                </button>
            </div>

            {/* Players List */}
            <div style={{ marginBottom: '20px' }}>
                <h3>👥 Players ({roomState.players?.length || 0})</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px'
                }}>
                    {roomState.players?.map((player) => (
                        <div
                            key={player.id}
                            style={{
                                padding: '10px',
                                background: player.isHost ? '#d4edda' : '#e9ecef',
                                border: `2px solid ${player.socketId ? '#28a745' : '#6c757d'}`,
                                borderRadius: '5px'
                            }}
                        >
                            <strong>{player.name}</strong>
                            {player.isHost && ' 👑'}
                            <br />
                            <small style={{ color: player.socketId ? '#28a745' : '#6c757d' }}>
                                {player.socketId ? '🟢 Online' : '⚫ Offline'}
                            </small>
                        </div>
                    ))}
                </div>
            </div>

            {/* Game Content */}
            {roomState.status === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '30px', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <h3>⏳ Waiting to Start</h3>
                    <p><strong>Story Prompt:</strong> {roomState.storyPrompt}</p>

                    {gameData?.isHost ? (
                        <button
                            onClick={handleStartGame}
                            style={{
                                padding: '15px 30px',
                                fontSize: '18px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                marginTop: '15px'
                            }}
                        >
                            🎮 Start Game
                        </button>
                    ) : (
                        <p>Waiting for the host to start the game...</p>
                    )}
                </div>
            )}

            {(roomState.status === 'playing' || roomState.status === 'voting') && (
                <div>
                    <h3>📖 Story</h3>
                    <div style={{
                        padding: '20px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        marginBottom: '20px'
                    }}>
                        {roomState.story?.map((part, index) => (
                            <div key={index} style={{ marginBottom: '15px' }}>
                                <strong>{part.type === 'prompt' ? '📝 Prompt' : '📖 Story'}:</strong>
                                <p>{part.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {roomState.status === 'voting' && roomState.currentChoices && (
                <div>
                    <h3>🗳️ Vote for Next Action</h3>
                    <div style={{
                        display: 'grid',
                        gap: '10px',
                        marginTop: '15px'
                    }}>
                        {roomState.currentChoices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleVote(index)}
                                style={{
                                    padding: '15px',
                                    textAlign: 'left',
                                    background: '#e9ecef',
                                    border: '1px solid #ced4da',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#dee2e6'}
                                onMouseOut={(e) => e.target.style.background = '#e9ecef'}
                            >
                                <strong>Option {index + 1}:</strong> {choice}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Connection Status */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                padding: '5px 10px',
                background: connected ? '#d4edda' : '#f8d7da',
                color: connected ? '#155724' : '#721c24',
                fontSize: '12px',
                border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`
            }}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
        </div>
    );
}

export default GameRoom;