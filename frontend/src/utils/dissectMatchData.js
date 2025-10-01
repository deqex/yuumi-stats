
export default function dissectMatchData(matchData) {
  let participants = [];
  // Defensive check to avoid errors if matchData or matchData.info is undefined
  if (
    matchData &&
    matchData.info &&
    Array.isArray(matchData.info.participants)
  ) {
    participants = matchData.info.participants;
  }

  const result = {};

  participants.forEach((p, index) => {
    const key = `player${index}`;
    result[key] = { ...p, name: p.riotIdGameName };
  });

  return result;
}
