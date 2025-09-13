import { io } from 'socket.io-client';

// The server URL is determined by environment variables, defaulting to localhost.
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

class SocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    /**
     * Establishes a connection to the Socket.IO server.
     * If already connected, it returns the existing socket instance.
     */
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

    /**
     * Disconnects the socket if it's currently connected.
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Joins a room and returns a Promise that resolves or rejects
     * based on the server's acknowledgement.
     * @param {string} roomId - The ID of the room to join.
     * @param {string} playerName - The name of the player.
     * @param {string|null} playerId - The existing ID of the player, if rejoining.
     * @returns {Promise<object>} A promise that resolves with the server response on success.
     */
    joinRoom(roomId, playerName, playerId = null) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                return reject(new Error('Socket not connected'));
            }

            console.log('📡 Attempting to join room:', { roomId, playerName, playerId });

            // Emit 'join-room' with a callback function for acknowledgement
            this.socket.emit('join-room', {
                roomId,
                playerName,
                playerId
            }, (response) => {
                // The server will call this callback with a response object
                if (response && response.success) {
                    console.log('✅ Successfully joined room:', response);
                    resolve(response); // Resolve the promise on success
                } else {
                    console.error('❌ Failed to join room:', response ? response.message : 'No response');
                    reject(new Error(response ? response.message : 'Failed to join room')); // Reject the promise on failure
                }
            });
        });
    }

    /**
     * Emits a 'start-game' event for the host.
     * Returns a promise for better async handling in the UI.
     * @param {string} roomId - The ID of the room to start the game in.
     * @returns {Promise<object>}
     */
    startGame(roomId) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                return reject(new Error('Socket not connected'));
            }

            console.log('🎮 Starting game for room:', roomId);
            // Although the server doesn't send a response, we can use a timeout
            // to handle cases where the server is unresponsive.
            this.socket.emit('start-game', { roomId }, () => {
                 // Assuming success if the server acknowledges the event
                resolve({ success: true });
            });
        });
    }

    /**
     * Adds an event listener to the socket.
     * @param {string} event - The name of the event.
     * @param {function} callback - The function to execute when the event is received.
     */
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

    /**
     * Removes a specific event listener.
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }

        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Removes all registered event listeners from the socket.
     */
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

// Export a singleton instance of the SocketManager
const socketManager = new SocketManager();

export default socketManager;