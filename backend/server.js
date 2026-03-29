import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js';
import masteryRoutes from './src/routes/masteryRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import leaderboardRoutes from './src/routes/leaderboardRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import groupRoutes from './src/routes/groupRoutes.js';
import dns from 'node:dns/promises';

dotenv.config();
dns.setServers(['1.1.1.1']);

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET not configured');
if (!process.env.RIOT_API_KEY) throw new Error('RIOT_API_KEY not configured');
if (!process.env.PORT) throw new Error('PORT not configured');
if (!process.env.MONGO_URI) throw new Error('MONGO_URI not configured');
if (!process.env.CORS_ORIGIN) throw new Error('CORS_ORIGIN not configured');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

function sanitize(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitize(obj[key]);
    }
  }
  return obj;
}
app.use((req, _res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Limit for endpoints that hit Riot API — skips /matches/analysis
const riotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/matches", riotLimiter, matchesRoutes);
app.use("/api/mastery", riotLimiter, masteryRoutes);
app.use("/api/profile", riotLimiter, profileRoutes);
app.use("/api/leaderboard", apiLimiter, leaderboardRoutes);
app.use("/api/groups", apiLimiter, groupRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();
  const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => process.exit(0));
  });
}

start();

