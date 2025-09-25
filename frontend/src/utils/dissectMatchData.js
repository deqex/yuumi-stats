
export default function dissectMatchData(matchData) {
  let participants = [];
  if (matchData) {
    participants = matchData.info.participants;
  }

  const result = {};

  participants.forEach((p, index) => {
    const key = `player${index}`;
    result[key] = {
      name: p.riotIdGameName,
      puuid: p.puuid,
      championId: p.championId,
      kills: p.kills,
      doubleKills: p.doubleKills,
      tripleKills: p.tripleKills,
      quadraKills: p.quadraKills,
      pentaKills: p.pentaKills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win,
      role: p.lane,
      damageToChampions: p.totalDamageDealtToChampions,
      visionScore: p.visionScore,
      cs: p.totalMinionsKilled,
      summoner1Id: p.summoner1Id,
      summoner2Id: p.summoner2Id,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    };
  });

  return result;
}
