const API_BASE = '/api/riot';

export async function getDataFromMatchId(matchId, region) {
    try {
        if (!matchId) throw new Error('Missing matchId');

        const params = region ? new URLSearchParams({ region }) : '';
        const res = await fetch(`${API_BASE}/match/${encodeURIComponent(matchId)}${params ? '?' + params : ''}`);
        if (!res.ok) throw new Error('Failed to fetch match data');
        const matchData = await res.json();
        return matchData;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


