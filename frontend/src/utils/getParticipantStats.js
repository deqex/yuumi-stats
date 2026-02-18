export async function getParticipantStats(puuid, region) {
    try {
        const params = new URLSearchParams({ puuid, region });
        const res = await fetch(`/api/matches/participant-stats?${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching participant stats:', error);
        return null;
    }
}
