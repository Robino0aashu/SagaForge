import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

class SocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        console.log('🔌 Connecting to server...');
        this.socket = io(SERVER_URL);

        this.socket.on('connect', () => {
            console.log('✅ Connected to server:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection failed:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Join a room
    joinRoom(roomId, playerName, playerId = null) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error('⏰ Join room timeout - cleaning up listeners');
                this.socket.off('joined-room', joinHandler);
                this.socket.off('error', errorHandler);
                reject(new Error('Join room timeout'));
            }, 5000); // Reduced timeout

            const joinHandler = (data) => {
                clearTimeout(timeout);
                this.socket.off('error', errorHandler);
                if (data.success) {
                    console.log('✅ Successfully joined room:', data);
                    resolve(data);
                } else {
                    console.error('❌ Join room failed:', data);
                    reject(new Error('Failed to join room'));
                }
            };

            const errorHandler = (error) => {
                clearTimeout(timeout);
                this.socket.off('joined-room', joinHandler);
                console.error('❌ Socket error during join:', error);
                reject(new Error(error.message || 'Socket error'));
            };

            // Set up listeners BEFORE emitting
            this.socket.once('joined-room', joinHandler);
            this.socket.once('error', errorHandler);

            console.log('📡 Attempting to join room:', { roomId, playerName, playerId });
            
            // Emit the join request
            this.socket.emit('join-room', {
                roomId,
                playerName,
                playerId
            });
        });
    }

    // Start game (host only)
    startGame(roomId) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Start game timeout'));
            }, 10000);

            this.socket.once('game-started', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(error.message || 'Failed to start game'));
            });

            this.socket.emit('start-game', { roomId });
        });
    }

    // Add event listener with cleanup
    on(event, callback) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        this.socket.on(event, callback);
        
        // Store for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // Remove event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }

        // Clean up from tracking
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Clean up all listeners
    removeAllListeners() {
        if (this.socket) {
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket.off(event, callback);
                });
            });
        }
        this.listeners.clear();
    }
}

// Singleton instance
const socketManager = new SocketManager();

export default socketManager;