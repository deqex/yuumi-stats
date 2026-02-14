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
    enum: ['eun1', 'euw1', 'na1', 'kr', 'br1', 'jp1', 'ru', 'oc1', 'tr1', 'la1', 'la2'],
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
