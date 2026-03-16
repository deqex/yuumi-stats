import { getBroadRegion } from "../utils/getBroadRegion.js";
import Match from "../models/Match.js";
import Profile from "../models/Profile.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { getApiKey } from "../utils/getApiKey.js";
import { riotFetch } from "../utils/riotFetch.js";
import { genBadges } from "../utils/genBadges.js";
import { genScore } from "../utils/genScore.js";
import { saveMatchToDb } from "../utils/saveMatch.js";

const aggregatedCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheEntry(key) {
    const entry = aggregatedCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { aggregatedCache.delete(key); return null; }
    return entry.data;
}

function setCacheEntry(key, data) {
    aggregatedCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}



export async function getMatchIds(req, res) {
    try {
        const { summonerName, summonerTag, region, forceUpdate, start = '0', count = '5', queue } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const startNum = Math.max(0, parseInt(start, 10) || 0);
        const countNum = Math.min(100, Math.max(1, parseInt(count, 10) || 5));

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        const broadRegion = getBroadRegion(region);
        console.log(`[API] fetching match IDs for ${summonerName}#${summonerTag} (${region}, start=${startNum}, count=${countNum}${queue ? `, queue=${queue}` : ''})`);
        const queueParam = queue ? `&queue=${queue}` : '';
        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${startNum}&count=${countNum}${queueParam}&api_key=${getApiKey()}`;
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchIds): ${matchRes.status}`);
        const matchIds = await matchRes.json();

        return res.json(matchIds);
    } catch (error) {
        console.error("getMatchIds error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getMatchData(req, res) {
    try {
        const { matchId } = req.params;
        const { region, forceUpdate } = req.query;
        if (!matchId) {
            return res.status(400).json({ error: "matchId is required" });
        }

        if (forceUpdate !== 'true') {
            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                console.log(`[DB] match ${matchId}`);
                const { participantSummaries, matchId: id, region: _r, _id, __v, ...gameFields } = cached;
                // Convert gameCreation to timestamp if it's a Date
                let gameCreation = gameFields.gameCreation;
                if (gameCreation instanceof Date) {
                    gameCreation = gameCreation.getTime();
                } else if (typeof gameCreation === 'string' || typeof gameCreation === 'object') {
                    // Try to convert string/object to timestamp
                    const dateObj = new Date(gameCreation);
                    if (!isNaN(dateObj)) gameCreation = dateObj.getTime();
                }
                const participantsWithBadges = genBadges(participantSummaries, cached.gameDuration, cached.queueId);
                return res.json({
                    metadata: { matchId: id },
                    info: {
                        ...gameFields,
                        gameCreation,
                        participants: participantsWithBadges
                    }
                });
            }
        }

        console.log(`[API] fetching match ${matchId}`);
        const broadRegion = region ? getBroadRegion(region) : "europe";

        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${getApiKey()}`;
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchData): ${matchRes.status}`);
        const matchData = await matchRes.json();

        saveMatchToDb(matchData, region);

        const participants = matchData.info?.participants ?? [];
        const participantsWithBadges = genBadges(participants, matchData.info?.gameDuration, matchData.info?.queueId);
        return res.json({
            ...matchData,
            info: { ...matchData.info, participants: participantsWithBadges },
        });
    } catch (error) {
        console.error("getMatchData error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getPuuid(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        return res.json({ puuid });
    } catch (error) {
        console.error("getPuuid error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getParticipantStats(req, res) {
    try {
        const { puuid, region } = req.query;
        if (!puuid || !region) {
            return res.status(400).json({ error: "puuid and region are required" });
        }

        const broadRegion = getBroadRegion(region);
        const apiKey = getApiKey();
        const regionLower = region.toLowerCase();

        // Fetch rank, summoner level, and match IDs parallel
        const [rankRes, summonerRes, matchIdsRes] = await Promise.all([
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${apiKey}`),
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`),
            riotFetch(`https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=7&api_key=${apiKey}`),
        ]);

        const ranks     = rankRes.ok     ? await rankRes.json()     : [];
        const summoner  = summonerRes.ok ? await summonerRes.json() : {};
        const matchIds  = matchIdsRes.ok ? await matchIdsRes.json() : [];
        let totalKills = 0, totalDeaths = 0, totalAssists = 0;
        let totalCS = 0, totalDurationSecs = 0, totalKP = 0, totalAiScore = 0;
        let wins = 0, validGames = 0;
        const recentGames = [];

        for (const matchId of matchIds) {
            let participants = null;
            let gameDuration = 0;
            let queueId = 0;

            // Check DB cache first
            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                participants = cached.participantSummaries;
                gameDuration = cached.gameDuration;
                queueId      = cached.queueId;
            } else {
                const matchRes = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`
                );
                if (!matchRes.ok) continue;
                const matchData = await matchRes.json();
                saveMatchToDb(matchData, region);
                participants = matchData.info?.participants || [];
                gameDuration = matchData.info?.gameDuration || 0;
                queueId      = matchData.info?.queueId || 0;
            }

            const p = participants.find(pl => pl.puuid === puuid);
            if (!p) continue;

            const teamKills = participants
                .filter(pl => pl.teamId === p.teamId)
                .reduce((sum, pl) => sum + (pl.kills || 0), 0);

            validGames++;
            totalKills        += p.kills   || 0;
            totalDeaths       += p.deaths  || 0;
            totalAssists      += p.assists || 0;
            totalCS           += (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
            totalDurationSecs += gameDuration;
            totalKP           += teamKills > 0 ? (p.kills + p.assists) / teamKills : 0;
            totalAiScore      += genScore(p, participants, gameDuration, queueId).score;
            if (p.win) wins++;

            recentGames.push({ championId: p.championId, win: p.win });
        }

        const stats = validGames > 0 ? {
            avgKills:    +(totalKills   / validGames).toFixed(1),
            avgDeaths:   +(totalDeaths  / validGames).toFixed(1),
            avgAssists:  +(totalAssists / validGames).toFixed(1),
            kda:         totalDeaths > 0
                ? +((totalKills + totalAssists) / totalDeaths).toFixed(2)
                : +(totalKills + totalAssists).toFixed(2),
            winRate:     Math.round((wins / validGames) * 100),
            csPerMin:    totalDurationSecs > 0
                ? +(totalCS / (totalDurationSecs / 60)).toFixed(1)
                : 0,
            avgKP:       Math.round((totalKP / validGames) * 100),
            avgAiScore:  Math.round(totalAiScore / validGames),
            gamesPlayed: validGames,
        } : null;

        return res.json({
            summonerLevel: summoner.summonerLevel ?? null,
            ranks,
            stats,
            recentGames,
        });
    } catch (error) {
        console.error("getParticipantStats error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getLiveGame(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}?api_key=${getApiKey()}`;
        const liveRes = await riotFetch(url);
        if (liveRes.status === 404) {
            return res.status(404).json({ error: "Player is not in a live game" });
        }
        if (!liveRes.ok) throw new Error(`Riot API error (livegame): ${liveRes.status}`);
        const liveData = await liveRes.json();

        return res.json(liveData);
    } catch (error) {
        console.error("getLiveGame error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getSummoner(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const summonerRes = await riotFetch(url);
        if (!summonerRes.ok) throw new Error(`Riot API error (summoner): ${summonerRes.status}`);
        const summoner = await summonerRes.json();

        return res.json(summoner);
    } catch (error) {
        console.error("getSummoner error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getRankEntries(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const rankRes = await riotFetch(url);
        if (!rankRes.ok) throw new Error(`Riot API error (ranks): ${rankRes.status}`);
        const ranks = await rankRes.json();

        return res.json(ranks);
    } catch (error) {
        console.error("getRankEntries error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getRankByPuuid(req, res) {
    const { puuid, region } = req.query;
    if (!puuid || !region) {
        return res.status(400).json({ error: "puuid and region are required" });
    }

    try {
        // Check DB cache first
        const profile = await Profile.findOne({ puuid }, { ranks: 1 }).lean();
        if (profile?.ranks?.length) {
            return res.json(JSON.parse(JSON.stringify(profile.ranks)));
        }

        // fallabck to Riot API
        const apiKey = getApiKey();
        const rankRes = await riotFetch(`https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${apiKey}`);
        const ranks = rankRes?.ok ? await rankRes.json() : [];
        return res.json(ranks);
    } catch (error) {
        console.error("getRankByPuuid error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getAggregatedStats(req, res) {
    try {
        const { summonerName, summonerTag, region, roles: rolesParam, queues: queuesParam } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        // Parse optional filter params
        const allowedRoles  = rolesParam  ? new Set(rolesParam.split(',').map(r => r.trim().toUpperCase())) : null;
        const allowedQueues = queuesParam ? new Set(queuesParam.split(',').map(Number)) : null;

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const broadRegion = getBroadRegion(region);
        const apiKey = getApiKey();

        const cacheKey = `${puuid}:${rolesParam || ''}:${queuesParam || ''}`;
        const cached = getCacheEntry(cacheKey);
        if (cached) {
            console.log(`[AggregatedStats] cache HIT ${summonerName}#${summonerTag}`);
            return res.json(cached);
        }

        const now       = Math.floor(Date.now() / 1000);
        const startTime = now - 14 * 24 * 60 * 60;

        // Helper to create a stat tracker { total, min, max }
        const tracker = () => ({ total: 0, min: Infinity, max: -Infinity });
        const update = (t, val) => {
            t.total += val;
            if (val < t.min) t.min = val;
            if (val > t.max) t.max = val;
        };

        let totalGames = 0, wins = 0;
        let totalAiScore = 0, totalKP = 0;

        // Performance trackers
        const kills = tracker(), deaths = tracker(), assists = tracker();
        const cs = tracker(), visionScore = tracker(), aiScore = tracker();
        const kp = tracker(), gameLength = tracker();

        // Highlights (totals only, no dropdown)
        let firstBloods = 0, forfeits = 0;
        const uniqueChampions = new Set();
        let epicMonsterSteals = 0, flawlessAces = 0, hadOpenNexus = 0;
        let perfectGames = 0, takedownsInEnemyFountain = 0;
        let elderDragonKillsWithOpposingSoul = 0, dancedWithRiftHerald = 0;
        let minEarliestBaron = Infinity;

        // Deep stat trackers
        const healFromMap = tracker(), controlWards = tracker();
        const dragonTakedowns = tracker(), scuttleKills = tracker();
        const stealthWards = tracker(), wardKills = tracker();
        const dmgToTurrets = tracker(), selfMitigated = tracker();
        const allyJungle = tracker(), dmgToChamps = tracker();
        const enemyJungle = tracker(), healsOnTeam = tracker();
        const killsNearTurret = tracker(), maxCsAdv = tracker();
        const takedownsAfterLevel = tracker(), takedownsBeforeJungle = tracker();
        const abilityUses = tracker();

        let idStart = 0;
        let totalIdsFetched = 0;
        let keepFetching = true;

        while (keepFetching) {
            const matchIdsRes = await riotFetch(
                `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${idStart}&count=10&api_key=${apiKey}`
            );
            if (!matchIdsRes.ok) throw new Error(`Riot API error (analysis matchIds): ${matchIdsRes.status}`);
            const batch = await matchIdsRes.json();

            if (batch.length === 0) break;
            totalIdsFetched += batch.length;
            console.log(`[API] analysis: ${batch.length} match IDs fetched (start=${idStart}) for ${summonerName}#${summonerTag} | roles=${rolesParam || 'all'} queues=${queuesParam || 'all'}`);

        for (const matchId of batch) {
            let p = null;
            let allParticipants = null;
            let gameDuration = 0;
            let queueId = null;
            let gameCreationSec = 0;

            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                console.log(`[DB] analysis ${matchId}`);
                gameCreationSec = new Date(cached.gameCreation).getTime() / 1000;
                queueId = cached.queueId;
                if (allowedQueues && !allowedQueues.has(queueId)) continue;
                p = cached.participantSummaries.find(ps => ps.puuid === puuid);
                allParticipants = cached.participantSummaries;
                gameDuration = cached.gameDuration;
            } else {
                console.log(`[API] fetching ${matchId} (analysis)`);
                const matchRes = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`
                );
                if (!matchRes.ok) continue;
                const matchData = await matchRes.json();
                saveMatchToDb(matchData, region);
                gameCreationSec = (matchData.info?.gameCreation || 0) / 1000;
                queueId = matchData.info?.queueId;
                if (allowedQueues && !allowedQueues.has(queueId)) continue;
                allParticipants = matchData.info?.participants || [];
                const rawP = allParticipants.find(pl => pl.puuid === puuid);
                gameDuration = matchData.info?.gameDuration || 0;
                if (rawP) {
                    p = {
                        ...rawP,
                        individualPosition: rawP.individualPosition ?? '',
                        controlWardsPlaced: rawP.challenges?.controlWardsPlaced ?? 0,
                        epicMonsterSteals: rawP.challenges?.epicMonsterSteals ?? 0,
                        flawlessAces: rawP.challenges?.flawlessAces ?? 0,
                        hadOpenNexus: rawP.challenges?.hadOpenNexus ?? 0,
                        perfectGame: rawP.challenges?.perfectGame ?? 0,
                        takedownsInEnemyFountain: rawP.challenges?.takedownsInEnemyFountain ?? 0,
                        earliestBaron: rawP.challenges?.earliestBaron ?? 0,
                        elderDragonKillsWithOpposingSoul: rawP.challenges?.elderDragonKillsWithOpposingSoul ?? 0,
                        dancedWithRiftHerald: rawP.challenges?.dancedWithRiftHerald ?? 0,
                        healFromMapSources: rawP.challenges?.HealFromMapSources ?? 0,
                        dragonTakedowns: rawP.challenges?.dragonTakedowns ?? 0,
                        scuttleCrabKills: rawP.challenges?.scuttleCrabKills ?? 0,
                        stealthWardsPlaced: rawP.challenges?.stealthWardsPlaced ?? 0,
                        wardTakedowns: rawP.challenges?.wardTakedowns ?? 0,
                        killsNearEnemyTurret: rawP.challenges?.killsNearEnemyTurret ?? 0,
                        maxCsAdvantageOnLaneOpponent: rawP.challenges?.maxCsAdvantageOnLaneOpponent ?? 0,
                        takedownsAfterGainingLevelAdvantage: rawP.challenges?.takedownsAfterGainingLevelAdvantage ?? 0,
                        takedownsBeforeJungleMinionSpawn: rawP.challenges?.takedownsBeforeJungleMinionSpawn ?? 0,
                        abilityUses: rawP.challenges?.abilityUses ?? 0,
                    };
                }
            }

            if (gameCreationSec < startTime) {
                console.log(`[Analysis] reached time limit at ${matchId} - stopping`);
                keepFetching = false;
                break;
            }

            if (!p) continue;

            // Role filter: individualPosition
            // ARAM (queueId 450)
            if (allowedRoles) {
                const gameRole = p.individualPosition || '';
                if (gameRole && gameRole !== 'NONE') {
                    if (!allowedRoles.has(gameRole)) continue;
                } else if (queueId !== 450) {
                    console.log(`[Analysis] skip ${matchId} — unknown individualPosition (individualPosition="${gameRole}")`);
                    continue;
                }
            }

            // Skip remakes 
            if (gameDuration < 14 * 60) {
                console.log(`[Analysis] skip ${matchId} — too short (${Math.round(gameDuration / 60)}m)`);
                continue;
            }

            const teamKills = allParticipants
                .filter(pl => pl.teamId === p.teamId)
                .reduce((sum, pl) => sum + (pl.kills || 0), 0);

            totalGames++;
            if (p.win) wins++;

            // AI score
            const roundedScore = genScore(p, allParticipants, gameDuration, queueId).score;
            const kpVal = teamKills > 0 ? Math.round(((p.kills + p.assists) / teamKills) * 100) : 0;
            const csVal = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);

            // Performance
            update(kills, p.kills || 0);
            update(deaths, p.deaths || 0);
            update(assists, p.assists || 0);
            update(cs, csVal);
            update(visionScore, p.visionScore || 0);
            update(aiScore, roundedScore);
            update(kp, kpVal);
            update(gameLength, gameDuration || 0);

            // Highlights
            if (p.firstBloodKill || p.firstBloodAssist) firstBloods++;
            if (p.gameEndedInSurrender && !p.win) forfeits++;
            if (p.championName) uniqueChampions.add(p.championName);
            epicMonsterSteals                += p.epicMonsterSteals || 0;
            flawlessAces                     += p.flawlessAces || 0;
            hadOpenNexus                     += p.hadOpenNexus || 0;
            perfectGames                     += p.perfectGame || 0;
            takedownsInEnemyFountain         += p.takedownsInEnemyFountain || 0;
            elderDragonKillsWithOpposingSoul += p.elderDragonKillsWithOpposingSoul || 0;
            dancedWithRiftHerald             += p.dancedWithRiftHerald || 0;
            if (p.earliestBaron > 0 && p.earliestBaron < minEarliestBaron) {
                minEarliestBaron = p.earliestBaron;
            }

            // Deep stats
            update(healFromMap,           p.healFromMapSources || 0);
            update(controlWards,          p.controlWardsPlaced || 0);
            update(dragonTakedowns,       p.dragonTakedowns || 0);
            update(scuttleKills,          p.scuttleCrabKills || 0);
            update(stealthWards,          p.stealthWardsPlaced || 0);
            update(wardKills,             p.wardTakedowns || 0);
            update(dmgToTurrets,          p.damageDealtToTurrets || 0);
            update(selfMitigated,         p.damageSelfMitigated || 0);
            update(allyJungle,            p.totalAllyJungleMinionsKilled || 0);
            update(dmgToChamps,           p.totalDamageDealtToChampions || 0);
            update(enemyJungle,           p.totalEnemyJungleMinionsKilled || 0);
            update(healsOnTeam,           p.totalHealsOnTeammates || 0);
            update(killsNearTurret,       p.killsNearEnemyTurret || 0);
            update(maxCsAdv,              p.maxCsAdvantageOnLaneOpponent || 0);
            update(takedownsAfterLevel,   p.takedownsAfterGainingLevelAdvantage || 0);
            update(takedownsBeforeJungle, p.takedownsBeforeJungleMinionSpawn || 0);
            update(abilityUses,           p.abilityUses || 0);
        }

            if (batch.length < 10) break;
            idStart += 10;
        }

        const n = totalGames;
        console.log(`[Analysis] complete — ${n}/${totalIdsFetched} IDs fetched for ${summonerName}#${summonerTag}`);

        // build a stat object with avg, total, max, min
        const stat = (t, round = false) => {
            const avg = n > 0 ? (round ? Math.round(t.total / n) : +(t.total / n).toFixed(2)) : 0;
            return {
                avg,
                total: round ? Math.round(t.total) : +t.total.toFixed(2),
                max: t.max === -Infinity ? 0 : (round ? Math.round(t.max) : +t.max.toFixed(2)),
                min: t.min === Infinity  ? 0 : (round ? Math.round(t.min) : +t.min.toFixed(2)),
            };
        };

        const result = {
            totalGames: n,
            wins,
            losses: n - wins,
            winRate: n > 0 ? Math.round((wins / n) * 100) : 0,
            performance: {
                kills:      stat(kills),
                deaths:     stat(deaths),
                assists:    stat(assists),
                cs:         stat(cs),
                visionScore: stat(visionScore),
                aiScore:    stat(aiScore, true),
                kp:         stat(kp, true),
                gameLength: stat(gameLength, true),
            },
            highlights: {
                firstBloods,
                forfeits,
                uniqueChampions: uniqueChampions.size,
                epicMonsterSteals,
                flawlessAces,
                hadOpenNexus,
                perfectGames,
                takedownsInEnemyFountain,
                elderDragonKillsWithOpposingSoul,
                dancedWithRiftHerald,
                earliestBaron: minEarliestBaron === Infinity ? null : Math.round(minEarliestBaron),
            },
            deepStats: {
                healFromMapSources:           stat(healFromMap, true),
                controlWardsPlaced:           stat(controlWards),
                dragonTakedowns:              stat(dragonTakedowns),
                scuttleCrabKills:             stat(scuttleKills),
                stealthWardsPlaced:           stat(stealthWards),
                wardTakedowns:                stat(wardKills),
                damageDealtToTurrets:         stat(dmgToTurrets, true),
                damageSelfMitigated:          stat(selfMitigated, true),
                allyJungleMinions:            stat(allyJungle),
                damageDealtToChampions:       stat(dmgToChamps, true),
                enemyJungleMinions:           stat(enemyJungle),
                healsOnTeammates:             stat(healsOnTeam, true),
                killsNearEnemyTurret:         stat(killsNearTurret),
                maxCsAdvantage:               stat(maxCsAdv),
                takedownsAfterLevelAdvantage: stat(takedownsAfterLevel),
                takedownsBeforeJungleMinionSpawn: stat(takedownsBeforeJungle),
                abilityUses:                  stat(abilityUses, true),
            },
        };

        setCacheEntry(cacheKey, result);
        return res.json(result);
    } catch (error) {
        console.error("[AggregatedStats] error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}
