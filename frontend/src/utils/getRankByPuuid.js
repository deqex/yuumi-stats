export async function getRankByPuuid(puuid, region) {
    try {
        const params = new URLSearchParams({ puuid, region });
        const res = await fetch(`/api/matches/rank-by-puuid?${params}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}
