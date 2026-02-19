const API_BASE = '/api/matches';

export async function getMatchIds(summonerName, summonerTag, region, forceUpdate = false, start = 0, count = 5) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region, start, count });
        if (forceUpdate) params.set('forceUpdate', 'true');
        const res = await fetch(`${API_BASE}/match-ids?${params}`);
        if (!res.ok) throw new Error('Failed to fetch match IDs');
        const matchIds = await res.json();
        return matchIds;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


