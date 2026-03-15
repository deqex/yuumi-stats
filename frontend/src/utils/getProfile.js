import { toast } from './toast';

const API_BASE = '/api/profile';

export async function getProfile(summonerName, summonerTag, region, forceUpdate = false) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        if (forceUpdate) params.set('forceUpdate', 'true');
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}?${params}`, { headers });
        if (res.status === 429) {
            toast.warn('Too many requests — slow down a bit.');
            return null;
        }
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile. Please try again.');
        return null;
    }
}
