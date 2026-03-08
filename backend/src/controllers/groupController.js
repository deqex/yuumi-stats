import Group from '../models/Group.js';

export async function createGroup(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required.' });
    const group = await Group.create({
      name: name.trim(),
      owner: req.userId,
      ownerUsername: req.username,
      members: [],
    });
    return res.status(201).json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMyGroups(req, res) {
  try {
    const groups = await Group.find({ owner: req.userId }).lean().sort({ createdAt: -1 });
    return res.json(groups);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    return res.json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
    if (group.members.length >= 15) {
      return res.status(400).json({ error: 'Groups can have at most 15 members.' });
    }
    group.members.push({ summonerName, summonerTag, region, label: label || '' });
    await group.save();
    return res.json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
    return res.status(500).json({ error: err.message });
  }
}
