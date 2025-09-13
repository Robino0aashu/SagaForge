import { getRedisClient } from "../config/redis.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const VOTING_TIMEOUT = process.env.VOTING_TIMEOUT;

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
                            if(nextHost) nextHost.isHost = true;
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