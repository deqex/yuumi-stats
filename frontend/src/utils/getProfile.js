const API_BASE = '/api/profile';

export async function getProfile(summonerName, summonerTag, region, forceUpdate = false) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        if (forceUpdate) params.set('forceUpdate', 'true');
        const res = await fetch(`${API_BASE}?${params}`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}
