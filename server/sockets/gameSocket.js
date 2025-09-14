import { getRedisClient } from "../config/redis.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const VOTING_TIMEOUT = process.env.VOTING_TIMEOUT;

const processVotingResults = async (roomId, room, io, redis) => {
    try {
        // Count votes
        const voteCounts = {};
        Object.values(room.votes).forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        // Find winning choice
        const winningChoice = Object.keys(voteCounts).reduce((a, b) => 
            voteCounts[a] > voteCounts[b] ? a : b
        );

        const chosenAction = room.currentChoices[winningChoice];
        
        console.log(`📊 Voting results for room ${roomId}:`, voteCounts);
        console.log(`🏆 Winning choice: "${chosenAction}"`);

        // Add the chosen action to the story
        room.story.push({
            type: 'choice',
            content: `The group decided to: ${chosenAction}`,
            timestamp: new Date().toISOString()
        });

        // Generate next story part (simple version for now)
        const nextStoryPart = generateNextStoryPart(chosenAction, room.story);
        room.story.push({
            type: 'narrative',
            content: nextStoryPart,
            timestamp: new Date().toISOString()
        });

        // Generate new choices for next round
        room.currentChoices = generateNextChoices(chosenAction);
        room.votes = {}; // Reset votes
        
        // Save updated room
        await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

        // Notify clients
        const publicRoomData = { ...room, votes: undefined };
        io.to(roomId).emit('voting-ended', publicRoomData);
        io.to(roomId).emit('room-updated', publicRoomData);
        
        // Start next voting round after a brief delay
        setTimeout(() => {
            io.to(roomId).emit('voting-started', {
                choices: room.currentChoices,
                timeLimit: VOTING_TIMEOUT
            });
        }, 3000); // 3 second delay to read the story

    } catch (error) {
        console.error('Error processing voting results:', error);
    }
};

// Generate next story part based on chosen action
const generateNextStoryPart = (chosenAction, currentStory) => {
    const storyParts = [
        `As you ${chosenAction.toLowerCase()}, you discover something unexpected...`,
        `Your decision to ${chosenAction.toLowerCase()} leads to a surprising turn of events...`,
        `Following your choice to ${chosenAction.toLowerCase()}, the story takes an interesting direction...`,
        `The consequence of ${chosenAction.toLowerCase()} becomes clear as...`,
        `Your action to ${chosenAction.toLowerCase()} reveals new mysteries...`
    ];
    
    const randomPart = storyParts[Math.floor(Math.random() * storyParts.length)];
    return randomPart;
};

// Generate next set of choices
const generateNextChoices = (previousAction) => {
    const choiceSets = [
        [
            "Investigate further",
            "Proceed with caution", 
            "Take a different approach"
        ],
        [
            "Trust your instincts",
            "Seek help from others",
            "Try something completely different"
        ],
        [
            "Face the challenge directly",
            "Look for an alternative solution",
            "Gather more information first"
        ],
        [
            "Move forward boldly",
            "Take time to plan",
            "Consider all options"
        ]
    ];
    
    const randomSet = choiceSets[Math.floor(Math.random() * choiceSets.length)];
    return randomSet;
};

