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

    // Join a room - simplified to just emit, let GameRoom handle responses
    joinRoom(roomId, playerName, playerId = null) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        console.log('📡 Attempting to join room:', { roomId, playerName, playerId });
        
        // Just emit the join request - responses will be handled by GameRoom listeners
        this.socket.emit('join-room', {
            roomId,
            playerName,
            playerId
        });

        // Return a simple promise that resolves immediately
        return Promise.resolve({ success: true });
    }

    // Start game (host only)
    startGame(roomId) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }

        console.log('🎮 Starting game for room:', roomId);
        this.socket.emit('start-game', { roomId });
        return Promise.resolve({ success: true });
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