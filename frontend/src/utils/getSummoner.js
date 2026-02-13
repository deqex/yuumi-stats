const API_BASE = '/api/matches';

export async function getSummoner(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/summoner?${params}`);
        if (!res.ok) throw new Error('Failed to fetch summoner data');
        return await res.json();
    } catch (error) {
        console.error('Error fetching summoner:', error);
        return null;
    }
}
