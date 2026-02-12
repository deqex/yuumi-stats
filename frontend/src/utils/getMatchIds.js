const API_BASE = '/api/riot';

export async function getMatchIds(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/match-ids?${params}`);
        if (!res.ok) throw new Error('Failed to fetch match IDs');
        const matchIds = await res.json();
        return matchIds;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


