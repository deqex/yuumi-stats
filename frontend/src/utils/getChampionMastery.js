const API_BASE = '/api/mastery';

export async function getChampionMastery(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/champion-mastery?${params}`);
        if (!res.ok) throw new Error('Failed to fetch champion mastery');
        const champs = await res.json();

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


