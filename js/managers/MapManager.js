/**
 * MapManager.js
 * Handles map loading, tile rendering, camera tracking,
 * collision detection, NPC drawing, and warp transitions.
 */
class MapManager {
  static TILE = 32;  // Tile size in pixels

  // Tile type constants
  static T = {
    FLOOR:    0,
    WALL:     1,
    GRASS:    2,
    WATER:    3,
    PATH:     4,
    BUILDING: 5,
    HEALER:   6,
  };

  constructor(game) {
    this.game      = game;
    this.canvas    = document.getElementById('game-canvas');
    this.ctx       = this.canvas.getContext('2d');
    this.currentMap = null;

    // Player world position (tile coords)
    this.playerX = 5;
    this.playerY = 5;

    // Camera offset (pixel) — top-left of visible area
    this.camX = 0;
    this.camY = 0;

    // Visible tiles (canvas is 480×384 @ 32px tiles = 15×12)
    this.visW = Math.ceil(this.canvas.width  / MapManager.TILE);
    this.visH = Math.ceil(this.canvas.height / MapManager.TILE);

    // Player animation
    this.playerAnim = { frame: 0, timer: 0, moving: false, dir: 'down' };

    // Movement state
    this.isMoving  = false;
    this.moveQueue = null;   // { dx, dy } next step

    // Pixel-smooth movement
    this.pixelX = 0;  // Player pixel offset during walk animation
    this.pixelY = 0;
    this.moveProgress = 0; // 0..1

    // Step counter for encounter check
    this.stepCount = 0;

    // NPC animation timers
    this.npcTimers = {};
  }

  /** Load a map by id and place player */
  loadMap(mapId, startX, startY) {
    this.currentMap = MAPS_DB[mapId];
    if (!this.currentMap) { console.error('Unknown map:', mapId); return; }

    this.playerX = startX ?? 5;
    this.playerY = startY ?? 5;
    this.pixelX  = 0;
    this.pixelY  = 0;
    this.isMoving = false;

    document.getElementById('hud-map').textContent = this.currentMap.name;
    this.game.saveSystem.saveGame();
    this._updateCamera();
  }

  /** Returns true if tile is walkable */
  isWalkable(tx, ty) {
    const map = this.currentMap;
    if (!map) return false;
    const row = map.tilemap[ty];
    if (!row) return false;
    const tile = row[tx];
    if (tile === MapManager.T.WALL || tile === MapManager.T.WATER) return false;
    // Check NPC occupancy (non-defeated trainers block)
    if (map.npcs?.some(n => n.x === tx && n.y === ty)) return false;
    return true;
  }

  getTile(tx, ty) {
    const row = this.currentMap?.tilemap[ty];
    return row ? row[tx] : -1;
  }

  /** Called each game-loop tick; processes movement input */
  update(dt, inputAction) {
    const T = MapManager.TILE;

    if (this.isMoving) {
      // Smooth pixel interpolation
      this.moveProgress += dt / 150; // 150ms per step
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.isMoving     = false;
        this.pixelX       = 0;
        this.pixelY       = 0;
        this.playerAnim.moving = false;
        this._updateCamera();
        this._onStepLanded();
      } else {
        this.pixelX = this.moveDir.dx * T * this.moveProgress;
        this.pixelY = this.moveDir.dy * T * this.moveProgress;
      }
      return;
    }

    // Direction input → attempt move
    const dirMap = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
    let dir = null;
    if (inputAction === 'up')    dir = 'up';
    if (inputAction === 'down')  dir = 'down';
    if (inputAction === 'left')  dir = 'left';
    if (inputAction === 'right') dir = 'right';

