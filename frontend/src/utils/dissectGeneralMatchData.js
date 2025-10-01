export default function dissectGeneralMatchData(matchData) {
  if (!matchData || !matchData.info) {
    return {}; // Return empty object if no data
  }

  const { participants, ...gameInfo } = matchData.info;

  return gameInfo;
}
