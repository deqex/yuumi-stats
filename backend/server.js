import express from 'express';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();




app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectDB();

