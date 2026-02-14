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
        const { summonerName, summonerTag, region, forceUpdate } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        if (forceUpdate !== 'true') {
            const cachedMatches = await Match.find({ "participantSummaries.puuid": puuid })
                .sort({ gameCreation: -1 })
                .limit(5)
                .select('matchId');
            if (cachedMatches.length > 0) {
                const matchIds = cachedMatches.map(m => m.matchId);
                console.log(`[DB] match IDs for ${summonerName}#${summonerTag} (${matchIds.length} matches)`);
                return res.json(matchIds);
            }
        }

        const broadRegion = getBroadRegion(region);
        console.log(`[API] fetching match IDs for ${summonerName}#${summonerTag} (${region})`);
        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5&api_key=${getApiKey()}`;
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
                return res.json({
                    metadata: { matchId: id },
                    info: {
                        ...gameFields,
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
