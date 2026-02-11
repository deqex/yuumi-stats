import React from 'react'

// DDragon CDN base for champion icons
const DD_CHAMPION_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/champion';

// data: result of dissectMatchData(matchData)
// focusName: summoner name to highlight (riotIdGameName)

export default function MatchCard({ data, focusName }) {
  if (!data) return null;

  const players = Object.values(data);
  const focusLower = (focusName || '').toLowerCase();
  const focusPlayer = players.find(p => (p?.name || '')?.toLowerCase() === focusLower);

  // Split teams (Riot teamId: 100 = Blue, 200 = Red)
  const blueTeam = players.filter(p => p.teamId === 100);
  const redTeam  = players.filter(p => p.teamId === 200);

  // Totals
  const sum = (arr, key) => arr.reduce((acc, p) => acc + (p?.[key] ?? 0), 0);
  const blueKills = sum(blueTeam, 'kills');
  const redKills  = sum(redTeam, 'kills');
  const blueGold  = sum(blueTeam, 'goldEarned');
  const redGold   = sum(redTeam, 'goldEarned');

  const allDamage = players.map(p => p?.totalDamageDealtToChampions ?? 0);
  const maxDamage = Math.max(1, ...allDamage);

  // Small UI helpers
  const pill = (text, bg, fg) => (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 999,
      background: bg,
      color: fg,
      fontWeight: 700,
      fontSize: 12
    }}>{text}</span>
  );

  const SimpleScore = (p) => {
    if (typeof p?.opScore === 'number') {
      return <span style={{ fontWeight: 700, color: '#FBBF24' }}>{Math.round(p.opScore)}</span>;
    }
    const k = p?.kills ?? 0;
    const a = p?.assists ?? 0;
    const d = p?.deaths ?? 0;
    const sc = Math.round(k * 1.5 + a - d); // placeholder OP score
    return <span style={{ fontWeight: 700, color: '#FBBF24' }}>{isNaN(sc) ? '-' : sc}</span>;
  };

  const scoreTooltip = (p) => {
    const b = p?.opBreakdown;
    if (!b) return 'Score breakdown unavailable';
    const round = (v) => Math.round(v ?? 0);
    const lines = [
      `Total: ${round(b.total)}`,
      `kdaScore: ${round(b.kdaScore)}`,
      `damageScore: ${round(b.damageScore)}`,
      `visionScore: ${round(b.visionScore)}`,
      `csScore: ${round(b.csScore)}`,
      `enchanterScore: ${round(b.enchanterScore)}`,
      `tankScore: ${round(b.tankScore)}`,
      `ccScore: ${round(b.ccScore)}`,
      `goldScore: ${round(b.goldScore)}`,
    ];
    return lines.join('\n');
  };

  const DamageBar = ({ value, color = '#F87171' }) => {
    const width = Math.max(3, Math.round((value / maxDamage) * 100));
    return (
      <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    );
  };

  // Resolve champion icon via DDragon CDN
  const getChampionImgUrl = (championName) => {
    if (!championName) return null;
    const id = String(championName).replace(/[^A-Za-z]/g, '');
    if (!id) return null;
    return `${DD_CHAMPION_ICON_BASE}/${id}.png`;
  };

  const ChampIcon = ({ name }) => {
    const src = getChampionImgUrl(name);
    if (!src) {
      return <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginRight: 8 }} />
    }
    return (
      <img
        src={src}
        alt={name || 'champion'}
        style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', marginRight: 8 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  };

  const BadgeDisplay = ({ badges }) => {
    if (!badges || badges.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {badges.map((badge, index) => (
          <span key={index} style={{
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.15)',
            color: '#FBBF24',
            fontSize: 10,
            fontWeight: 700,
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>{badge}</span>
        ))}
      </div>
    );
  };

  const rowGrid = '1fr 72px 120px 1fr 60px 60px 180px';

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: rowGrid,
    alignItems: 'center',
    padding: '8px 10px',
    gap: '8px',
    borderTop: '1px solid #1F2937'
  };

  const headerRowStyle = {
    display: 'grid',
    gridTemplateColumns: rowGrid,
    alignItems: 'center',
    padding: '10px 10px',
    gap: '8px',
    background: 'rgba(255,255,255,0.04)',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: 700,
    textTransform: 'uppercase'
  };

  const NameCell = (p, isFocus) => (
    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <ChampIcon name={p?.championName} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{
          color: isFocus ? '#FFFFFF' : '#E5E7EB',
          fontWeight: isFocus ? 800 : 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 220
        }}>{p?.name}</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Lvl {p?.champLevel ?? 1}</span>
      </div>
    </div>
  );

  const renderRow = (p) => {
    const isFocus = (p?.name || '').toLowerCase() === focusLower;
    const dmg = p?.totalDamageDealtToChampions ?? 0;
    const cs = (p?.totalMinionsKilled ?? 0) + (p?.neutralMinionsKilled ?? 0);
    return (
      <div key={`${p?.puuid}-${p?.championName}`} style={rowStyle}>
        {NameCell(p, isFocus)}
        <div style={{ textAlign: 'center' }} title={scoreTooltip(p)}>{SimpleScore(p)}</div>
        <div style={{ textAlign: 'center', color: '#E5E7EB', fontWeight: 700 }}>{p?.kills ?? 0}/{p?.deaths ?? 0}/{p?.assists ?? 0}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DamageBar value={dmg} />
          <span style={{ color: '#E5E7EB', fontSize: 12, minWidth: 40, textAlign: 'right' }}>{dmg}</span>
        </div>
        <div style={{ textAlign: 'center', color: '#E5E7EB', fontWeight: 600 }}>{p?.visionScore ?? 0}</div>
        <div style={{ textAlign: 'center', color: '#E5E7EB', fontWeight: 600 }}>{cs}</div>
        <BadgeDisplay badges={p?.badges} />
      </div>
    );
  };

  const TotalsBar = () => {
    const totalKills = blueKills + redKills;
    const blueKillPct = totalKills ? (blueKills / totalKills) * 100 : 50;
    const totalGold = blueGold + redGold;
    const blueGoldPct = totalGold ? (blueGold / totalGold) * 100 : 50;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#93C5FD', fontWeight: 700, textAlign: 'right' }}>{blueKills}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 10, background: '#374151', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${blueKillPct}%`, background: '#60A5FA' }} />
              <div style={{ width: `${100 - blueKillPct}%`, background: '#F87171' }} />
            </div>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Total Kill</span>
          </div>
          <span style={{ color: '#FCA5A5', fontWeight: 700 }}>{redKills}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#93C5FD', fontWeight: 700, textAlign: 'right' }}>{blueGold.toLocaleString()}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 10, background: '#374151', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${blueGoldPct}%`, background: '#60A5FA' }} />
              <div style={{ width: `${100 - blueGoldPct}%`, background: '#F87171' }} />
            </div>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Total Gold</span>
          </div>
          <span style={{ color: '#FCA5A5', fontWeight: 700 }}>{redGold.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const cardBg = '#111827';

  return (
    <div style={{
      border: '1px solid #1F2937',
      borderRadius: 10,
      background: cardBg,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      width: '100%',
      marginBottom: 16
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #1F2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pill(
            focusPlayer?.win ? 'Victory' : 'Defeat',
            focusPlayer?.win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            focusPlayer?.win ? '#34D399' : '#F87171'
          )}
          <div style={{ color: '#E5E7EB', fontWeight: 800 }}>
            {focusPlayer ? `${focusPlayer.kills}/${focusPlayer.deaths}/${focusPlayer.assists}` : 'K/D/A'}
            <span style={{ color: '#9CA3AF', fontWeight: 600, marginLeft: 6 }}>KDA</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {pill('Overview', 'rgba(255,255,255,0.06)', '#E5E7EB')}
          {pill('OP Score', 'rgba(255,255,255,0.06)', '#E5E7EB')}
          {pill('Team analysis', 'rgba(255,255,255,0.06)', '#E5E7EB')}
        </div>
      </div>

      {/* Defeat (Blue) */}
      <div>
        <div style={headerRowStyle}>
          <div>Defeat (Blue Team)</div>
          <div>OP Score</div>
          <div>KDA</div>
          <div>Damage</div>
          <div>Vision</div>
          <div>CS</div>
          <div>Badges</div>
        </div>
        {blueTeam.map(renderRow)}
      </div>

      {/* Totals */}
      <TotalsBar />

      {/* Victory (Red) */}
      <div>
        <div style={headerRowStyle}>
          <div>Victory (Red Team)</div>
          <div>OP Score</div>
          <div>KDA</div>
          <div>Damage</div>
          <div>Vision</div>
          <div>CS</div>
          <div>Badges</div>
        </div>
        {redTeam.map(renderRow)}
      </div>
    </div>
  )
}
