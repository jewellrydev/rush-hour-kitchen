// The rules of Rush Hour Kitchen: orders arrive on the board, each wanting one dish from the
// menu. The cook stacks ingredients on the plate (counter order does not matter, the set
// does), rings the bell to serve, and is paid the dish price plus a patience bonus. An order
// whose patience runs out walks away and costs a star; lose every star, or run out the day
// clock, and the day ends. No drawing and no DOM here: the same world is what the screenshot
// scenes stage, so a staged frame is the real game.

import { DAY_SECONDS, INGREDIENTS, PATIENCE, PLATE_MAX, RECIPES, SPAWN, START_STARS } from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;

/** Two stacks are the same dish when they hold the same ingredients, in any order. */
function sameDish(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export function createWorld(random) {
  const state = {
    elapsed: 0,
    timeLeft: DAY_SECONDS,
    orders: [],
    plate: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    stars: START_STARS,
    over: false,
    spawnIn: SPAWN.first,
    message: '',
    messageFor: 0,
    lastPay: 0,
  };

  function patienceFor(elapsed) {
    const dayProgress = Math.min(1, elapsed / DAY_SECONDS);
    return PATIENCE.start - (PATIENCE.start - PATIENCE.floor) * dayProgress;
  }

  function spawnInterval(elapsed) {
    const dayProgress = Math.min(1, elapsed / DAY_SECONDS);
    return SPAWN.start - (SPAWN.start - SPAWN.end) * dayProgress;
  }

  /** Add an order for `recipe` (or a random unlocked one) if the board has room. */
  function spawnOrder(recipe) {
    if (state.orders.length >= SPAWN.maxOpen || state.over) return null;
    const unlocked = RECIPES.filter((r) => r.from <= state.elapsed);
    const chosen = recipe ?? unlocked[Math.floor(random() * unlocked.length)];
    const patience = patienceFor(state.elapsed);
    const order = { recipe: chosen, patience, patienceMax: patience };
    state.orders.push(order);
    return order;
  }

  function setMessage(text, seconds = 2.2) {
    state.message = text;
    state.messageFor = seconds;
  }

  const world = {
    state,

    reset() {
      state.elapsed = 0;
      state.timeLeft = DAY_SECONDS;
      state.orders = [];
      state.plate = [];
      state.score = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.served = 0;
      state.lost = 0;
      state.stars = START_STARS;
      state.over = false;
      state.spawnIn = SPAWN.first;
      state.message = '';
      state.messageFor = 0;
      state.lastPay = 0;
    },

    /** Put ingredient `index` (into INGREDIENTS) on the plate. False when the plate is full. */
    addIngredient(index) {
      if (state.over || state.plate.length >= PLATE_MAX) return false;
      state.plate.push(INGREDIENTS[index].id);
      return true;
    },

    clearPlate() {
      state.plate = [];
    },

    /**
     * Serve the plate to the first order it matches. Pays price + patience bonus + combo
     * bonus, clears the plate and returns the amount paid; 0 when nothing matches.
     */
    serve() {
      if (state.over || state.plate.length === 0) return 0;
      const index = state.orders.findIndex((order) => sameDish(order.recipe.items, state.plate));
      if (index === -1) {
        setMessage('No order matches that plate — check the board!');
        return 0;
      }
      const [order] = state.orders.splice(index, 1);
      const freshness = Math.ceil((order.patience / order.patienceMax) * 5);
      const pay = order.recipe.price + freshness + state.combo;
      state.score += pay;
      state.lastPay = pay;
      state.served += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.plate = [];
      setMessage(`${order.recipe.name} served: +$${pay}`);
      return pay;
    },

    spawnOrder,

    /** Advance the day by `dt` seconds. Returns EVENT_* flags for what happened. */
    step(dt) {
      if (state.over) return 0;
      let events = 0;
      state.elapsed += dt;
      state.timeLeft = Math.max(0, DAY_SECONDS - state.elapsed);
      if (state.messageFor > 0) state.messageFor = Math.max(0, state.messageFor - dt);

      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        if (spawnOrder()) state.spawnIn = spawnInterval(state.elapsed);
        else state.spawnIn = 0.8;
      }

      const drain = 1 + PATIENCE.drainRamp * Math.min(1, state.elapsed / DAY_SECONDS);
      for (let i = state.orders.length - 1; i >= 0; i -= 1) {
        const order = state.orders[i];
        order.patience -= dt * drain;
        if (order.patience <= 0) {
          state.orders.splice(i, 1);
          state.lost += 1;
          state.stars -= 1;
          state.combo = 0;
          events |= EVENT_EXPIRED;
          setMessage(`${order.recipe.name} walked out!`);
        }
      }

      if (state.stars <= 0 || state.timeLeft <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      }
      return events;
    },
  };

  return world;
}