    if (dir) {
      const [dx, dy] = dirMap[dir];
      this.playerAnim.dir = dir;
      const nx = this.playerX + dx;
      const ny = this.playerY + dy;

      // Check warp first
      const warp = this._checkWarp(nx, ny);
      if (warp) {
        this.game.warpTo(warp);
        return;
      }

      if (this.isWalkable(nx, ny)) {
        this.playerX      = nx;
        this.playerY      = ny;
        this.isMoving     = true;
        this.moveProgress = 0;
        this.moveDir      = { dx, dy };
        this.pixelX       = dx * T * 0;
        this.pixelY       = dy * T * 0;
        this.playerAnim.moving = true;
        this.playerAnim.frame  = (this.playerAnim.frame + 1) % 4;
        this.stepCount++;
      }
    }
  }

  _updateCamera() {
    const T  = MapManager.TILE;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.camX = Utils.clamp(this.playerX * T - cw / 2 + T / 2, 0,
      Math.max(0, this.currentMap.tilemap[0].length * T - cw));
    this.camY = Utils.clamp(this.playerY * T - ch / 2 + T / 2, 0,
      Math.max(0, this.currentMap.tilemap.length * T - ch));
  }

  _checkWarp(nx, ny) {
    return this.currentMap.warps?.find(w => w.x === nx && w.y === ny) || null;
  }

  _onStepLanded() {
    const tile = this.getTile(this.playerX, this.playerY);

    // Healing center tile
    if (tile === MapManager.T.HEALER) {
      this.game.triggerHealer();
      return;
    }

    // NPC interaction check (adjacent)
    this._checkNPCProximity();

    // Tall grass encounter
    if (tile === MapManager.T.GRASS) {
      const rate = this.currentMap.grassEncounterRate || 0;
      if (Math.random() < rate && this.currentMap.encounters?.length) {
        const enemy = pickWildEncounter(this.currentMap.encounters, this.game.entityManager.player.level);
        this.game.startBattle(enemy, null);
      }
    }
  }

  _checkNPCProximity() {
    // Auto-engage defeated-facing trainers (placeholder — interaction via 'confirm')
  }

  /** Check if player is adjacent to an NPC and facing it */
  getInteractableNPC() {
    const dirOff = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
    const [dx, dy] = dirOff[this.playerAnim.dir] || [0,1];
    const tx = this.playerX + dx;
    const ty = this.playerY + dy;
    return this.currentMap.npcs?.find(n => n.x === tx && n.y === ty) || null;
  }

  // ── RENDERING ────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    const T   = MapManager.TILE;
    const map = this.currentMap;
    if (!map) return;

    ctx.save();
    ctx.translate(-Math.floor(this.camX), -Math.floor(this.camY));

    const rows = map.tilemap.length;
    const cols = map.tilemap[0].length;

    // Draw tiles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = map.tilemap[row][col];
        const px   = col * T;
        const py   = row * T;
        this._drawTile(ctx, tile, px, py, T, map);
      }
    }

    // Draw NPCs
    if (map.npcs) {
      for (const npc of map.npcs) {
        this._drawNPC(ctx, npc, T);
      }
    }

    // Draw player
    const playerPxX = this.playerX * T + this.pixelX;
    const playerPxY = this.playerY * T + this.pixelY;
    this._drawPlayer(ctx, playerPxX, playerPxY, T);

    ctx.restore();
  }

  _drawTile(ctx, tile, px, py, T, map) {
    const T2 = T;
    switch (tile) {
      case MapManager.T.FLOOR:
        ctx.fillStyle = map.bgColor || '#3a5a2a';
        ctx.fillRect(px, py, T2, T2);
        // Grid dot
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(px, py, 1, 1);
        break;

      case MapManager.T.WALL:
        // Stone wall
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(px, py, T2, T2);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(px+2, py+2, T2-4, T2-4);
        ctx.fillStyle = '#6a5a4a';
        ctx.fillRect(px, py, T2, 3);
        ctx.fillRect(px, py, 3, T2);
        break;

      case MapManager.T.GRASS:
        // Tall grass — two-tone green with tufts
        ctx.fillStyle = '#2a5a1a';
        ctx.fillRect(px, py, T2, T2);
        ctx.fillStyle = '#3a7a2a';
        for (let i = 0; i < 4; i++) {
          const gx = px + (i % 2) * 14 + 4;
          const gy = py + Math.floor(i / 2) * 12 + 6;
          ctx.fillRect(gx, gy, 4, 8);
          ctx.fillRect(gx+2, gy-3, 2, 5);
        }
        break;

      case MapManager.T.WATER:
        ctx.fillStyle = '#1a5a8a';
        ctx.fillRect(px, py, T2, T2);
        ctx.fillStyle = '#2a7aaa';
        ctx.fillRect(px+2, py+T2/3, T2-4, 4);
        ctx.fillRect(px+4, py+T2*2/3, T2-8, 3);
        break;

      case MapManager.T.PATH:
        ctx.fillStyle = map.pathColor || '#c8a878';
        ctx.fillRect(px, py, T2, T2);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(px, py, T2, 1);
        ctx.fillRect(px, py, 1, T2);
        break;

      case MapManager.T.BUILDING:
      case MapManager.T.HEALER:
        // Building entrance / door
        ctx.fillStyle = tile === MapManager.T.HEALER ? '#3a1a6a' : '#6a3a1a';
        ctx.fillRect(px, py, T2, T2);
        // Door frame
        ctx.fillStyle = tile === MapManager.T.HEALER ? '#c8a0ff' : '#c8a84b';
        ctx.fillRect(px+4, py+4, T2-8, T2-4);
        ctx.fillStyle = tile === MapManager.T.HEALER ? '#8a50cc' : '#8a5020';
        ctx.fillRect(px+8, py+8, T2-16, T2-10);
        // Door label
        ctx.fillStyle = '#fff';
        ctx.font = '5px monospace';
        ctx.fillText(tile === MapManager.T.HEALER ? '✚' : '▶', px+11, py+18);
        break;

      default:
        ctx.fillStyle = '#222';
        ctx.fillRect(px, py, T2, T2);
    }
  }

  _drawPlayer(ctx, px, py, T) {
    const p       = this.game.entityManager.player;
    const color   = Utils.elementColor(p.element);
    const frame   = this.playerAnim.frame;
    const dir     = this.playerAnim.dir;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + T/2, py + T - 4, 8, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(px + 8, py + 10, 16, 16);

    // Head
    ctx.fillStyle = '#f5d0b0';
    ctx.fillRect(px + 10, py + 2, 12, 12);

    // Eyes based on direction
    ctx.fillStyle = '#1a1a1a';
    if (dir === 'down' || dir === 'up') {
      if (dir === 'down') {
        ctx.fillRect(px + 12, py + 6, 2, 2);
        ctx.fillRect(px + 18, py + 6, 2, 2);
      }
    } else {
      const eyeX = dir === 'right' ? px + 19 : px + 11;
      ctx.fillRect(eyeX, py + 6, 2, 2);
    }

    // Walk bob
    const bob = this.playerAnim.moving ? (frame % 2 === 0 ? -1 : 1) : 0;

    // Legs (walking animation)
    ctx.fillStyle = '#3a3a5a';
    if (this.playerAnim.moving) {
      const legOffset = frame % 2 === 0 ? 2 : -2;
      ctx.fillRect(px + 9,  py + 24 + legOffset, 5, 6);
      ctx.fillRect(px + 18, py + 24 - legOffset, 5, 6);
    } else {
      ctx.fillRect(px + 9,  py + 24, 5, 6);
      ctx.fillRect(px + 18, py + 24, 5, 6);
    }

    // Element aura glow
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(Date.now() / 400);
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.ellipse(px + T/2, py + T/2 + bob, 14, 16, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _drawNPC(ctx, npc, T) {
    const px = npc.x * T;
    const py = npc.y * T;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + T/2, py + T - 4, 7, 3, 0, 0, Math.PI*2);
    ctx.fill();

    // Body color by type
    const bodyColors = {
      healer:   '#8a50cc',
      trainer:  npc.element ? Utils.elementColor(npc.element) : '#cc8a50',
      merchant: '#50cc8a',
      elder:    '#888888',
      sage:     '#cc5050',
    };
    const color = bodyColors[npc.type] || '#aaaaaa';

    ctx.fillStyle = color;
    ctx.fillRect(px + 9, py + 11, 14, 14);

    // Head
    ctx.fillStyle = '#f5d0b0';
    ctx.fillRect(px + 11, py + 3, 10, 10);

    // Eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(px + 13, py + 6, 2, 2);
    ctx.fillRect(px + 17, py + 6, 2, 2);

    // Legs
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(px + 10, py + 23, 4, 5);
    ctx.fillRect(px + 18, py + 23, 4, 5);

    // Name tag (tiny)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(px + 1, py - 10, T - 2, 9);
    ctx.fillStyle = '#fff';
    ctx.font = '5px monospace';
    const label = npc.name.slice(0, 10);
    ctx.fillText(label, px + 2, py - 3);

    // Defeated trainer — grey out
    if (npc.type === 'trainer' && npc.defeated) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(px + 5, py, T - 10, T - 2);
    }
  }
}
