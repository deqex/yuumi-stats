const VALID_REGIONS = new Set([
    "BR1", "LA1", "LA2", "NA1",
    "EUN1", "EUW1", "ME1", "RU", "TR1",
    "JP1", "KR",
    "OC1", "SG2", "TW2", "VN2",
]);

export function isValidRegion(region) {
    return VALID_REGIONS.has(region.toUpperCase());
}

export function getBroadRegion(region) {
    const upper = region.toUpperCase();

    if (["BR1", "LA1", "LA2", "NA1"].includes(upper)) {
        return "americas";
    }
    if (["EUN1", "EUW1", "ME1", "RU", "TR1"].includes(upper)) {
        return "europe";
    }
    if (["JP1", "KR"].includes(upper)) {
        return "asia";
    }
    if (["OC1", "SG2", "TW2", "VN2"].includes(upper)) {
        return "sea";
    }

    throw new Error(`Unknown region: ${region}`);
}

export function getPuuidRegion(region) {
    const broad = getBroadRegion(region);
    return broad === "sea" ? "asia" : broad;
}
