import DominationTreeIcon  from './DDragon/runes/7200_Domination.png';
import PrecisionTreeIcon   from './DDragon/runes/7201_Precision.png';
import SorceryTreeIcon     from './DDragon/runes/7202_Sorcery.png';
import InspirationTreeIcon from './DDragon/runes/7203_Whimsy.png';
import ResolveTreeIcon     from './DDragon/runes/7204_Resolve.png';

import RankIron        from './DDragon/ranks/Rank=Iron.png';
import RankBronze      from './DDragon/ranks/Rank=Bronze.png';
import RankSilver      from './DDragon/ranks/Rank=Silver.png';
import RankGold        from './DDragon/ranks/Rank=Gold.png';
import RankPlatinum    from './DDragon/ranks/Rank=Platinum.png';
import RankEmerald     from './DDragon/ranks/Rank=Emerald.png';
import RankDiamond     from './DDragon/ranks/Rank=Diamond.png';
import RankMaster      from './DDragon/ranks/Rank=Master.png';
import RankGrandmaster from './DDragon/ranks/Rank=Grandmaster.png';
import RankChallenger  from './DDragon/ranks/Rank=Challenger.png';

export const DD_RUNE_ICON_BASE = 'https://ddragon.leagueoflegends.com/cdn/img';

export const SUMMONER_SPELLS = {
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

export const RUNE_ICONS = {
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

export const RUNE_TREE_ICONS = {
  8000: PrecisionTreeIcon,
  8100: DominationTreeIcon,
  8200: SorceryTreeIcon,
  8300: InspirationTreeIcon,
  8400: ResolveTreeIcon,
};

export const RANK_ICON_MAP = {
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

export const ROMAN_TO_NUM = { I: '1', II: '2', III: '3', IV: '4' };
