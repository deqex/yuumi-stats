const API_BASE = '/api/matches';

export async function getLiveGame(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/live-game?${params}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch live game data');
        return await res.json();
    } catch (error) {
        console.error('Error fetching live game:', error);
        return null;
    }
}
