export default function dissectGeneralMatchData(matchData) {
  if (!matchData || !matchData.info) {
    return {};
  }

  const { participants, ...gameInfo } = matchData.info;

  return gameInfo;
}
