const API_BASE = '/api/riot';

export async function getPuuid(summonerName, summonerTag, region) {
    try {
        const params = new URLSearchParams({ summonerName, summonerTag, region });
        const res = await fetch(`${API_BASE}/puuid?${params}`);
        if (!res.ok) throw new Error('Failed to fetch puuid');
        const data = await res.json();
        return data.puuid;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}


