/**
 * helpers.js — Shared utility functions
 */

const Utils = {

  /** Clamp a value between min and max */
  clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },

  /** Linear interpolation */
  lerp(a, b, t) { return a + (b - a) * t; },

  /** Random integer between min and max (inclusive) */
  randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); },

  /** Random float 0..1 */
  rand() { return Math.random(); },

  /** Shuffle array in-place */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /** Deep clone a plain object */
  clone(obj) { return JSON.parse(JSON.stringify(obj)); },

  /** Wait ms milliseconds (returns Promise) */
  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

  /** Capitalize first letter */
  cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : ''; },

  // ── Canvas Helpers ────────────────────────────────────────

  /** Clear a canvas context */
  clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },

  /** Draw a filled rounded rectangle */
  roundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fillStyle)  { ctx.fillStyle = fillStyle; ctx.fill(); }
    if (strokeStyle){ ctx.strokeStyle = strokeStyle; ctx.lineWidth = 2; ctx.stroke(); }
  },

  /** Draw pixel-art style text on canvas */
  pixelText(ctx, text, x, y, color = '#fff', size = 8) {
    ctx.fillStyle = color;
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.fillText(text, x, y);
  },

  /** HP bar color based on percentage */
  hpColor(pct) {
    if (pct > 0.5) return '#48d597';
    if (pct > 0.25) return '#e8c847';
    return '#e84848';
  },

  /** Element accent color */
  elementColor(element) {
    return { water: '#4fc3f7', earth: '#8bc34a', fire: '#ff7043', air: '#e0e0e0', normal: '#aaaaaa' }[element] || '#aaaaaa';
  },

  /** Element background color (darker) */
  elementBg(element) {
    return { water: '#0d3b5a', earth: '#1a2e0d', fire: '#3a0d00', air: '#2a2a2a', normal: '#1a1a1a' }[element] || '#1a1a1a';
  },

  // ── DOM Helpers ───────────────────────────────────────────

  /** Show a DOM element (remove hidden class) */
  show(el) { if (el) el.classList.remove('hidden'); },

  /** Hide a DOM element */
  hide(el) { if (el) el.classList.add('hidden'); },

  /** Toggle hidden class */
  toggle(el, visible) { el?.classList.toggle('hidden', !visible); },

  /** Set screen active */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
  },

  /** Flash an element with a CSS class then remove it */
  flashClass(el, cls, ms = 400) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  },

  // ── XP / Level ───────────────────────────────────────────

  /** XP needed to reach next level (simple quadratic curve) */
  xpForLevel(level) {
    return Math.floor(50 * Math.pow(level, 1.6));
  },

  /** Compute stat growth on level up */
  statOnLevel(base, level) {
    return Math.floor(base * (1 + level * 0.08));
  },
};
