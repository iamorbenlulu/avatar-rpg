/**
 * InputHandler.js
 * Manages keyboard input, buffers directional presses,
 * and exposes a clean API for the game loop.
 */
class InputHandler {
  constructor() {
    this.keys = {};           // Currently held keys
    this.justPressed = {};    // Keys pressed this frame
    this._queue = [];         // Buffered action queue

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  _onKeyDown(e) {
    if (this.keys[e.code]) return; // Prevent repeat
    this.keys[e.code] = true;
    this.justPressed[e.code] = true;

    // Map key to game action and buffer it
    const action = this._codeToAction(e.code);
    if (action) {
      this._queue.push(action);
      // Prevent page scroll on arrow keys / space
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _codeToAction(code) {
    const map = {
      ArrowUp:    'up',
      ArrowDown:  'down',
      ArrowLeft:  'left',
      ArrowRight: 'right',
      KeyW:       'up',
      KeyS:       'down',
      KeyA:       'left',
      KeyD:       'right',
      Space:      'confirm',
      Enter:      'confirm',
      KeyZ:       'confirm',
      Escape:     'cancel',
      KeyX:       'cancel',
      KeyM:       'menu',
    };
    return map[code] || null;
  }

  /** Call at end of each frame to clear per-frame state */
  flush() {
    this.justPressed = {};
    this._queue = [];
  }

  /** Consume and return the next buffered action (FIFO) */
  consumeAction() {
    return this._queue.shift() || null;
  }

  /** Peek without consuming */
  peekAction() {
    return this._queue[0] || null;
  }

  /** Check if an action is in the queue */
  hasAction(action) {
    return this._queue.includes(action);
  }

  /** Is a specific key currently held? */
  isHeld(code) { return !!this.keys[code]; }

  /** Was a key pressed this frame? */
  wasPressed(code) { return !!this.justPressed[code]; }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }
}
