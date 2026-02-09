import mongoose from "mongoose";

// matchSummary.schema.js
const matchSchema = new mongoose.Schema({
  matchId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  region: { 
    type: String, 
    required: true,
    enum: ['EUN1', 'EUW1', 'NA1', 'KR', 'BR1', 'JP1', 'RU', 'OC1', 'TR1', 'LA1', 'LA2']
  },
  gameCreation: { 
    type: Date, 
    required: true,
    index: true
  },
  gameDuration: { 
    type: Number, 
    required: true 
  },
  queueId: { 
    type: Number, 
    required: true,
    index: true
  },
  season: { 
    type: Number, 
    required: true 
  },
  
  participantSummaries: [{
    puuid: { type: String, required: true, index: true },
    championId: { type: Number, required: true },
    role: { 
      type: String, 
      enum: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT'],
      required: true
    },
    win: { type: Boolean, required: true },
    kills: { type: Number, required: true },
    deaths: { type: Number, required: true },
    assists: { type: Number, required: true },
    totalMinionsKilled: { type: Number, default: 0 },
    goldEarned: { type: Number, default: 0 },
    damageDealtToChampions: { type: Number, default: 0 },
    visionScore: { type: Number, default: 0 },
    items: [Number],  // Simplified array of item IDs
    summonerSpells: [Number]
  }]
}, {
  timestamps: false
});

const Match = mongoose.model('Match', matchSchema);

export default Match;