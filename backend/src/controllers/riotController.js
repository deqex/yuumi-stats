import { getBroadRegion } from "../utils/getBroadRegion.js";

function getApiKey() {
    const key = process.env.RIOT_API_KEY;
    if (!key) throw new Error("Missing RIOT_API_KEY in backend .env");
    return key;
}

// ---------- helpers ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with automatic retry on 429 (rate-limited) responses.
 * Respects the Retry-After header from Riot, with a fallback of 1 second.
 */
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
    if (!res.ok) throw new Error(`Riot API error (puuid): ${res.status}`);
    const { puuid } = await res.json();
    return puuid;
}

// ---------- route handlers ----------

export async function getMatchIds(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);
        const broadRegion = getBroadRegion(region);

        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5&api_key=${getApiKey()}`;
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchIds): ${matchRes.status}`);
        const matchIds = await matchRes.json();

        return res.json(matchIds);
    } catch (error) {
        console.error("getMatchIds error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getMatchData(req, res) {
    try {
        const { matchId } = req.params;
        const { region } = req.query;
        if (!matchId) {
            return res.status(400).json({ error: "matchId is required" });
        }

        // Default to europe if no region provided (matches are region-specific)
        const broadRegion = region ? getBroadRegion(region) : "europe";

        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${getApiKey()}`;
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchData): ${matchRes.status}`);
        const matchData = await matchRes.json();

        return res.json(matchData);
    } catch (error) {
        console.error("getMatchData error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getChampionMastery(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);

        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const masteryRes = await riotFetch(url);
        if (!masteryRes.ok) throw new Error(`Riot API error (mastery): ${masteryRes.status}`);
        const champs = await masteryRes.json();

        return res.json(champs);
    } catch (error) {
        console.error("getChampionMastery error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getPuuid(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);
        return res.json({ puuid });
    } catch (error) {
        console.error("getPuuid error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getSummoner(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const summonerRes = await riotFetch(url);
        if (!summonerRes.ok) throw new Error(`Riot API error (summoner): ${summonerRes.status}`);
        const summoner = await summonerRes.json();

        return res.json(summoner);
    } catch (error) {
        console.error("getSummoner error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getRankEntries(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const rankRes = await riotFetch(url);
        if (!rankRes.ok) throw new Error(`Riot API error (ranks): ${rankRes.status}`);
        const ranks = await rankRes.json();

        return res.json(ranks);
    } catch (error) {
        console.error("getRankEntries error:", error);
        return res.status(500).json({ error: error.message });
    }
}
