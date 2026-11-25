// Every tuning number and colour for Rush Hour Kitchen in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds in one working day, from doors-open to the final score. */
export const DAY_SECONDS = 150;

/** Stars the kitchen starts with; an order that walks out costs one. Three lost, day over. */
export const START_STARS = 3;

/** The plate holds at most this many ingredients; every recipe fits. */
export const PLATE_MAX = 5;

/** Order patience in seconds, and how much faster it drains as the day wears on. */
export const PATIENCE = { start: 48, floor: 26, drainRamp: 0.35 };

/** Seconds between new orders, shrinking from early to late day. */
export const SPAWN = { first: 1.2, start: 7.5, end: 3.6, maxOpen: 3 };

/**
 * The ingredient counter, left to right. `key` is the keyboard shortcut shown on the bin.
 * Colours are the drawing colours for the bin and for the layer on the plate.
 */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', bin: '#e8b04b', layer: '#f0be5a' },
  { id: 'patty', name: 'Patty', key: '2', bin: '#8a4b2a', layer: '#7c3f21' },
  { id: 'cheese', name: 'Cheese', key: '3', bin: '#f6c945', layer: '#ffd94d' },
  { id: 'lettuce', name: 'Lettuce', key: '4', bin: '#58b368', layer: '#6fce7e' },
  { id: 'tomato', name: 'Tomato', key: '5', bin: '#e5534b', layer: '#f0564d' },
  { id: 'potato', name: 'Potato', key: '6', bin: '#c98d4b', layer: '#d99a52' },
];

/**
 * The menu. `items` is the plate stack a dish needs, bottom first; `price` is the base pay
 * before the patience bonus. Harder dishes unlock as the day goes on (`from`, seconds in).
 */
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce'], price: 9, from: 0 },
  { id: 'cheese', name: 'Cheeseburger', items: ['bun', 'patty', 'cheese'], price: 10, from: 0 },
  { id: 'salad', name: 'Garden Salad', items: ['lettuce', 'tomato', 'cheese'], price: 10, from: 20 },
  { id: 'wedges', name: 'Cheesy Wedges', items: ['potato', 'cheese'], price: 8, from: 35 },
  { id: 'stack', name: 'Full Stack', items: ['bun', 'patty', 'cheese', 'tomato'], price: 14, from: 60 },
];

export const PALETTE = {
  backdrop: '#191008',
  wall: '#2e1d0e',
  board: '#3a2413',
  boardEdge: '#c98d4b',
  card: '#fdf6e3',
  cardText: '#33241a',
  counter: '#6b4423',
  counterTop: '#8a5a2e',
  plate: '#e8e4da',
  plateRim: '#b9b2a2',
  bin: '#4a2f18',
  text: '#fdf6e3',
  muted: '#c9a06a',
  gold: '#f2c94c',
  good: '#58b368',
  bad: '#e5534b',
  bar: '#f6c945',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'rush-hour-kitchen.best';
