// ============================================================
//  MEDITATIVE NATURE SCROLL
//  Canvas: 800 × 400  |  World: 2400 wide (3× canvas)
//  p5.js only — no external libraries
// ============================================================

// ─── WORLD & CAMERA ─────────────────────────────────────────
const WORLD_W  = 2400;   // total world width (3× canvas)
const CANVAS_W = 800;
const CANVAS_H = 400;
const SPEED    = 0.5;    // camera drift speed in px/frame

let camX = 0;            // world-space left edge of the camera

// ─── TERRAIN PROFILES ───────────────────────────────────────
// Pre-built once in setup() using overlapping sine waves.
// Each is an array of {x, y} world-space points.
let farPts = [];    // distant lavender hills (parallax 0.35)
let midPts = [];    // sage-green mid hills   (parallax 0.62)
let gndPts = [];    // near meadow ground     (parallax 1.0)

// ─── FLOATING PETALS ────────────────────────────────────────
let petals = [];

// ─── HIDDEN SYMBOLS (BONUS) ─────────────────────────────────
// 4 glowing symbols scattered through the world.
// Each pulses when the camera reveals them.
let symbols = [];

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);

  // Build terrain curves — overlapping sine waves give organic hills
  for (let x = 0; x <= WORLD_W; x += 6) {
    farPts.push(createVector(x,
      212 + sin(x * 0.003)        * 52
          + sin(x * 0.007 + 1.2)  * 26
    ));
    midPts.push(createVector(x,
      270 + sin(x * 0.0045 + 2)   * 34
          + sin(x * 0.009  + 4.5) * 15
    ));
    gndPts.push(createVector(x,
      316 + sin(x * 0.006 + 1)    * 9
    ));
  }

  // Create 55 drifting petal particles scattered across the world
  for (let i = 0; i < 55; i++) {
    petals.push({
      wx:   random(WORLD_W),      // world-space x
      y:    random(80, 345),      // screen y
      sz:   random(3, 7.5),       // petal size
      vx:   random(0.18, 0.65),   // rightward drift speed
      ph:   random(TWO_PI),       // phase offset for vertical float
      ang:  random(TWO_PI),       // rotation angle
      aSpd: random(-0.025, 0.025),// rotation speed
      r:    random(230, 255),     // soft pink/peach tones
      g:    random(148, 218),
      b:    random(182, 234),
      a:    random(140, 210)
    });
  }

  // Place 4 hidden glowing symbols at specific world positions
  symbols = [
    { wx: 480,  wy: 192, type: 'star', ph: 0            },
    { wx: 1110, wy: 180, type: 'moon', ph: PI            },
    { wx: 1670, wy: 202, type: 'leaf', ph: HALF_PI       },
    { wx: 2210, wy: 188, type: 'sun',  ph: PI + HALF_PI  }
  ];
}

// ============================================================
//  DRAW — called every frame
// ============================================================
function draw() {
  // Advance camera and loop seamlessly at the right edge
  camX = (camX + SPEED) % (WORLD_W - CANVAS_W);

  // ── Layer 0: Sky gradient — fixed, no parallax ──────────
  drawSky();

  // ── Layer 1: Distant clouds — very slow parallax 0.15 ───
  push();
  translate(-camX * 0.15, 0);
  drawClouds();
  pop();

  // ── Layer 2: Far hills — parallax 0.35 ──────────────────
  push();
  translate(-camX * 0.35, 0);
  drawFarHills();
  pop();

  // ── Layer 3: Mid hills — parallax 0.62 ──────────────────
  push();
  translate(-camX * 0.62, 0);
  drawMidHills();
  pop();

  // ── Layer 4: Foreground — full camera speed (1.0) ───────
  // Near ground, trees, flowers, petals, and symbols all live here.
  push();
  translate(-camX, 0);
  drawNearGround();
  drawTrees();
  drawFlowers();
  drawPetals();
  drawSymbols();
  pop();
}

// ============================================================
//  SKY — vertical warm-pastel gradient
//  Top: soft lavender-blue  →  Bottom: warm peachy-cream
// ============================================================
function drawSky() {
  noStroke();
  for (let y = 0; y < CANVAS_H; y++) {
    let t = y / CANVAS_H;
    stroke(
      lerp(185, 255, t),   // R: lavender → peach
      lerp(172, 210, t),   // G: cool → warm
      lerp(230, 178, t)    // B: blue → amber
    );
    line(0, y, CANVAS_W, y);
  }
  noStroke();
}

