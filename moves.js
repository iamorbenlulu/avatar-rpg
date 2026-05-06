/**
 * moves.js — Move Data Definitions
 * Each move: { name, type, power, accuracy, description, learnLevel }
 * type maps to element: 'water' | 'earth' | 'fire' | 'air' | 'normal'
 */
const MOVES_DB = {
  // ── WATER MOVES ──────────────────────────────────────
  water_whip:       { name: 'Water Whip',       type: 'water', power: 40, accuracy: 95, description: 'A precise whip of water.', learnLevel: 1 },
  ice_shard:        { name: 'Ice Shard',         type: 'water', power: 30, accuracy: 100,description: 'Fast ice shards always strike first.', learnLevel: 5 },
  tidal_wave:       { name: 'Tidal Wave',        type: 'water', power: 80, accuracy: 75, description: 'A massive wall of water.', learnLevel: 12 },
  ice_prison:       { name: 'Ice Prison',        type: 'water', power: 55, accuracy: 85, description: 'Encases the foe in ice.', learnLevel: 18 },
  spirit_oasis:     { name: 'Spirit Oasis',      type: 'water', power: 0,  accuracy: 100,description: 'Restores some HP.', learnLevel: 22, heal: 30 },
  blood_bend:       { name: 'Bloodbend',         type: 'water', power: 110,accuracy: 60, description: 'A forbidden technique.', learnLevel: 30 },

  // ── EARTH MOVES ──────────────────────────────────────
  rock_toss:        { name: 'Rock Toss',         type: 'earth', power: 45, accuracy: 90, description: 'Hurls a chunk of earth.', learnLevel: 1 },
  earth_wall:       { name: 'Earth Wall',        type: 'earth', power: 0,  accuracy: 100,description: 'Raises defense this turn.', learnLevel: 4, statMod: { def: 1 } },
  seismic_slam:     { name: 'Seismic Slam',      type: 'earth', power: 70, accuracy: 80, description: 'Shakes the ground hard.', learnLevel: 10 },
  metal_bend:       { name: 'Metalbend',         type: 'earth', power: 85, accuracy: 80, description: 'Twists metal into a weapon.', learnLevel: 16 },
  sand_storm:       { name: 'Sand Storm',        type: 'earth', power: 50, accuracy: 95, description: 'Blinds and damages.', learnLevel: 20 },
  earth_rumble:     { name: 'Earth Rumble',      type: 'earth', power: 120,accuracy: 65, description: 'Legendary earthbending.', learnLevel: 30 },

  // ── FIRE MOVES ──────────────────────────────────────
  fire_blast:       { name: 'Fire Blast',        type: 'fire',  power: 45, accuracy: 95, description: 'A burst of hot flame.', learnLevel: 1 },
  flame_jet:        { name: 'Flame Jet',         type: 'fire',  power: 55, accuracy: 90, description: 'Continuous stream of fire.', learnLevel: 4 },
  lightning:        { name: 'Lightning Strike',  type: 'fire',  power: 90, accuracy: 70, description: 'Rare lightning generation.', learnLevel: 13 },
  fire_ring:        { name: 'Fire Ring',         type: 'fire',  power: 65, accuracy: 85, description: 'Surrounds foe with flame.', learnLevel: 17 },
  combustion:       { name: 'Combustion',        type: 'fire',  power: 100,accuracy: 65, description: 'Combustion-bending explosion.', learnLevel: 25 },
  sozins_comet:     { name: "Sozin's Comet",     type: 'fire',  power: 140,accuracy: 55, description: 'Fire amplified by the comet.', learnLevel: 35 },

  // ── AIR MOVES ──────────────────────────────────────
  air_gust:         { name: 'Air Gust',          type: 'air',   power: 35, accuracy: 100,description: 'A swift burst of air.', learnLevel: 1 },
  air_scooter:      { name: 'Air Scooter',       type: 'air',   power: 40, accuracy: 95, description: 'Spin-kick riding a ball of air.', learnLevel: 5 },
  tornado:          { name: 'Tornado',           type: 'air',   power: 70, accuracy: 80, description: 'A spinning vortex of wind.', learnLevel: 11 },
  sound_wave:       { name: 'Sound Wave',        type: 'air',   power: 55, accuracy: 90, description: 'Compressed air wave.', learnLevel: 16 },
  air_suffocate:    { name: 'Suffocate',         type: 'air',   power: 85, accuracy: 75, description: 'Removes air around foe.', learnLevel: 22 },
  avatar_state_air: { name: 'Avatar Wind',       type: 'air',   power: 130,accuracy: 60, description: 'The power of all past Avatars.', learnLevel: 32 },

  // ── NORMAL (shared) ──────────────────────────────────
  tackle:           { name: 'Tackle',            type: 'normal',power: 30, accuracy: 100,description: 'A basic physical strike.', learnLevel: 1 },
  meditate:         { name: 'Meditate',          type: 'normal',power: 0,  accuracy: 100,description: 'Centers the mind. +1 atk.', learnLevel: 1, statMod: { atk: 1 } },
};

/** Starting moves by element */
const STARTER_MOVES = {
  water: ['water_whip', 'tackle'],
  earth: ['rock_toss', 'tackle'],
  fire:  ['fire_blast', 'tackle'],
  air:   ['air_gust', 'tackle'],
};

/** Level-up move pool by element */
const LEVEL_MOVES = {
  water: [
    { level: 5,  id: 'ice_shard' },
    { level: 10, id: 'meditate' },
    { level: 12, id: 'tidal_wave' },
    { level: 18, id: 'ice_prison' },
    { level: 22, id: 'spirit_oasis' },
    { level: 30, id: 'blood_bend' },
  ],
  earth: [
    { level: 4,  id: 'earth_wall' },
    { level: 8,  id: 'meditate' },
    { level: 10, id: 'seismic_slam' },
    { level: 16, id: 'metal_bend' },
    { level: 20, id: 'sand_storm' },
    { level: 30, id: 'earth_rumble' },
  ],
  fire: [
    { level: 4,  id: 'flame_jet' },
    { level: 8,  id: 'meditate' },
    { level: 13, id: 'lightning' },
    { level: 17, id: 'fire_ring' },
    { level: 25, id: 'combustion' },
    { level: 35, id: 'sozins_comet' },
  ],
  air: [
    { level: 5,  id: 'air_scooter' },
    { level: 8,  id: 'meditate' },
    { level: 11, id: 'tornado' },
    { level: 16, id: 'sound_wave' },
    { level: 22, id: 'air_suffocate' },
    { level: 32, id: 'avatar_state_air' },
  ],
};

/** Type effectiveness multipliers */
const TYPE_CHART = {
  water: { fire: 1.5, earth: 0.8, water: 0.8, air: 1.0, normal: 1.0 },
  earth: { water: 0.8, fire: 1.0, earth: 0.8, air: 1.5, normal: 1.0 },
  fire:  { water: 0.8, earth: 1.0, fire: 0.8, air: 1.0, normal: 1.0 },
  air:   { earth: 0.8, fire: 1.0, water: 1.0, air: 0.8, normal: 1.0 },
  normal:{ water: 1.0, earth: 1.0, fire: 1.0, air: 1.0, normal: 1.0 },
};

function getTypeMultiplier(moveType, targetType) {
  if (!TYPE_CHART[moveType]) return 1.0;
  return TYPE_CHART[moveType][targetType] || 1.0;
}
