
export default function dissectMatchData(matchData) {
  let participants = [];
  if (
    matchData &&
    matchData.info &&
    Array.isArray(matchData.info.participants)
  ) {
    participants = matchData.info.participants;
  }

  const result = {};
  const gameDuration = matchData.info.gameDuration

  participants.forEach((p, index) => {
    const key = `player${index}`;
    result[key] = { ...p, name: p.riotIdGameName };
  });

  return result;

}
