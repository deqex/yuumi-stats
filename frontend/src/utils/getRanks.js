const API_BASE = '/api/riot';

export async function getRanks(summonerName, summonerTag, region) {
  if (!summonerName || !summonerTag || !region) return [];
  try {
    const params = new URLSearchParams({ summonerName, summonerTag, region });
    const res = await fetch(`${API_BASE}/ranks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch ranks');
    return await res.json();
  } catch (error) {
    console.error('getRanks error:', error);
    return [];
  }
}
