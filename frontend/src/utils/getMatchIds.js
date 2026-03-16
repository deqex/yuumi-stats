import { toast } from './toast';

const API_BASE = '/api/matches';

export async function getMatchIds(summonerName, summonerTag, region, forceUpdate = false, start = 0, count = 5, queue = null) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region, start, count });
        if (forceUpdate) params.set('forceUpdate', 'true');
        if (queue) params.set('queue', queue);
        const res = await fetch(`${API_BASE}/match-ids?${params}`);
        if (res.status === 429) {
            toast.warn('Too many requests — slow down a bit.');
            return [];
        }
        if (!res.ok) throw new Error('Failed to fetch match IDs');
        return await res.json();
    } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load matches. Please try again.');
        return [];
    }
}


