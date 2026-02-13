import ChampionMastery from "../models/ChampionMastery.js";
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

async function saveMasteryToDb(puuid, region, champs) {
    const champions = champs.map((c) => ({
        championId:                   c.championId,
        championLevel:                c.championLevel,
        championPoints:               c.championPoints,
        championPointsSinceLastLevel: c.championPointsSinceLastLevel ?? 0,
        championPointsUntilNextLevel: c.championPointsUntilNextLevel ?? 0,
        lastPlayTime:                 c.lastPlayTime ?? 0,
    }));

    await ChampionMastery.findOneAndUpdate(
        { puuid, region: region.toLowerCase() },
        { puuid, region: region.toLowerCase(), champions, lastUpdated: new Date() },
        { upsert: true, new: true }
    );

    console.log(`Saved mastery for ${puuid} (${region}) – ${champions.length} champions`);
}

export async function getChampionMastery(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?api_key=${getApiKey()}`;
        const masteryRes = await riotFetch(url);
        if (!masteryRes.ok) throw new Error(`Riot API error (mastery): ${masteryRes.status}`);
        const champs = await masteryRes.json();

        saveMasteryToDb(puuid, region, champs).catch((err) =>
            console.error("Error saving mastery to DB:", err.message)
        );

        return res.json(champs);
    } catch (error) {
        console.error("getChampionMastery error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getStoredMastery(req, res) {
    try {
        const { puuid } = req.params;
        const { region } = req.query;
        if (!puuid || !region) {
            return res.status(400).json({ error: "puuid param and region query are required" });
        }

        const doc = await ChampionMastery.findOne({ puuid, region: region.toLowerCase() });
        if (!doc) return res.status(404).json({ error: "No stored mastery found" });

        return res.json(doc);
    } catch (error) {
        console.error("getStoredMastery error:", error);
        return res.status(500).json({ error: error.message });
    }
}
