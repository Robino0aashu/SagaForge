import { Router } from 'express';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from '../config/database.js';

import { authenticateToken } from '../middleware/authMiddleware.js'; 

const router = Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required"
      });
    }

    const existingUser = await query(
      'Select id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Username or email already exists"
      });
    };

    const rounds = 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    const avatarColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const result = await query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_color) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, display_name, avatar_color, created_at`,
      [username, email, passwordHash, displayName || username, avatarColor]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarColor: user.avatar_color
      },
      token
    });
  }
  catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: "Username and Password are required"
      });
    }

    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email= $1',
      [username]
    );

    if (result.rows.length == 0) {
      return res.status(401).json({
        error: "Invalid Credentials"
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid Creds"
      });
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      message: 'Login Successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarColor: user.avatar_color
      },
      token
    });
  }
  catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get user profile - protected
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result= await query(
      'SELECT id, username, email, display_name, avatar_color, created_at FROM users WHERE id=$1',
      [req.user.userId]
    );

    if(result.rows.length==0){
      return res.status(404).json({
        error: "User not found"
      });
    }

    const user=result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarColor: user.avatar_color,
        createdAt: user.created_at
      }
    });
  }
  catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/stories', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, title, summary, created_at, is_public FROM stories WHERE created_by = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json({
            success: true,
            stories: result.rows
        });
    } catch (error) {
        console.error('Error fetching user stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});



export default router;