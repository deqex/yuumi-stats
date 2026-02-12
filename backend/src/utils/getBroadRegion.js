export function getBroadRegion(region) {
    const upper = region.toUpperCase();

    if (["BR1", "LA1", "LA2", "NA1"].includes(upper)) {
        return "americas";
    }
    if (["EUN1", "EUW1", "RU", "TR"].includes(upper)) {
        return "europe";
    }
    if (["JP1", "KR", "ME1", "OC1", "SG2", "TW2", "VN2"].includes(upper)) {
        return "asia";
    }

    throw new Error(`Unknown region: ${region}`);
}
