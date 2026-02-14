import Profile from "../models/Profile.js";
import { getBroadRegion } from "../utils/getBroadRegion.js";

function getApiKey() {
    const key = process.env.RIOT_API_KEY;
    if (!key) throw new Error("Missing RIOT_API_KEY in backend .env");
    return key;
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
    const data = await res.json();
    return data.puuid;
}

async function fetchSummoner(puuid, region) {
    const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${getApiKey()}`;
    const res = await riotFetch(url);
    if (!res.ok) throw new Error(`Riot API error (summoner): ${res.status}`);
    return await res.json();
}

async function fetchRanks(puuid, region) {
    const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${getApiKey()}`;
    const res = await riotFetch(url);
    if (!res.ok) throw new Error(`Riot API error (ranks): ${res.status}`);
    return await res.json();
}

async function saveProfileToDb(summonerName, puuid, icon, rankEntries) {
    const ranks = rankEntries.map((e) => ({
        queueType: e.queueType,
        tier: e.tier,
        rank: e.rank,
        leaguePoints: e.leaguePoints ?? 0,
        wins: e.wins ?? 0,
        losses: e.losses ?? 0,
    }));

    const profile = await Profile.findOneAndUpdate(
        { puuid },
        {
            summonerName,
            puuid,
            icon,
            ranks,
            lastUpdated: new Date(),
        },
        { upsert: true, new: true }
    );

    console.log(`Saved profile for ${summonerName} (${puuid}) to DB`);
    return profile;
}

export async function getProfile(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await fetchPuuid(summonerName, summonerTag, region);
        const [summoner, rankEntries] = await Promise.all([
            fetchSummoner(puuid, region),
            fetchRanks(puuid, region),
        ]);

        const profile = await saveProfileToDb(
            `${summonerName}#${summonerTag}`,
            puuid,
            summoner.profileIconId,
            rankEntries
        );

        return res.json({
            summonerName: profile.summonerName,
            puuid: profile.puuid,
            icon: profile.icon,
            ranks: profile.ranks,
            summonerLevel: summoner.summonerLevel,
        });
    } catch (error) {
        console.error("getProfile error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getStoredProfile(req, res) {
    try {
        const { puuid } = req.params;
        if (!puuid) {
            return res.status(400).json({ error: "puuid is required" });
        }

        const profile = await Profile.findOne({ puuid });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        return res.json(profile);
    } catch (error) {
        console.error("getStoredProfile error:", error);
        return res.status(500).json({ error: error.message });
    }
}
