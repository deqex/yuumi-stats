import mongoose from "mongoose";

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
    riotIdGameName: { type: String, default: '' },
    riotIdTagline: { type: String, default: '' },
    championId: { type: Number, required: true },
    championName: { type: String, required: true },
    teamId: { type: Number, required: true },
    individualPosition: { type: String, default: '' },
    roleQuestId: { type: Number, default: null },
    win: { type: Boolean, required: true },
    kills: { type: Number, required: true },
    deaths: { type: Number, required: true },
    assists: { type: Number, required: true },
    totalMinionsKilled: { type: Number, default: 0 },
    neutralMinionsKilled: { type: Number, default: 0 },
    champExperience: { type: Number, default: 0 },
    champLevel: { type: Number, default: 1 },
    goldEarned: { type: Number, default: 0 },
    totalDamageDealtToChampions: { type: Number, default: 0 },
    totalDamageShieldedOnTeammates: { type: Number, default: 0 },
    totalHealsOnTeammates: { type: Number, default: 0 },
    totalDamageTaken: { type: Number, default: 0 },
    damageSelfMitigated: { type: Number, default: 0 },
    timeCCingOthers: { type: Number, default: 0 },
    timePlayed: { type: Number, default: 0 },
    visionScore: { type: Number, default: 0 },
    enemyMissingPings: { type: Number, default: 0 },
    enemyVisionPings: { type: Number, default: 0 },
    firstTowerKill: { type: Boolean, default: false },
    firstBloodKill: { type: Boolean, default: false },
    firstBloodAssist: { type: Boolean, default: false },
    largestMultiKill: { type: Number, default: 0 },
    objectivesStolen: { type: Number, default: 0 },
    // additional stats
    controlWardsPlaced: { type: Number, default: 0 },
    damageDealtToTurrets: { type: Number, default: 0 },
    totalAllyJungleMinionsKilled: { type: Number, default: 0 },
    totalEnemyJungleMinionsKilled: { type: Number, default: 0 },
    gameEndedInSurrender: { type: Boolean, default: false },
    gameEndedInEarlySurrender: { type: Boolean, default: false },
    // challenges
    epicMonsterSteals: { type: Number, default: 0 },
    flawlessAces: { type: Number, default: 0 },
    hadOpenNexus: { type: Number, default: 0 },
    perfectGame: { type: Number, default: 0 },
    takedownsInEnemyFountain: { type: Number, default: 0 },
    earliestBaron: { type: Number, default: 0 },
    elderDragonKillsWithOpposingSoul: { type: Number, default: 0 },
    dancedWithRiftHerald: { type: Number, default: 0 },
    healFromMapSources: { type: Number, default: 0 },
    dragonTakedowns: { type: Number, default: 0 },
    scuttleCrabKills: { type: Number, default: 0 },
    stealthWardsPlaced: { type: Number, default: 0 },
    wardTakedowns: { type: Number, default: 0 },
    killsNearEnemyTurret: { type: Number, default: 0 },
    maxCsAdvantageOnLaneOpponent: { type: Number, default: 0 },
    takedownsAfterGainingLevelAdvantage: { type: Number, default: 0 },
    takedownsBeforeJungleMinionSpawn: { type: Number, default: 0 },
    abilityUses: { type: Number, default: 0 },
    killParticipation: { type: Number, default: 0 },
    kda: { type: Number, default: 0 },
    item0: { type: Number, default: 0 },
    item1: { type: Number, default: 0 },
    item2: { type: Number, default: 0 },
    item3: { type: Number, default: 0 },
    item4: { type: Number, default: 0 },
    item5: { type: Number, default: 0 },
    item6: { type: Number, default: 0 },
    summoner1Id: { type: Number, default: 0 },
    summoner2Id: { type: Number, default: 0 },
    perks: { type: mongoose.Schema.Types.Mixed, default: null },
  }]
}, {
  timestamps: false
});

const Match = mongoose.model('Match', matchSchema);

export default Match;