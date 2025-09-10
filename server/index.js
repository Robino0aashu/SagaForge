const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {connectPostgreSQL} =require('./config/database');
const {connectRedis} = require('./config/redis');

const app=express();

app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());

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