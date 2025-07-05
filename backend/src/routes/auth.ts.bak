import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getUserByEmail, createUser } from '../services/databaseService';

const router = express.Router();

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ email, password: hashedPassword });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token });
  }
);

export { router as authRoutes }; 