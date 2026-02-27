import React from 'react';
import './MatchDetail.css';

import DominationTreeIcon from '../../utils/DDragon/runes/7200_Domination.png';
import PrecisionTreeIcon from '../../utils/DDragon/runes/7201_Precision.png';
import SorceryTreeIcon from '../../utils/DDragon/runes/7202_Sorcery.png';
import InspirationTreeIcon from '../../utils/DDragon/runes/7203_Whimsy.png';
import ResolveTreeIcon from '../../utils/DDragon/runes/7204_Resolve.png';



const DD_CHAMPION_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/champion';
const DD_ITEM_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/item';
const DD_SUMMONER_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/16.3.1/img/spell';
const DD_RUNE_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/img';

const SUMMONER_SPELLS = {
  1: 'SummonerBoost',
  3: 'SummonerExhaust',
  4: 'SummonerFlash',
  6: 'SummonerHaste',
  7: 'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  13: 'SummonerMana',
  14: 'SummonerDot',
  21: 'SummonerBarrier',
  32: 'SummonerSnowball',
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
  8000: PrecisionTreeIcon,
  8100: DominationTreeIcon,
  8200: SorceryTreeIcon,
  8300: InspirationTreeIcon,
  8400: ResolveTreeIcon,
};

export default function MatchDetail({ match, focusName }) {
  if (!match || !match.players) return null;

  const players = Object.values(match.players);
  const focusLower = (focusName || '').toLowerCase();

  const blueTeam = players.filter(p => p.teamId === 100);
  const redTeam = players.filter(p => p.teamId === 200);

  const blueWin = blueTeam[0]?.win;
  const redWin = redTeam[0]?.win;

  // Max damage for bars
  const allDamage = players.map(p => p?.totalDamageDealtToChampions ?? 0);
  const maxDamage = Math.max(1, ...allDamage);

  // Team total kills for KP calculation
  const blueTeamKills = blueTeam.reduce((sum, p) => sum + (p.kills ?? 0), 0);
  const redTeamKills = redTeam.reduce((sum, p) => sum + (p.kills ?? 0), 0);

  // Duration
  const durationSeconds = match.gameInfo?.gameDuration || 0;
  const minutesPlayed = durationSeconds > 0 ? durationSeconds / 60 : 1;

  // Score rankings
  const scoredPlayers = players.filter(p => typeof p.opScore === 'number');
  const sortedByScore = [...scoredPlayers].sort((a, b) => b.opScore - a.opScore);

  const getPlacement = (player) => {
    const idx = sortedByScore.findIndex(p => p.puuid === player.puuid);
    if (idx < 0) return '-';
    const pos = idx + 1;
    if (pos === 1) return '1st';
    if (pos === 2) return '2nd';
    if (pos === 3) return '3rd';
    return `${pos}th`;
  };

  const getChampionImgUrl = (name) => {
    if (!name) return null;
    const id = String(name).replace(/[^A-Za-z]/g, '');
    return id ? `${DD_CHAMPION_ICON_BASE}/${id}.png` : null;
  };

  const getItemIconUrl = (id) => {
    if (!id || id === 0) return null;
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

  const getRuneTreeIcon = (styleId) => {
    return styleId != null ? RUNE_TREE_ICONS[styleId] : null;
  };

  const getKdaString = (p) => {
    return `${p.kills ?? 0} / ${p.deaths ?? 0} / ${p.assists ?? 0}`;
  };

  const getKdaRatio = (p) => {
    const k = p.kills ?? 0;
    const d = p.deaths ?? 0;
    const a = p.assists ?? 0;
    if (d === 0) return 'Perfect';
    return ((k + a) / d).toFixed(2);
  };

  const getKdaClass = (p) => {
    const d = p.deaths ?? 0;
    if (d === 0) return 'kda-perfect';
    const ratio = ((p.kills ?? 0) + (p.assists ?? 0)) / d;
    if (ratio > 5) return 'kda-gold';
    if (ratio > 1.5) return 'kda-green';
    return 'kda-red';
  };

  const getScoreClass = (score) => {
    if (score === '-' || isNaN(score)) return '';
    if (score < 45) return 'score-red';
    if (score > 85) return 'score-gold';
    return 'score-green';
  };



  const BOOTS_ITEM_IDS = new Set([
    1001, 3006, 3009, 3020, 3047, 3111, 3117, 3158,
  ]);

  const renderPlayerRow = (p) => {
    const isFocus = (p?.name || '').toLowerCase() === focusLower;
    const dmg = p?.totalDamageDealtToChampions ?? 0;
    const cs = (p?.totalMinionsKilled ?? 0) + (p?.neutralMinionsKilled ?? 0);
    const csPerMin = minutesPlayed > 0 ? (cs / minutesPlayed).toFixed(1) : '0.0';
    const score = typeof p.opScore === 'number' ? Math.round(p.opScore) : '-';
    const placement = getPlacement(p);

    // Kill participation
    const teamKills = p.teamId === 100 ? blueTeamKills : redTeamKills;
    const kp = teamKills > 0 ? Math.round(((p.kills ?? 0) + (p.assists ?? 0)) / teamKills * 100) : 0;
    const dmgWidth = Math.max(3, Math.round((dmg / maxDamage) * 100));

    const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];

    // Lane / role detection
    const lanePos = (p.individualPosition || '').toUpperCase();
    const isSupport = lanePos === 'UTILITY';
    const isJungle = lanePos === 'JUNGLE';
    const isTop = lanePos === 'TOP';
    const isMid = lanePos === 'MIDDLE';
    const isADC = lanePos === 'BOTTOM' && !isSupport;

    const isBootsItem = (id) => id && BOOTS_ITEM_IDS.has(id);


    // Use roleQuestId from DB (always present if available)
    const questIdForRole = p.roleQuestId || 0;


    const adcBootsItem = isADC ? (items.find(id => isBootsItem(id)) || 0) : 0;

    // Runes
    const primaryStyle = p?.perks?.styles?.find(s => s.description === 'primaryStyle') || p?.perks?.styles?.[0];
    const primaryKeystoneId = primaryStyle?.selections?.[0]?.perk;
    const primaryRuneIcon = getRuneIconUrl(primaryKeystoneId);
    const secondaryStyle = p?.perks?.styles?.find(s => s.description === 'subStyle') || p?.perks?.styles?.[1];
    const secondaryRuneTreeIcon = getRuneTreeIcon(secondaryStyle?.style);

    // Summoner spells
    const summ1 = getSummonerIconUrl(p.summoner1Id);
    const summ2 = getSummonerIconUrl(p.summoner2Id);

    return (
      <div key={p.puuid} className={`md-player-row ${isFocus ? 'md-focus' : ''}`}>
        {/* Champion + Spells + Runes */}
        <div className="md-champion-cell">
          <div className="md-champ-icon-wrap">
            {getChampionImgUrl(p.championName) ? (
              <img
                src={getChampionImgUrl(p.championName)}
                alt={p.championName}
                className="md-champ-icon"
              />
            ) : (
              <div className="md-champ-placeholder" />
            )}
            <span className="md-champ-level">{p.champLevel ?? 1}</span>
          </div>
          <div className="md-spells-runes">
            <div className="md-spell-col">
              <div className="md-mini-icon">{summ1 && <img src={summ1} alt="spell" />}</div>
              <div className="md-mini-icon">{summ2 && <img src={summ2} alt="spell" />}</div>
            </div>
            <div className="md-spell-col">
              <div className="md-mini-icon md-rune-primary">{primaryRuneIcon && <img src={primaryRuneIcon} alt="keystone" />}</div>
              <div className="md-mini-icon md-rune-secondary">{secondaryRuneTreeIcon && <img src={secondaryRuneTreeIcon} alt="rune tree" />}</div>
            </div>
          </div>
          <div className="md-player-info">
            <span className={`md-player-name ${isFocus ? 'md-name-focus' : ''}`}>
              {p.name || 'Unknown'}
            </span>
            <span className="md-player-tag">
              #{p.riotIdTagline || '???'}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="md-badges-cell">
          {p.badges && p.badges.map((badge, i) => (
            <span key={i} className={`md-badge${badge === 'MVP' ? ' md-badge-mvp' : ''}`}>{badge}</span>
          ))}
        </div>

        {/* AI Score */}
        <div className="md-score-cell">
          <span className={`md-score-value ${getScoreClass(score)}`}
            style={score === '-' || isNaN(score) ? {} : score < 45 ? { color: '#F87171' } : score > 80 ? { color: '#D4AF37' } : { color: '#34D399' }}
          >{score}</span>
          <span className="md-score-placement">{placement}</span>
          {p.opBreakdown && (
            <div className="md-score-breakdown" role="tooltip" aria-hidden={false}>
              <div className="md-breakdown-row"><span className="md-breakdown-label">KDA</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.kdaScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">Damage</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.damageScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">Vision</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.visionScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">CS</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.csScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">Enchanter</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.enchanterScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">Tank</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.tankScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">Gold</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.goldScore)}</span></div>
              <div className="md-breakdown-row"><span className="md-breakdown-label">CC</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.ccScore)}</span></div>
              <div className="md-breakdown-total"><span className="md-breakdown-label">Total</span><span className="md-breakdown-value">{Math.round(p.opBreakdown.total)}</span></div>
            </div>
          )}
        </div>

        {/* KDA */}
        <div className="md-kda-cell">
          <span className="md-kda-numbers">{getKdaString(p)}</span>
          <span
            className={`md-kda-ratio ${getKdaClass(p)}`}
            style={(() => {
              const d = p.deaths ?? 0;
              if (d === 0) return { color: '#34D399' };
              const ratio = ((p.kills ?? 0) + (p.assists ?? 0)) / d;
              if (ratio > 5) return { color: '#D4AF37' };
              if (ratio > 1.5) return { color: '#34D399' };
              return { color: '#F87171' };
            })()}
          >{getKdaRatio(p)}</span>
        </div>

        {/* Damage */}
        <div className="md-damage-cell">
          <span className="md-damage-value">{dmg.toLocaleString()}</span>
          <div className="md-damage-bar-track">
            <div
              className="md-damage-bar-fill"
              style={{ width: `${dmgWidth}%` }}
            />
          </div>
        </div>

        {/* CS */}
        <div className="md-cs-cell">
          <span className="md-cs-value">{cs}</span>
          <span className="md-cs-permin">({csPerMin}/m)</span>
        </div>

        {/* KP */}
        <div className="md-kp-cell">
          <span
            className={`md-kp-value`}
            style={kp < 30 ? { color: '#F87171' } : kp > 60 ? { color: '#D4AF37' } : { color: '#34D399' }}
          >{kp}%</span>
        </div>

        {/* Items + Role Quest */}
        <div className="md-items-cell">
          {items.map((itemId, idx) => {
            const src = getItemIconUrl(itemId);
            return (
              <div key={idx} className={`md-item-slot ${idx === 6 ? 'md-item-trinket' : ''}`}>
                {src && (
                  <img src={src} alt={`Item ${itemId}`} className="md-item-img" />
                )}
              </div>
            );
          })}

          {/* Role quest slot (all roles, including ADC) */}
          <div className="md-item-slot md-item-quest" title="Role quest">
            {questIdForRole ? (
              <img
                src={getItemIconUrl(questIdForRole)}
                alt={`Quest ${questIdForRole}`}
                className="md-item-img"
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderTeamSection = (team, isWin, label, teamClass) => (
    <div className={`md-team-section ${teamClass}`}>
      <div className={`md-team-header ${isWin ? 'md-team-win' : 'md-team-lose'}`}>
        <div className="md-team-title">
          <span className="md-team-result">{isWin ? 'Win' : 'Lose'}</span>
          <span className="md-team-label">({label})</span>
        </div>
        <div className="md-header-row">
          <span className="md-header-col md-header-col-badges"></span>
          <span className="md-header-col md-header-col-score">AI-Score</span>
          <span className="md-header-col md-header-col-kda">KDA</span>
          <span className="md-header-col md-header-col-dmg">Damage</span>
          <span className="md-header-col md-header-col-cs">CS</span>
          <span className="md-header-col md-header-col-kp">KP</span>
          <span className="md-header-col md-header-col-items">Items</span>
        </div>
      </div>
      <div className="md-team-rows">
        {team.map(renderPlayerRow)}
      </div>
    </div>
  );

  return (
    <div className="match-detail-panel">
      {renderTeamSection(blueTeam, blueWin, 'Blue Team', 'md-blue')}
      {renderTeamSection(redTeam, redWin, 'Red Team', 'md-red')}
    </div>
  );
}
