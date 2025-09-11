const express=require('express');
const router = express.Router();

//Create a new room!!
router.post('/create-room', (req, res)=>{
    res.json({message: "Create room route works!"});
});

//Get room info
router.get('/room/:roomId', (req, res)=>{
    res.json({message: "Get room info route works!!", roomId: req.params.roomId});
});

//Get Completed Stories
router.get('/stories/public', (req, res)=>{
    res.json({message: "Get public stories route works!!"});
});

// Get story by shared token   
router.get('/story/share/:shareToken', (req, res)=>{
    res.json({message: "Get shared story route works!", token: req.params.shareToken});
});

module.exports = router;