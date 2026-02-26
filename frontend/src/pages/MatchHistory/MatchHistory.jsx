import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MatchHistory.css';
import { Navbar } from '../../components';
import DominationTreeIcon from '../../utils/DDragon/runes/7200_Domination.png';
import PrecisionTreeIcon from '../../utils/DDragon/runes/7201_Precision.png';
import SorceryTreeIcon from '../../utils/DDragon/runes/7202_Sorcery.png';
import InspirationTreeIcon from '../../utils/DDragon/runes/7203_Whimsy.png';
import ResolveTreeIcon from '../../utils/DDragon/runes/7204_Resolve.png';
import QuestMid from '../../utils/DDragon/role-quests/1206.png';
import QuestSupport from '../../utils/DDragon/role-quests/1208.png';
import QuestJungle from '../../utils/DDragon/role-quests/1209.png';
import QuestTop from '../../utils/DDragon/role-quests/1221.png';
import RankIron from '../../utils/DDragon/ranks/Rank=Iron.png';
import RankBronze from '../../utils/DDragon/ranks/Rank=Bronze.png';
import RankSilver from '../../utils/DDragon/ranks/Rank=Silver.png';
import RankGold from '../../utils/DDragon/ranks/Rank=Gold.png';
import RankPlatinum from '../../utils/DDragon/ranks/Rank=Platinum.png';
import RankEmerald from '../../utils/DDragon/ranks/Rank=Emerald.png';
import RankDiamond from '../../utils/DDragon/ranks/Rank=Diamond.png';
import RankMaster from '../../utils/DDragon/ranks/Rank=Master.png';
import RankGrandmaster from '../../utils/DDragon/ranks/Rank=Grandmaster.png';
import RankChallenger from '../../utils/DDragon/ranks/Rank=Challenger.png';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
import dissectMatchData from '../../utils/dissectMatchData';
import dissectGeneralMatchData from '../../utils/dissectGeneralMatchData';
import { genScore } from '../../utils/genScore';
import { genBadges } from '../../utils/genBadges';
import { getSummoner } from '../../utils/getSummoner';
import { getRanks } from '../../utils/getRanks';
import { getProfile } from '../../utils/getProfile';
import MatchDetail from '../../components/MatchDetail/MatchDetail';

const RANK_ICON_MAP = {
  IRON: RankIron,
  BRONZE: RankBronze,
  SILVER: RankSilver,
  GOLD: RankGold,
  PLATINUM: RankPlatinum,
  EMERALD: RankEmerald,
  DIAMOND: RankDiamond,
  MASTER: RankMaster,
  GRANDMASTER: RankGrandmaster,
  CHALLENGER: RankChallenger,
};

