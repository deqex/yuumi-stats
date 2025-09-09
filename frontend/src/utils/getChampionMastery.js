const apikey = import.meta.env.VITE_RIOT_API_KEY;

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getChampionMastery(summonerName, summonerTag, region) {
    try { //don't forget to check region
        const puuidRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag}?api_key=${apikey}`);
        if (!puuidRes.ok) throw new Error('Failed to fetch summoner');
        const { puuid } = await puuidRes.json();

        const masteryRes = await fetch(`https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10&api_key=${apikey}`);
        if (!masteryRes.ok) throw new Error('Failed to fetch champion mastery');
        const champs = await masteryRes.json();

        const championData = await import('../utils/DDragon/champion.json'); //swap to use api end point instead of a local file
        const keyToName = {};
        Object.values(championData.default.data).forEach(champ => {
            keyToName[champ.key] = champ.name;
        });
        
        return champs.map(champ => ({
            ...champ,
            name: keyToName[champ.championId] || `Champion ${champ.championId}`
        }));

    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


