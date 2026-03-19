import { useState, useCallback, useMemo, useEffect } from 'react';
import { timeSince } from '../../utils/timeSince';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components';
import { useAuth } from '../../context/AuthContext';

import topIcon    from '../../utils/position-top.svg';
import jungleIcon from '../../utils/position-jungle.svg';
import middleIcon from '../../utils/position-middle.svg';
import bottomIcon from '../../utils/position-bottom.svg';
import supportIcon from '../../utils/position-utility.svg';

import './Group.css';


const VIEW_MODES = [
  { value: 'avg',   label: 'Average' },
  { value: 'total', label: 'Total'   },
  { value: 'max',   label: 'Highest' },
  { value: 'min',   label: 'Lowest'  },
];

const ALL_ROLES  = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const ALL_QUEUES = [480, 400, 420, 440, 450];

const TIME_PERIODS = [
  { value: 7,   label: '7 Days'   },
  { value: 14,  label: '14 Days'  },
  { value: 30,  label: '1 Month'  },
  { value: 90,  label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: 365, label: '1 Year'   },
];

const ROLES = [
  { value: 'TOP',     label: 'Top',     icon: topIcon     },
  { value: 'JUNGLE',  label: 'Jungle',  icon: jungleIcon  },
  { value: 'MIDDLE',  label: 'Mid',     icon: middleIcon  },
  { value: 'BOTTOM',  label: 'Bot',     icon: bottomIcon  },
  { value: 'UTILITY', label: 'Support', icon: supportIcon },
];

const QUEUES = [
  { value: 480, label: 'Swiftplay'   },
  { value: 400, label: 'Draft Pick'  },
  { value: 420, label: 'Ranked Solo' },
  { value: 440, label: 'Ranked Flex' },
  { value: 450, label: 'ARAM'        },
];

const REGIONS = [
  { value: 'euw1', label: 'EUW' },
  { value: 'eun1', label: 'EUNE' },
  { value: 'na1',  label: 'NA'  },
  { value: 'kr',   label: 'KR'  },
  { value: 'br1',  label: 'BR'  },
  { value: 'jp1',  label: 'JP'  },
  { value: 'la1',  label: 'LAN' },
  { value: 'la2',  label: 'LAS' },
  { value: 'me1',  label: 'ME'  },
  { value: 'oc1',  label: 'OCE' },
  { value: 'ru',   label: 'RU'  },
  { value: 'tr1',  label: 'TR'  },
  { value: 'sg2',  label: 'SG'  },
  { value: 'ph2',  label: 'PH'  },
  { value: 'th2',  label: 'TH'  },
  { value: 'tw2',  label: 'TW'  },
  { value: 'vn2',  label: 'VN'  },
];

