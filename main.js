/**
 * main.js — Entry point
 * Instantiates the GameEngine and kicks off the title screen.
 */

// Instantiate and boot the engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameEngine();
  game.init();

  // Expose for debugging in browser console
  window._game = game;

  // Animate element preview canvases continuously (title screen sparkle)
  let previewFrame = 0;
  function animatePreviews() {
    previewFrame++;
    ['water','earth','fire','air'].forEach((el, i) => {
      const canvas = document.getElementById(`prev-${el}`);
      if (!canvas || canvas.closest('.screen')?.classList.contains('hidden')) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const color = Utils.elementColor(el);
      const t = previewFrame / 30;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = Utils.elementBg(el);
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = 0.85 + 0.1 * Math.sin(t + i);
      ctx.fillStyle = color;

      const cx = W / 2, cy = H / 2;

      switch (el) {
        case 'water': {
          // Pulsing water droplet
          const r = 16 + 3 * Math.sin(t * 1.5);
          ctx.beginPath();
          ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
          ctx.fill();
          // Ripple ring
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy + 4, r + 8 + 4 * Math.sin(t), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'earth': {
          // Rotating square (rock)
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t * 0.3);
          ctx.fillRect(-18, -14, 36, 28);
          ctx.fillStyle = Utils.elementColor('earth') + '88';
          ctx.fillRect(-10, -22, 20, 14);
          ctx.restore();
          break;
        }
        case 'fire': {
          // Flickering flame
          const h = 28 + 6 * Math.sin(t * 3.7);
          const w = 14 + 4 * Math.sin(t * 2.1);
          ctx.beginPath();
          ctx.moveTo(cx, cy - h);
          ctx.bezierCurveTo(cx + w, cy - h/2, cx + w - 4, cy + 10, cx, cy + 14);
          ctx.bezierCurveTo(cx - w + 4, cy + 10, cx - w, cy - h/2, cx, cy - h);
          ctx.fill();
          // Inner glow
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#ffee88';
          ctx.beginPath();
          ctx.ellipse(cx, cy, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'air': {
          // Orbiting particles
          ctx.globalAlpha = 0.7;
          for (let p = 0; p < 4; p++) {
            const angle  = t * 2 + (p * Math.PI / 2);
            const radius = 18 + 5 * Math.sin(t + p);
            const px     = cx + Math.cos(angle) * radius;
            const py     = cy + Math.sin(angle) * radius * 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 4 + 2 * Math.sin(t * 2 + p), 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }

      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(animatePreviews);
  }
  animatePreviews();

  console.log('%cAvatar RPG loaded. window._game for debug.', 'color:#ffd700;font-family:monospace;font-size:14px');
  console.log('%cControls: Arrow Keys / WASD = Move | Z / Enter / Space = Confirm | X / Esc = Cancel | M = Menu',
    'color:#4fc3f7;font-family:monospace;font-size:11px');
});
