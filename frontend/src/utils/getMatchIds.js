const apikey = import.meta.env.VITE_RIOT_API_KEY;
import { getPuuid } from './getPuuid.js';

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getMatchIds(summonerName, summonerTag, region) {
    try {
        const puuid = await getPuuid(summonerName, summonerTag, region);
        if (!puuid) throw new Error('Puuid not found');

        // fix this to use the correct region
        const matchIdRes = await fetch(`
        https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${apikey}
            `);
        if (!matchIdRes.ok) throw new Error('Failed to fetch champion mastery');
        const MatchIds = await matchIdRes.json();

        return MatchIds;

    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


