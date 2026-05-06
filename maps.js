/**
 * maps.js — Map Data Definitions
 *
 * Tile types:
 *   0 = floor/grass (walkable)
 *   1 = wall/tree (blocked)
 *   2 = tall grass (random encounter zone)
 *   3 = water (blocked)
 *   4 = path/road (walkable, no encounter)
 *   5 = building entrance (warp trigger)
 *   6 = healing center entrance
 *
 * Each map: { id, name, music, tilemap, npcs, warps, grassEncounterRate, encounters, healerPos }
 */
const MAPS_DB = {

  // ══════════════════════════════════
  // EMBER ISLAND TOWN — Starting area
  // ══════════════════════════════════
  town: {
    id: 'town',
    name: 'Ember Island Town',
    bgColor: '#3a5a2a',
    pathColor: '#c8a878',
    grassEncounterRate: 0,
    healerPos: { x: 7, y: 3 },

    tilemap: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
      [1,0,1,1,0,4,0,4,0,1,1,0,0,0,1],
      [1,0,1,6,0,4,0,4,0,1,5,0,0,0,1],
      [1,0,1,1,0,4,0,4,0,1,1,0,0,0,1],
      [1,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1],
    ],

    npcs: [
      {
        id: 'npc_elder',
        x: 2, y: 6,
        name: 'Elder Kato',
        type: 'healer',
        sprite: 'elder',
        dialogue: [
          'Welcome, young bender. This is Ember Island.',
          'The route to the south holds many wild benders...',
          'Be careful in the tall grass! Walk slowly.',
          'Return here to rest and recover your strength.',
        ],
      },
      {
        id: 'npc_trainer1',
        x: 10, y: 6,
        name: 'Bender Mai',
        type: 'trainer',
        element: 'fire',
        sprite: 'trainer',
        defeated: false,
        dialogue: {
          before: ['I challenge you, traveler! Show me your bending!'],
          after:  ["You're stronger than you look. I'll train harder."],
        },
        team: [
          { name: 'Wild Firebender', element: 'fire', level: 3, hp: 25, maxHp: 25, moves: ['fire_blast'] },
        ],
        reward: { xp: 30 },
      },
      {
        id: 'npc_merchant',
        x: 9, y: 2,
        name: 'Merchant Fong',
        type: 'merchant',
        sprite: 'merchant',
        dialogue: [
          'Potions and supplies — that\'s my trade!',
          '(Shop feature coming soon...)',
          'Stay strong, traveler!',
        ],
      },
    ],

    warps: [
      { x: 5,  y: 11, toMap: 'route1', toX: 7,  toY: 1,  direction: 'down' },
      { x: 10, y: 3,  toMap: 'dojo',   toX: 3,  toY: 5,  direction: 'building' },
      { x: 3,  y: 3,  toMap: 'healer', toX: 3,  toY: 5,  direction: 'building', isHealer: true },
    ],
  },

  // ══════════════════════════════════
  // ROUTE 1 — Wild bender grasslands
  // ══════════════════════════════════
  route1: {
    id: 'route1',
    name: 'Volcanic Route 1',
    bgColor: '#2a4a1a',
    pathColor: '#a07850',
    grassEncounterRate: 0.15,
    healerPos: null,

    tilemap: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,4,4,4,2,2,2,2,2,2,1],
      [1,2,2,2,2,4,0,4,2,2,2,2,2,2,1],
      [1,2,2,1,2,4,0,4,2,1,2,2,2,2,1],
      [1,2,2,1,2,4,0,4,2,1,2,2,2,2,1],
      [1,2,2,2,2,4,4,4,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    npcs: [
      {
        id: 'npc_route_trainer',
        x: 3, y: 8,
        name: 'Scout Bumi',
        type: 'trainer',
        element: 'earth',
        sprite: 'trainer',
        defeated: false,
        dialogue: {
          before: ['You stepped into my training zone! FIGHT!'],
          after:  ['Haha! You\'ve got good bending. Keep going!'],
        },
        team: [
          { name: 'Earth Pupil', element: 'earth', level: 4, hp: 30, maxHp: 30, moves: ['rock_toss'] },
          { name: 'Stone Fist',  element: 'earth', level: 3, hp: 25, maxHp: 25, moves: ['tackle'] },
        ],
        reward: { xp: 45 },
      },
    ],

    warps: [
      { x: 7, y: 0, toMap: 'town',   toX: 5, toY: 10, direction: 'up' },
    ],

    encounters: [
      { name: 'Wild Firebender',  element: 'fire',  levelMin: 2, levelMax: 5, weight: 30 },
      { name: 'Earth Pupil',      element: 'earth', levelMin: 2, levelMax: 4, weight: 25 },
      { name: 'Air Nomad',        element: 'air',   levelMin: 2, levelMax: 4, weight: 20 },
      { name: 'Water Tribe Scout',element: 'water', levelMin: 2, levelMax: 5, weight: 25 },
    ],
  },

  // ══════════════════════════════════
  // HEALING CENTER (interior)
  // ══════════════════════════════════
  healer: {
    id: 'healer',
    name: 'Healing Center',
    bgColor: '#2a2050',
    pathColor: '#d4c8f0',
    grassEncounterRate: 0,
    healerPos: { x: 3, y: 2 },

    tilemap: [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,0,6,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,1,0,1,1,1,1],
    ],

    npcs: [
      {
        id: 'npc_healer',
        x: 3, y: 2,
        name: 'Healer Katara',
        type: 'healer',
        sprite: 'healer',
        dialogue: [
          'Welcome to the Healing Center!',
          'I\'ll restore your health with waterbending.',
          'Come back any time you need help.',
        ],
      },
    ],

    warps: [
      { x: 2, y: 5, toMap: 'town', toX: 3, toY: 4, direction: 'exit' },
    ],
  },

  // ══════════════════════════════════
  // DOJO (interior placeholder)
  // ══════════════════════════════════
  dojo: {
    id: 'dojo',
    name: 'Bending Dojo',
    bgColor: '#3a1a1a',
    pathColor: '#8a5030',
    grassEncounterRate: 0,
    healerPos: null,

    tilemap: [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,1,0,1,1,1,1],
    ],

    npcs: [
      {
        id: 'npc_sifu',
        x: 3, y: 2,
        name: 'Master Jeong Jeong',
        type: 'sage',
        sprite: 'elder',
        dialogue: [
          'This dojo trains the mind as much as the body.',
          'Fire is life. But it must be mastered, not wielded carelessly.',
          'Train hard. Your potential is limitless.',
        ],
      },
    ],

    warps: [
      { x: 2, y: 5, toMap: 'town', toX: 10, toY: 4, direction: 'exit' },
    ],
  },
};
