import express from 'express';
import { register, login, refresh, logout, updateLeagueName, deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.put('/league-name', requireAuth, updateLeagueName);
router.delete('/account', requireAuth, deleteAccount);

export default router;
