import { useEffect, useState } from 'react';
import { getRankColor } from '../../utils/getRankColor';
import { useParams, useNavigate } from 'react-router-dom';
import './LiveGame.css';
import { Navbar } from '../../components';
import { getLiveGame } from '../../utils/getLiveGame';
import { getParticipantStats } from '../../utils/getParticipantStats';
import DominationTreeIcon from '../../utils/DDragon/runes/7200_Domination.png';
import PrecisionTreeIcon  from '../../utils/DDragon/runes/7201_Precision.png';
import SorceryTreeIcon    from '../../utils/DDragon/runes/7202_Sorcery.png';
import InspirationTreeIcon from '../../utils/DDragon/runes/7203_Whimsy.png';
import ResolveTreeIcon    from '../../utils/DDragon/runes/7204_Resolve.png';
import RankIron       from '../../utils/DDragon/ranks/Rank=Iron.png';
import RankBronze     from '../../utils/DDragon/ranks/Rank=Bronze.png';
import RankSilver     from '../../utils/DDragon/ranks/Rank=Silver.png';
import RankGold       from '../../utils/DDragon/ranks/Rank=Gold.png';
import RankPlatinum   from '../../utils/DDragon/ranks/Rank=Platinum.png';
import RankEmerald    from '../../utils/DDragon/ranks/Rank=Emerald.png';
import RankDiamond    from '../../utils/DDragon/ranks/Rank=Diamond.png';
import RankMaster     from '../../utils/DDragon/ranks/Rank=Master.png';
import RankGrandmaster from '../../utils/DDragon/ranks/Rank=Grandmaster.png';
import RankChallenger from '../../utils/DDragon/ranks/Rank=Challenger.png';

const DD_VERSION            = '16.3.1';
const DD_CHAMPION_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion`;
const DD_SUMMONER_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/spell`;
const DD_RUNE_ICON_BASE     = `https://ddragon.leagueoflegends.com/cdn/img`;

const MAP_NAMES = { 11: "Summoner's Rift", 12: 'Howling Abyss' };

const RANK_ICON_MAP = {
  IRON: RankIron, BRONZE: RankBronze, SILVER: RankSilver,
  GOLD: RankGold, PLATINUM: RankPlatinum, EMERALD: RankEmerald,
  DIAMOND: RankDiamond, MASTER: RankMaster, GRANDMASTER: RankGrandmaster,
  CHALLENGER: RankChallenger,
};

const ROMAN_TO_NUM = { I: '1', II: '2', III: '3', IV: '4' };

const SUMMONER_SPELLS = {
  1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash',
  6: 'SummonerHaste', 7: 'SummonerHeal',    11: 'SummonerSmite',
  12: 'SummonerTeleport', 13: 'SummonerMana', 14: 'SummonerDot',
  21: 'SummonerBarrier', 32: 'SummonerSnowball',
};

const RUNE_ICONS = {
  8005: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8010: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
  8021: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
  8112: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
  8124: 'perk-images/Styles/Domination/Predator/Predator.png',
  8128: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
  8214: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
  8437: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
  8439: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
  8465: 'perk-images/Styles/Resolve/Guardian/Guardian.png',
  8351: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
  8360: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
  8369: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png',
};

const RUNE_TREE_ICONS = {
  8000: PrecisionTreeIcon, 8100: DominationTreeIcon, 8200: SorceryTreeIcon,
  8300: InspirationTreeIcon, 8400: ResolveTreeIcon,
};

const TIER_OFFSET = { IRON: 0, BRONZE: 4, SILVER: 8, GOLD: 12, PLATINUM: 16, EMERALD: 20, DIAMOND: 24 };
const DIV_SCORE   = { IV: 1, III: 2, II: 3, I: 4 };

function champUrl(champ)  { return champ ? `${DD_CHAMPION_ICON_BASE}/${champ.id}.png` : null; }
function spellUrl(id)     { const k = id != null ? SUMMONER_SPELLS[id] : null; return k ? `${DD_SUMMONER_ICON_BASE}/${k}.png` : null; }
function runeUrl(id)      { const r = id != null ? RUNE_ICONS[id] : null; return r ? `${DD_RUNE_ICON_BASE}/${r}` : null; }
function titleCase(str)   { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }

