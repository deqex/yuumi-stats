import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js';
import masteryRoutes from './src/routes/masteryRoutes.js';
import dns from "node:dns/promises";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  const { summonerName, summonerTag, region, matchId } = { ...req.query, ...req.params };
  const who = summonerName ? `${summonerName}#${summonerTag}` : matchId || '';
  const where = region ? ` (${region})` : '';
  const route = req.path.split('/').filter(Boolean).pop() || req.path;
  console.log(`[${route}] ${who}${where}`);
  next();
});

app.use("/api/matches", matchesRoutes);
app.use("/api/mastery", masteryRoutes);


dns.setServers(["1.1.1.1"]);
console.log(await dns.getServers());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

