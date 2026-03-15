import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js';
import masteryRoutes from './src/routes/masteryRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import leaderboardRoutes from './src/routes/leaderboardRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import groupRoutes from './src/routes/groupRoutes.js';
import dns from "node:dns/promises";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

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
  skip: (req) => req.path === '/analysis',
});

app.use("/api/auth", authRoutes);
app.use("/api/matches", riotLimiter, matchesRoutes);
app.use("/api/mastery", riotLimiter, masteryRoutes);
app.use("/api/profile", riotLimiter, profileRoutes);
app.use("/api/leaderboard", apiLimiter, leaderboardRoutes);
app.use("/api/groups", apiLimiter, groupRoutes);


dns.setServers(["1.1.1.1"]);
console.log(dns.getServers());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

