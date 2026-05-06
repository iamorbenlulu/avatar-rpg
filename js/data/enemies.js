/**
 * enemies.js — Wild Bender & NPC Enemy Templates
 * Used by BattleSystem to generate encounter instances
 */

const ENEMY_TEMPLATES = {
  'Wild Firebender': {
    element: 'fire',
    baseHp: 18,
    baseAtk: 12,
    baseDef: 8,
    baseSpd: 10,
    xpYield: 20,
    moves: ['fire_blast', 'tackle'],
    spriteColor: '#ff7043',
  },
  'Earth Pupil': {
    element: 'earth',
    baseHp: 24,
    baseAtk: 10,
    baseDef: 14,
    baseSpd: 6,
    xpYield: 18,
    moves: ['rock_toss', 'tackle'],
    spriteColor: '#8bc34a',
  },
  'Air Nomad': {
    element: 'air',
    baseHp: 15,
    baseAtk: 9,
    baseDef: 7,
    baseSpd: 16,
    xpYield: 16,
    moves: ['air_gust', 'tackle'],
    spriteColor: '#e0e0e0',
  },
  'Water Tribe Scout': {
    element: 'water',
    baseHp: 20,
    baseAtk: 11,
    baseDef: 10,
    baseSpd: 12,
    xpYield: 19,
    moves: ['water_whip', 'tackle'],
    spriteColor: '#4fc3f7',
  },
  'Stone Fist': {
    element: 'earth',
    baseHp: 22,
    baseAtk: 13,
    baseDef: 12,
    baseSpd: 5,
    xpYield: 22,
    moves: ['rock_toss', 'earth_wall'],
    spriteColor: '#6d4c41',
  },
};

/**
 * Generate a scaled enemy instance from template + level
 */
function createEnemy(name, level) {
  const tpl = ENEMY_TEMPLATES[name];
  if (!tpl) return null;
  const scale = 1 + (level - 1) * 0.12;
  const maxHp  = Math.round(tpl.baseHp  * scale);
  const atk    = Math.round(tpl.baseAtk * scale);
  const def    = Math.round(tpl.baseDef * scale);
  const spd    = Math.round(tpl.baseSpd * scale);
  return {
    name,
    element: tpl.element,
    level,
    hp: maxHp,
    maxHp,
    atk, def, spd,
    moves: tpl.moves.slice(),
    xpYield: Math.round(tpl.xpYield * scale),
    spriteColor: tpl.spriteColor,
  };
}

/**
 * Pick a random encounter from a map's encounter table
 */
function pickWildEncounter(encounterTable, playerLevel) {
  const total = encounterTable.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of encounterTable) {
    roll -= entry.weight;
    if (roll <= 0) {
      const lvl = entry.levelMin + Math.floor(
        Math.random() * (entry.levelMax - entry.levelMin + 1)
      );
      const adjusted = Math.max(1, Math.min(lvl, playerLevel + 3));
      return createEnemy(entry.name, adjusted);
    }
  }
  return createEnemy(encounterTable[0].name, playerLevel);
}
