/**
 * BattleSystem.js
 * Full Pokemon-style 1v1 turn-based battle engine.
 * Handles: Fight/Skills/Switch(stub)/Run menus, damage calc,
 * type effectiveness, status, XP grant, move learn prompts,
 * and blackout on defeat.
 */
class BattleSystem {
  constructor(game) {
    this.game    = game;
    this.canvas  = document.getElementById('battle-canvas');
    this.ctx     = this.canvas.getContext('2d');

    this.active  = false;
    this.enemy   = null;
    this.npc     = null;   // Trainer NPC if this is a trainer battle

    // Temp stat modifiers (reset each battle)
    this._playerMods = { atk: 0, def: 0 };
    this._enemyMods  = { atk: 0, def: 0 };

    // Enemy HP tracking (local copy for display)
    this._enemyHp    = 0;
    this._enemyMaxHp = 0;

    this._animFrame  = null;
    this._logEl      = document.getElementById('battle-log');
    this._actionsEl  = document.getElementById('battle-actions');
    this._movesEl    = document.getElementById('battle-moves');
    this._nameEl     = document.getElementById('battle-log-name');
  }

  /** Entry point — called by GameEngine */
  startBattle(enemy, npc = null) {
    this.active          = true;
    this.enemy           = Utils.clone(enemy);
    this.npc             = npc;
    this._enemyHp        = enemy.hp;
    this._enemyMaxHp     = enemy.maxHp;
    this._playerMods     = { atk: 0, def: 0 };
    this._enemyMods      = { atk: 0, def: 0 };

    // Update UI name tags
    document.getElementById('enemy-name').textContent  = enemy.name.toUpperCase();
    document.getElementById('enemy-level').textContent = 'Lv.' + enemy.level;
    const p = this.game.entityManager.player;
    document.getElementById('player-name-battle').textContent  = p.name;
    document.getElementById('player-level-battle').textContent = 'Lv.' + p.level;
    this._nameEl.textContent = p.name;

    this._syncBars();
    this._setLog(`A wild ${enemy.name} appeared!`);

    Utils.showScreen('screen-battle');
    this._showActions();
    this._renderLoop();
  }

  // ── Rendering ───────────────────────────────────────────

  _renderLoop() {
    if (!this.active) return;
    this._render();
    this._animFrame = requestAnimationFrame(() => this._renderLoop());
  }

  _render() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const p = this.game.entityManager.player;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0d1a');
    bg.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ground lines
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    for (let y = H * 0.55; y < H; y += 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Enemy platform
    ctx.fillStyle = '#1e2a1e';
    Utils.roundRect(ctx, W * 0.5, H * 0.35, W * 0.42, 12, 6, '#1e2a1e');

    // Player platform
    ctx.fillStyle = '#1e1a2e';
    Utils.roundRect(ctx, W * 0.08, H * 0.6, W * 0.35, 14, 6, '#1e1a2e');

    // Draw enemy sprite
    this._drawBattleSprite(ctx, this.enemy, W * 0.65, H * 0.15, true);

    // Draw player sprite
    this._drawBattleSprite(ctx, p, W * 0.18, H * 0.4, false);
  }