function formatSeconds(s) {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatGameLength(secs) {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}


function aggregateMatches(rawMatches, selectedRoles, selectedQueues) {
  if (!rawMatches) return null;

  const allowedRoles  = selectedRoles.length < ALL_ROLES.length ? new Set(selectedRoles) : null;
  const allowedQueues = new Set(selectedQueues);

  const filtered = rawMatches.filter(m => {
    if (!allowedQueues.has(m.queueId)) return false;
    if (allowedRoles && m.queueId !== 450) {
      if (!m.position || !allowedRoles.has(m.position)) return false;
    }
    return true;
  });

  if (filtered.length === 0) return { totalGames: 0, wins: 0, losses: 0, winRate: 0 };

  const tracker = () => ({ total: 0, min: Infinity, max: -Infinity });
  const update  = (t, val) => {
    t.total += val;
    if (val < t.min) t.min = val;
    if (val > t.max) t.max = val;
  };

  let wins = 0;
  const kills = tracker(), deaths = tracker(), assists = tracker();
  const cs = tracker(), visionScore = tracker(), aiScore = tracker();
  const kp = tracker(), gameLength = tracker();

  let firstBloods = 0, forfeits = 0;
  const uniqueChampions = new Set();
  let epicMonsterSteals = 0, flawlessAces = 0, hadOpenNexus = 0;
  let perfectGames = 0, takedownsInEnemyFountain = 0;
  let elderDragonKillsWithOpposingSoul = 0, dancedWithRiftHerald = 0;
  let minEarliestBaron = Infinity;

  const healFromMap = tracker(), controlWards = tracker();
  const dragonTakedowns = tracker(), scuttleKills = tracker();
  const stealthWards = tracker(), wardKills = tracker();
  const dmgToTurrets = tracker(), selfMitigated = tracker();
  const allyJungle = tracker(), dmgToChamps = tracker();
  const enemyJungle = tracker(), healsOnTeam = tracker();
  const killsNearTurret = tracker(), maxCsAdv = tracker();
  const takedownsAfterLevel = tracker(), takedownsBeforeJungle = tracker();
  const abilityUses = tracker();

  for (const m of filtered) {
    if (m.win) wins++;
    update(kills,       m.kills);
    update(deaths,      m.deaths);
    update(assists,     m.assists);
    update(cs,          m.cs);
    update(visionScore, m.visionScore);
    update(aiScore,     m.aiScore);
    update(kp,          m.kp);
    update(gameLength,  m.gameDuration);
    firstBloods += m.firstBlood;
    forfeits    += m.forfeit;
    if (m.championName) uniqueChampions.add(m.championName);
    epicMonsterSteals                += m.epicMonsterSteals;
    flawlessAces                     += m.flawlessAces;
    hadOpenNexus                     += m.hadOpenNexus;
    perfectGames                     += m.perfectGame;
    takedownsInEnemyFountain         += m.takedownsInEnemyFountain;
    elderDragonKillsWithOpposingSoul += m.elderDragonKillsWithOpposingSoul;
    dancedWithRiftHerald             += m.dancedWithRiftHerald;
    if (m.earliestBaron > 0 && m.earliestBaron < minEarliestBaron) minEarliestBaron = m.earliestBaron;
    update(healFromMap,           m.healFromMapSources);
    update(controlWards,          m.controlWardsPlaced);
    update(dragonTakedowns,       m.dragonTakedowns);
    update(scuttleKills,          m.scuttleCrabKills);
    update(stealthWards,          m.stealthWardsPlaced);
    update(wardKills,             m.wardTakedowns);
    update(dmgToTurrets,          m.damageDealtToTurrets);
    update(selfMitigated,         m.damageSelfMitigated);
    update(allyJungle,            m.totalAllyJungleMinionsKilled);
    update(dmgToChamps,           m.totalDamageDealtToChampions);
    update(enemyJungle,           m.totalEnemyJungleMinionsKilled);
    update(healsOnTeam,           m.totalHealsOnTeammates);
    update(killsNearTurret,       m.killsNearEnemyTurret);
    update(maxCsAdv,              m.maxCsAdvantageOnLaneOpponent);
    update(takedownsAfterLevel,   m.takedownsAfterGainingLevelAdvantage);
    update(takedownsBeforeJungle, m.takedownsBeforeJungleMinionSpawn);
    update(abilityUses,           m.abilityUses);
  }

  const n = filtered.length;
  const stat = (t, round = false) => {
    const avg = n > 0 ? (round ? Math.round(t.total / n) : +(t.total / n).toFixed(2)) : 0;
    return {
      avg,
      total: round ? Math.round(t.total)           : +t.total.toFixed(2),
      max:   t.max === -Infinity ? 0 : (round ? Math.round(t.max) : +t.max.toFixed(2)),
      min:   t.min === Infinity  ? 0 : (round ? Math.round(t.min) : +t.min.toFixed(2)),
    };
  };

  return {
    totalGames: n,
    wins,
    losses:  n - wins,
    winRate: Math.round((wins / n) * 100),
    performance: {
      kills:       stat(kills),
      deaths:      stat(deaths),
      assists:     stat(assists),
      cs:          stat(cs),
      visionScore: stat(visionScore),
      aiScore:     stat(aiScore, true),
      kp:          stat(kp, true),
      gameLength:  stat(gameLength, true),
    },
    highlights: {
      firstBloods,
      forfeits,
      uniqueChampions:              uniqueChampions.size,
      epicMonsterSteals,
      flawlessAces,
      hadOpenNexus,
      perfectGames,
      takedownsInEnemyFountain,
      elderDragonKillsWithOpposingSoul,
      dancedWithRiftHerald,
      earliestBaron: minEarliestBaron === Infinity ? null : Math.round(minEarliestBaron),
    },
    deepStats: {
      healFromMapSources:               stat(healFromMap, true),
      controlWardsPlaced:               stat(controlWards),
      dragonTakedowns:                  stat(dragonTakedowns),
      scuttleCrabKills:                 stat(scuttleKills),
      stealthWardsPlaced:               stat(stealthWards),
      wardTakedowns:                    stat(wardKills),
      damageDealtToTurrets:             stat(dmgToTurrets, true),
      damageSelfMitigated:              stat(selfMitigated, true),
      allyJungleMinions:                stat(allyJungle),
      damageDealtToChampions:           stat(dmgToChamps, true),
      enemyJungleMinions:               stat(enemyJungle),
      healsOnTeammates:                 stat(healsOnTeam, true),
      killsNearEnemyTurret:             stat(killsNearTurret),
      maxCsAdvantage:                   stat(maxCsAdv),
      takedownsAfterLevelAdvantage:     stat(takedownsAfterLevel),
      takedownsBeforeJungleMinionSpawn: stat(takedownsBeforeJungle),
      abilityUses:                      stat(abilityUses, true),
    },
  };
}


// ── Leaderboard stat card ─────────────────────────────────────────────────────

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#B45309'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

function LeaderboardStatCard({ label, entries, format, sortOrder }) {
  // entries: [{ name, value }]
  const valid   = entries.filter(e => typeof e.value === 'number' && !isNaN(e.value));
  const invalid = entries.filter(e => !(typeof e.value === 'number' && !isNaN(e.value)));
  const ascending = sortOrder === 'worst';
  const sorted  = [...valid].sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
  const all     = [...sorted, ...invalid];

  return (
    <div className="group-stat-card">
      <div className="group-stat-card-label">
        {label}
      </div>
      <div className="group-stat-rankings">
        {all.map((item, i) => {
          const rank = sorted.indexOf(item);
          const isValid = rank !== -1;
          return (
            <div
              key={item.name}
              className={`group-rank-row${i === 0 && isValid ? ' rank-first' : ''}`}
            >
              <span
                className="group-rank-pos"
                style={{ color: isValid && rank < 3 ? RANK_COLORS[rank] : '#D1D5DB' }}
              >
                {isValid ? (rank < 3 ? RANK_LABELS[rank] : `${rank + 1}th`) : '—'}
              </span>
              <span className="group-rank-name" title={item.name}>{item.name}</span>
              <span className={`group-rank-value${i === 0 && isValid ? ' rank-first-value' : ''}`}>
                {isValid
                  ? (format ? format(item.value) : item.value)
                  : (item.status === 'loading' ? '…' : '—')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardHighlightCard({ label, entries, formatVal, sortOrder }) {
  const valid   = entries.filter(e => typeof e.value === 'number' && !isNaN(e.value));
  const invalid = entries.filter(e => !(typeof e.value === 'number' && !isNaN(e.value)));
  const ascending = sortOrder === 'worst';
  const sorted  = [...valid].sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
  const all     = [...sorted, ...invalid];

  return (
    <div className="group-stat-card">
      <div className="group-stat-card-label">{label}</div>
      <div className="group-stat-rankings">
        {all.map((item, i) => {
          const rank = sorted.indexOf(item);
          const isValid = rank !== -1;
          return (
            <div
              key={item.name}
              className={`group-rank-row${i === 0 && isValid ? ' rank-first' : ''}`}
            >
              <span
                className="group-rank-pos"
                style={{ color: isValid && rank < 3 ? RANK_COLORS[rank] : '#D1D5DB' }}
              >
                {isValid ? (rank < 3 ? RANK_LABELS[rank] : `${rank + 1}th`) : '—'}
              </span>
              <span className="group-rank-name" title={item.name}>{item.name}</span>
              <span className={`group-rank-value${i === 0 && isValid ? ' rank-first-value' : ''}`}>
                {isValid
                  ? (formatVal ? formatVal(item.value) : item.value)
                  : (item.status === 'loading' ? '…' : '—')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Summary table ─────────────────────────────────────────────────────────────

function SummaryTable({ memberStats }) {
  const sorted = [...memberStats].sort((a, b) => {
    const wa = a.data?.winRate ?? -1;
    const wb = b.data?.winRate ?? -1;
    return wb - wa;
  });

  return (
    <div className="group-summary-table-wrap">
      <table className="group-summary-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Games</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(ms => (
            <tr key={ms.name}>
              <td className="gst-player">{ms.name}</td>
              {ms.status === 'loading' ? (
                <td colSpan={4} className="gst-loading">Loading…</td>
              ) : ms.status === 'idle' ? (
                <td colSpan={4} className="gst-empty">Not loaded</td>
              ) : ms.status === 'error' ? (
                <td colSpan={4} className="gst-error">{ms.errorMsg}</td>
              ) : ms.data?.totalGames === 0 ? (
                <td colSpan={4} className="gst-empty">No games</td>
              ) : (
                <>
                  <td>{ms.data?.totalGames ?? '—'}</td>
                  <td className="gst-win">{ms.data?.wins ?? '—'}</td>
                  <td className="gst-loss">{ms.data?.losses ?? '—'}</td>
                  <td className={`gst-wr${(ms.data?.winRate ?? 0) >= 50 ? ' gst-wr-hi' : ' gst-wr-lo'}`}>
                    {ms.data?.winRate != null ? `${ms.data.winRate}%` : '—'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ── Main component ────────────────────────────────────────────────────────────

export default function Group() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup]           = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState('');

  // member raw matches: { [memberId]: { raw: [], status: 'idle'|'loading'|'ok'|'error', errorMsg: '' } }
  const [memberMatches, setMemberMatches] = useState({});
  const [hasLoaded, setHasLoaded]         = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [viewMode,        setViewMode]        = useState('avg');
  const [sortOrder,       setSortOrder]       = useState('best');
  const [selectedRoles,   setSelectedRoles]   = useState(ALL_ROLES);
  const [selectedQueues,  setSelectedQueues]  = useState(ALL_QUEUES.filter(q => q !== 450));
  const [selectedDays,    setSelectedDays]    = useState(14);
  const [daysDirty,       setDaysDirty]       = useState(false);
  const [lastUpdated,     setLastUpdated]     = useState(null);

  // manage members panel
  const [manageOpen, setManageOpen] = useState(false);
  const [addName,    setAddName]    = useState('');
  const [addTag,     setAddTag]     = useState('');
  const [addRegion,  setAddRegion]  = useState('euw1');
  const [addErr,     setAddErr]     = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = user && group && user.username === group.ownerUsername;

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) return;
      navigate('/groups');
    } catch { /* ignore */ }
    finally { setDeleteLoading(false); }
  };

  // fetch group on mount
  useEffect(() => {
    if (!user) return;
    setGroupLoading(true);
    fetch(`/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setGroupError(data.error); return; }
        setGroup(data);
      })
      .catch(() => setGroupError('Failed to load group.'))
      .finally(() => setGroupLoading(false));
  }, [groupId, user]);

  const memberDisplayName = (m) =>
    m.label?.trim() ? m.label.trim() : `${m.summonerName}#${m.summonerTag}`;

  const fetchAnalysis = useCallback(async (days) => {
    if (!group || group.members.length === 0) return;
    setAnalysisLoading(true);
    setHasLoaded(false);
    setDaysDirty(false);

    // Mark all as loading
    const initial = {};
    group.members.forEach(m => { initial[m._id] = { raw: null, status: 'loading', errorMsg: '' }; });
    setMemberMatches(initial);

    const fetchMember = async (m) => {
      try {
        const qs = new URLSearchParams({
          summonerName: m.summonerName,
          summonerTag:  m.summonerTag,
          region:       m.region,
          days,
        });
        const res = await fetch(`/api/matches/analysis?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
        setMemberMatches(prev => ({
          ...prev,
          [m._id]: { raw: json.matches, status: 'ok', errorMsg: '' },
        }));
      } catch (err) {
        setMemberMatches(prev => ({
          ...prev,
          [m._id]: { raw: null, status: 'error', errorMsg: err.message },
        }));
      }
    };

    if (days >= 30) {
      // Sequential fetching with delay to avoid rate limits on large date ranges
      for (let i = 0; i < group.members.length; i++) {
        await fetchMember(group.members[i]);
        if (i < group.members.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } else {
      await Promise.all(group.members.map(fetchMember));
    }

    setHasLoaded(true);
    setLastUpdated(new Date());
    setAnalysisLoading(false);
  }, [group]);

  // member stats: aggregate per member
  const memberStats = useMemo(() => {
    if (!group?.members) return [];
    return group.members.map(m => {
      const entry = memberMatches[m._id];
      if (!entry) {
        return { name: memberDisplayName(m), status: 'idle', data: null };
      }
      if (entry.status === 'loading') {
        return { name: memberDisplayName(m), status: 'loading', data: null };
      }
      if (entry.status === 'error') {
        return { name: memberDisplayName(m), status: 'error', errorMsg: entry.errorMsg, data: null };
      }
      const data = aggregateMatches(entry.raw, selectedRoles, selectedQueues);
      return { name: memberDisplayName(m), status: 'ok', data };
    });
  }, [group, memberMatches, selectedRoles, selectedQueues]);

  // Build leaderboard entries for a performance stat
  const perfEntries = (key) => memberStats.map(ms => ({
    name:   ms.name,
    status: ms.status,
    value:  ms.data?.performance?.[key]?.[viewMode],
  }));

  const deepEntries = (key) => memberStats.map(ms => ({
    name:   ms.name,
    status: ms.status,
    value:  ms.data?.deepStats?.[key]?.[viewMode],
  }));

  const highlightEntries = (key) => memberStats.map(ms => ({
    name:   ms.name,
    status: ms.status,
    value:  ms.data?.highlights?.[key],
  }));

  const fmtLarge   = (v) => (typeof v === 'number' ? v.toLocaleString() : v);
  const fmtGameLen = (v) => formatGameLength(v);
  const fmtKP      = (v) => (typeof v === 'number' ? `${v}%` : v);

  // add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addName.trim() || !addTag.trim()) return;
    setAddErr('');
    setAddLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          summonerName: addName.trim(),
          summonerTag:  addTag.trim(),
          region:       addRegion,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddErr(data.error || 'Failed to add member.'); return; }
      setGroup(data);
      setAddName(''); setAddTag('');
    } catch {
      setAddErr('Could not connect to server.');
    } finally {
      setAddLoading(false);
    }
  };

  // remove member
  const handleRemoveMember = async (memberId) => {
    setRemoveLoading(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setGroup(data);
      setMemberMatches(prev => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } finally {
      setRemoveLoading(null);
    }
  };

  const toggleRole = (role) => setSelectedRoles(prev =>
    prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
  );
  const toggleQueue = (q) => setSelectedQueues(prev =>
    prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
  );

  const anyLoading = memberStats.some(ms => ms.status === 'loading');

  if (groupLoading) {
    return (
      <div className="group-page">
        <Navbar />
        <div className="group-inner">
          <div className="group-loading-state">
            <div className="analysis-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="group-page">
        <Navbar />
        <div className="group-inner">
          <div className="analysis-error">{groupError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-page">
      <Navbar />
      <div className="group-inner">

        {/* Header */}
        <div className="group-header-card">
          <div className="group-header-info">
            <h1 className="group-name">{group.name}</h1>
            <span className="group-meta">
              Created by <strong>{group.ownerUsername}</strong>
              {' · '}
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isOwner && (
            <button
              className={`group-manage-toggle${manageOpen ? ' open' : ''}`}
              onClick={() => setManageOpen(v => !v)}
            >
              {manageOpen ? 'Done' : 'Manage Members'}
            </button>
          )}
        </div>

        {/* Manage members panel */}
        {isOwner && manageOpen && (
          <div className="group-manage-panel">
            <h3 className="group-manage-title">Members</h3>

            {group.members.length === 0 ? (
              <p className="group-manage-empty">No members yet. Add some below.</p>
            ) : (
              <div className="group-member-list">
                {group.members.map(m => (
                  <div key={m._id} className="group-member-row">
                    <div className="group-member-info">
                      <span className="group-member-name">{memberDisplayName(m)}</span>
                      <span className="group-member-account">
                        {m.summonerName}#{m.summonerTag}
                        {' · '}
                        {REGIONS.find(r => r.value === m.region)?.label ?? m.region}
                      </span>
                    </div>
                    <button
                      className="group-member-remove"
                      onClick={() => handleRemoveMember(m._id)}
                      disabled={removeLoading === m._id}
                    >
                      {removeLoading === m._id ? '…' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="group-manage-title" style={{ marginTop: 20 }}>Add Member</h3>
            <form className="group-add-form" onSubmit={handleAddMember}>
              <div className="group-add-row">
                <input
                  className="group-add-input"
                  placeholder="Summoner Name"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                />
                <span className="group-add-hash">#</span>
                <input
                  className="group-add-input group-add-tag"
                  placeholder="TAG"
                  value={addTag}
                  onChange={e => setAddTag(e.target.value)}
                  maxLength={10}
                />
                <select
                  className="group-add-select"
                  value={addRegion}
                  onChange={e => setAddRegion(e.target.value)}
                >
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {addErr && <p className="groups-error" style={{ marginTop: 6 }}>{addErr}</p>}
              <button
                className="groups-btn-primary"
                type="submit"
                disabled={addLoading || !addName.trim() || !addTag.trim()}
              >
                {addLoading ? 'Adding…' : 'Add Member'}
              </button>
            </form>

            <button
              className="group-delete-btn"
              onClick={handleDeleteGroup}
              disabled={deleteLoading}
              style={{ marginTop: 24 }}
            >
              {deleteLoading ? 'Deleting…' : 'Delete Group'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {group.members.length === 0 && !manageOpen && (
          <div className="group-empty-state">
            <p>This group has no members yet.</p>
            {isOwner && (
              <button className="groups-btn-primary" onClick={() => setManageOpen(true)}>
                Add Members
              </button>
            )}
          </div>
        )}

        {/* Filters + load */}
        {group.members.length > 0 && (
          <>
            <div className="analysis-filters-card">
              <div className="filter-row">
                <span className="filter-row-label">Role</span>
                <div className="filter-chips">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      className={`filter-chip role-chip${selectedRoles.includes(r.value) ? ' active' : ''}`}
                      onClick={() => toggleRole(r.value)}
                      title={r.label}
                    >
                      <img src={r.icon} alt={r.label} className="role-chip-icon" />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Period</span>
                <select
                  className="period-select"
                  value={selectedDays}
                  onChange={e => {
                    setSelectedDays(Number(e.target.value));
                    if (hasLoaded) setDaysDirty(true);
                  }}
                >
                  {TIME_PERIODS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Mode</span>
                <div className="filter-chips">
                  {QUEUES.map(q => (
                    <button
                      key={q.value}
                      className={`filter-chip${selectedQueues.includes(q.value) ? ' active' : ''}`}
                      onClick={() => toggleQueue(q.value)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!hasLoaded && !analysisLoading && (
              <div className="analysis-load-area">
                <div className="analysis-load-icon">📊</div>
                <p className="analysis-load-title">Group Leaderboard</p>
                <p className="analysis-load-subtitle">
                  Load analysis for all {group.members.length} members and compare their stats.
                </p>
                <button className="analysis-load-btn" onClick={() => fetchAnalysis(selectedDays)}>
                  Load Analysis
                </button>
              </div>
            )}

            {analysisLoading && !hasLoaded && (
              <div className="analysis-loading">
                <div className="analysis-spinner" />
                Fetching data for {group.members.length} players…
              </div>
            )}

            {(daysDirty && hasLoaded && !analysisLoading) && (
              <div className="analysis-refetch-bar">
                <button
                  className="analysis-update-btn"
                  onClick={() => fetchAnalysis(selectedDays)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Update
                </button>
                {lastUpdated && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Updated {timeSince(lastUpdated)}</div>}
              </div>
            )}

            {(!daysDirty && hasLoaded && !analysisLoading && memberStats.some(ms => ms.status === 'idle')) && (
              <div className="analysis-refetch-bar">
                <button
                  className="analysis-update-btn"
                  onClick={() => fetchAnalysis(selectedDays)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Load new players
                </button>
                {lastUpdated && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Updated {timeSince(lastUpdated)}</div>}
              </div>
            )}

            {analysisLoading && hasLoaded && (
              <div className="analysis-refetch-bar">
                <div className="analysis-spinner small" />
                Updating…
              </div>
            )}

            {hasLoaded && (
              <div style={{ opacity: anyLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>

                {/* Summary table */}
                <div className="analysis-section">
                  <div className="analysis-section-header">
                    <span className="section-title">Overview</span>
                    <div className="section-divider" />
                    <span className="section-subtitle">
                      {TIME_PERIODS.find(t => t.value === selectedDays)?.label}
                    </span>
                  </div>
                  <SummaryTable memberStats={memberStats} />
                </div>

                {/* View mode + sort toggle */}
                <div className="view-mode-bar" style={{ marginTop: 8 }}>
                  <span className="view-mode-label">Showing:</span>
                  <div className="view-mode-tabs">
                    {VIEW_MODES.map(m => (
                      <button
                        key={m.value}
                        className={`view-mode-btn${viewMode === m.value ? ' active' : ''}`}
                        onClick={() => setViewMode(m.value)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <span className="view-mode-label" style={{ marginLeft: 'auto' }}>Sort:</span>
                  <div className="view-mode-tabs">
                    <button
                      className={`view-mode-btn${sortOrder === 'best' ? ' active' : ''}`}
                      onClick={() => setSortOrder('best')}
                    >
                      Most
                    </button>
                    <button
                      className={`view-mode-btn${sortOrder === 'worst' ? ' active' : ''}`}
                      onClick={() => setSortOrder('worst')}
                    >
                      Least
                    </button>
                  </div>
                </div>

                {/* Performance */}
                <div className="analysis-section">
                  <div className="analysis-section-header">
                    <span className="section-title">Performance Stats</span>
                    <div className="section-divider" />
                    <span className="section-subtitle">per game</span>
                  </div>
                  <div className="group-stat-grid">
                    <LeaderboardStatCard label="Kills"        entries={perfEntries('kills')}       sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Deaths"       entries={perfEntries('deaths')}      lowerBetter sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Assists"      entries={perfEntries('assists')}     sortOrder={sortOrder} />
                    <LeaderboardStatCard label="CS"           entries={perfEntries('cs')}          sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Vision Score" entries={perfEntries('visionScore')} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="AI Score"     entries={perfEntries('aiScore')}     sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Kill Part."   entries={perfEntries('kp')}          format={fmtKP}      sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Game Length"  entries={perfEntries('gameLength')}  format={fmtGameLen} sortOrder={sortOrder} />
                  </div>
                </div>

                {/* Highlights */}
                <div className="analysis-section">
                  <div className="analysis-section-header">
                    <span className="section-title">Highlights</span>
                    <div className="section-divider" />
                    <span className="section-subtitle">totals over period</span>
                  </div>
                  <div className="group-stat-grid">
                    <LeaderboardHighlightCard label="First Bloods"            entries={highlightEntries('firstBloods')}                    sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Forfeits"                entries={highlightEntries('forfeits')}         lowerBetter   sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Unique Champions"        entries={highlightEntries('uniqueChampions')}                sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Epic Monster Steals"     entries={highlightEntries('epicMonsterSteals')}              sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Flawless Aces"           entries={highlightEntries('flawlessAces')}                   sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Perfect Games"           entries={highlightEntries('perfectGames')}                   sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Wins with Open Nexus"    entries={highlightEntries('hadOpenNexus')}                   sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Kills in Enemy Fountain" entries={highlightEntries('takedownsInEnemyFountain')}       sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Elder w/ Opposing Soul"  entries={highlightEntries('elderDragonKillsWithOpposingSoul')} sortOrder={sortOrder} />
                    <LeaderboardHighlightCard label="Danced with Rift Herald" entries={highlightEntries('dancedWithRiftHerald')}           sortOrder={sortOrder} />
                    <LeaderboardHighlightCard
                      label="Earliest Baron"
                      entries={memberStats.map(ms => ({
                        name:   ms.name,
                        status: ms.status,
                        value:  ms.data?.highlights?.earliestBaron ?? null,
                      }))}
                      lowerBetter
                      sortOrder={sortOrder}
                      formatVal={v => v != null ? formatSeconds(v) : '—'}
                    />
                  </div>
                </div>

                {/* Deep stats */}
                <div className="analysis-section">
                  <div className="analysis-section-header">
                    <span className="section-title">Deep Stats</span>
                    <div className="section-divider" />
                    <span className="section-subtitle">per game</span>
                  </div>
                  <div className="group-stat-grid">
                    <LeaderboardStatCard label="Abilities Casted"              entries={deepEntries('abilityUses')}                      format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Control Wards"                 entries={deepEntries('controlWardsPlaced')}                                 sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Stealth Wards"                 entries={deepEntries('stealthWardsPlaced')}                                 sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Ward Takedowns"                entries={deepEntries('wardTakedowns')}                                     sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Dragon Takedowns"              entries={deepEntries('dragonTakedowns')}                                   sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Scuttle Crab Kills"            entries={deepEntries('scuttleCrabKills')}                                  sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Damage to Turrets"             entries={deepEntries('damageDealtToTurrets')}             format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Damage Mitigated"              entries={deepEntries('damageSelfMitigated')}              format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Ally Jungle CS"                entries={deepEntries('allyJungleMinions')}                                 sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Enemy Jungle CS"               entries={deepEntries('enemyJungleMinions')}                                sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Damage to Champions"           entries={deepEntries('damageDealtToChampions')}           format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Heals on Teammates"            entries={deepEntries('healsOnTeammates')}                 format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Heal from Map"                 entries={deepEntries('healFromMapSources')}               format={fmtLarge} sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Kills near Turret"             entries={deepEntries('killsNearEnemyTurret')}                               sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Max CS Advantage"              entries={deepEntries('maxCsAdvantage')}                                    sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Takedowns after lvl up"        entries={deepEntries('takedownsAfterLevelAdvantage')}                      sortOrder={sortOrder} />
                    <LeaderboardStatCard label="Takedowns before jungle spawn" entries={deepEntries('takedownsBeforeJungleMinionSpawn')}                  sortOrder={sortOrder} />
                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
