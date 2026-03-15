import { toast } from './toast';

const API_BASE = '/api/matches';

export async function getDataFromMatchId(matchId, region, forceUpdate = false) {
    try {
        if (!matchId) throw new Error('Missing matchId');

        const params = new URLSearchParams();
        if (region) params.set('region', region);
        if (forceUpdate) params.set('forceUpdate', 'true');
        const qs = params.toString();
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/match/${encodeURIComponent(matchId)}${qs ? '?' + qs : ''}`, { headers });
        if (res.status === 429) {
            toast.warn('Too many requests — slow down a bit.');
            return null;
        }
        if (!res.ok) throw new Error('Failed to fetch match data');
        return await res.json();
    } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load match data. Please try again.');
        return null;
    }
}