function formatRank(ranks) {
  const solo = ranks?.find(r => r.queueType === 'RANKED_SOLO_5x5');
  if (!solo?.tier) return 'Unranked';
  return `${titleCase(solo.tier)} ${ROMAN_TO_NUM[solo.rank] || solo.rank}`;
}

function getRankIcon(ranks) {
  const solo = ranks?.find(r => r.queueType === 'RANKED_SOLO_5x5');
  if (!solo?.tier) return null;
  return RANK_ICON_MAP[solo.tier.toUpperCase()] || null;
}

function rankScore(ranks) {
  const solo = ranks?.find(r => r.queueType === 'RANKED_SOLO_5x5');
  if (!solo?.tier) return null;
  const t = solo.tier.toUpperCase();
  if (t === 'CHALLENGER')  return 31;
  if (t === 'GRANDMASTER') return 30;
  if (t === 'MASTER')      return 29;
  const base = TIER_OFFSET[t];
  if (base == null) return null;
  return base + (DIV_SCORE[solo.rank] || 0);
}

function scoreToRank(score) {
  if (score >= 31) return 'Challenger';
  if (score >= 30) return 'Grandmaster';
  if (score >= 29) return 'Master';
  const tiers = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond'];
  const divs  = ['IV', 'III', 'II', 'I'];
  const idx = Math.floor((score - 1) / 4);
  const div = divs[(score - 1) % 4];
  return `${tiers[idx]} ${div}`;
}

function calcAvgRank(puuids, statsMap) {
  const scores = puuids
    .map(puuid => {
      const data = statsMap[puuid];
      if (!data) return null;
      return rankScore(data.ranks);
    })
    .filter(s => s !== null);
  if (!scores.length) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return scoreToRank(Math.round(avg));
}

