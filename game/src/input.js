// Keyboard and pointer input. One-shot presses are queued as bit flags and taken once by the
// loop, so a press between two frames is never lost and never counted twice. Pointer clicks
// are queued with their position in logical field coordinates; the loop asks the renderer
// where the click landed (an ingredient bin, the serve bell, the bin button).

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_CLEAR = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const INGREDIENT_KEYS = new Map([
  ['Digit1', 0], ['Digit2', 1], ['Digit3', 2], ['Digit4', 3], ['Digit5', 4], ['Digit6', 5],
]);

export function createInput(canvas, toField) {
  let actions = 0;
  const picked = [];
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (INGREDIENT_KEYS.has(event.code)) {
      if (!event.repeat) picked.push(INGREDIENT_KEYS.get(event.code));
    } else if (event.code === 'Enter') {
      if (!event.repeat) actions |= ACTION_SERVE | ACTION_CONFIRM;
    } else if (event.code === 'Space') {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (event.code === 'Backspace') {
      if (!event.repeat) actions |= ACTION_CLEAR;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event.clientX, event.clientY);
    clicks.push(point);
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Ingredient indexes chosen since the last call, in order. */
    takePicked() {
      return picked.splice(0, picked.length);
    },
    /** Click points (logical coordinates) since the last call, in order. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
