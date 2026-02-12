const apikey = import.meta.env.VITE_RIOT_API_KEY;
import { getPuuid } from './getPuuid.js';

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getChampionMastery(summonerName, summonerTag, region) {
    try { 
        const puuid = await getPuuid(summonerName, summonerTag, region);
        if (!puuid) throw new Error('Puuid not found');

        const masteryRes = await fetch(`https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?api_key=${apikey}`);
        if (!masteryRes.ok) throw new Error('Failed to fetch champion mastery');
        const champs = await masteryRes.json();

        const championData = await import('../utils/DDragon/champion.json'); //swap to use api end point instead of a local file
        const keyToChamp = {};
        Object.values(championData.default.data).forEach(champ => {
            keyToChamp[champ.key] = {
                name: champ.name,
                id: champ.id,
                title: champ.title,
                tags: champ.tags,
            };
        });
        
        return champs.map(champ => {
            const info = keyToChamp[champ.championId] || {};
            return {
                ...champ,
                name: info.name || `Champion ${champ.championId}`,
                championStringId: info.id || '',
                title: info.title || '',
                tags: info.tags || [],
            };
        });

    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


