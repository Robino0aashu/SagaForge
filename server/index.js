import express, { json } from 'express';

import { createServer} from 'http';
import {Server} from 'socket.io';

import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectPostgreSQL } from './config/database.js';
import { connectRedis } from './config/redis.js';
import gameRoutes from './routes/gameRoutes.js';
import userRoutes from './routes/userRoutes.js';
import gameSocketHandlers from './sockets/gameSocket.js';

const app=express();
const server= createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors());

app.use(json());

app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res)=>{
    res.json({
        status: 'Server Running',
        timestamp: new Date().toISOString()
    });
});

gameSocketHandlers(io);

io.on('connection', (socket)=>{
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', ()=>{
        console.log(`User Disconnected: ${socket.id}`);
    });
})

const initializeConnections = async () => {
  try {
    await connectPostgreSQL();
    await connectRedis();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 SagaForge server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize connections:', error);
    process.exit(1);
  }
};

initializeConnections();