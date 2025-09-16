import { getRedisClient } from "../config/redis.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

import { generateStoryPart, generateChoices, consolidateStory } from '../services/mistralService.js';

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

        console.log(`📊 Voting results for room ${roomId} (Round ${room.currentRound + 1}):`, voteCounts);
        console.log(`🏆 Winning choice: "${chosenAction}"`);

        // Increment round counter FIRST
        room.currentRound += 1;

        // Add the chosen action to the story
        room.story.push({
            type: 'choice',
            content: `The group decided to: ${chosenAction}`,
            timestamp: new Date().toISOString(),
            round: room.currentRound
        });

        // Generate next story part with AI (passing round information)
        console.log('🤖 Generating AI story continuation...');
        const nextStoryPart = await generateStoryPart(room.story, chosenAction, room.currentRound - 1, room.numberOfRounds);
        room.story.push({
            type: 'narrative',
            content: nextStoryPart,
            timestamp: new Date().toISOString(),
            round: room.currentRound
        });

        // Check if game should end
        if (room.currentRound >= room.numberOfRounds) {
            console.log(`🏁 Game completed after ${room.numberOfRounds} rounds`);

            // Generate final conclusion
            const conclusion = await generateStoryPart(
                room.story,
                "bring the story to a satisfying conclusion",
                room.currentRound,
                room.numberOfRounds
            );

            room.story.push({
                type: 'conclusion',
                content: conclusion,
                timestamp: new Date().toISOString(),
                round: room.currentRound
            });

            console.log('✍️ Consolidating the final story...');
            room.finalStory = await consolidateStory(room.story);

            room.status = 'completed';
            room.completedAt = new Date().toISOString();

            // Save completed room
            await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

            // Notify clients of completion
            const publicRoomData = { ...room, votes: undefined };
            io.to(roomId).emit('game-completed', publicRoomData);
            io.to(roomId).emit('room-updated', publicRoomData);

            console.log('✅ Game completed successfully');
            return;
        }

        // Generate new choices with AI (passing round information)
        console.log('🤖 Generating AI choices...');
        room.currentChoices = await generateChoices(room.story, room.currentRound - 1, room.numberOfRounds);
        room.votes = {}; // Reset votes

        // Save updated room
        await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

        // Notify clients
        const publicRoomData = { ...room, votes: undefined };
        io.to(roomId).emit('voting-ended', publicRoomData);
        io.to(roomId).emit('room-updated', publicRoomData);

        console.log(`✅ Round ${room.currentRound} setup complete`);

        // Start next voting round after a brief delay
        setTimeout(() => {
            io.to(roomId).emit('voting-started', {
                choices: room.currentChoices,
                timeLimit: VOTING_TIMEOUT,
                currentRound: room.currentRound,
                totalRounds: room.numberOfRounds
            });
        }, 3000); // 3 second delay to read the story

    } catch (error) {
        console.error('Error processing voting results:', error);
        // Fallback to continue the game even if AI fails
        room.currentRound += 1;

        if (room.currentRound >= room.numberOfRounds) {
            room.status = 'completed';
            room.completedAt = new Date().toISOString();
            const publicRoomData = { ...room, votes: undefined };
            io.to(roomId).emit('game-completed', publicRoomData);
            return;
        }

        room.currentChoices = ["Continue forward", "Look around", "Take a break"];
        io.to(roomId).emit('voting-started', {
            choices: room.currentChoices,
            timeLimit: VOTING_TIMEOUT,
            currentRound: room.currentRound,
            totalRounds: room.numberOfRounds
        });
    }
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
                const player = room.players.find(p => p.id === socket.playerId);
                if (!player || !player.isHost) {
                    socket.emit('error', { message: 'Only the host can start the game' });
                    return;
                }

                room.status = 'playing';
                room.currentRound = 0;
                room.story = [{
                    type: 'prompt',
                    content: room.storyPrompt,
                    timestamp: new Date().toISOString(),
                    round: 0
                }];

                // Generate initial choices with AI
                room.currentChoices = await generateChoices(room.story, -1, room.numberOfRounds);
                room.status = 'voting';
                room.votes = {};

                await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

                const publicRoomData = { ...room, votes: undefined };
                io.to(roomId).emit('game-started', publicRoomData);
                io.to(roomId).emit('voting-started', {
                    choices: room.currentChoices,
                    timeLimit: VOTING_TIMEOUT,
                    currentRound: room.currentRound,
                    totalRounds: room.numberOfRounds
                });

                console.log(`🎮 Game started in room ${roomId} for ${room.numberOfRounds} rounds`);
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
                console.log(`🗳️ Player ${player.name} voted for choice ${choiceIndex} (Round ${room.currentRound + 1})`);

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
                    console.error('Error handling disconnect:', error);
                }
            }
        });
    })
}

export default gameSocketHandlers;