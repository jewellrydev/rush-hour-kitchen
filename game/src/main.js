// Rush Hour Kitchen: boot, the fixed-step loop, and the wiring between input, world and
// renderer. With ?shot=start|play|end the page stages that screenshot scene instead of
// playing, and draws it once (and again on resize).

import { FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { ACTION_CLEAR, ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, createInput } from './input.js';
import { EVENT_OVER, createWorld } from './world.js';
import { LAYOUT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, draw } from './render.js';
import { stageShot } from './shots.js';
import { BEST_KEY } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '1') || 1;
const world = createWorld(createRandom(seed * 7919 + 13));

let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY) ?? '0') || 0; } catch { best = 0; }

let screen = SCREEN_TITLE;
let paused = false;

/** Convert a client point to logical field coordinates, accounting for the letterbox. */
function toField(clientX, clientY) {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const ox = (window.innerWidth - FIELD.width * scale) / 2;
  const oy = (window.innerHeight - FIELD.height * scale) / 2;
  return { x: (clientX - ox) / scale, y: (clientY - oy) / scale };
}

const input = createInput(canvas, toField);

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}
window.addEventListener('resize', () => { resize(); if (shotMode) drawShot(); });
resize();

function fitTransform() {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const ox = (canvas.width - FIELD.width * scale) / 2;
  const oy = (canvas.height - FIELD.height * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
}

function announce() {
  const s = world.state;
  status.textContent = s.over
    ? `Day over. You earned ${s.score} dollars and served ${s.served} dishes.`
    : `${s.orders.length} orders on the board, ${s.plate.length} ingredients on the plate, ${Math.ceil(s.timeLeft)} seconds left, score ${s.score}.`;
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function binAt(point) {
  if (point.y < LAYOUT.binsY || point.y > LAYOUT.binsY + LAYOUT.binH) return -1;
  for (let i = 0; i < 6; i += 1) {
    const x = LAYOUT.binX(i);
    if (point.x >= x && point.x <= x + LAYOUT.binW) return i;
  }
  return -1;
}

function startDay() {
  world.reset();
  screen = SCREEN_PLAY;
  paused = false;
}

function handleClick(point) {
  if (screen !== SCREEN_PLAY) { startDay(); return; }
  const bin = binAt(point);
  if (bin >= 0) { world.addIngredient(bin); return; }
  if (inside(point, LAYOUT.serve)) { world.serve(); return; }
  if (inside(point, LAYOUT.trash)) { world.clearPlate(); }
}

const shotMode = params.has('shot');
function drawShot() {
  const staged = stageShot(params.get('shot') ?? 'start', world);
  fitTransform();
  ctx.fillStyle = '#191008';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  draw(ctx, world.state, staged.screen, staged.best);
  announce();
}

if (shotMode) {
  drawShot();
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;

    const actions = input.takeActions();
    for (const point of input.takeClicks()) handleClick(point);
    if (actions & ACTION_PAUSE) paused = !paused;
    if (screen !== SCREEN_PLAY && (actions & ACTION_CONFIRM)) startDay();
    if (screen === SCREEN_PLAY && !paused) {
      for (const index of input.takePicked()) world.addIngredient(index);
      if (actions & ACTION_SERVE) world.serve();
      if (actions & ACTION_CLEAR) world.clearPlate();
      while (acc >= STEP) {
        acc -= STEP;
        if (world.step(STEP) & EVENT_OVER) {
          screen = SCREEN_OVER;
          if (world.state.score > best) {
            best = world.state.score;
            try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ }
          }
        }
      }
    } else {
      input.takePicked();
      acc = 0;
    }

    fitTransform();
    ctx.fillStyle = '#191008';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw(ctx, world.state, screen, best);
    if (paused && screen === SCREEN_PLAY) {
      ctx.fillStyle = 'rgba(16, 9, 3, 0.6)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#fdf6e3';
      ctx.font = '700 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED — press P to keep cooking', FIELD.width / 2, FIELD.height / 2);
    }
    announce();
  }
  requestAnimationFrame(frame);
}
