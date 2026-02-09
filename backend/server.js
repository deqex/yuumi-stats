import express from 'express';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import matchesRoutes from './src/routes/matchesRoutes.js'; //zkontrolujk zda je cesta správná
import dns from "node:dns/promises";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/matches", matchesRoutes);


dns.setServers(["1.1.1.1"]);
console.log(await dns.getServers());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

