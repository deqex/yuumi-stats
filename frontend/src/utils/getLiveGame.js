import { toast } from './toast';

const API_BASE = '/api/matches';

export async function getLiveGame(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/live-game?${params}`);
        if (res.status === 404) return null;
        if (res.status === 429) {
            toast.warn('Too many requests — slow down a bit.');
            return null;
        }
        if (!res.ok) throw new Error('Failed to fetch live game data');
        return await res.json();
    } catch (error) {
        console.error('Error fetching live game:', error);
        toast.error('Failed to load live game. Please try again.');
        return null;
    }
}
