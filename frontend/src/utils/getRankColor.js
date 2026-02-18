
export const RANK_COLOR_MAP = {
  emerald:    '#2ecc40',   
  diamond:    '#a259ec',   
  platinum:   '#1abc9c',   
  gold:       '#ff9900',   
  silver:     '#838383',   
  bronze:     '#a97142',   
  iron:       '#474037',   
  master:     '#b30068',   
  grandmaster:'#b41d31',   
  challenger: '#ffe347',   
};

export function getRankColor(rank) {
  if (!rank) return RANK_COLOR_MAP.silver;
  const normalized = rank.toLowerCase();
  return RANK_COLOR_MAP[normalized] || RANK_COLOR_MAP.silver;
}
