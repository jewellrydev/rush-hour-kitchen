// Everything Rush Hour Kitchen draws: the kitchen, the order board, the plate and its stack,
// the ingredient counter, and the title and day-over screens. Pure canvas drawing from the
// world state — the same function paints live play and the staged screenshot scenes.

import { DAY_SECONDS, FIELD, FONT, INGREDIENTS, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** Geometry the input loop hit-tests against, in logical field coordinates. */
export const LAYOUT = {
  headerH: 64,
  boardY: 84,
  cardW: 384,
  cardH: 168,
  cardGap: 24,
  plate: { x: 640, y: 392, rx: 218, ry: 52 },
  serve: { x: 1012, y: 330, w: 196, h: 104 },
  trash: { x: 72, y: 330, w: 196, h: 104 },
  binsY: 500,
  binW: 192,
  binH: 168,
  binGap: 13,
};

LAYOUT.cardX = (i) => (FIELD.width - (LAYOUT.cardW * 3 + LAYOUT.cardGap * 2)) / 2 + i * (LAYOUT.cardW + LAYOUT.cardGap);
LAYOUT.binX = (i) => (FIELD.width - (LAYOUT.binW * INGREDIENTS.length + LAYOUT.binGap * (INGREDIENTS.length - 1))) / 2 + i * (LAYOUT.binW + LAYOUT.binGap);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'center', weight = 600) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** A compact round icon of an ingredient, for order cards and bins. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = '#f0be5a';
    ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.fill();
    ctx.fillRect(-r, 0, r * 2, r * 0.45);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-r * 0.4, -r * 0.45], [r * 0.15, -r * 0.6], [r * 0.45, -r * 0.3]]) {
      ctx.beginPath(); ctx.ellipse(sx, sy, r * 0.12, r * 0.06, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#7c3f21';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#96603a';
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.15, r * 0.4, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.5); ctx.lineTo(r, -r * 0.5); ctx.lineTo(r * 0.6, r * 0.7); ctx.lineTo(0, r * 0.35); ctx.lineTo(-r * 0.6, r * 0.7);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6c945';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#6fce7e';
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const x = -r + (i * r * 2) / 5;
      ctx.arc(x, 0, r * 0.34, Math.PI, 0);
    }
    ctx.fill();
    ctx.fillRect(-r, 0, r * 2, r * 0.4);
    ctx.fillStyle = '#58b368';
    ctx.fillRect(-r, r * 0.25, r * 2, r * 0.15);
  } else if (id === 'tomato') {
    ctx.fillStyle = '#f0564d';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#58b368';
    ctx.fillRect(-r * 0.08, -r * 1.05, r * 0.16, r * 0.3);
  } else if (id === 'potato') {
    ctx.fillStyle = '#d99a52';
    for (const dx of [-r * 0.55, 0, r * 0.55]) {
      ctx.beginPath();
      ctx.moveTo(dx - r * 0.28, r * 0.7); ctx.lineTo(dx, -r * 0.75); ctx.lineTo(dx + r * 0.28, r * 0.7);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#f0be5a';
    ctx.fillRect(-r * 0.85, r * 0.55, r * 1.7, r * 0.15);
  }
  ctx.restore();
}

