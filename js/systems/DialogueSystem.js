/**
 * DialogueSystem.js
 * Manages NPC conversations, choice menus, and healer interactions.
 * Queues lines, advances on confirm input, resolves Promises for async flow.
 */
class DialogueSystem {
  constructor(game) {
    this.game    = game;
    this.active  = false;
    this._resolve = null;

    this.box      = document.getElementById('dialogue-box');
    this.textEl   = document.getElementById('dialogue-text');
    this.nextEl   = document.getElementById('dialogue-next');
    this.choicesEl= document.getElementById('dialogue-choices');
    this.portrait = document.getElementById('dialogue-portrait');

    // Typewriter state
    this._typeFull   = '';
    this._typeIdx    = 0;
    this._typeTimer  = null;
    this._typeDone   = false;
  }

  /** Show a sequence of dialogue lines. Returns Promise that resolves when done. */
  async showDialogue(lines, npcName = '', element = null) {
    this.active = true;
    Utils.show(this.box);
    Utils.hide(this.choicesEl);

    // Portrait colour
    this.portrait.style.background = element ? Utils.elementBg(element) : '#0d0d1a';
    this.portrait.style.borderColor = element ? Utils.elementColor(element) : '#c8a84b';

    for (const line of lines) {
      await this._showLine(line);
    }

    Utils.hide(this.box);
    this.active = false;
  }

  _showLine(text) {
    return new Promise(resolve => {
      this._resolve  = resolve;
      this._typeFull = text;
      this._typeIdx  = 0;
      this._typeDone = false;
      this.textEl.textContent = '';
      Utils.show(this.nextEl);
      this.nextEl.classList.remove('blink');

      clearInterval(this._typeTimer);
      this._typeTimer = setInterval(() => {
        if (this._typeIdx < this._typeFull.length) {
          this.textEl.textContent += this._typeFull[this._typeIdx++];
        } else {
          clearInterval(this._typeTimer);
          this._typeDone = true;
          this.nextEl.classList.add('blink');
        }
      }, 28);
    });
  }

  /** Called by GameEngine when 'confirm' is pressed and dialogue is active */
  advance() {
    if (!this.active) return;
    if (!this._typeDone) {
      // Skip typewriter
      clearInterval(this._typeTimer);
      this.textEl.textContent = this._typeFull;
      this._typeDone = true;
      this.nextEl.classList.add('blink');
    } else if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r();
    }
  }

  /** Show a choice menu; returns Promise<index> */
  async showChoice(prompt, options) {
    this.active = true;
    Utils.show(this.box);
    this.textEl.textContent = prompt;
    Utils.show(this.choicesEl);
    this.choicesEl.innerHTML = '';
    Utils.hide(this.nextEl);

    return new Promise(resolve => {
      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className   = 'choice-btn';
        btn.textContent = `▶ ${opt}`;
        btn.onclick = () => {
          Utils.hide(this.box);
          Utils.hide(this.choicesEl);
          this.active = false;
          resolve(i);
        };
        this.choicesEl.appendChild(btn);
      });
    });
  }

  /** Full NPC interaction flow */
  async interact(npc) {
    const em = this.game.entityManager;

    if (npc.type === 'healer') {
      await this.showDialogue(npc.dialogue, npc.name, 'water');
      em.healPlayer();
      this.game.lastHealerMap = this.game.mapManager.currentMap.id;
      this.game.lastHealerX   = npc.x;
      this.game.lastHealerY   = npc.y + 1;
      await this.showDialogue(['Your health has been fully restored!', 'Safe travels, bender.'], npc.name, 'water');
      return;
    }

    if (npc.type === 'trainer' && !npc.defeated) {
      await this.showDialogue(npc.dialogue.before, npc.name, npc.element);
      // Build enemy team
      const enemy = npc.team[0]; // Start with first (future: full team)
      this.game.startBattle(enemy, npc);
      return;
    }

    if (npc.type === 'trainer' && npc.defeated) {
      await this.showDialogue(npc.dialogue.after, npc.name, npc.element);
      return;
    }

    // Generic NPC
    const lines = Array.isArray(npc.dialogue) ? npc.dialogue : [npc.dialogue];
    await this.showDialogue(lines, npc.name, null);
  }
}