function PlayerCard({ participant, isFocused, championMap, statsData }) {
  const champ       = championMap[String(participant.championId)];
  const champImgUrl = champUrl(champ);

  const spell1      = spellUrl(participant.spell1Id);
  const spell2      = spellUrl(participant.spell2Id);
  const keystoneId  = participant.perks?.perkIds?.[0];
  const subStyleId  = participant.perks?.perkSubStyle;
  const keystoneImg = runeUrl(keystoneId);
  const subTreeImg  = RUNE_TREE_ICONS[subStyleId] || null;

  const [gameName, tagLine] = (participant.riotId || '#').split('#');

  const level    = statsData?.summonerLevel ?? null;
  const rankText = statsData ? formatRank(statsData.ranks) : null;
  const rankIcon = statsData ? getRankIcon(statsData.ranks) : null;
  const s        = statsData?.stats ?? null;

  const loading = statsData === undefined;

  return (
    <div className={`lg-player-card ${isFocused ? 'lg-player-card--focused' : ''}`}>

      <div className="lg-card-top">
        <div className="lg-spells-col">
          <div className="lg-spell-slot">{spell1 && <img src={spell1} alt="s1" className="lg-slot-img" />}</div>
          <div className="lg-spell-slot">{spell2 && <img src={spell2} alt="s2" className="lg-slot-img" />}</div>
        </div>

        <div className="lg-champ-tile">
          {champImgUrl
            ? <img src={champImgUrl} alt={champ?.name} className="lg-slot-img" />
            : <div className="lg-champ-tile-empty" />}
        </div>

        <div className="lg-runes-col">
          <div className="lg-rune-slot">{keystoneImg && <img src={keystoneImg} alt="keystone" className="lg-slot-img" />}</div>
          <div className="lg-rune-slot lg-rune-slot--sub">{subTreeImg && <img src={subTreeImg} alt="sub" className="lg-slot-img lg-slot-img--sub" />}</div>
        </div>
      </div>

      <div className="lg-card-info">
        <div className="lg-card-name">
          {gameName}<span className="lg-card-tag">#{tagLine}</span>
        </div>

        {loading ? (
          <div className="lg-card-loading-row" />
        ) : (
          <>
            <div className="lg-card-level">
              {level != null ? `Level ${level}` : 'Level —'}
            </div>
            <div className="lg-card-rank-row">
              {rankIcon && <img src={rankIcon} alt="rank" className="lg-rank-icon" />}
              <span
                className="lg-card-rank"
                style={{ color: getRankColor(rankText?.split(' ')[0]) }}
              >
                {rankText ?? '—'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="lg-recent-champs">
        {loading || !statsData?.recentGames
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="lg-recent-champ">
                <div className="lg-recent-champ-icon lg-skeleton" />
                <div className="lg-recent-champ-bar" />
              </div>
            ))
          : statsData.recentGames.map((game, i) => {
              const c   = championMap[String(game.championId)];
              const url = champUrl(c);
              return (
                <div key={i} className="lg-recent-champ">
                  <div className="lg-recent-champ-icon">
                    {url
                      ? <img src={url} alt={c?.name} className="lg-slot-img" />
                      : <div className="lg-team-champ-empty" />}
                  </div>
                  <div className={`lg-recent-champ-bar ${game.win ? 'lg-bar-win' : 'lg-bar-loss'}`} />
                </div>
              );
            })
        }
      </div>

      <div className="lg-card-stats">
        {loading ? (
          <>
            <div className="lg-stat-skeleton" style={{ width: '70%' }} />
            <div className="lg-stat-skeleton" style={{ width: '55%' }} />
            <div className="lg-stat-skeleton" style={{ width: '60%' }} />
            <div className="lg-stat-skeleton" style={{ width: '50%' }} />
            <div className="lg-stat-skeleton" style={{ width: '45%' }} />
            <div className="lg-stat-skeleton" style={{ width: '65%' }} />
          </>
        ) : s ? (
          <>
            <div className="lg-stat-main">{s.avgKills} / {s.avgDeaths} / {s.avgAssists}</div>
            <div className="lg-stat-sub">({s.kda} KDA)</div>
            <div className="lg-stat-sub">{s.winRate}% Winrate</div>
            <div className="lg-stat-sub">{s.csPerMin} cs/min</div>
            <div className="lg-stat-sub">{s.avgKP}% KP</div>
            <div className="lg-stat-sub">Avg AI Score —</div>
          </>
        ) : (
          <>
            <div className="lg-stat-main">— / — / —</div>
            <div className="lg-stat-sub">(— KDA)</div>
            <div className="lg-stat-sub">—% Winrate</div>
            <div className="lg-stat-sub">— cs/min</div>
            <div className="lg-stat-sub">—% KP</div>
            <div className="lg-stat-sub">Avg AI Score —</div>
          </>
        )}
      </div>

      <div className="lg-card-badges" />
    </div>
  );
}

export default function LiveGame() {
  const [gameData, setGameData]         = useState(null);
  const [notInGame, setNotInGame]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [championMap, setChampionMap]   = useState({});
  const [elapsed, setElapsed]           = useState(0);
  const [statsMap, setStatsMap]         = useState({});
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag]   = useState('');
  const [region, setRegion]             = useState('');
  const [queuesMap, setQueuesMap]       = useState({});
  const params   = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (params.region && params.nameTag) {
      const [name, tag] = params.nameTag.split('-');
      setRegion(params.region);
      setSummonerName(name || '');
      setSummonerTag(tag || '');
    }
  }, [params]);

  useEffect(() => {
    fetch('/api/matches/queues')
      .then(r => r.json())
      .then(data => {
        const map = {};
        for (const q of data) {
          let name = q.description || q.map || 'Unknown';
          name = name.replace(/^\d+v\d+\s+/, '').replace(/\s+games$/i, '');
          map[q.queueId] = name;
        }
        setQueuesMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/data/en_US/champion.json`)
      .then(r => r.json())
      .then(data => {
        const map = {};
        Object.values(data.data).forEach(c => { map[c.key] = { id: c.id, name: c.name }; });
        setChampionMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!summonerName || !summonerTag || !region) return;
    setLoading(true);
    setNotInGame(false);
    setGameData(null);
    setStatsMap({});
    getLiveGame(summonerName, summonerTag, region)
      .then(data => { if (!data) setNotInGame(true); else setGameData(data); })
      .finally(() => setLoading(false));
  }, [summonerName, summonerTag, region]);

  useEffect(() => {
    if (!gameData || !region) return;
    const participants = gameData.participants || [];
    const fetchAll = async () => {
      for (const p of participants) {
        try {
          const data = await getParticipantStats(p.puuid, region);
          setStatsMap(prev => ({ ...prev, [p.puuid]: data ?? null }));
        } catch {
          setStatsMap(prev => ({ ...prev, [p.puuid]: null }));
        }
      }
    };
    fetchAll();
  }, [gameData, region]);

  useEffect(() => {
    if (!gameData?.gameStartTime) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - gameData.gameStartTime) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameData?.gameStartTime]);

  const minutesElapsed = Math.floor(elapsed / 60);
  const blueTeam = gameData?.participants?.filter(p => p.teamId === 100) || [];
  const redTeam  = gameData?.participants?.filter(p => p.teamId === 200) || [];

  const isFocused = p => {
    const [n] = (p.riotId || '').split('#');
    return n.toLowerCase() === summonerName.toLowerCase();
  };

  const getStatsData = puuid => {
    if (!(puuid in statsMap)) return undefined;
    return statsMap[puuid];
  };

  const blueAvgRank = calcAvgRank(blueTeam.map(p => p.puuid), statsMap);
  const redAvgRank  = calcAvgRank(redTeam.map(p => p.puuid), statsMap);

  const queueName = queuesMap[gameData?.gameQueueConfigId] || gameData?.gameMode || '';
  const mapName   = MAP_NAMES[gameData?.mapId] || '';

  return (
    <div className="livegame-container">
      <Navbar />
      <div className="livegame-inner">

        {summonerName && summonerTag && (
          <div className="profile-tabs">
            <button className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`)}>Overview</button>
            <button className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/mastery`)}>Mastery</button>
            <button className="profile-tab-button disabled">Analysis</button>
            <button className="profile-tab-button active"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/livegame`)}>Live game</button>
          </div>
        )}

        {loading && (
          <div className="lg-status">
            <div className="lg-spinner" />
            <span>Checking for live game…</span>
          </div>
        )}

        {!loading && notInGame && (
          <div className="lg-not-found">
            <div className="lg-not-found-icon">⚔️</div>
            <div className="lg-not-found-title">{summonerName} is not currently in a game</div>
            <div className="lg-not-found-sub">Check back when they queue up!</div>
          </div>
        )}

        {!loading && gameData && (
          <>
            <div className="lg-game-info">
              <span>{queueName}</span>
              {mapName && <><span className="lg-info-sep">|</span><span>{mapName}</span></>}
              <span className="lg-info-sep">|</span>
              <span>Match started {minutesElapsed} minute{minutesElapsed !== 1 ? 's' : ''} ago</span>
            </div>

            <div className="lg-team-section">
              <div className="lg-team-header">
                <span className="lg-team-label lg-blue">Blue Team</span>
                <span className="lg-avg-divider"> | </span>
                <span className="lg-avg-label">Average rank: </span>
                <span
                  className="lg-avg-rank"
                  style={{ color: getRankColor(blueAvgRank?.split(' ')[0]) }}
                >
                  {blueAvgRank ?? '—'}
                </span>
              </div>
              <div className="lg-cards-row">
                {blueTeam.map(p => (
                  <PlayerCard key={p.puuid} participant={p} isFocused={isFocused(p)}
                    championMap={championMap} statsData={getStatsData(p.puuid)} />
                ))}
              </div>
            </div>

            <div className="lg-team-section">
              <div className="lg-team-header">
                <span className="lg-team-label lg-red">Red Team</span>
                <span className="lg-avg-divider"> | </span>
                <span className="lg-avg-label">Average rank: </span>
                <span
                  className="lg-avg-rank"
                  style={{ color: getRankColor(redAvgRank?.split(' ')[0]) }}
                >
                  {redAvgRank ?? '—'}
                </span>
              </div>
              <div className="lg-cards-row">
                {redTeam.map(p => (
                  <PlayerCard key={p.puuid} participant={p} isFocused={isFocused(p)}
                    championMap={championMap} statsData={getStatsData(p.puuid)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
