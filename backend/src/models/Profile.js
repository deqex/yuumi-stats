import mongoose from "mongoose";

const rankSchema = new mongoose.Schema({
  queueType:  { type: String, required: true },
  tier:       { type: String, required: true },
  rank:       { type: String, required: true },
  leaguePoints: { type: Number, default: 0 },
  wins:       { type: Number, default: 0 },
  losses:     { type: Number, default: 0 },
}, { _id: false });

const profileSchema = new mongoose.Schema({
  summonerName: {
    type: String,
    required: true,
    index: true,
  },
  puuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  icon: {
    type: Number,
    required: true,
  },
  summonerLevel: {
    type: Number,
    default: 0,
  },
  ranks: [rankSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: false, collection: "profiles" });

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
