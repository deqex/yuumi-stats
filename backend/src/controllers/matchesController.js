import { getBroadRegion } from "../utils/getBroadRegion.js";
import Match from "../models/Match.js";

function getApiKey() {
    const key = process.env.RIOT_API_KEY;
    if (!key) throw new Error("Missing RIOT_API_KEY in backend .env");
    return key;
}

const puuidCache    = new Map();
const puuidInflight = new Map();
const PUUID_TTL     = 5 * 60 * 1000;

function getCachedPuuid(summonerName, summonerTag, region) {
    const key = `${summonerName.toLowerCase()}#${summonerTag.toLowerCase()}@${region.toLowerCase()}`;

    const cached = puuidCache.get(key);
    if (cached && Date.now() - cached.ts < PUUID_TTL) {
        return Promise.resolve(cached.puuid);
    }

    if (puuidInflight.has(key)) {
        return puuidInflight.get(key);
    }

    const promise = fetchPuuid(summonerName, summonerTag, region)
        .then((puuid) => {
            puuidCache.set(key, { puuid, ts: Date.now() });
            puuidInflight.delete(key);
            return puuid;
        })
        .catch((err) => {
            puuidInflight.delete(key);
            throw err;
        });

    puuidInflight.set(key, promise);
    return promise;
}

const POSITION_TO_ROLE = {
    TOP: "TOP",
    JUNGLE: "JUNGLE",
    MIDDLE: "MIDDLE",
    BOTTOM: "BOTTOM",
    UTILITY: "SUPPORT",
};

const POSITION_TO_QUEST_ID = {
    TOP: 1221,
    JUNGLE: 1209,
    MIDDLE: 1206,
    UTILITY: 1208,
};


async function saveMatchToDb(matchData, region) {
    try {
        const { metadata, info } = matchData;
        if (!metadata?.matchId || !info?.participants) return;

        const exists = await Match.exists({ matchId: metadata.matchId });
        if (exists) return;

        const season = new Date(info.gameCreation).getFullYear() - 2010;

        const participantSummaries = info.participants.map((p) => ({
            puuid: p.puuid,
            riotIdGameName: p.riotIdGameName ?? '',
            riotIdTagline: p.riotIdTagline ?? '',
            championId: p.championId,
            championName: p.championName,
            teamId: p.teamId,
            teamPosition: p.teamPosition ?? '',
            individualPosition: p.individualPosition ?? '',
            role: POSITION_TO_ROLE[p.teamPosition] || "MIDDLE",
            roleQuestId: POSITION_TO_QUEST_ID[p.teamPosition] ?? null,
            win: p.win,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            totalMinionsKilled: p.totalMinionsKilled ?? 0,
            neutralMinionsKilled: p.neutralMinionsKilled ?? 0,
            champExperience: p.champExperience ?? 0,
            champLevel: p.champLevel ?? 1,
            goldEarned: p.goldEarned ?? 0,
            totalDamageDealtToChampions: p.totalDamageDealtToChampions ?? 0,
            totalDamageShieldedOnTeammates: p.totalDamageShieldedOnTeammates ?? 0,
            totalHealsOnTeammates: p.totalHealsOnTeammates ?? 0,
            totalDamageTaken: p.totalDamageTaken ?? 0,
            damageSelfMitigated: p.damageSelfMitigated ?? 0,
            timeCCingOthers: p.timeCCingOthers ?? 0,
            timePlayed: p.timePlayed ?? 0,
            visionScore: p.visionScore ?? 0,
            enemyMissingPings: p.enemyMissingPings ?? 0,
            enemyVisionPings: p.enemyVisionPings ?? 0,
            firstTowerKill: p.firstTowerKill ?? false,
            firstBloodKill: p.firstBloodKill ?? false,
            firstBloodAssist: p.firstBloodAssist ?? false,
            largestMultiKill: p.largestMultiKill ?? 0,
            objectivesStolen: p.objectivesStolen ?? 0,
            item0: p.item0 ?? 0,
            item1: p.item1 ?? 0,
            item2: p.item2 ?? 0,
            item3: p.item3 ?? 0,
            item4: p.item4 ?? 0,
            item5: p.item5 ?? 0,
            item6: p.item6 ?? 0,
            summoner1Id: p.summoner1Id ?? 0,
            summoner2Id: p.summoner2Id ?? 0,
            perks: p.perks ?? null,
        }));

        const regionCode = (region || info.platformId || "").toUpperCase();

        await Match.create({
            matchId: metadata.matchId,
            region: regionCode,
            gameCreation: new Date(info.gameCreation),
            gameDuration: info.gameDuration,
            queueId: info.queueId,
            season,
            participantSummaries,
        });

        console.log(`Saved match ${metadata.matchId} to DB`);
    } catch (err) {
        if (err.code !== 11000) {
            console.error("Error saving match to DB:", err.message);
        }
    }
}



const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function riotFetch(url, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        const res = await fetch(url);
        if (res.status === 429 && i < retries) {
            const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
            console.warn(`Rate limited by Riot API, retrying in ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
            continue;
        }
        return res;
    }
}

async function fetchPuuid(summonerName, summonerTag, region) {
    const broadRegion = getBroadRegion(region);
    const url = `https://${broadRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(summonerTag)}?api_key=${getApiKey()}`;
    const res = await riotFetch(url);
    if (res.status === 404) {
        const err = new Error(`Player "${summonerName}#${summonerTag}" not found`);
        err.statusCode = 404;
        throw err;
    }
    if (!res.ok) throw new Error(`Riot API error (puuid): ${res.status}`);
    const { puuid } = await res.json();
    return puuid;
}



export async function getMatchIds(req, res) {
    try {
        const { summonerName, summonerTag, region, forceUpdate, start = '0', count = '5' } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const startNum = Math.max(0, parseInt(start, 10) || 0);
        const countNum = Math.min(100, Math.max(1, parseInt(count, 10) || 5));

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        const broadRegion = getBroadRegion(region);
        console.log(`[API] fetching match IDs for ${summonerName}#${summonerTag} (${region}, start=${startNum}, count=${countNum})`);
        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${startNum}&count=${countNum}&api_key=${getApiKey()}`;
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
                return res.json({
                    metadata: { matchId: id },
                    info: {
                        ...gameFields,
                        gameCreation,
                        participants: participantSummaries
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

        return res.json(matchData);
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

        // Fetch rank, summoner level, and match IDs in parallel
        const [rankRes, summonerRes, matchIdsRes] = await Promise.all([
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${apiKey}`),
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`),
            riotFetch(`https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=7&api_key=${apiKey}`),
        ]);

        const ranks     = rankRes.ok     ? await rankRes.json()     : [];
        const summoner  = summonerRes.ok ? await summonerRes.json() : {};
        const matchIds  = matchIdsRes.ok ? await matchIdsRes.json() : [];

        // Calculate stats from last 7 ranked games
        let totalKills = 0, totalDeaths = 0, totalAssists = 0;
        let totalCS = 0, totalDurationSecs = 0, totalKP = 0;
        let wins = 0, validGames = 0;
        const recentGames = [];

        for (const matchId of matchIds) {
            let participants = null;
            let gameDuration = 0;

            // Check DB cache first
            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                participants = cached.participantSummaries;
                gameDuration = cached.gameDuration;
            } else {
                const matchRes = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`
                );
                if (!matchRes.ok) continue;
                const matchData = await matchRes.json();
                saveMatchToDb(matchData, region);
                participants = matchData.info?.participants || [];
                gameDuration = matchData.info?.gameDuration || 0;
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
