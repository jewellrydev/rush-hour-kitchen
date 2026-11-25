// The screenshot scenes behind ?shot=start|play|end. Each one is built with the world's own
// rules — real orders spawned, real ingredients stacked, real time stepped — and then drawn
// by the real renderer, so the frame is what the game itself shows and the same seed always
// gives the same frame.

import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and return
 * the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    // Mid-service: three orders up, the cheeseburger half-built on the plate, money banked.
    world.spawnOrder(recipe('cheese'));
    world.spawnOrder(recipe('classic'));
    world.spawnOrder(recipe('salad'));
    state.elapsed = 42;
    state.timeLeft = 108;
    for (const order of state.orders) order.patience = order.patienceMax * 0.62;
    state.orders[2].patience = state.orders[2].patienceMax * 0.3;
    world.addIngredient(0); // bun
    world.addIngredient(1); // patty
    state.score = 34;
    state.combo = 2;
    state.served = 3;
    state.message = 'Garden Salad is getting impatient…';
    state.messageFor = 99;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    // The day is done: a full board never happened, but the till tells the story.
    state.elapsed = 150;
    state.timeLeft = 0;
    state.score = 96;
    state.served = 9;
    state.lost = 2;
    state.stars = 1;
    state.combo = 0;
    state.bestCombo = 4;
    state.over = true;
    return { screen: SCREEN_OVER, best: 96 };
  }
  // start: the kitchen at opening time, first order just in, plate clean.
  world.spawnOrder(recipe('classic'));
  return { screen: SCREEN_TITLE, best: 0 };
}
