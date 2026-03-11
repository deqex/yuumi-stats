import ChampionMastery from "../models/ChampionMastery.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { getApiKey } from "../utils/getApiKey.js";
import { riotFetch } from "../utils/riotFetch.js";


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
        const { summonerName, summonerTag, region, forceUpdate } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        if (forceUpdate === 'true' && !req.userId) {
            return res.status(403).json({ error: 'forceUpdate requires authentication.' });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        if (forceUpdate !== 'true') {
            const cached = await ChampionMastery.findOne({ puuid, region: region.toLowerCase() });
            if (cached && cached.champions?.length > 0) {
                console.log(`[DB] mastery for ${puuid} (${region})`);
                return res.json(cached.champions);
            }
        }

        console.log(`[API] fetching mastery for ${puuid} (${region})`);
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
