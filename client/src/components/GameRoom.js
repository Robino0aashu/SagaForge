import { useParams, useNavigate } from 'react-router-dom';
import socketManager from '../utils/socket';
import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../context/authContext';

import { Container, Paper, Typography, Grid, Snackbar } from '@mui/material';
import PlayerCard from './game/PlayerCard';
import PeopleIcon from '@mui/icons-material/People';
import GameHeader from './game/GameHeader';
import GameContent from './game/GameContent';
import GameStatusScreen from './game/GameStatusScreen';

import {
    Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';


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

    const [isSaving, setIsSaving] = useState(false);
    const [isPublicConfirmOpen, setIsPublicConfirmOpen] = useState(false);
    const { isGuest, token } = useAuth();

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

    const handleOpenPublicConfirm = () => {
        if (!isGuest) { // Only open for registered users
            setIsPublicConfirmOpen(true);
        }
    };

    const handleClosePublicConfirm = () => {
        setIsPublicConfirmOpen(false);
    };
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


    const handleSaveAndEndGame = async (isPublicChoice) => {
        if (!token || isGuest) {
            alert('Only registered users can save stories.');
            return;
        }

        handleClosePublicConfirm(); 
        setIsSaving(true);
        try {
            const storyContent = roomState.story || [];
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/story`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: roomState.storyPrompt,
                    content: storyContent,
                    summary: roomState.finalStory,
                    total_choices: storyContent.filter(p => p.type === 'choice').length,
                    participants: roomState.players,
                    is_public: isPublicChoice
                })
            });

            const data = await response.json();

            if (data.success) {
                // On success, disconnect and navigate
                socketManager.disconnect();
                navigate('/stories');
            } else {
                alert('Failed to save story: ' + (data.error || 'Unknown error'));// Stop loading only if there's an error
            }
        } catch (error) {
            console.error('Error saving the story:', error);
            alert('An error occurred while saving the story.'); // Stop loading on error
        }finally{
            setIsSaving(false);
        }
        
    };


    const handleLeaveRoom = () => {
        socketManager.disconnect();
        navigate('/home');
    };



    // const lastTwoStoryParts = roomState.story?.slice(-2) || [];

    if (loading || error || !roomState) {
        return (
            <GameStatusScreen
                loading={loading}
                error={error}
                connectionStatus={connectionStatus}
                roomId={roomId}
                gameData={gameData}
            />
        );
    }

    return (
         <>
            <Container maxWidth="lg" sx={{ my: 4 }}>
                <GameHeader roomId={roomId} roomState={roomState} onLeave={handleLeaveRoom} />
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={8}>
                        <GameContent
                            roomState={roomState}
                            gameData={gameData}
                            onStartGame={handleStartGame}
                            onVote={handleVote}
                            onSaveAndEnd={handleOpenPublicConfirm}
                            isSaving={isSaving}
                            isGuest={isGuest}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, position: 'sticky', top: '88px' }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ mr: 1 }} /> Players ({roomState.players?.length || 0})
                            </Typography>
                            <Grid container spacing={2}>
                                {roomState.players?.map((player) => (
                                    <Grid item xs={12} key={player.id}>
                                        <PlayerCard player={player} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Dialog open={isPublicConfirmOpen} onClose={handleClosePublicConfirm}>
                <DialogTitle>Share Your Saga?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Would you like to make this story public for others to read?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleSaveAndEndGame(false)} color="secondary">
                        Keep it Private
                    </Button>
                    <Button onClick={() => handleSaveAndEndGame(true)} variant="contained" autoFocus>
                        Make it Public
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={!connected} message="🔴 Disconnected from server..." anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );
}


export default GameRoom;