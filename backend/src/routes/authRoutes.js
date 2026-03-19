import express from 'express';
import { register, login, updateLeagueName, deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/league-name', requireAuth, updateLeagueName);
router.delete('/account', requireAuth, deleteAccount);

export default router;
