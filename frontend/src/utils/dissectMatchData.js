
export default function dissectMatchData(matchData) {
  const participantsArray = matchData.info.participants;
  const ingameNames = participantsArray.map(p => p.riotIdGameName);
  for (const player of ingameNames) { //change to save for each participant im too stupid rn
      let ingameName = participantsArray.map(p => p.riotIdGameName);
      let champion = participantsArray.map(p => p.championId); //or name choose later

      let kills = participantsArray.map(p => p.kills);
      let deaths = participantsArray.map(p => p.deaths);
      let assists = participantsArray.map(p => p.assists);
      let win = participantsArray.map(p => p.win);
      let totalDamageDealt = participantsArray.map(p => p.totalDamageDealt);
      let summoner1Id = participantsArray.map(p => p.summoner1Id);
      let summoner2Id = participantsArray.map(p => p.summoner2Id);
      let visionScore = participantsArray.map(p => p.visionScore);
      let totalMinionsKilled = participantsArray.map(p => p.totalMinionsKilled);
      //fuck runes
      //especially aery
      let items = [
        item0 = participantsArray.map(p => p.item0),
        item1 = participantsArray.map(p => p.item1),
        item2 = participantsArray.map(p => p.item2),
        item3 = participantsArray.map(p => p.item3),
        item4 = participantsArray.map(p => p.item4),
        item5 = participantsArray.map(p => p.item5),
        item6 = participantsArray.map(p => p.item6)
      ];
  }








  
  return ingameNames; 
}
