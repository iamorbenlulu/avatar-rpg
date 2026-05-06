/**
 * GameEngine.js
 * Central coordinator: owns the game loop, manages screen transitions,
 * delegates to sub-systems, and handles global events.
 */
class GameEngine {
  constructor() {
    this.running      = false;
    this.lastTime     = 0;
    this.state        = 'title'; // title | select | game | battle | dialogue | menu

    // Sub-systems (initialised in init())
    this.inputHandler  = null;
    this.entityManager = null;
    this.mapManager    = null;
    this.battleSystem  = null;
    this.dialogueSystem= null;
    this.saveSystem    = null;

    // Healer respawn point
    this.lastHealerMap = 'healer';
    this.lastHealerX   = 3;
    this.lastHealerY   = 4;

    this._loopBound = this._loop.bind(this);
  }

  init() {
    this.inputHandler   = new InputHandler();
    this.entityManager  = new EntityManager(this);
    this.mapManager     = new MapManager(this);
    this.battleSystem   = new BattleSystem(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.saveSystem     = new SaveSystem(this);

    this._bindMenuUI();
    this._showTitle();
  }

  // ── Title / Selection ────────────────────────────────────

  _showTitle() {
    this.state = 'select';
    Utils.showScreen('screen-select');

    // Hide the big title card, show selection directly
    const titleCard = document.querySelector('.title-card');
    if (titleCard) titleCard.style.display = 'none';
    document.getElementById('element-select').classList.remove('hidden');
    document.getElementById('player-name').value = 'AVATAR';

    // Draw element preview sprites
    ['water','earth','fire','air'].forEach(el => this._drawElementPreview(el));

    // Element card selection — use replaceWith trick to clear old listeners
    document.querySelectorAll('.element-card').forEach(card => {
      const fresh = card.cloneNode(true);
      card.parentNode.replaceChild(fresh, card);
    });
    document.querySelectorAll('.element-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.element-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
    // Ensure fire is pre-selected (matches HTML default)
    const fireCard = document.querySelector('.element-card[data-element="fire"]');
    if (fireCard) fireCard.classList.add('selected');

    // Start button — clone to remove any stacked listeners
    const oldBtn = document.getElementById('btn-start');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', () => this._startGame());
  }

  _drawElementPreview(element) {
    const canvas = document.getElementById(`prev-${element}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const color = Utils.elementColor(element);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = Utils.elementBg(element);
    ctx.fillRect(0, 0, W, H);

    // Simple elemental symbol
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;

    switch (element) {
      case 'water':
        // Wave
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy + 4, 10, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'earth':
        // Triangle mountain
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx + 22, cy + 16);
        ctx.lineTo(cx - 22, cy + 16);
        ctx.closePath();
        ctx.fill();
        break;
      case 'fire':
        // Flame shape
        ctx.beginPath();
        ctx.moveTo(cx, cy - 22);
        ctx.bezierCurveTo(cx + 16, cy - 6, cx + 14, cy + 14, cx, cy + 18);
        ctx.bezierCurveTo(cx - 14, cy + 14, cx - 16, cy - 6, cx, cy - 22);
        ctx.fill();
        break;
      case 'air':
        // Swirl
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, 8 + i * 8, (i * 1.2), (i * 1.2) + Math.PI * 1.3);
          ctx.lineWidth = 4 - i;
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.8 - i * 0.2;
          ctx.stroke();
        }
        break;
    }
    ctx.globalAlpha = 1;
  }

  _startGame() {
    const selected = document.querySelector('.element-card.selected');
    const element  = selected?.dataset.element || 'fire';
    const name     = document.getElementById('player-name').value.trim() || 'AVATAR';

    console.log('[GameEngine] _startGame → element:', element, 'name:', name);

    // Check for existing save — use inline prompt instead of confirm()
    if (this.saveSystem.hasSave()) {
      this._showSavePrompt(element, name);
      return;
    }

    this._newGame(element, name);
  }

  _showSavePrompt(element, name) {
    const summary = this.saveSystem.getSaveSummary();
    // Build a quick inline overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;z-index:999;
    `;
    overlay.innerHTML = `
      <div style="background:#16213e;border:3px solid #c8a84b;padding:2rem;max-width:380px;text-align:center;font-family:'Press Start 2P',monospace;color:#e8e8d4;">
        <p style="font-size:0.55rem;margin-bottom:1rem;color:#ffd700;">SAVE FILE FOUND</p>
        <p style="font-size:0.4rem;color:#8a8a6a;margin-bottom:1.5rem;line-height:1.8;">${summary}</p>
        <div style="display:flex;flex-direction:column;gap:0.6rem;">
          <button id="sp-continue" style="font-family:'Press Start 2P',monospace;font-size:0.45rem;background:#1a2e1a;border:2px solid #ffd700;color:#ffd700;padding:0.6rem;cursor:pointer;">▶ CONTINUE SAVED GAME</button>
          <button id="sp-new"      style="font-family:'Press Start 2P',monospace;font-size:0.45rem;background:#2e1a1a;border:2px solid #ff7043;color:#ff7043;padding:0.6rem;cursor:pointer;">✕ NEW GAME (overwrites save)</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('sp-continue').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (this.saveSystem.loadGame()) {
        this._enterGameWorld();
      } else {
        this._newGame(element, name);
      }
    });
    document.getElementById('sp-new').addEventListener('click', () => {
      document.body.removeChild(overlay);
      this.saveSystem.deleteSave();
      this._newGame(element, name);
    });
  }

  _newGame(element, name) {
    this.entityManager.createPlayer(element, name);
    this.mapManager.loadMap('town', 5, 5);
    this.lastHealerMap = 'healer';
    this.lastHealerX   = 3;
    this.lastHealerY   = 4;
    this.saveSystem.saveGame();
    this._enterGameWorld();
  }

  _enterGameWorld() {
    Utils.showScreen('screen-game');
    this.state = 'game';
    this.entityManager.updateHUDElements();
    this.updateHUD();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._loopBound);
  }

  // ── Game Loop ────────────────────────────────────────────

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min(timestamp - this.lastTime, 64); // Cap at ~15fps min
    this.lastTime = timestamp;

    if (this.state === 'game') {
      const action = this.inputHandler.consumeAction();

      if (action === 'menu') {
        this._openMenu();
      } else if (action === 'confirm' && this.dialogueSystem.active) {
        this.dialogueSystem.advance();
      } else if (action === 'confirm' && !this.dialogueSystem.active) {
        this._tryInteract();
      } else if (!this.dialogueSystem.active) {
        this.mapManager.update(dt, action);
      }

      this.mapManager.render();
    }

    this.inputHandler.flush();
    requestAnimationFrame(this._loopBound);
  }

  // ── World Interactions ───────────────────────────────────

  _tryInteract() {
    const npc = this.mapManager.getInteractableNPC();
    if (npc) {
      this.state = 'dialogue';
      this.dialogueSystem.interact(npc).then(() => {
        this.state = 'game';
      });
    }
  }

  /** Called by MapManager when a warp tile is stepped on */
  warpTo(warp) {
    const overlay = document.getElementById('transition-overlay');
    overlay.classList.remove('hidden');

    // Fade out
    let alpha = 0;
    const fadeOut = setInterval(() => {
      alpha = Math.min(1, alpha + 0.12);
      overlay.style.opacity = alpha;
      if (alpha >= 1) {
        clearInterval(fadeOut);
        // Perform warp
        if (warp.isHealer) {
          this.lastHealerMap = warp.toMap;
          this.lastHealerX   = warp.toX;
          this.lastHealerY   = warp.toY;
        }
        this.mapManager.loadMap(warp.toMap, warp.toX, warp.toY);
        this.saveSystem.saveGame();

        // Fade in
        let a2 = 1;
        const fadeIn = setInterval(() => {
          a2 = Math.max(0, a2 - 0.12);
          overlay.style.opacity = a2;
          if (a2 <= 0) {
            clearInterval(fadeIn);
            overlay.classList.add('hidden');
          }
        }, 20);
      }
    }, 20);
  }

  /** Triggered by healer tile or healer NPC */
  triggerHealer() {
    const em = this.entityManager;
    em.healPlayer();
    this.lastHealerMap = this.mapManager.currentMap.id;
    this.lastHealerX   = this.mapManager.playerX;
    this.lastHealerY   = this.mapManager.playerY;
    this.dialogueSystem.showDialogue(
      ['The healing spring restored your health!', 'HP fully recovered.'],
      'Healing Spring', 'water'
    ).then(() => { this.state = 'game'; });
    this.state = 'dialogue';
  }

  /** Entry point for battles (from MapManager or DialogueSystem) */
  startBattle(enemy, npc) {
    this.state = 'battle';
    this.running = false; // Pause world loop during battle
    this.battleSystem.startBattle(enemy, npc);
  }

  /** Called by BattleSystem after returning from battle */
  returnFromBattle() {
    this.state   = 'game';
    this.running = true;
    this.lastTime = performance.now();
    Utils.showScreen('screen-game');
    this.updateHUD();
    requestAnimationFrame(this._loopBound);
  }

  /** Blackout: fade to black, warp to last healer, full heal */
  triggerBlackout() {
    const overlay = document.getElementById('blackout-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    setTimeout(() => {
      this.entityManager.healPlayer();
      this.mapManager.loadMap(this.lastHealerMap, this.lastHealerX, this.lastHealerY);
      this.saveSystem.saveGame();

      setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
        this.returnFromBattle();
      }, 1500);
    }, 1200);
  }

  // ── HUD ─────────────────────────────────────────────────

  updateHUD() {
    this.entityManager.updateHUDElements();
  }

  // ── Menu ─────────────────────────────────────────────────

  _openMenu() {
    this.state = 'menu';
    const p = this.entityManager.player;
    document.getElementById('menu-player-name').textContent = p.name;
    document.getElementById('menu-element').textContent     = Utils.cap(p.element);
    document.getElementById('menu-level').textContent       = p.level;
    document.getElementById('menu-hp').textContent          = `${p.hp}/${p.maxHp}`;
    document.getElementById('menu-xp').textContent          = `${p.xp}/${p.xpNext}`;
    document.getElementById('menu-location').textContent    = this.mapManager.currentMap?.name || '';

    const moveList = document.getElementById('menu-moves');
    moveList.innerHTML = '';
    p.moves.forEach(m => {
      const li = document.createElement('li');
      li.textContent = `${m.name} [${m.type.toUpperCase()} PWR:${m.power}]`;
      moveList.appendChild(li);
    });

    Utils.showScreen('screen-menu');
  }

  _bindMenuUI() {
    document.getElementById('btn-menu').addEventListener('click', () => {
      if (this.state === 'game') this._openMenu();
    });
    document.getElementById('btn-close-menu').addEventListener('click', () => {
      Utils.showScreen('screen-game');
      this.state = 'game';
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      const ok = this.saveSystem.saveGame();
      document.getElementById('save-status').textContent = ok ? '✓ Game saved!' : '✗ Save failed!';
    });
    document.getElementById('btn-load').addEventListener('click', () => {
      if (!this.saveSystem.hasSave()) {
        document.getElementById('save-status').textContent = 'No save data found.';
        return;
      }
      if (confirm('Load saved game? Unsaved progress will be lost.')) {
        const ok = this.saveSystem.loadGame();
        if (ok) {
          Utils.showScreen('screen-game');
          this.state = 'game';
          this.updateHUD();
          document.getElementById('save-status').textContent = '';
        } else {
          document.getElementById('save-status').textContent = '✗ Load failed!';
        }
      }
    });

    // Escape closes menu
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.state === 'menu') {
        Utils.showScreen('screen-game');
        this.state = 'game';
      }
    });
  }
}