// ============================================================
//  CLOUDS — fluffy ellipse clusters with a rosy blush
// ============================================================
function drawClouds() {
  // Cloud positions are spaced across the full world width.
  // Because parallax is 0.15, the effective viewing window
  // is much narrower, so clouds appear to fill the sky nicely.
  const clouds = [
    { x:  150, y: 65,  s: 1.2  },
    { x:  490, y: 52,  s: 0.9  },
    { x:  830, y: 70,  s: 1.4  },
    { x: 1170, y: 56,  s: 1.0  },
    { x: 1500, y: 68,  s: 1.15 },
    { x: 1840, y: 50,  s: 0.85 },
    { x: 2180, y: 73,  s: 1.1  },
  ];

  noStroke();
  for (let c of clouds) {
    // Main cloud body — three overlapping ellipses
    fill(255, 245, 250, 195);
    ellipse(c.x,           c.y,           80*c.s, 38*c.s);
    ellipse(c.x - 34*c.s,  c.y + 10*c.s,  56*c.s, 30*c.s);
    ellipse(c.x + 38*c.s,  c.y +  8*c.s,  60*c.s, 28*c.s);
    // Rosy blush highlight on top
    fill(255, 220, 235, 55);
    ellipse(c.x, c.y - 5, 60*c.s, 22*c.s);
  }
}

// ============================================================
//  FAR HILLS — muted lavender silhouette
// ============================================================
function drawFarHills() {
  // Filled hill shape from precomputed profile down to bottom of canvas
  fill(205, 188, 225);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of farPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);

  // Subtle rim-light along the ridge
  stroke(225, 212, 240, 110);
  strokeWeight(1.5);
  noFill();
  beginShape();
  for (let p of farPts) vertex(p.x, p.y - 2);
  endShape();
  noStroke();
}

// ============================================================
//  MID HILLS — sage-green rolling meadow
// ============================================================
function drawMidHills() {
  fill(162, 204, 170);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of midPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);
}

// ============================================================
//  NEAR GROUND — rich meadow base strip (foreground layer)
// ============================================================
function drawNearGround() {
  fill(130, 182, 142);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of gndPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);
}

// ============================================================
//  TREES — layered foliage blobs, snapped to ground surface
// ============================================================
function drawTrees() {
  const treeXs = [
     85,  255,  435,  615,  800,
    1015, 1195, 1385, 1570, 1755,
    1945, 2135, 2325
  ];

  for (let tx of treeXs) {
    let gY = groundY(tx);
    // Vary height and width using Perlin noise for organic feel
    let h  = 58 + noise(tx * 0.01)       * 38;
    let w  = 46 + noise(tx * 0.02 + 5)   * 18;

    // Trunk
    fill(148, 108, 78);
    noStroke();
    rect(tx - 5, gY - h + 12, 10, h);

    // Three overlapping foliage ellipses create a soft, layered crown
    fill(108, 162, 122, 218);
    ellipse(tx,       gY - h - 4,   w,        w * 0.95);
    fill(92,  150, 110, 200);
    ellipse(tx - 14,  gY - h + 9,   w * 0.8,  w * 0.8);
    fill(122, 175, 136, 200);
    ellipse(tx + 11,  gY - h + 11,  w * 0.74, w * 0.74);
  }
}

// ============================================================
//  FLOWERS + GRASS BLADES — foreground botanical detail
// ============================================================
function drawFlowers() {
  // Grass blades: two angled lines per clump, spaced across world
  strokeWeight(1.2);
  for (let x = 0; x < WORLD_W; x += 18) {
    let gy = groundY(x);
    let bh = 7 + noise(x * 0.14) * 10;
    stroke(90, 152, 100, 165);
    line(x,     gy, x - 2,  gy - bh);
    line(x + 7, gy, x + 9,  gy - bh * 0.75);
  }
  noStroke();

  // Flowers: one per region, each with a distinct pastel hue
  const flowers = [
    { x:  140, c: [255, 172, 185] },   // blush pink
    { x:  305, c: [255, 228, 142] },   // butter yellow
    { x:  485, c: [212, 172, 255] },   // soft violet
    { x:  665, c: [255, 188, 200] },   // rose
    { x:  865, c: [255, 235, 152] },   // warm yellow
    { x: 1055, c: [188, 172, 255] },   // periwinkle
    { x: 1235, c: [255, 198, 168] },   // apricot
    { x: 1425, c: [172, 218, 255] },   // sky blue
    { x: 1615, c: [255, 172, 212] },   // carnation
    { x: 1805, c: [255, 225, 152] },   // golden
    { x: 1995, c: [192, 255, 192] },   // mint
    { x: 2195, c: [255, 192, 225] },   // cotton candy
    { x: 2365, c: [255, 240, 158] },   // lemon
  ];

  for (let f of flowers) {
    let gy = groundY(f.x);

    // Stem
    stroke(92, 145, 80);
    strokeWeight(1.4);
    line(f.x, gy, f.x, gy - 20);
    noStroke();

    // 6 petals arranged in a ring
    fill(f.c[0], f.c[1], f.c[2], 200);
    for (let i = 0; i < 6; i++) {
      let a = (i / 6) * TWO_PI;
      ellipse(f.x + cos(a) * 6, (gy - 20) + sin(a) * 6, 8, 8);
    }

    // Bright center
    fill(255, 242, 100);
    ellipse(f.x, gy - 20, 7, 7);
  }
}