  _drawBattleSprite(ctx, entity, cx, cy, isEnemy) {
    const size   = isEnemy ? 72 : 80;
    const color  = Utils.elementColor(entity.element);
    const t      = Date.now() / 800;
    const bob    = Math.sin(t) * 3;

    ctx.save();
    ctx.translate(cx, cy + bob);

    // Glow aura
    const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.75);
    glow.addColorStop(0, color + '55');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.75, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isEnemy) {
      this._drawEnemyFigure(ctx, entity, size, color);
    } else {
      this._drawPlayerFigure(ctx, entity, size, color);
    }

    ctx.restore();
  }

  _drawPlayerFigure(ctx, p, size, color) {
    const s = size / 80;
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-16*s, -10*s, 32*s, 30*s);
    // Head
    ctx.fillStyle = '#f5d0b0';
    ctx.fillRect(-12*s, -30*s, 24*s, 22*s);
    // Eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-6*s, -22*s, 4*s, 4*s);
    ctx.fillRect(4*s,  -22*s, 4*s, 4*s);
    // Legs
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(-14*s, 18*s, 10*s, 16*s);
    ctx.fillRect(4*s,   18*s, 10*s, 16*s);
    // Element glyph on chest
    ctx.fillStyle = '#fff';
    ctx.font = `${12*s}px serif`;
    ctx.textAlign = 'center';
    const glyphs = { water: '💧', earth: '⛰', fire: '🔥', air: '💨' };
    ctx.fillText(glyphs[p.element] || '★', 0, 8*s);
    ctx.textAlign = 'left';
  }

  _drawEnemyFigure(ctx, enemy, size, color) {
    const s = size / 72;
    // Mirrored body
    ctx.fillStyle = color;
    ctx.fillRect(-14*s, -8*s, 28*s, 26*s);
    // Head
    ctx.fillStyle = '#f0c0a0';
    ctx.fillRect(-10*s, -26*s, 20*s, 20*s);
    // Eyes (menacing)
    ctx.fillStyle = '#ff3a00';
    ctx.fillRect(-6*s, -20*s, 4*s, 3*s);
    ctx.fillRect(2*s,  -20*s, 4*s, 3*s);
    // Legs
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(-12*s, 16*s, 8*s, 14*s);
    ctx.fillRect(4*s,   16*s, 8*s, 14*s);
    // Element indicator
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font      = `${11*s}px serif`;
    ctx.textAlign = 'center';
    const glyphs  = { water: '〜', earth: '▲', fire: '△', air: '∿' };
    ctx.fillText(glyphs[enemy.element] || '?', 0, 6*s);
    ctx.textAlign = 'left';
  }

  // ── Battle Menu UI ───────────────────────────────────────

  _showActions() {
    Utils.show(this._actionsEl);
    Utils.hide(this._movesEl);
    this._actionsEl.querySelectorAll('.battle-btn').forEach(btn => {
      btn.onclick = () => this._onAction(btn.dataset.action);
    });
  }

  _onAction(action) {
    switch (action) {
      case 'fight':  this._showMoves(); break;
      case 'skills': this._showMoves(); break;
      case 'switch': this._setLog('No other benders to switch to!'); break;
      case 'run':    this._tryRun(); break;
    }
  }

  _showMoves() {
    const p = this.game.entityManager.player;
    Utils.hide(this._actionsEl);
    Utils.show(this._movesEl);
    this._movesEl.innerHTML = '';

    p.moves.forEach((move, i) => {
      const btn = document.createElement('button');
      btn.className = `move-btn ${move.type}`;
      btn.innerHTML = `
        <span>${move.name}</span>
        <span class="move-type">${move.type.toUpperCase()} | PWR:${move.power} ACC:${move.accuracy}</span>
      `;
      btn.onclick = () => this._executePlayerMove(move);
      this._movesEl.appendChild(btn);
    });

    // Back button
    const back = document.createElement('button');
    back.className = 'move-btn';
    back.innerHTML = '<span>← BACK</span>';
    back.onclick = () => this._showActions();
    this._movesEl.appendChild(back);
  }

  // ── Combat Flow ──────────────────────────────────────────

  async _executePlayerMove(move) {
    // Disable all buttons during resolution
    this._disableMenu(true);

    const p = this.game.entityManager.player;

    // Determine turn order by speed
    const playerFirst = p.spd >= (this.enemy.spd || 10);

    if (playerFirst) {
      await this._applyMove(move, p, this.enemy, false);
      if (this._enemyHp > 0) await this._enemyTurn();
    } else {
      await this._enemyTurn();
      if (p.hp > 0) await this._applyMove(move, p, this.enemy, false);
    }

    if (this.active) {
      this._disableMenu(false);
      this._showActions();
    }
  }

  async _applyMove(move, attacker, defender, isEnemy) {
    const aName = isEnemy ? this.enemy.name : attacker.name;

    // Accuracy check
    if (Math.random() * 100 > move.accuracy) {
      this._setLog(`${aName} used ${move.name}... but it missed!`);
      await Utils.wait(1200);
      return;
    }

    this._setLog(`${aName} used ${move.name}!`);
    await Utils.wait(700);

    // Stat modifier moves (no damage)
    if (move.statMod) {
      if (!isEnemy) {
        this._playerMods.atk = (this._playerMods.atk || 0) + (move.statMod.atk || 0);
        this._playerMods.def = (this._playerMods.def || 0) + (move.statMod.def || 0);
        this._setLog(`${aName}'s power rose!`);
      } else {
        this._enemyMods.atk  = (this._enemyMods.atk  || 0) + (move.statMod.atk || 0);
        this._setLog(`${aName}'s power rose!`);
      }
      await Utils.wait(900);
      return;
    }

    // Heal moves
    if (move.heal && !isEnemy) {
      this.game.entityManager.restoreHP(move.heal);
      this._setLog(`${aName} recovered ${move.heal} HP!`);
      this._syncBars();
      await Utils.wait(900);
      return;
    }

    // Damage calculation
    if (move.power > 0) {
      const atkStat  = isEnemy
        ? (this.enemy.atk || 10) * (1 + (this._enemyMods.atk || 0) * 0.2)
        : this.game.entityManager.player.atk * (1 + (this._playerMods.atk || 0) * 0.2);
      const defStat  = isEnemy
        ? this.game.entityManager.player.def
        : (this.enemy.def || 8) * (1 + (this._enemyMods.def || 0) * 0.2);
      const typeMulti = getTypeMultiplier(
        move.type,
        isEnemy ? this.game.entityManager.player.element : this.enemy.element
      );
      const crit     = Math.random() < 0.0625 ? 1.5 : 1.0;
      const rand     = 0.85 + Math.random() * 0.15;
      const dmg      = Math.max(1, Math.floor(
        (atkStat / defStat) * move.power * typeMulti * crit * rand / 8
      ));

      if (crit > 1) { this._setLog('A critical hit!'); await Utils.wait(400); }
      if (typeMulti > 1) { this._setLog("It's super effective!"); await Utils.wait(400); }
      if (typeMulti < 1) { this._setLog("It's not very effective..."); await Utils.wait(400); }

      if (isEnemy) {
        // Damage player
        const fainted = this.game.entityManager.damagePlayer(dmg);
        this._syncBars();
        Utils.flashClass(document.getElementById('battle-canvas'), 'shake');
        this._setLog(`${this.game.entityManager.player.name} took ${dmg} damage!`);
        await Utils.wait(900);
        if (fainted) await this._playerFainted();
      } else {
        // Damage enemy
        this._enemyHp = Math.max(0, this._enemyHp - dmg);
        this._syncBars();
        Utils.flashClass(document.getElementById('battle-canvas'), 'shake');
        this._setLog(`${this.enemy.name} took ${dmg} damage!`);
        await Utils.wait(900);
        if (this._enemyHp <= 0) await this._enemyFainted();
      }
    }
  }

  async _enemyTurn() {
    if (!this.active) return;
    const moves = this.enemy.moves
      .map(id => MOVES_DB[id])
      .filter(Boolean);
    const move = moves[Math.floor(Math.random() * moves.length)] || MOVES_DB['tackle'];
    await this._applyMove(move, this.enemy, null, true);
  }

  async _tryRun() {
    // Wild battles: always succeed; trainer battles: fail
    if (this.npc) {
      this._setLog("You can't run from a trainer battle!");
      await Utils.wait(1000);
      return;
    }
    this._setLog('Got away safely!');
    await Utils.wait(1000);
    this._endBattle();
  }

  async _enemyFainted() {
    if (!this.active) return;
    this._setLog(`${this.enemy.name} was defeated!`);
    await Utils.wait(1000);

    const xpGain = this.enemy.xpYield || 20;
    this._setLog(`Gained ${xpGain} XP!`);
    Utils.flashClass(document.getElementById('player-xp-fill'), 'xp-flash');
    await Utils.wait(800);

    const result = this.game.entityManager.grantXP(xpGain);
    this._syncBars();

    if (result.leveled) {
      const p = this.game.entityManager.player;
      this._setLog(`${p.name} reached level ${p.level}!`);
      await Utils.wait(1200);
    }

    // Mark trainer defeated
    if (this.npc) {
      this.game.entityManager.defeatNpc(this.npc.id);
    }

    // Check for new move
    if (result.newMove) {
      await this._offerLearnMove(result.newMove);
    }

    this._endBattle();
  }

  async _playerFainted() {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this._animFrame);

    this._setLog(`${this.game.entityManager.player.name} blacked out!`);
    await Utils.wait(1500);
    this._endBattle(true);
    this.game.triggerBlackout();
  }

  async _offerLearnMove(move) {
    return new Promise(resolve => {
      const p = this.game.entityManager;
      const learnEl  = document.getElementById('screen-learn');
      const titleEl  = document.getElementById('learn-title');
      const infoEl   = document.getElementById('learn-info');
      const replaceEl = document.getElementById('learn-replace');
      const listEl   = document.getElementById('learn-move-list');
      const cancelBtn = document.getElementById('btn-learn-cancel');

      titleEl.textContent = `${p.player.name} wants to learn ${move.name}!`;
      infoEl.textContent  = `Type: ${move.type.toUpperCase()} | Power: ${move.power} | Acc: ${move.accuracy}\n"${move.description}"`;

      learnEl.classList.remove('hidden');
      learnEl.classList.add('active');

      if (p.learnMove(move.id)) {
        // Learned successfully
        infoEl.textContent += '\n\n✓ Move learned!';
        setTimeout(() => {
          learnEl.classList.add('hidden');
          learnEl.classList.remove('active');
          resolve();
        }, 2000);
      } else {
        // Slots full — show replace UI
        Utils.show(replaceEl);
        listEl.innerHTML = '';
        p.player.moves.forEach((m, i) => {
          const li = document.createElement('li');
          li.textContent = `${m.name} [${m.type.toUpperCase()} | PWR:${m.power}]`;
          li.onclick = () => {
            p.replaceMoveAt(i, move.id);
            Utils.hide(replaceEl);
            learnEl.classList.add('hidden');
            learnEl.classList.remove('active');
            resolve();
          };
          listEl.appendChild(li);
        });
        cancelBtn.onclick = () => {
          Utils.hide(replaceEl);
          learnEl.classList.add('hidden');
          learnEl.classList.remove('active');
          resolve();
        };
      }
    });
  }

  _endBattle(blacked = false) {
    this.active = false;
    cancelAnimationFrame(this._animFrame);
    if (!blacked) {
      Utils.showScreen('screen-game');
      this.game.saveSystem.saveGame();
    }
  }

  _disableMenu(disabled) {
    document.querySelectorAll('.battle-btn, .move-btn').forEach(b => b.disabled = disabled);
  }

  // ── HP Bar Sync ──────────────────────────────────────────

  _syncBars() {
    const p    = this.game.entityManager.player;
    const pPct = p.hp / p.maxHp;
    const ePct = this._enemyHp / this._enemyMaxHp;

    const pFill = document.getElementById('player-hp-fill');
    const eFill = document.getElementById('enemy-hp-fill');

    pFill.style.width      = (pPct * 100).toFixed(1) + '%';
    pFill.style.background = Utils.hpColor(pPct);
    eFill.style.width      = (ePct * 100).toFixed(1) + '%';
    eFill.style.background = Utils.hpColor(ePct);

    document.getElementById('player-hp-cur').textContent = p.hp;
    document.getElementById('player-hp-max').textContent = p.maxHp;

    // XP bar
    const xpPct = p.xp / p.xpNext;
    document.getElementById('player-xp-fill').style.width = (xpPct * 100).toFixed(1) + '%';

    // Enemy HP sync (used internally)
    this.enemy.hp = this._enemyHp;

    // Also update HUD
    this.game.entityManager.updateHUDElements();
  }

  _setLog(msg) {
    this._logEl.textContent = msg;
  }
}