const titleCaseTier = (tier) => {
  if (!tier) return '';
  return tier
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatRankLabel = (entry) => {
  if (!entry) return 'Unranked';
  return `${titleCaseTier(entry.tier)} ${entry.rank} ${entry.leaguePoints} LP`;
};

export default function MatchHistory() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [summonerData, setSummonerData] = useState(null);
  const [rankEntries, setRankEntries] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [matchOffset, setMatchOffset] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [queuesMap, setQueuesMap] = useState({});
  const params = useParams();
  const navigate = useNavigate();

  const fetchMatches = async (name, tag, regionCode, forceUpdate = false) => {
    if (!name || !tag) return;
    try {
      const matchIds = await getMatchIds(name, tag, regionCode, forceUpdate, 0, 5);
      // Process sequentially to avoid hitting Riot API rate limits
      const matchData = [];
      for (const matchId of matchIds) {
        try {
          const data = await getDataFromMatchId(matchId, regionCode, forceUpdate);
          if (!data || !data.info) continue; // skip failed fetches
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          const scoredPlayers = await genScore(players, gameInfo);
          const playersWithBadges = await genBadges(scoredPlayers, gameInfo);
          matchData.push({ matchId, players: playersWithBadges, gameInfo });
        } catch (e) {
          console.warn(`Skipping match ${matchId}:`, e);
        }
      }
      setMatches(matchData);
      setMatchOffset(5);
      setHasMore(true);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const loadMoreMatches = async () => {
    if (isLoadingMore || !hasMore || !summonerName || !summonerTag) return;
    setIsLoadingMore(true);
    try {
      const currentOffset = matchOffset;
      const newMatchIds = await getMatchIds(summonerName, summonerTag, region, false, currentOffset, 20);
      if (newMatchIds.length === 0) {
        setHasMore(false);
        return;
      }
      const existingIds = new Set(matches.map(m => m.matchId));
      const newMatchData = [];
      for (const matchId of newMatchIds) {
        if (existingIds.has(matchId)) continue;
        try {
          const data = await getDataFromMatchId(matchId, region, false);
          if (!data || !data.info) continue;
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          const scoredPlayers = await genScore(players, gameInfo);
          const playersWithBadges = await genBadges(scoredPlayers, gameInfo);
          newMatchData.push({ matchId, players: playersWithBadges, gameInfo });
        } catch (e) {
          console.warn(`Skipping match ${matchId}:`, e);
        }
      }
      setMatches(prev => [...prev, ...newMatchData]);
      const newOffset = currentOffset + newMatchIds.length;
      setMatchOffset(newOffset);
      if (newOffset >= 100 || newMatchIds.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more matches:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
    if (params.region && params.nameTag) {
      const [name, tag] = params.nameTag.split('-');
      setRegion(params.region);
      setSummonerName(name || '');
      setSummonerTag(tag || '');
      fetchMatches(name, tag, params.region);
      getProfile(name, tag, params.region).then(profile => {
        if (profile) {
          setSummonerData({ profileIconId: profile.icon, summonerLevel: profile.summonerLevel });
          setRankEntries(profile.ranks || []);
        }
      });
    }
  }, [params]);

  const handleUpdate = async () => {
    if (isUpdating || !summonerName || !summonerTag) return;
    setIsUpdating(true);
    try {
      const profilePromise = getProfile(summonerName, summonerTag, region, true).then(profile => {
        if (profile) {
          setSummonerData({ profileIconId: profile.icon, summonerLevel: profile.summonerLevel });
          setRankEntries(profile.ranks || []);
        }
      });
      const matchesPromise = fetchMatches(summonerName, summonerTag, region, true);
      await Promise.all([profilePromise, matchesPromise]);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const wins = matches.filter(m => {
    const players = Object.values(m.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    return focusPlayer?.win;
  }).length;

  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  const profileStats = (() => {
    let totalKills = 0, totalDeaths = 0, totalAssists = 0;
    let totalOpScore = 0, opScoreCount = 0;
    let totalCS = 0, totalDurationMinutes = 0, csGameCount = 0;

    for (const m of matches) {
      const players = Object.values(m.players);
      const fp = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
      if (!fp) continue;

      totalKills   += fp.kills   || 0;
      totalDeaths  += fp.deaths  || 0;
      totalAssists += fp.assists || 0;

      if (typeof fp.opScore === 'number') {
        totalOpScore += fp.opScore;
        opScoreCount++;
      }

      const isSupport = (fp.individualPosition || '').toUpperCase() === 'UTILITY';
      if (!isSupport) {
        const cs = (fp.totalMinionsKilled || 0) + (fp.neutralMinionsKilled || 0);
        const durationSecs = fp.timePlayed || m.gameInfo?.gameDuration || 0;
        if (durationSecs > 0) {
          totalCS += cs;
          totalDurationMinutes += durationSecs / 60;
          csGameCount++;
        }
      }
    }

    const n = matches.length;
    const avgKdaRatio = n > 0
      ? (totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect')
      : '—';
    return {
      avgKills:    n > 0 ? (totalKills   / n).toFixed(1) : '—',
      avgDeaths:   n > 0 ? (totalDeaths  / n).toFixed(1) : '—',
      avgAssists:  n > 0 ? (totalAssists / n).toFixed(1) : '—',
      avgKdaRatio,
      avgOpScore:  opScoreCount > 0 ? Math.round(totalOpScore / opScoreCount) : null,
      avgCsPerMin: csGameCount  > 0 ? (totalCS / totalDurationMinutes).toFixed(1) : null,
    };
  })();

  const mostPlayedChampions = (() => {
    const champMap = {};
    const filtered = matches.filter(m => {
      const qid = m.gameInfo?.queueId;
      if (activeTab === 'ranked') return qid === 420;
      if (activeTab === 'flex')   return qid === 440;
      if (activeTab === 'aram')   return qid === 450;
      return true;
    });
    for (const m of filtered) {
      const players = Object.values(m.players);
      const fp = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
      if (!fp?.championName) continue;
      const key = fp.championName;
      if (!champMap[key]) champMap[key] = { championName: key, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      champMap[key].games++;
      if (fp.win) champMap[key].wins++;
      champMap[key].kills   += fp.kills   || 0;
      champMap[key].deaths  += fp.deaths  || 0;
      champMap[key].assists += fp.assists || 0;
    }
    return Object.values(champMap)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);
  })();

  const DD_CHAMPION_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/champion';
  const DD_ITEM_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/item';
  const DD_SUMMONER_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/spell';
  const DD_RUNE_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/img';
  const DD_PROFILE_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/profileicon';

  const profileIconId = summonerData?.profileIconId ?? 588;
  const soloRank = rankEntries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
  const rankSections = [
    { label: 'Ranked Solo/Duo', entry: soloRank },
  ];

  const getRankIcon = (entry) => {
    if (!entry?.tier) return null;
    return RANK_ICON_MAP[entry.tier.toUpperCase()] || null;
  };
  const soloRankIcon = getRankIcon(soloRank);

  const SUMMONER_SPELLS = {
    1: 'SummonerBoost',       // Cleanse
    3: 'SummonerExhaust',
    4: 'SummonerFlash',
    6: 'SummonerHaste',       // Ghost
    7: 'SummonerHeal',
    11: 'SummonerSmite',
    12: 'SummonerTeleport',
    13: 'SummonerMana',       // Clarity
    14: 'SummonerDot',        // Ignite
    21: 'SummonerBarrier',
    32: 'SummonerSnowball',
  };

  const RUNE_ICONS = {
    // Precision keystones
    8005: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
    8008: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
    8010: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
    8021: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
    // Domination keystones
    8112: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
    8124: 'perk-images/Styles/Domination/Predator/Predator.png',
    8128: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
    9923: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
    // Sorcery keystones
    8214: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
    8229: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
    8230: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
    // Resolve keystones
    8437: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
    8439: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
    8465: 'perk-images/Styles/Resolve/Guardian/Guardian.png',
    // Inspiration keystones
    8351: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
    8360: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
    8369: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png',
  };

  const RUNE_TREE_ICONS = {
    8000: PrecisionTreeIcon,
    8100: DominationTreeIcon,
    8200: SorceryTreeIcon,
    8300: InspirationTreeIcon,
    8400: ResolveTreeIcon,
  };

  const getChampionIconUrl = (name) => {
    if (!name) return null;
    const id = String(name).replace(/[^A-Za-z]/g, '');
    if (!id) return null;
    return `${DD_CHAMPION_ICON_BASE}/${id}.png`;
  };

  const getItemIconUrl = (id) => {
    if (!id) return null;
    return `${DD_ITEM_ICON_BASE}/${id}.png`;
  };

  const getRuneIconUrl = (id) => {
    const rel = id != null ? RUNE_ICONS[id] : null;
    if (!rel) return null;
    return `${DD_RUNE_ICON_BASE}/${rel}`;
  };

  const getSummonerIconUrl = (id) => {
    const key = id != null ? SUMMONER_SPELLS[id] : null;
    if (!key) return null;
    return `${DD_SUMMONER_ICON_BASE}/${key}.png`;
  };

  const SimplifiedMatchCard = ({ match }) => {
    const players = Object.values(match.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    const normalize = (s) => {
      if (!s) return '';
      try {
        return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      } catch (e) {
        return String(s).toLowerCase().replace(/[^a-z0-9]/gi, '');
      }
    };

    // Debug: log focus detection values so we can verify matching in the browser console
    try {
      // eslint-disable-next-line no-console
      console.debug('MatchHistory focus check', {
        summonerName,
        normalizedSummoner: normalize(summonerName),
        players: players.map(p => ({ name: p?.name, normalized: normalize(p?.name) }))
      });
    } catch (err) {
      // silent
    }
    
    if (!focusPlayer) return null;

    const blueTeam = players.filter(p => p.teamId === 100);
    const redTeam = players.filter(p => p.teamId === 200);

    const getChampionInitial = (name) => {
      if (!name) return '?';
      return name.substring(0, 1).toUpperCase();
    };

    const getChampionStatus = (level) => {
      if (level >= 18) return 'Legendary';
      if (level >= 15) return 'Godlike';
      if (level >= 12) return 'Favorable';
      return 'Normal';
    };

    const kda = focusPlayer.kills + focusPlayer.deaths + focusPlayer.assists;
    const kdaRatio = focusPlayer.deaths > 0
      ? (focusPlayer.kills + focusPlayer.assists) / focusPlayer.deaths
      : focusPlayer.kills + focusPlayer.assists;

    // CS, CS per minute, and Kill Participation
    const totalCs = (focusPlayer.totalMinionsKilled || 0) + (focusPlayer.neutralMinionsKilled || 0);

    let durationSeconds = 0;
    if (typeof focusPlayer.timePlayed === 'number') {
      durationSeconds = focusPlayer.timePlayed;
    } else if (match.gameInfo && typeof match.gameInfo.gameDuration === 'number') {
      durationSeconds = match.gameInfo.gameDuration;
    }

    const minutesPlayed = durationSeconds > 0 ? durationSeconds / 60 : 0;
    const csPerMin = minutesPlayed > 0 ? totalCs / minutesPlayed : 0;

    // Use AI score computed in genScore.js (opScore) and rank among all players
    const focusAiScore = typeof focusPlayer.opScore === 'number' ? focusPlayer.opScore : null;
    const roundedAiScore = focusAiScore !== null ? Math.round(focusAiScore) : null;

    const scoredPlayers = players.filter(p => typeof p.opScore === 'number');
    const sortedByScore = [...scoredPlayers].sort((a, b) => b.opScore - a.opScore);
    const placementIndex = focusAiScore !== null
      ? sortedByScore.findIndex(p => p.puuid === focusPlayer.puuid)
      : -1;

    const formatPlacement = (pos) => {
      if (pos <= 0) return '-';
      if (pos === 1) return '1st';
      if (pos === 2) return '2nd';
      if (pos === 3) return '3rd';
      return `${pos}th`;
    };

    const placementLabel = placementIndex >= 0 ? formatPlacement(placementIndex + 1) : '-';

    const focusChampionIcon = getChampionIconUrl(focusPlayer?.championName);

    const primaryStyle = focusPlayer?.perks?.styles?.find(s => s.description === 'primaryStyle')
      || focusPlayer?.perks?.styles?.[0];
    const primaryKeystoneId = primaryStyle?.selections?.[0]?.perk;
    const primaryRuneIcon = getRuneIconUrl(primaryKeystoneId);

    const secondaryStyle = focusPlayer?.perks?.styles?.find(s => s.description === 'subStyle')
      || focusPlayer?.perks?.styles?.[1];
    const secondaryRuneTreeIcon = secondaryStyle?.style ? RUNE_TREE_ICONS[secondaryStyle.style] : null;

    const summonerIcons = [
      getSummonerIconUrl(focusPlayer.summoner1Id),
      getSummonerIconUrl(focusPlayer.summoner2Id),
    ];

    const itemSlots = [
      focusPlayer.item0,
      focusPlayer.item1,
      focusPlayer.item2,
      focusPlayer.item3,
      focusPlayer.item4,
      focusPlayer.item5,
    ];

    const trinketItem = focusPlayer.item6; // vision / trinket slot

    // Role-quest local icons (not actually in inventory)
    const QUEST_ICONS = {
      1206: QuestMid,   // Mid
      1208: QuestSupport, // Support
      1209: QuestJungle,  // Jungle
      1221: QuestTop,   // Top
    };

    // Boots item IDs (ADC gets boots in the quest slot)
    const BOOTS_ITEM_IDS = new Set([
      1001, // Boots
      3006, // Berserker's Greaves
      3009, // Boots of Swiftness
      3020, // Sorcerer's Shoes
      3047, // Plated Steelcaps
      3111, // Mercury's Treads
      3117, // Mobility Boots
      3158, // Ionian Boots of Lucidity
    ]);

    const lanePos = (focusPlayer.individualPosition || '').toUpperCase();
    const isSupport = lanePos === 'UTILITY';
    const isJungle = lanePos === 'JUNGLE';
    const isTop = lanePos === 'TOP';
    const isMid = lanePos === 'MIDDLE';
    const isADC = lanePos === 'BOTTOM' && !isSupport;

    const isBootsItem = (id) => id && BOOTS_ITEM_IDS.has(id);

    // For lanes with quests, use fixed quest IDs;
    // for ADC, show their boots item instead.
    let questIdForRole = 0;
    if (isJungle) questIdForRole = 1209;
    else if (isSupport) questIdForRole = 1208;
    else if (isTop) questIdForRole = 1221;
    else if (isMid) questIdForRole = 1206;

    const adcBootsItem = isADC ? (itemSlots.find(id => isBootsItem(id)) || 0) : 0;
    const displayItems = isADC && adcBootsItem
      ? itemSlots.filter(id => id !== adcBootsItem)
      : itemSlots;

    // Format game duration from seconds
    const durationMin = Math.floor(durationSeconds / 60);
    const durationSec = durationSeconds % 60;
    const durationStr = `${durationMin}:${String(durationSec).padStart(2, '0')}`;

    // Calculate how long ago the match was
    const gameCreation = match.gameInfo?.gameCreation;
    const timeAgoStr = (() => {
      if (!gameCreation) return '';
      const diffMs = Date.now() - gameCreation;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return `${diffDay}d ago`;
      const diffMonth = Math.floor(diffDay / 30);
      return `${diffMonth}mo ago`;
    })();

    const queueName = queuesMap[match.gameInfo?.queueId] || 'Normal';

    const isExpanded = expandedMatchId === match.matchId;

    return (
      <div key={match.matchId} className="match-card-wrapper">
      <div
        className={`match-card ${focusPlayer.win ? 'win' : 'loss'} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setExpandedMatchId(isExpanded ? null : match.matchId)}
      >
        {/* Left Section: Game Info */}
        <div className="match-left-section">
          <div className="match-info-text">
            <div className="game-mode">{queueName}</div>
            <div className="game-time">{timeAgoStr}</div>
            <div className="game-result">
              <span className={`result-status ${focusPlayer.win ? 'win' : 'loss'}`}>
                {focusPlayer.win ? 'Win' : 'Loss'}
              </span>
              <span className="result-duration">{durationStr}</span>
            </div>
          </div>
        </div>

        {/* Runes (primary + secondary stacked) */}
        <div className="match-runes-stack">
          {[primaryRuneIcon, secondaryRuneTreeIcon].map((src, idx) => (
            <div
              key={idx}
              className={idx === 0 ? 'rune-slot' : 'rune-slot rune-slot-secondary'}
            >
              {src && (
                <img
                  src={src}
                  alt={idx === 0 ? 'Keystone rune' : 'Secondary rune path'}
                  className="rune-icon-img"
                />
              )}
            </div>
          ))}
        </div>

        {/* Summoner Spells */}
        <div className="match-summoners-section">
          {summonerIcons.map((src, idx) => (
            <div key={idx} className="summoner-icon">
              {src && (
                <img
                  src={src}
                  alt="Summoner spell"
                  className="summoner-icon-img"
                />
              )}
            </div>
          ))}
        </div>

        {/* Champion Portrait */}
        <div className="champion-portrait">
          {focusChampionIcon && (
            <img
              src={focusChampionIcon}
              alt={focusPlayer?.championName || 'champion'}
              className="champion-portrait-img"
            />
          )}
        </div>

        {/* Champion stats and items: items on left, stats on right */}
        <div className="match-champion-column">
          <div className="match-items-stats-row">
            {/* Items Section */}
            <div className="match-items-section">
              {displayItems.map((itemId, idx) => {
                const src = getItemIconUrl(itemId);
                return (
                  <div key={idx} className="item-icon">
                    {src && (
                      <img
                        src={src}
                        alt={itemId ? `Item ${itemId}` : 'Empty slot'}
                        className="item-icon-img"
                      />
                    )}
                  </div>
                );
              })}

              {/* Quest item slot */}
              <div className="item-icon item-icon-quest" title="Role quest">
                {(() => {
                  const questSrc = isADC
                    ? (adcBootsItem ? getItemIconUrl(adcBootsItem) : null)
                    : (questIdForRole ? QUEST_ICONS[questIdForRole] : null);

                  return questSrc ? (
                    <img
                      src={questSrc}
                      alt={isADC
                        ? (adcBootsItem ? `ADC boots ${adcBootsItem}` : 'No boots')
                        : (questIdForRole ? `Quest ${questIdForRole}` : 'No quest')}
                      className="item-icon-img"
                    />
                  ) : null;
                })()}
              </div>

              {/* Vision / trinket slot */}
              <div className="item-icon item-icon-vision" title="Trinket">
                {getItemIconUrl(trinketItem) && (
                  <img
                    src={getItemIconUrl(trinketItem)}
                    alt={trinketItem ? `Trinket ${trinketItem}` : 'No trinket'}
                    className="item-icon-img"
                  />
                )}
              </div>
            </div>

            {/* Stats Section centered between items and player list */}
            <div className="match-stats-row">
              {/* KDA Section */}
              <div className="match-kda-section">
                <div className="kda-value">{focusPlayer.kills} / {focusPlayer.deaths} / {focusPlayer.assists}</div>
                <div className="kda-ratio">{kdaRatio.toFixed(2)} KDA</div>
              </div>

              {/* CS Section */}
              <div className="match-cs-section">
                <div className="cs-value">{totalCs} CS</div>
                <div className="cs-per-min">{csPerMin.toFixed(1)} cs/min</div>
              </div>

              {/* AI Score & Position */}
              <div className="match-score-section">
                <div className="score-container">
                  <div
                    className="ai-score-badge"
                    style={roundedAiScore === null ? {} : roundedAiScore < 45 ? { background: '#F87171', color: '#fff' } : roundedAiScore > 85 ? { background: '#D4AF37', color: '#fff' } : { background: '#34D399', color: '#fff' }}
                  >
                    <span className="score-value">{roundedAiScore !== null ? roundedAiScore : '-'}</span>
                  </div>
                  <div className="position-badge">
                    <span className="position-value">{placementLabel}</span>
                  </div>
                    {/* Breakdown tooltip (shows on hover/focus) */}
                    {focusPlayer.opBreakdown && (
                      <div className="score-breakdown" role="tooltip" aria-hidden={false}>
                        <div className="breakdown-row"><span className="breakdown-label">KDA</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.kdaScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Damage</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.damageScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Vision</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.visionScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">CS</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.csScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Enchanter</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.enchanterScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Tank</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.tankScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Gold</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.goldScore)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">CC</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.ccScore)}</span></div>
                        <div className="breakdown-total"><span className="breakdown-label">Total</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.total)}</span></div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Players */}
        <div className="match-players-section">
          <div className="team-column">
            {blueTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${normalize(p?.name) === normalize(summonerName) ? 'focus' : ''}`}
                data-focused={normalize(p?.name) === normalize(summonerName) ? 'true' : 'false'}
              >
                {getChampionIconUrl(p?.championName) ? (
                  <img
                    src={getChampionIconUrl(p?.championName)}
                    alt={p?.championName || 'champion'}
                    className="player-icon"
                  />
                ) : (
                  <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                )}
                <button
                  className="player-name player-name-clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tag = p?.riotIdTagline || '';
                    const url = `${window.location.origin}/profile/${region}/${encodeURIComponent(p?.name || '')}-${encodeURIComponent(tag)}/overview`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Open profile for ${p?.name}`}
                >
                  {p?.name}
                </button>
              </div>
            ))}
          </div>
          <div className="team-column">
            {redTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${normalize(p?.name) === normalize(summonerName) ? 'focus' : ''}`}
                data-focused={normalize(p?.name) === normalize(summonerName) ? 'true' : 'false'}
              >
                {getChampionIconUrl(p?.championName) ? (
                  <img
                    src={getChampionIconUrl(p?.championName)}
                    alt={p?.championName || 'champion'}
                    className="player-icon"
                  />
                ) : (
                  <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                )}
                <button
                  className="player-name player-name-clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tag = p?.riotIdTagline || '';
                    const url = `${window.location.origin}/profile/${region}/${encodeURIComponent(p?.name || '')}-${encodeURIComponent(tag)}/overview`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Open profile for ${p?.name}`}
                >
                  {p?.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expand Arrow */}
        <div className={`match-expand-icon ${isExpanded ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      {isExpanded && (
        <MatchDetail match={match} focusName={summonerName} />
      )}
      </div>
    );
  };

  return (
    <div className="match-history-container">
      <Navbar />
      <div className="match-history-inner">

        {/* Profile navigation tabs */}
        {summonerName && summonerTag && (
          <div className="profile-tabs">
            <button
              className={`profile-tab-button active`}
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`)}
            >
              Overview
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/mastery`)}
            >
              Mastery
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/analysis`)}
            >
              Analysis
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/livegame`)}
            >
              Live Game
            </button>
          </div>
        )}

        {/* Player Profile Card */}
        {summonerName && matches.length > 0 && (
          <div className="player-profile-card">
            <div className="player-icon-section">
              <div className="player-main-icon">
                <img
                  src={`${DD_PROFILE_ICON_BASE}/${profileIconId}.png`}
                  alt="Profile Icon"
                  style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                />
                {summonerData?.summonerLevel != null && (
                  <div className="player-level-badge">{summonerData.summonerLevel}</div>
                )}
              </div>
            </div>
            <div className="player-info">
              <div className="player-title">{summonerName}#{summonerTag}</div>
              <button
                className={`update-button${isUpdating ? ' updating' : ''}`}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
              <div className="player-ranks">
                {rankSections.map(({ label, entry }) => {
                  const iconSrc = getRankIcon(entry);
                  return (
                    <div className="rank-entry" key={label}>
                      {iconSrc ? (
                        <img src={iconSrc} alt={`${label} icon`} className="rank-icon" />
                      ) : (
                        <div className="rank-icon rank-icon-placeholder">-</div>
                      )}
                      <div className="rank-text">
                        <div className="rank-queue">{label}</div>
                        <div className="rank-value">{formatRankLabel(entry)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="performance-stats">
              <div className="stat-circle">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    strokeDasharray={`${(winRate / 100) * 2 * 3.14159 * 60} ${2 * 3.14159 * 60}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="stat-circle-text">
                  <div className="stat-circle-percent">{winRate}%</div>
                  <div className="stat-circle-label">Win Rate</div>
                </div>
              </div>
              <div className="performance-details">
                <div className="performance-row">
                  <div className="performance-label">{matches.length} Games</div>
                  <div className="performance-value">{wins}W {matches.length - wins}L</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Avg KDA</div>
                  <div className="performance-value">{profileStats.avgKdaRatio} KDA</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Avg AI Score</div>
                  <div className="performance-value" style={profileStats.avgOpScore === null ? {} : profileStats.avgOpScore < 45 ? { color: '#F87171' } : profileStats.avgOpScore > 85 ? { color: '#FFD700' } : { color: '#34D399' }}>{profileStats.avgOpScore ?? '—'}</div>
                </div>
                {profileStats.avgCsPerMin !== null && (
                  <div className="performance-row">
                    <div className="performance-label">Avg CS/min</div>
                    <div className="performance-value">{profileStats.avgCsPerMin}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Matches Section */}
        {summonerName && matches.length > 0 && (
          <div className="matches-section">
            {/* Champions List - Left Sidebar */}
            <div className="champions-sidebar">
              <div className="champions-title">Most Played</div>
              <div className="champions-list">
                {mostPlayedChampions.map(({ championName, games, wins, kills, deaths, assists }) => {
                  const winPct = Math.round((wins / games) * 100);
                  const iconUrl = getChampionIconUrl(championName);
                  const avgK = (kills   / games).toFixed(1);
                  const avgD = (deaths  / games).toFixed(1);
                  const avgA = (assists / games).toFixed(1);
                  return (
                    <div className="champion-item" key={championName}>
                      <div className="champion-icon">
                        {iconUrl
                          ? <img src={iconUrl} alt={championName} className="champion-icon-img" />
                          : <span>{championName[0]}</span>
                        }
                      </div>
                      <div className="champion-info">
                        <div className="champion-name">{championName}</div>
                        <div className="champion-stats">{winPct}% · {games} game{games !== 1 ? 's' : ''}</div>
                        <div className="champion-kda">{avgK} / {avgD} / {avgA}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matches - Right Content */}
            <div className="matches-content">
              <div className="match-tabs">
                <button
                  className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`tab-button ${activeTab === 'ranked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ranked')}
                >
                  Ranked Solo/Duo
                </button>
                <button
                  className={`tab-button ${activeTab === 'flex' ? 'active' : ''}`}
                  onClick={() => setActiveTab('flex')}
                >
                  Ranked Flex
                </button>
                <button
                  className={`tab-button ${activeTab === 'aram' ? 'active' : ''}`}
                  onClick={() => setActiveTab('aram')}
                >
                  ARAM
                </button>
              </div>

              {/* Match Cards */}
              <div className="matches-list">
                {matches
                  .filter(match => {
                    const qid = match.gameInfo?.queueId;
                    if (activeTab === 'ranked') return qid === 420;
                    if (activeTab === 'flex')   return qid === 440;
                    if (activeTab === 'aram')   return qid === 450;
                    return true;
                  })
                  .map(match => (
                    <SimplifiedMatchCard key={match.matchId} match={match} />
                  ))}
              </div>

              {hasMore && (
                <button
                  className={`load-more-button${isLoadingMore ? ' loading' : ''}`}
                  onClick={loadMoreMatches}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Matches'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