// ============================================================
//  PETALS — drifting floating particles in world space
// ============================================================
function drawPetals() {
  noStroke();
  for (let p of petals) {
    // Update: drift right, float vertically on a sine wave, spin slowly
    p.wx  += p.vx;
    p.y   += sin(frameCount * 0.018 + p.ph) * 0.35;
    p.ang += p.aSpd;

    // Wrap around the world
    if (p.wx > WORLD_W) p.wx = 0;
    if (p.y  > CANVAS_H - 25) p.y = 85;

    // Cull: skip petals that are off-screen (world-space check)
    if (p.wx < camX - 15 || p.wx > camX + CANVAS_W + 15) continue;

    // Draw an elongated oval rotated to look like a drifting petal
    push();
    translate(p.wx, p.y);
    rotate(p.ang);
    fill(p.r, p.g, p.b, p.a);
    ellipse(0, 0, p.sz * 2.3, p.sz);
    pop();
  }
}

// ============================================================
//  SYMBOLS — 4 hidden glowing discoveries (BONUS)
//  Each symbol pulses when the camera reveals it on screen.
// ============================================================
function drawSymbols() {
  for (let s of symbols) {
    // Advance the pulse phase continuously
    s.ph += 0.055;

    // Only draw when within screen bounds (world-space check)
    let sx = s.wx - camX;
    if (sx < -60 || sx > CANVAS_W + 60) continue;

    // pulse: 0 → 1 smooth oscillation
    let pulse = (sin(s.ph) + 1) * 0.5;

    // Radial glow — concentric rings fade outward
    noStroke();
    let maxR = 20 + pulse * 14;
    for (let r = maxR; r > 0; r -= 2.5) {
      let a = map(r, maxR, 0, 0, 65 + pulse * 115);
      fill(255, 228, 115, a);
      ellipse(s.wx, s.wy, r * 2, r * 2);
    }

    // Symbol fill and outline, alpha-boosted by pulse
    let sa = 175 + pulse * 80;
    fill(255, 245, 158, sa);
    stroke(255, 205, 55, sa);
    strokeWeight(1.5);

    if      (s.type === 'star') drawStarSym(s.wx, s.wy, 8, 18, 5);
    else if (s.type === 'moon') drawMoonSym(s.wx, s.wy, 13, pulse);
    else if (s.type === 'leaf') drawLeafSym(s.wx, s.wy, 13, pulse);
    else if (s.type === 'sun' ) drawSunSym (s.wx, s.wy, 10, pulse);
  }
}

// ─── Symbol: 5-point star ───────────────────────────────────
function drawStarSym(x, y, r1, r2, n) {
  beginShape();
  for (let i = 0; i < n * 2; i++) {
    let r = (i % 2 === 0) ? r2 : r1;
    let a = (i / (n * 2)) * TWO_PI - HALF_PI;
    vertex(x + cos(a) * r, y + sin(a) * r);
  }
  endShape(CLOSE);
}

// ─── Symbol: crescent moon ──────────────────────────────────
// Carved by overdrawing a smaller ellipse in a contrasting hue.
function drawMoonSym(x, y, r, pulse) {
  noStroke();
  fill(255, 242, 185, 200 + pulse * 55);
  ellipse(x, y, r * 2, r * 2);
  // "Cut out" the crescent shape with a mid-purple disc
  fill(190, 162, 222, 235);
  ellipse(x + r * 0.48, y, r * 1.52, r * 1.72);
}

// ─── Symbol: botanical leaf ─────────────────────────────────
function drawLeafSym(x, y, r, pulse) {
  fill(158, 225, 158, 200 + pulse * 55);
  stroke(95, 182, 108, 220);
  strokeWeight(1.2);
  // Symmetrical leaf via mirrored bezier curves
  beginShape();
  vertex(x, y - r);
  bezierVertex(x + r, y - r * 0.3,  x + r, y + r * 0.3, x, y + r);
  bezierVertex(x - r, y + r * 0.3,  x - r, y - r * 0.3, x, y - r);
  endShape(CLOSE);
  // Central midrib vein
  stroke(95, 182, 108, 175);
  line(x, y - r, x, y + r);
}

// ─── Symbol: radiant sun ────────────────────────────────────
function drawSunSym(x, y, r, pulse) {
  noStroke();
  fill(255, 235, 98, 200 + pulse * 55);
  ellipse(x, y, r * 2, r * 2);
  // 8 rays that lengthen slightly with the pulse
  stroke(255, 215, 65, 175 + pulse * 80);
  strokeWeight(2);
  for (let i = 0; i < 8; i++) {
    let a  = (i / 8) * TWO_PI;
    let i1 = r + 3;
    let o1 = r + 8 + pulse * 5;
    line(
      x + cos(a) * i1, y + sin(a) * i1,
      x + cos(a) * o1, y + sin(a) * o1
    );
  }
}

// ============================================================
//  HELPER — sample near-ground Y at any world X
// ============================================================
function groundY(wx) {
  return 316 + sin(wx * 0.006 + 1) * 9;
}
