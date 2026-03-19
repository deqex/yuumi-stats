import mongoose from "mongoose";

const championEntrySchema = new mongoose.Schema({
  championId:                   { type: Number, required: true },
  championLevel:                { type: Number, required: true },
  championPoints:               { type: Number, required: true },
  championPointsSinceLastLevel: { type: Number, default: 0 },
  championPointsUntilNextLevel: { type: Number, default: 0 },
  lastPlayTime:                 { type: Number, default: 0 },
}, { _id: false });

const championMasterySchema = new mongoose.Schema({
  puuid: {
    type: String,
    required: true,
    index: true,
  },
  region: {
    type: String,
    required: true,
    enum: ['EUN1', 'EUW1', 'NA1', 'KR', 'BR1', 'JP1', 'RU', 'OC1', 'TR1', 'LA1', 'LA2', 'ME1', 'SG2', 'TW2', 'VN2'],
  },
  champions: [championEntrySchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: false, collection: "mastery" });

championMasterySchema.index({ puuid: 1, region: 1 }, { unique: true });

const ChampionMastery = mongoose.model("ChampionMastery", championMasterySchema);

export default ChampionMastery;
