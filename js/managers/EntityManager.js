/**
 * EntityManager.js
 * Owns the player entity: stats, moves, XP, leveling, healing.
 * Also handles NPC defeated-state tracking.
 */
class EntityManager {

  // ── Element Base Stats ──────────────────────────────────
  static ELEMENT_STATS = {
    water: { hp: 28, atk: 12, def: 10, spd: 14, hpGrowth: 4, atkGrowth: 2 },
    earth: { hp: 34, atk: 14, def: 16, spd:  8, hpGrowth: 5, atkGrowth: 3 },
    fire:  { hp: 24, atk: 16, def:  9, spd: 14, hpGrowth: 3, atkGrowth: 4 },
    air:   { hp: 20, atk: 11, def:  8, spd: 18, hpGrowth: 3, atkGrowth: 2 },
  };

  constructor(game) {
    this.game = game;
    this.player = null;
    this.defeatedNpcs = new Set(); // tracks defeated trainer IDs
  }

  /** Create a brand-new player from element choice + name */
  createPlayer(element, name) {
    const base = EntityManager.ELEMENT_STATS[element];
    const startMoves = STARTER_MOVES[element].map(id => ({ id, ...MOVES_DB[id] }));
    this.player = {
      name:    name.toUpperCase().slice(0, 8) || 'AVATAR',
      element,
      level:   1,
      xp:      0,
      xpNext:  Utils.xpForLevel(2),
      hp:      base.hp,
      maxHp:   base.hp,
      atk:     base.atk,
      def:     base.def,
      spd:     base.spd,
      moves:   startMoves,         // Array of move objects (max 6)
      learnedMoveIds: new Set(STARTER_MOVES[element]),
    };
    return this.player;
  }

  /** Load player from a plain save object */
  loadPlayer(data) {
    this.player = data;
    // Restore Set from array
    this.player.learnedMoveIds = new Set(data.learnedMoveIds || []);
    return this.player;
  }

  /** Serialise player for saving (Sets → arrays) */
  serialisePlayer() {
    return {
      ...this.player,
      learnedMoveIds: [...this.player.learnedMoveIds],
    };
  }

  /** Grant XP; returns { leveled, newMove } if something happened */
  grantXP(amount) {
    const p = this.player;
    p.xp += amount;
    const result = { leveled: false, newMove: null };

    while (p.xp >= p.xpNext) {
      p.xp    -= p.xpNext;
      p.level += 1;
      p.xpNext = Utils.xpForLevel(p.level + 1);

      // Stat growth
      const base = EntityManager.ELEMENT_STATS[p.element];
      p.maxHp += base.hpGrowth  + Utils.randInt(0, 2);
      p.hp     = p.maxHp; // Full heal on level up
      p.atk   += base.atkGrowth + Utils.randInt(0, 1);
      p.def   += 1;
      p.spd   += 1;

      result.leveled = true;

      // Check for move learned at this level
      const pool = LEVEL_MOVES[p.element] || [];
      const entry = pool.find(m => m.level === p.level && !p.learnedMoveIds.has(m.id));
      if (entry) {
        result.newMove = { id: entry.id, ...MOVES_DB[entry.id] };
      }
    }

    this.game.saveSystem.saveGame(); // Persist after XP gain
    return result;
  }

  /** Teach a move; if slots are full returns false so UI can prompt replace */
  learnMove(moveId) {
    const p = this.player;
    if (p.moves.length < 6) {
      p.moves.push({ id: moveId, ...MOVES_DB[moveId] });
      p.learnedMoveIds.add(moveId);
      return true;
    }
    return false; // Caller should show replace UI
  }

  /** Replace an existing move at index with a new one */
  replaceMoveAt(index, moveId) {
    const p = this.player;
    p.moves[index] = { id: moveId, ...MOVES_DB[moveId] };
    p.learnedMoveIds.add(moveId);
  }

  /** Fully heal the player */
  healPlayer() {
    const p = this.player;
    p.hp = p.maxHp;
    this.game.updateHUD();
    this.game.saveSystem.saveGame();
  }

  /** Apply damage to player; returns true if fainted */
  damagePlayer(amount) {
    this.player.hp = Math.max(0, this.player.hp - amount);
    this.game.updateHUD();
    return this.player.hp <= 0;
  }

  /** Restore partial HP (used by heal moves) */
  restoreHP(amount) {
    const p = this.player;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    this.game.updateHUD();
  }

  /** Mark an NPC trainer as defeated */
  defeatNpc(npcId) {
    this.defeatedNpcs.add(npcId);
    // Find and flag in map data
    for (const map of Object.values(MAPS_DB)) {
      const npc = map.npcs?.find(n => n.id === npcId);
      if (npc) npc.defeated = true;
    }
  }

  isDefeated(npcId) { return this.defeatedNpcs.has(npcId); }

  /** Serialise NPC defeat state */
  serialiseNpcs() { return [...this.defeatedNpcs]; }

  /** Restore NPC defeat state */
  loadNpcs(ids = []) {
    this.defeatedNpcs = new Set(ids);
    ids.forEach(id => {
      for (const map of Object.values(MAPS_DB)) {
        const npc = map.npcs?.find(n => n.id === id);
        if (npc) npc.defeated = true;
      }
    });
  }

  // ── HUD update helper ────────────────────────────────────
  updateHUDElements() {
    const p = this.player;
    if (!p) return;
    const pct = p.hp / p.maxHp;
    document.getElementById('hud-name').textContent    = p.name;
    document.getElementById('hud-level').textContent   = p.level;
    document.getElementById('hud-hp-text').textContent = `${p.hp}/${p.maxHp}`;
    const fill = document.getElementById('hud-hp-fill');
    fill.style.width = (pct * 100).toFixed(1) + '%';
    fill.style.background = Utils.hpColor(pct);

    const badge = document.getElementById('hud-element');
    badge.textContent  = p.element.toUpperCase();
    badge.className    = `element-badge ${p.element}`;
  }
}
