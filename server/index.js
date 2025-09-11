import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectPostgreSQL } from './config/database.js';
import { connectRedis } from './config/redis.js';

import gameRoutes from './routes/gameRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app=express();

app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(json());
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res)=>{
    res.json({
        status: 'Server Running',
        timestamp: new Date().toISOString()
    });
});

const initializeConnections = async()=>{
    try{
        await connectPostgreSQL();
        await connectRedis();
        const PORT = process.env.PORT;
        app.listen(PORT, () => {
            console.log(`🚀 SagaForge server running on port ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        });
    }
    catch (error){
        console.error("Failed to initialize connections to pg or redis:", error);
        process.exit(1);
    }
};

initializeConnections();