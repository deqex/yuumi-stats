import Group from '../models/Group.js';
import { isValidRegion } from '../utils/getBroadRegion.js';

const MAX_GROUPS_PER_USER = 10;

export async function createGroup(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required.' });
    if (typeof name !== 'string' || name.trim().length > 50) {
      return res.status(400).json({ error: 'Group name must be at most 50 characters.' });
    }
    const count = await Group.countDocuments({ owner: req.userId });
    if (count >= MAX_GROUPS_PER_USER) {
      return res.status(400).json({ error: `You can create at most ${MAX_GROUPS_PER_USER} groups.` });
    }
    const group = await Group.create({
      name: name.trim(),
      owner: req.userId,
      ownerUsername: req.username,
      members: [],
    });
    return res.status(201).json(group);
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ error: 'Failed to create group' });
  }
}

export async function getMyGroups(req, res) {
  try {
    const groups = await Group.find({ owner: req.userId }).lean().sort({ createdAt: -1 });
    return res.json(groups);
  } catch (err) {
    console.error('getMyGroups error:', err);
    return res.status(500).json({ error: 'Failed to fetch groups' });
  }
}

export async function getGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    if (group.owner.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden.' });
    return res.json(group);
  } catch (err) {
    console.error('getGroup error:', err);
    return res.status(500).json({ error: 'Failed to fetch group' });
  }
}

export async function addMember(req, res) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    if (group.owner.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden.' });
    const { summonerName, summonerTag, region, label } = req.body;
    if (!summonerName || !summonerTag || !region) {
      return res.status(400).json({ error: 'summonerName, summonerTag, and region are required.' });
    }
    if (typeof summonerName !== 'string' || summonerName.length > 100) {
      return res.status(400).json({ error: 'Invalid summonerName.' });
    }
    if (typeof summonerTag !== 'string' || summonerTag.length > 20) {
      return res.status(400).json({ error: 'Invalid summonerTag.' });
    }
    if (!isValidRegion(region)) {
      return res.status(400).json({ error: 'Invalid region.' });
    }
    if (group.members.length >= 15) {
      return res.status(400).json({ error: 'Groups can have at most 15 members.' });
    }
    if (label != null && (typeof label !== 'string' || label.length > 50)) {
      return res.status(400).json({ error: 'Label must be at most 50 characters.' });
    }
    group.members.push({ summonerName, summonerTag, region, label: label || '' });
    await group.save();
    return res.json(group);
  } catch (err) {
    console.error('addMember error:', err);
    return res.status(500).json({ error: 'Failed to add member' });
  }
}

export async function removeMember(req, res) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    if (group.owner.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden.' });
    group.members = group.members.filter(m => m._id.toString() !== req.params.memberId);
    await group.save();
    return res.json(group);
  } catch (err) {
    console.error('removeMember error:', err);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}

export async function deleteGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    if (group.owner.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden.' });
    await group.deleteOne();
    return res.json({ message: 'Group deleted.' });
  } catch (err) {
    console.error('deleteGroup error:', err);
    return res.status(500).json({ error: 'Failed to delete group' });
  }
}
