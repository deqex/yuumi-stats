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
        if (!res.ok) throw new Error('Failed to fetch match data');
        const matchData = await res.json();
        return matchData;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


