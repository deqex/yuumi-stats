import { getApiKey } from './getApiKey.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function riotFetch(url, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        const res = await fetch(url, {
            headers: { 'X-Riot-Token': getApiKey() }
        });
        if (res.status === 429 && i < retries) {
            const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
            console.warn(`Rate limited by Riot API, retrying in ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
            continue;
        }
        return res;
    }
    throw new Error('Riot API rate limit exceeded after retries');
}
