/**
 * SaveSystem.js
 * Persists and restores full game state via localStorage.
 * Saves: player stats/moves, map position, defeated NPCs, last healer location.
 */
class SaveSystem {
  static KEY = 'avatar_rpg_save_v1';

  constructor(game) {
    this.game = game;
  }

  /** Returns true if a save exists */
  hasSave() {
    return !!localStorage.getItem(SaveSystem.KEY);
  }

  /** Save current game state */
  saveGame() {
    try {
      const mm = this.game.mapManager;
      const em = this.game.entityManager;
      const state = {
        version:      1,
        timestamp:    Date.now(),
        player:       em.serialisePlayer(),
        defeatedNpcs: em.serialiseNpcs(),
        map:          mm.currentMap?.id || 'town',
        playerX:      mm.playerX,
        playerY:      mm.playerY,
        lastHealerMap:this.game.lastHealerMap || 'healer',
        lastHealerX:  this.game.lastHealerX   || 3,
        lastHealerY:  this.game.lastHealerY   || 4,
      };
      localStorage.setItem(SaveSystem.KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('SaveSystem: failed to save', e);
      return false;
    }
  }

  /** Load game state; returns true on success */
  loadGame() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state?.player) return false;

      const em = this.game.entityManager;
      const mm = this.game.mapManager;

      em.loadPlayer(state.player);
      em.loadNpcs(state.defeatedNpcs || []);

      mm.loadMap(state.map || 'town', state.playerX || 5, state.playerY || 5);

      this.game.lastHealerMap = state.lastHealerMap || 'healer';
      this.game.lastHealerX   = state.lastHealerX   || 3;
      this.game.lastHealerY   = state.lastHealerY   || 4;

      return true;
    } catch (e) {
      console.error('SaveSystem: failed to load', e);
      return false;
    }
  }

  /** Wipe save data */
  deleteSave() {
    localStorage.removeItem(SaveSystem.KEY);
  }

  /** Return a save summary string for display */
  getSaveSummary() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return 'No save found.';
      const s = JSON.parse(raw);
      const d = new Date(s.timestamp);
      return `${s.player.name} · Lv.${s.player.level} · ${MAPS_DB[s.map]?.name || s.map} · ${d.toLocaleDateString()}`;
    } catch { return 'Save data corrupted.'; }
  }
}
