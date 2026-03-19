import { toast } from './toast';

const API_BASE = '/api/mastery';

export async function getChampionMastery(summonerName, summonerTag, region, forceUpdate = false, ddVersion = '16.5.1') {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        if (forceUpdate) params.set('forceUpdate', 'true');
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/champion-mastery?${params}`, { headers });
        if (res.status === 429) {
            toast.warn('Too many requests — slow down a bit.');
            return [];
        }
        if (!res.ok) throw new Error('Failed to fetch champion mastery');
        const json = await res.json();
        const champs = json.champions ?? json;
        const lastUpdated = json.lastUpdated ? new Date(json.lastUpdated) : null;

        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/data/en_US/champion.json`);
        if (!champRes.ok) throw new Error('Failed to fetch champion data');
        const championData = await champRes.json();
        const keyToChamp = {};
        Object.values(championData.data).forEach(champ => {
            keyToChamp[champ.key] = {
                name: champ.name,
                id: champ.id,
                title: champ.title,
                tags: champ.tags,
            };
        });

        const champions = champs.map(champ => {
            const info = keyToChamp[champ.championId] || {};
            return {
                ...champ,
                name: info.name || `Champion ${champ.championId}`,
                championStringId: info.id || '',
                title: info.title || '',
                tags: info.tags || [],
            };
        });
        return { champions, lastUpdated };

    } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load champion mastery. Please try again.');
        return { champions: [], lastUpdated: null };
    }
}


