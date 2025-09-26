
export default function dissectMatchData(matchData) {
  let participants = [];
  if (matchData) {
    participants = matchData.info.participants;
  }

  const result = {};

  participants.forEach((p, index) => {
    const key = `player${index}`;
    result[key] = { ...p, name: p.riotIdGameName };
  });

  return result;
}
