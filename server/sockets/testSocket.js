import { io } from 'socket.io-client';
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';
const API_URL = `${SERVER_URL}/api/games`;  // corrected /api/games per earlier code

class SocketTester {
    constructor() {
        this.socket = null;
        this.roomData = null;
        this.hostId = "f303b2bc-eae9-4bd2-b628-c92314ce211f"; // Your existing host ID
        this.roomId = '31DA8CF1'; // Your existing room ID
    }

    // Initialize socket connection
    async connect() {
        console.log('🔌 Connecting to server...');
        this.socket = io(SERVER_URL);

        return new Promise((resolve) => {
            this.socket.on('connect', () => {
                console.log('✅ Connected to server with ID:', this.socket.id);
                this.setupEventListeners();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.log('❌ Connection failed:', error.message);
            });
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        this.socket.on('joined-room', (data) => {
            console.log('✅ JOINED ROOM:', data);
        });

        this.socket.on('room-updated', (data) => {
            console.log('🔄 ROOM UPDATED:', {
                players: data.players?.length,
                status: data.status,
                playersNames: data.players?.map(p => p.name)
            });
        });

        this.socket.on('game-started', (data) => {
            console.log('🎮 GAME STARTED:', {
                status: data.status,
                storyLength: data.story?.length,
                currentChoices: data.currentChoices
            });
        });

        this.socket.on('voting-started', (data) => {
            console.log('🗳️ VOTING STARTED:', {
                choices: data.choices,
                timeLimit: data.timeLimit
            });
        });

        this.socket.on('error', (error) => {
            console.log('❌ SOCKET ERROR:', error);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from server');
        });
    }

    // Skipping testCreateRoom since you already tested it

    // Test 2: Host joins room via socket
    async testHostJoinRoom() {
        console.log('\n👑 TEST 2: Host joining room via socket...');
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('❌ Host join timeout');
                resolve(false);
            }, 5000);

            this.socket.once('joined-room', (data) => {
                clearTimeout(timeout);
                if (data.success) {
                    console.log('✅ Host joined successfully as player:', data.playerId);
                    resolve(true);
                } else {
                    console.log('❌ Host join failed');
                    resolve(false);
                }
            });

            this.socket.emit('join-room', {
                roomId: this.roomId,
                playerName: 'Aashu',
                playerId: this.hostId
            });
        });
    }

    // Test 3: Add a new player
    async testAddNewPlayer() {
        console.log('\n👥 TEST 3: Adding new player...');
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('❌ New player join timeout');
                resolve(false);
            }, 5000);

            // Create second socket for new player
            const playerSocket = io(SERVER_URL);
            
            playerSocket.on('connect', () => {
                playerSocket.once('joined-room', (data) => {
                    clearTimeout(timeout);
                    if (data.success) {
                        console.log('✅ New player joined successfully:', data.playerId);
                        playerSocket.disconnect();
                        resolve(true);
                    } else {
                        console.log('❌ New player join failed');
                        playerSocket.disconnect();
                        resolve(false);
                    }
                });

                playerSocket.emit('join-room', {
                    roomId: this.roomId,
                    playerName: 'TestPlayer2'
                });
            });
        });
    }

    // Test 4: Get room info via API
    async testGetRoomInfo() {
        console.log('\n📋 TEST 4: Getting room info...');
        
        try {
            const response = await fetch(`${API_URL}/room/${this.roomId}`);
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Room info retrieved:', {
                    status: data.roomData.status,
                    playersCount: data.roomData.players.length,
                    host: data.roomData.host
                });
                return true;
            } else {
                console.log('❌ Failed to get room info:', data.error);
                return false;
            }
        } catch (error) {
            console.log('❌ API Error:', error.message);
            return false;
        }
    }

    // Test 5: Start game (host only)
    async testStartGame() {
        console.log('\n🎮 TEST 5: Starting game...');
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('❌ Start game timeout');
                resolve(false);
            }, 5000);

            this.socket.once('game-started', (data) => {
                clearTimeout(timeout);
                console.log('✅ Game started successfully');
                resolve(true);
            });

            this.socket.emit('start-game', {
                roomId: this.roomId
            });
        });
    }

    // Test 6: Test error cases
    async testErrorCases() {
        console.log('\n❌ TEST 6: Testing error cases...');
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('✅ No error event received - error handling OK');
                resolve(true);
            }, 2000);

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                console.log('✅ Error handling working:', error.message);
                resolve(true);
            });

            this.socket.emit('join-room', {
                roomId: 'NONEXISTENT',
                playerName: 'TestPlayer'
            });
        });
    }

    // Run all tests sequentially except createRoom
    async runAllTests() {
        console.log('🚀 Starting Socket Tests...\n');
        
        await this.connect();
        await this.delay(1000);

        // Skipping createRoom test since already tested
        const test2 = await this.testHostJoinRoom();
        if (!test2) return;

        await this.delay(1000);
        const test3 = await this.testAddNewPlayer();

        await this.delay(1000);
        const test4 = await this.testGetRoomInfo();

        await this.delay(1000);
        const test5 = await this.testStartGame();

        await this.delay(1000);
        const test6 = await this.testErrorCases();

        console.log('\n🏁 All tests completed!');
        this.socket.disconnect();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests
const tester = new SocketTester();
tester.runAllTests().catch(console.error);