/** One flat layer of the plate stack, drawn wide; `y` is the layer's centre line. */
function drawPlateLayer(ctx, id, cx, y, halfW) {
  const h = 17;
  ctx.save();
  ctx.translate(cx, y);
  if (id === 'bun') {
    ctx.fillStyle = '#f0be5a';
    roundRect(ctx, -halfW, -h, halfW * 2, h * 2, 9); ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#7c3f21';
    ctx.beginPath(); ctx.ellipse(0, 0, halfW, h * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffd94d';
    ctx.save(); ctx.rotate(-0.02);
    roundRect(ctx, -halfW * 0.96, -h * 0.6, halfW * 1.92, h * 1.2, 4); ctx.fill();
    ctx.restore();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#6fce7e';
    ctx.beginPath();
    const waves = 9;
    for (let i = 0; i <= waves; i += 1) {
      const x = -halfW + (i * halfW * 2) / waves;
      const yy = i % 2 === 0 ? -h * 0.55 : h * 0.1;
      if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    for (let i = waves; i >= 0; i -= 1) {
      const x = -halfW + (i * halfW * 2) / waves;
      ctx.lineTo(x, h * 0.75);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#f0564d';
    ctx.beginPath(); ctx.ellipse(0, 0, halfW * 0.94, h * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath(); ctx.ellipse(0, 0, halfW * 0.6, h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'potato') {
    ctx.fillStyle = '#d99a52';
    for (const dx of [-halfW * 0.55, 0, halfW * 0.55]) {
      ctx.beginPath();
      ctx.moveTo(dx - 20, h); ctx.lineTo(dx, -h * 1.5); ctx.lineTo(dx + 20, h);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

function drawHeader(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, FIELD.width, LAYOUT.headerH);
  ctx.fillStyle = PALETTE.boardEdge;
  ctx.fillRect(0, LAYOUT.headerH - 3, FIELD.width, 3);
  text(ctx, 'RUSH HOUR KITCHEN', 24, LAYOUT.headerH / 2, 26, PALETTE.text, 'left', 800);
  // Day clock: a draining bar with the seconds left.
  const frac = Math.max(0, state.timeLeft / DAY_SECONDS);
  ctx.fillStyle = '#241608';
  roundRect(ctx, 470, 18, 340, 28, 8); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? PALETTE.bar : PALETTE.bad;
  if (frac > 0) { roundRect(ctx, 470, 18, 340 * frac, 28, 8); ctx.fill(); }
  text(ctx, `${Math.ceil(state.timeLeft)}s`, 640, 33, 19, PALETTE.cardText);
  text(ctx, `$${state.score}`, 1010, LAYOUT.headerH / 2, 30, PALETTE.gold, 'right', 800);
  // Stars: gold for kept, dim for lost.
  for (let i = 0; i < 3; i += 1) {
    text(ctx, '★', 1062 + i * 40, LAYOUT.headerH / 2, 32, i < state.stars ? PALETTE.gold : '#5a4632');
  }
  if (state.combo > 1) text(ctx, `combo x${state.combo}`, 1256, LAYOUT.headerH / 2, 19, PALETTE.good, 'right', 700);
}

function drawOrderCard(ctx, order, index) {
  const x = LAYOUT.cardX(index);
  const y = LAYOUT.boardY;
  ctx.fillStyle = PALETTE.card;
  roundRect(ctx, x, y, LAYOUT.cardW, LAYOUT.cardH, 12); ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge; ctx.lineWidth = 3;
  roundRect(ctx, x, y, LAYOUT.cardW, LAYOUT.cardH, 12); ctx.stroke();
  text(ctx, order.recipe.name, x + LAYOUT.cardW / 2, y + 30, 25, PALETTE.cardText, 'center', 800);
  text(ctx, `$${order.recipe.price}`, x + LAYOUT.cardW - 18, y + 30, 22, '#8a5a2e', 'right', 800);
  const items = order.recipe.items;
  const spacing = 74;
  const startX = x + LAYOUT.cardW / 2 - ((items.length - 1) * spacing) / 2;
  items.forEach((id, i) => drawIngredientIcon(ctx, id, startX + i * spacing, y + 92, 27));
  // Patience bar: full and gold when fresh, red as it runs out.
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = '#e3d9c2';
  roundRect(ctx, x + 22, y + LAYOUT.cardH - 30, LAYOUT.cardW - 44, 13, 6); ctx.fill();
  ctx.fillStyle = frac > 0.45 ? PALETTE.good : frac > 0.2 ? PALETTE.bar : PALETTE.bad;
  if (frac > 0) { roundRect(ctx, x + 22, y + LAYOUT.cardH - 30, (LAYOUT.cardW - 44) * frac, 13, 6); ctx.fill(); }
}

function drawPlate(ctx, state) {
  const { x, y, rx, ry } = LAYOUT.plate;
  // Counter surface under the plate.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(0, 452, FIELD.width, 10);
  ctx.fillStyle = PALETTE.plateRim;
  ctx.beginPath(); ctx.ellipse(x, y + 10, rx + 10, ry + 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  // The stack, bottom first, rising from the plate.
  state.plate.forEach((id, i) => {
    drawPlateLayer(ctx, id, x, y - 8 - i * 19, 118 - i * 4);
  });
  if (state.plate.length === 0) {
    text(ctx, 'plate is empty — pick ingredients below', x, y + 2, 19, '#8d8574');
  }
}

function drawButton(ctx, rect, label, sub, fill) {
  ctx.fillStyle = fill;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14); ctx.fill();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 - 14, 27, PALETTE.text, 'center', 800);
  text(ctx, sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 22, 16, PALETTE.text);
}

function drawBins(ctx) {
  INGREDIENTS.forEach((ing, i) => {
    const x = LAYOUT.binX(i);
    const y = LAYOUT.binsY;
    ctx.fillStyle = PALETTE.bin;
    roundRect(ctx, x, y, LAYOUT.binW, LAYOUT.binH, 12); ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge; ctx.lineWidth = 2;
    roundRect(ctx, x, y, LAYOUT.binW, LAYOUT.binH, 12); ctx.stroke();
    drawIngredientIcon(ctx, ing.id, x + LAYOUT.binW / 2, y + 62, 34);
    text(ctx, ing.name, x + LAYOUT.binW / 2, y + 122, 21, PALETTE.text, 'center', 700);
    text(ctx, `press ${ing.key}`, x + LAYOUT.binW / 2, y + 148, 14, PALETTE.muted);
  });
}

function drawKitchen(ctx, state) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // The board behind the order cards.
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 24, LAYOUT.boardY - 14, FIELD.width - 48, LAYOUT.cardH + 28, 14); ctx.fill();
  drawHeader(ctx, state);
  state.orders.forEach((order, i) => drawOrderCard(ctx, order, i));
  if (state.orders.length === 0) {
    text(ctx, 'no orders yet — the lunch rush is coming…', FIELD.width / 2, LAYOUT.boardY + LAYOUT.cardH / 2, 22, PALETTE.muted);
  }
  drawPlate(ctx, state);
  drawButton(ctx, LAYOUT.serve, 'SERVE', 'Enter', PALETTE.good);
  drawButton(ctx, LAYOUT.trash, 'BIN IT', 'Backspace', '#8a4b2a');
  if (state.messageFor > 0 && state.message) {
    text(ctx, state.message, FIELD.width / 2, 300, 24, PALETTE.gold, 'center', 700);
  }
  // Counter front below the bins.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, LAYOUT.binsY - 14, FIELD.width, 14);
  drawBins(ctx);
}

function drawOverlay(ctx, title, lines, foot) {
  ctx.fillStyle = 'rgba(16, 9, 3, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 290, 130, 700, 460, 18); ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge; ctx.lineWidth = 3;
  roundRect(ctx, 290, 130, 700, 460, 18); ctx.stroke();
  text(ctx, title, FIELD.width / 2, 205, 46, PALETTE.gold, 'center', 800);
  lines.forEach((line, i) => text(ctx, line, FIELD.width / 2, 285 + i * 44, 24, PALETTE.text));
  text(ctx, foot, FIELD.width / 2, 545, 20, PALETTE.muted);
}

/** Draw the whole frame for `state` on `screen`; `best` is the stored best score. */
export function draw(ctx, state, screen, best) {
  drawKitchen(ctx, state);
  if (screen === SCREEN_TITLE) {
    drawOverlay(ctx, 'RUSH HOUR KITCHEN', [
      'Orders land on the board. Build each dish on the plate',
      'from the counter — click a bin or press 1–6 — then',
      'ring SERVE (Enter) before the patience bar runs out.',
      'Happy customers pay a bonus. Walk-outs cost a star.',
    ], 'Click or press Enter to open the kitchen');
  } else if (screen === SCREEN_OVER) {
    drawOverlay(ctx, 'END OF THE DAY', [
      `You earned $${state.score} and served ${state.served} dishes.`,
      `Best combo: x${Math.max(1, state.bestCombo)} · walk-outs: ${state.lost}`,
      best > 0 ? `Best day so far: $${best}` : 'Every great kitchen starts with one service.',
      'Same time tomorrow?',
    ], 'Click or press Enter to play again');
  }
}
