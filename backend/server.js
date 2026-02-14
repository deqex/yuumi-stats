import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js';
import masteryRoutes from './src/routes/masteryRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import dns from "node:dns/promises";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/matches", matchesRoutes);
app.use("/api/mastery", masteryRoutes);
app.use("/api/profile", profileRoutes);


dns.setServers(["1.1.1.1"]);
console.log(await dns.getServers());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

