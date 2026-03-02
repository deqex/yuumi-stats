import express from 'express';
import { register, login, updateLeagueName } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/league-name', requireAuth, updateLeagueName);

export default router;
