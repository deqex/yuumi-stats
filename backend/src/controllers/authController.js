import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET in backend .env');
  return secret;
}

export const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(409).json({ message: 'Username already taken.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashed });

  const token = jwt.sign({ id: user._id, username: user.username }, getJwtSecret(), { expiresIn: '7d' });

  res.status(201).json({ token, username: user.username, leagueName: user.leagueName });
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input.' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = jwt.sign({ id: user._id, username: user.username }, getJwtSecret(), { expiresIn: '7d' });

  res.json({ token, username: user.username, leagueName: user.leagueName });
};

export const updateLeagueName = async (req, res) => {
  const { leagueName } = req.body;
  const userId = req.userId;

  const user = await User.findByIdAndUpdate(userId, { leagueName: leagueName || '' }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found.' });

  res.json({ leagueName: user.leagueName });
};
