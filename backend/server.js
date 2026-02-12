import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js';
import riotRoutes from './src/routes/riotRoutes.js';
import dns from "node:dns/promises";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/matches", matchesRoutes);
app.use("/api/riot", riotRoutes);


dns.setServers(["1.1.1.1"]);
console.log(await dns.getServers());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

