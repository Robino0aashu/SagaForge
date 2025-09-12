import  {getRedisClient} from "../config/redis.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const VOTING_TIMEOUT = process.env.VOTING_TIMEOUT;

const gameSocketHandlers = (io) => {
    const votingTimers = new Map();

    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('join-room', async (data) => {
            try {
                console.log('join-room event received:', data);
                const { roomId, playerName, playerId } = data;  // playerId may be provided or not
                const redis = getRedisClient();

                if (!roomId || !playerName) {
                    socket.emit('error', { message: "Room ID and player name are required" });
                    return;
                }

                const roomData = await redis.get(`room:${roomId}`);
                if (!roomData) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }

                const room = JSON.parse(roomData);

                // If playerId provided, try to update socketId for existing player (host or returning player)
                if (playerId) {
                    const existingPlayer = room.players.find(p => p.id === playerId);
                    if (existingPlayer) {
                        existingPlayer.socketId = socket.id;
                        socket.playerId = existingPlayer.id;
                        socket.playerName = existingPlayer.name;
                        socket.roomId = roomId;

                        await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));

                        socket.join(roomId);

                        const publicRoomData = { ...room, votes: undefined };
                        io.to(roomId).emit('room-updated', publicRoomData);

                        socket.emit('joined-room', {
                            success: true,
                            playerId: existingPlayer.id,
                            roomData: publicRoomData
                        });

                        console.log(`🔄 Player ${existingPlayer.name} re-joined room ${roomId}`);
                        return;
                    }
                    // If playerId provided but not found, fall through to add new player
                }

                // No playerId or not found: Add new player (allow duplicate names)
                const newPlayerId = uuidv4();
                room.players.push({
                    id: newPlayerId,
                    name: playerName,
                    socketId: socket.id,
                    isHost: false
                });

                socket.playerId = newPlayerId;
                socket.playerName = playerName;
                socket.roomId = roomId;

                await redis.setEx(`room:${roomId}`, 24 * 60 * 60, JSON.stringify(room));
                socket.join(roomId);

                const publicRoomData = { ...room, votes: undefined };
                io.to(roomId).emit('room-updated', publicRoomData);
                socket.emit('joined-room', {
                    success: true,
                    playerId: newPlayerId,
                    roomData: publicRoomData
                });

                console.log(`👥 New player ${playerName} joined room ${roomId}`);
            }
            catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
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
                const player = room.players.find(p => p.socketId === socket.id);
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
            }
            catch (error) {
                console.error('Error starting game:', error);
                socket.emit('error', { message: 'Failed to start game' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    })
}

export default gameSocketHandlers;