const gameSocketHandlers = (io) => {
    const votingTimers = new Map();

    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('join-room', async (data, callback) => { // Added callback for acknowledgements
            try {
                const { roomId, playerName, playerId } = data;
                const redis = getRedisClient();

                if (!roomId || !playerName) {
                    if (callback) callback({ success: false, message: "Room ID and player name are required" });
                    return;
                }

                const roomData = await redis.get(`room:${roomId}`);
                if (!roomData) {
                    if (callback) callback({ success: false, message: 'Room not found' });
                    return;
                }

                const room = JSON.parse(roomData);

                // --- Reconnection Logic ---
                if (playerId) {
                    const existingPlayer = room.players.find(p => p.id === playerId);
                    if (existingPlayer) {
                        existingPlayer.socketId = socket.id; // Update socketId on reconnect
                        socket.playerId = existingPlayer.id;
                        socket.playerName = existingPlayer.name;
                        socket.roomId = roomId;

                        await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));
                        socket.join(roomId);

                        const publicRoomData = { ...room, votes: undefined };
                        io.to(roomId).emit('room-updated', publicRoomData);

                        if (callback) callback({
                            success: true,
                            playerId: existingPlayer.id,
                            roomData: publicRoomData
                        });
                        console.log(`🔄 Player ${existingPlayer.name} re-joined room ${roomId}`);
                        return;
                    }
                    if (callback) callback({ success: false, message: 'Player ID not found in room' });
                    return;
                }

                // --- New Player Logic ---
                if (room.players.some(p => p.name === playerName)) {
                    if (callback) callback({ success: false, message: 'A player with this name already exists in this room.' });
                    return;
                }

                const newPlayerId = uuidv4();
                const newPlayer = {
                    id: newPlayerId,
                    name: playerName,
                    socketId: socket.id,
                    isHost: room.players.length === 0 // First player is the host
                };
                room.players.push(newPlayer);

                socket.playerId = newPlayerId;
                socket.playerName = playerName;
                socket.roomId = roomId;

                await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));
                socket.join(roomId);

                const publicRoomData = { ...room, votes: undefined };
                io.to(roomId).emit('room-updated', publicRoomData);

                if (callback) callback({
                    success: true,
                    playerId: newPlayerId,
                    roomData: publicRoomData
                });
                console.log(`👥 New player ${playerName} joined room ${roomId}`);

            } catch (error) {
                console.error('Error joining room:', error);
                if (callback) callback({ success: false, message: 'Failed to join room' });
            }
        });

        socket.on('start-game', async (data) => {
            try {
                const { roomId } = data;
                const redis = getRedisClient();

                const roomData = await redis.get(`room:${roomId}`);
                if (!roomData) {
                    socket.emit('error', { message: "Room not found" });
                    return;
                }

                const room = JSON.parse(roomData);
                // 🔒 SECURITY FIX: Check against the persistent playerId, not the temporary socket.id
                const player = room.players.find(p => p.id === socket.playerId);
                if (!player || !player.isHost) {
                    socket.emit('error', { message: 'Only the host can start the game' });
                    return;
                }

                room.status = 'playing';
                room.story = [{
                    type: 'prompt',
                    content: room.storyPrompt,
                    timestamp: new Date().toISOString()
                }];
                room.story.push({
                    type: 'narrative',
                    content: `The adventure begins... ${room.storyPrompt}`,
                    timestamp: new Date().toISOString()
                });
                room.currentChoices = [
                    "Explore the area carefully",
                    "Take immediate action",
                    "Look for more information"
                ];
                room.status = 'voting';
                room.votes = {};

                await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

                const publicRoomData = { ...room, votes: undefined };
                io.to(roomId).emit('game-started', publicRoomData);
                io.to(roomId).emit('voting-started', {
                    choices: room.currentChoices,
                    timeLimit: VOTING_TIMEOUT
                });

                console.log(`🎮 Game started in room ${roomId}`);
            } catch (error) {
                console.error('Error starting game:', error);
                socket.emit('error', { message: 'Failed to start game' });
            }
        });


        socket.on('vote', async (data) => {
            try {
                const { roomId, choiceIndex } = data;
                const redis = getRedisClient();

                const roomData = await redis.get(`room:${roomId}`);
                if (!roomData) {
                    socket.emit('error', { message: "Room not found" });
                    return;
                }

                const room = JSON.parse(roomData);

                // Check if player is in the room
                const player = room.players.find(p => p.id === socket.playerId);
                if (!player) {
                    socket.emit('error', { message: 'Player not found in room' });
                    return;
                }

                // Check if voting is active
                if (room.status !== 'voting') {
                    socket.emit('error', { message: 'Voting is not currently active' });
                    return;
                }

                // Record the vote
                room.votes[socket.playerId] = choiceIndex;
                console.log(`🗳️ Player ${player.name} voted for choice ${choiceIndex}`);

                // Check if all connected players have voted
                const connectedPlayers = room.players.filter(p => p.socketId);
                const allVoted = connectedPlayers.every(p => room.votes[p.id] !== undefined);

                await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

                // Emit vote confirmation
                socket.emit('vote-submitted', { success: true });

                if (allVoted) {
                    // Clear any existing voting timer
                    if (votingTimers.has(roomId)) {
                        clearTimeout(votingTimers.get(roomId));
                        votingTimers.delete(roomId);
                    }

                    // Process voting results
                    await processVotingResults(roomId, room, io, redis);
                }

            } catch (error) {
                console.error('Error processing vote:', error);
                socket.emit('error', { message: 'Failed to process vote' });
            }
        });

        // --- 👇 NEW DISCONNECT LOGIC ---
        socket.on('disconnect', async () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
            const { roomId, playerId } = socket;

            if (roomId && playerId) {
                try {
                    const redis = getRedisClient();
                    const roomData = await redis.get(`room:${roomId}`);

                    if (roomData) {
                        const room = JSON.parse(roomData);
                        const disconnectedPlayer = room.players.find(p => p.id === playerId);

                        if (!disconnectedPlayer) return;

                        // Mark player as offline instead of removing immediately
                        disconnectedPlayer.socketId = null;

                        // If the host disconnected, assign a new host
                        if (disconnectedPlayer.isHost && room.players.filter(p => p.socketId).length > 0) {
                            disconnectedPlayer.isHost = false;
                            const nextHost = room.players.find(p => p.socketId);
                            if (nextHost) nextHost.isHost = true;
                            console.log(`👑 New host assigned in room ${roomId}: ${nextHost.name}`);
                        }

                        await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

                        const publicRoomData = { ...room, votes: undefined };
                        io.to(roomId).emit('room-updated', publicRoomData);

                        console.log(`🔌 Player ${disconnectedPlayer.name} marked as offline in room ${roomId}`);
                    }
                } catch (error) {
                    Fstart
                    console.error('Error handling disconnect:', error);
                }
            }
        });
    })
}

export default gameSocketHandlers;