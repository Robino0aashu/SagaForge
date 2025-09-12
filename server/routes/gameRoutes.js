import { Router } from 'express';
import { v4 as uuidv4, parse } from 'uuid';
import { getRedisClient } from '../config/redis.js';
import { query } from '../config/database.js';

const router = Router();

//Create a new room!!
router.post('/create-room', async (req, res)=>{
    try{
        const {hostName, storyPrompt}=req.body;

        if(!hostName || !storyPrompt){
            return res.status(400).json({
                error: "Host name and story prompt are required"
            });
        }

        const roomId=uuidv4().substring(0, 8).toUpperCase();
        const redis=getRedisClient();

        const hostId=uuidv4();
        const roomData ={
            id: roomId,
            host: hostName,
            storyPrompt,
            players: [{name: hostName, id: hostId, isHost: true}],
            status: 'waiting', //waiting, playing, voting, completed
            story: [],
            currentChoices: [],
            votes: {},
            createdAt: new Date().toISOString(),
            maxPlayers: 8
        };
        //store room data in redis with 24hr expiration.
        await redis.setEx(`room:${roomId}`, 24*60*60, JSON.stringify(roomData));

        res.json({
            success:true,
            hostId,
            roomId,
            roomData:{
                ...roomData,
                votes: undefined
            }
        });
    }
    catch(error){
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

//Get room info
router.get('/room/:roomId', async (req, res)=>{
    try{
        const {roomId}=req.params;
        const redis=getRedisClient();
        const roomData=await redis.get(`room:${roomId}`);

        if(!roomData){
            return res.status(404).json({
                error: "Room not found"
            });
        }

        const parsedRoom=JSON.parse(roomData);

        const publicRoomData={
            ...parsedRoom,
            votes: undefined
        };
        res.json({
            success: true,
            roomData: publicRoomData
        });
    }
    catch (error){
        console.error('Error fetching room:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

//Get Completed Stories
router.get('/stories/public', async (req, res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT id, title, summary, created_at, participants, total_choices, share_token
            FROM stories
            WHERE is_public = true
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const totalStories = await query(
            'SELECT COUNT(*) FROM stories WHERE is_public = true'
        );

        res.json({
            success: true,
            stories: result.rows,
            pagination:{
                page,
                limit,
                total: parseInt(totalStories.rows[0].count),
                totalPages: Math.ceil(totalStories.rows[0].count /limit)
            }
        });
    }
    catch(error){
        console.error('Error fetching public stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});

// Get story by shared token   
router.get('/story/share/:shareToken', async (req, res)=>{
    try{
        const {shareToken} =req.params;
        
        const result = await query(
            'SELECT * FROM stories WHERE share_token = $1',
            [shareToken]
        );
        if(result.rows.length ==0){
            return res.status(404).JSON({error: "Story not found"});
        }
        res.json({
            success: true,
            story: result.rows[0]
        });
    }
    catch(error){
        console.error('Error fetching story:', error);
        res.status(500).json({ error: 'Failed to fetch story' });
    }
});

export default router;