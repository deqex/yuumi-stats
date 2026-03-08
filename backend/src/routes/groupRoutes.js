import express from 'express';
import { createGroup, getMyGroups, getGroup, addMember, removeMember } from '../controllers/groupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, createGroup);
router.get('/mine', requireAuth, getMyGroups);
router.get('/:id', getGroup);
router.post('/:id/members', requireAuth, addMember);
router.delete('/:id/members/:memberId', requireAuth, removeMember);

export default router;
