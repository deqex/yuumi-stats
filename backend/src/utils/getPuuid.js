import { getBroadRegion } from "./getBroadRegion.js";
import { riotFetch } from "./riotFetch.js";
import Profile from "../models/Profile.js";

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchPuuid(summonerName, summonerTag, region) {
    const dbProfile = await Profile.findOne({
        gameName: { $regex: new RegExp(`^${escapeRegex(summonerName)}$`, 'i') },
        tagLine:  { $regex: new RegExp(`^${escapeRegex(summonerTag)}$`,  'i') },
    }, 'puuid').lean();
    if (dbProfile?.puuid) {
        console.log(`[PUUID] DB hit for ${summonerName}#${summonerTag}`);
        return dbProfile.puuid;
    }

    const broadRegion = getBroadRegion(region);
    const url = `https://${broadRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(summonerTag)}`;
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

const puuidCache    = new Map();
const puuidInflight = new Map();
const PUUID_TTL     = 5 * 60 * 1000;
const MAX_PUUID_CACHE = 2000;

export function getCachedPuuid(summonerName, summonerTag, region) {
    const key = `${summonerName.toLowerCase()}#${summonerTag.toLowerCase()}@${region.toLowerCase()}`;
    const cached = puuidCache.get(key);
    if (cached && Date.now() - cached.ts < PUUID_TTL) return Promise.resolve(cached.puuid);
    if (puuidInflight.has(key)) return puuidInflight.get(key);
    const promise = fetchPuuid(summonerName, summonerTag, region)
        .then((puuid) => {
            if (puuidCache.size >= MAX_PUUID_CACHE) {
                const oldest = puuidCache.keys().next().value;
                puuidCache.delete(oldest);
            }
            puuidCache.set(key, { puuid, ts: Date.now() }); puuidInflight.delete(key); return puuid;
        })
        .catch((err)  => { puuidInflight.delete(key); throw err; });
    puuidInflight.set(key, promise);
    return promise;
}
