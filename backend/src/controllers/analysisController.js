import { getBroadRegion, isValidRegion } from "../utils/getBroadRegion.js";
import Match from "../models/Match.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { riotFetch } from "../utils/riotFetch.js";
import { genScore } from "../utils/genScore.js";
import { saveMatchToDb } from "../utils/saveMatch.js";
import { extractChallengeFields } from "../utils/extractChallengeFields.js";


const analysisCache = new Map();
const CACHE_TTL_MS = 45 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

function getCacheEntry(key) {
    const entry = analysisCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { analysisCache.delete(key); return null; }
    return entry.data;
}

function setCacheEntry(key, data) {
    if (analysisCache.size >= MAX_CACHE_SIZE) {
        const oldest = analysisCache.keys().next().value;
        analysisCache.delete(oldest);
    }
    analysisCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of analysisCache) {
        if (now > entry.expiresAt) analysisCache.delete(key);
    }
}, CACHE_TTL_MS);


function getPosition(p) { return p.individualPosition || ''; }



export async function getAnalysisData(req, res) {
    try {
        const { summonerName, summonerTag, region, days: daysParam } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const allowedDays = [7, 14, 30, 90, 180, 365];
        let days = parseInt(daysParam, 10) || 14;
        if (!allowedDays.includes(days)) days = 14;

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const broadRegion = getBroadRegion(region);

        const cacheKey = `${puuid}:${days}`;
        const cachedResult = getCacheEntry(cacheKey);
        if (cachedResult) {
            console.log(`[Analysis] cache HIT ${summonerName}#${summonerTag} (${days}d)`);
            return res.json(cachedResult);
        }

        const now = Math.floor(Date.now() / 1000);
        const startTime = now - days * 24 * 60 * 60;

        const apiDelayMs = Math.round((days / 365) * 1500);
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        const matches = [];
        let idStart = 0;
        let totalIdsFetched = 0;
        let keepFetching = true;

        while (keepFetching) {
            const matchIdsRes = await riotFetch(
                `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${idStart}&count=100`
            );
            if (!matchIdsRes.ok) throw new Error(`Riot API error (matchIds): ${matchIdsRes.status}`);
            const batch = await matchIdsRes.json();

            if (batch.length === 0) break;
            totalIdsFetched += batch.length;

            for (const matchId of batch) {
                let p = null;
                let allParticipants = null;
                let gameDuration = 0;
                let queueId = null;
                let gamePosition = '';
                let gameCreationSec = 0;

                const cached = await Match.findOne({ matchId }).lean();
                if (cached) {
                    console.log(`[Analysis][DB] ${matchId}`);
                    gameCreationSec = new Date(cached.gameCreation).getTime() / 1000;
                    queueId = cached.queueId;
                    p = cached.participantSummaries.find(ps => ps.puuid === puuid);
                    allParticipants = cached.participantSummaries;
                    gameDuration = cached.gameDuration;
                    if (p) gamePosition = getPosition(p);
                } else {
                    console.log(`[Analysis][API] ${matchId} (delay ${apiDelayMs}ms)`);
                    const matchRes = await riotFetch(
                        `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`
                    );
                    await sleep(apiDelayMs);
                    if (!matchRes.ok) continue;
                    const matchData = await matchRes.json();

                    saveMatchToDb(matchData, region).catch(e => console.error('[saveMatch]', e.message));

                    gameCreationSec = (matchData.info?.gameCreation || 0) / 1000;
                    queueId = matchData.info?.queueId;
                    allParticipants = matchData.info?.participants || [];
                    const rawP = allParticipants.find(pl => pl.puuid === puuid);
                    gameDuration = matchData.info?.gameDuration || 0;

                    if (rawP) {
                        gamePosition = getPosition(rawP);
                        p = {
                            ...rawP,
                            ...extractChallengeFields(rawP),
                        };
                    }
                }

                if (gameCreationSec > 0 && gameCreationSec < startTime) {
                    console.log(`[Analysis] reached time limit at ${matchId} - stopping`);
                    keepFetching = false;
                    break;
                }
                if (gameCreationSec === 0) {
                    console.log(`[Analysis] skip ${matchId} - missing gameCreation`);
                    continue;
                }

                if (!p) continue;

                if (gameDuration < 14 * 60) {
                    console.log(`[Analysis] skip ${matchId} - too short (${Math.round(gameDuration / 60)}m)`);
                    continue;
                }

                const teamKills = allParticipants
                    .filter(pl => pl.teamId === p.teamId)
                    .reduce((sum, pl) => sum + (pl.kills || 0), 0);

                const roundedScore = genScore(p, allParticipants, gameDuration, queueId).score;
                const csVal = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
                const kpVal = teamKills > 0 ? Math.round(((p.kills + p.assists) / teamKills) * 100) : 0;

                matches.push({
                    matchId,
                    queueId,
                    gameDuration,
                    position:                        gamePosition,
                    win:                             !!p.win,
                    kills:                           p.kills || 0,
                    deaths:                          p.deaths || 0,
                    assists:                         p.assists || 0,
                    cs:                              csVal,
                    visionScore:                     p.visionScore || 0,
                    aiScore:                         roundedScore,
                    kp:                              kpVal,
                    firstBlood:                      (p.firstBloodKill || p.firstBloodAssist) ? 1 : 0,
                    forfeit:                         (p.gameEndedInSurrender && !p.win) ? 1 : 0,
                    championName:                    p.championName || '',
                    epicMonsterSteals:               p.challenges?.epicMonsterSteals || 0,
                    flawlessAces:                    p.challenges?.flawlessAces || 0,
                    hadOpenNexus:                    p.challenges?.hadOpenNexus || 0,
                    perfectGame:                     p.challenges?.perfectGame || 0,
                    takedownsInEnemyFountain:        p.challenges?.takedownsInEnemyFountain || 0,
                    elderDragonKillsWithOpposingSoul:p.challenges?.elderDragonKillsWithOpposingSoul || 0,
                    dancedWithRiftHerald:            p.challenges?.dancedWithRiftHerald || 0,
                    earliestBaron:                   p.challenges?.earliestBaron || 0,
                    largestMultiKill:                p.largestMultiKill || 0,
                    largestKillingSpree:             p.largestKillingSpree || 0,
                    objectivesStolen:                p.objectivesStolen || 0,
                    healFromMapSources:              p.challenges?.healFromMapSources || 0,
                    controlWardsPlaced:              p.challenges?.controlWardsPlaced || 0,
                    dragonTakedowns:                 p.challenges?.dragonTakedowns || 0,
                    scuttleCrabKills:                p.challenges?.scuttleCrabKills || 0,
                    stealthWardsPlaced:              p.challenges?.stealthWardsPlaced || 0,
                    wardTakedowns:                   p.challenges?.wardTakedowns || 0,
                    damageDealtToTurrets:            p.damageDealtToTurrets || 0,
                    damageSelfMitigated:             p.damageSelfMitigated || 0,
                    totalAllyJungleMinionsKilled:    p.totalAllyJungleMinionsKilled || 0,
                    totalDamageDealtToChampions:     p.totalDamageDealtToChampions || 0,
                    totalEnemyJungleMinionsKilled:   p.totalEnemyJungleMinionsKilled || 0,
                    totalHealsOnTeammates:           p.totalHealsOnTeammates || 0,
                    killsNearEnemyTurret:            p.challenges?.killsNearEnemyTurret || 0,
                    maxCsAdvantageOnLaneOpponent:    p.challenges?.maxCsAdvantageOnLaneOpponent || 0,
                    takedownsAfterGainingLevelAdvantage: p.challenges?.takedownsAfterGainingLevelAdvantage || 0,
                    takedownsBeforeJungleMinionSpawn:    p.challenges?.takedownsBeforeJungleMinionSpawn || 0,
                    abilityUses:                     p.challenges?.abilityUses || 0,
                });
            }

            if (batch.length < 100) break;
            idStart += 100;
        }

        console.log(`[Analysis] complete — ${matches.length} matches for ${summonerName}#${summonerTag} (${days}d, ${totalIdsFetched} IDs fetched)`);

        const result = { matches };
        setCacheEntry(cacheKey, result);
        return res.json(result);
    } catch (error) {
        console.error("[Analysis] getAnalysisData error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch analysis data';
        return res.status(status).json({ error: message });
    }
}
