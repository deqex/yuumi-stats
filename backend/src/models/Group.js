import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  summonerName: { type: String, required: true, trim: true },
  summonerTag:  { type: String, required: true, trim: true },
  region:       { type: String, required: true, trim: true },
  label:        { type: String, default: '', trim: true },
}, { _id: true });

const groupSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerUsername: { type: String, required: true },
  members:       [memberSchema],
}, { timestamps: true, collection: 'groups' });

groupSchema.index({ owner: 1 });

export default mongoose.model('Group', groupSchema);
