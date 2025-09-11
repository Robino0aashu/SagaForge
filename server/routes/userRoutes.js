import { Router } from 'express';
const router = Router();

// User registration
router.post('/register', (req, res) => {
  res.json({ message: "Register route works!" });
});

// User login
router.post('/login', (req, res) => {
  res.json({ message: "Login route works!" });
});

// Get user profile (will be protected later)
router.get('/profile', (req, res) => {
  res.json({ message: "Profile route works!" });
});

export default router;