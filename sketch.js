// ============================================================
//  MEDITATIVE NATURE SCROLL — AFTERNOON TO NIGHT
//  Canvas: 800 × 400  |  World: 2400 wide (3× canvas)
//  Narrative: camera drifts left→right through the day.
//  Symbols in discovery order: Sun → Leaf → Star → Moon
//    Sun  (wx=150)  — left side of screen, full afternoon
//    Leaf (wx=950)  — resting on the ground, golden hour
//    Star (wx=1500) — dusk sky, stars emerging
//    Moon (wx=2300) — right side of screen, deep night
//  p5.js only — no external libraries
// ============================================================

// ─── WORLD & CAMERA ─────────────────────────────────────────
const WORLD_W  = 2400;
const CANVAS_W = 800;
const CANVAS_H = 400;
const SPEED    = 0.5;   // camera drift (px/frame)

let camX = 0;           // world-space left edge of camera

// ─── TIME OF DAY ────────────────────────────────────────────
// tod: 0 = bright afternoon, 1 = deep night
// Computed each frame from camX with a non-linear easing
// so the transition accelerates sharply around the Leaf symbol.
let tod = 0;

// ─── TERRAIN PROFILES ───────────────────────────────────────
let farPts = [];   // distant lavender hills  (parallax 0.35)
let midPts = [];   // sage-green mid hills    (parallax 0.62)
let gndPts = [];   // near meadow ground      (parallax 1.0)

// ─── FLOATING PETALS / FIREFLIES ────────────────────────────
let petals = [];

// ─── STARS (screen-space, fade in at dusk) ──────────────────
let stars = [];

// ─── HIDDEN SYMBOLS ─────────────────────────────────────────
let symbols = [];

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);

  // Build terrain from overlapping sine waves — organic, non-repeating
  for (let x = 0; x <= WORLD_W; x += 6) {
    farPts.push(createVector(x,
      212 + sin(x * 0.003)       * 52
          + sin(x * 0.007 + 1.2) * 26
    ));
    midPts.push(createVector(x,
      270 + sin(x * 0.0045 + 2)  * 34
          + sin(x * 0.009 + 4.5) * 15
    ));
    gndPts.push(createVector(x,
      316 + sin(x * 0.006 + 1)   * 9
    ));
  }

  // Floating petal particles distributed across the world
  for (let i = 0; i < 55; i++) {
    petals.push({
      wx:   random(WORLD_W),
      y:    random(80, 345),
      sz:   random(3, 7.5),
      vx:   random(0.18, 0.65),
      ph:   random(TWO_PI),
      ang:  random(TWO_PI),
      aSpd: random(-0.025, 0.025),
      r:    random(230, 255),   // daytime: soft pink-peach
      g:    random(148, 218),
      b:    random(182, 234),
      a:    random(140, 210)
    });
  }

  // Stars in screen-space (they don't scroll — sky is infinite)
  for (let i = 0; i < 90; i++) {
    stars.push({
      x:  random(CANVAS_W),
      y:  random(CANVAS_H * 0.62),  // upper sky only
      sz: random(0.8, 2.4),
      ph: random(TWO_PI)            // twinkle phase offset
    });
  }

  // ── 4 hidden glowing symbols ────────────────────────────
  // Leaf sits on the ground — snap its wy to groundY(950) - radius
  let leafGroundY = 316 + sin(950 * 0.006 + 1) * 9;  // ≈ 320

  symbols = [
    // Sun: first discovery, left side of screen at scroll start
    { wx: 150,  wy: 158,              type: 'sun',  ph: 0           },
    // Leaf: resting on the ground, marks the golden-hour pivot
    { wx: 950,  wy: leafGroundY - 14, type: 'leaf', ph: HALF_PI     },
    // Star: dusk area, sky filling with stars
    { wx: 1500, wy: 188,              type: 'star', ph: PI          },
    // Moon: final discovery, right side of screen at scroll end
    { wx: 2300, wy: 162,              type: 'moon', ph: PI+HALF_PI  }
  ];
}

// ============================================================
//  HELPERS
// ============================================================

// Classic smooth-step: ease in AND out over [0,1]
function smoothStep(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Compute time-of-day from camX.
// Three segments give a slow → FAST → slow easing curve:
//   Segment A  camX 0→352  (p 0→0.22)  tod 0→0.12  very slow, still afternoon
//   Segment B  camX 352→832 (p 0.22→0.52) tod 0.12→0.88  FAST burst at the Leaf
//   Segment C  camX 832→1600 (p 0.52→1)  tod 0.88→1.0  slow tail into night
function computeTOD() {
  let p = camX / (WORLD_W - CANVAS_W);   // 0 → 1

  if (p < 0.22) {
    return lerp(0,    0.12, smoothStep(p / 0.22));
  } else if (p < 0.52) {
    return lerp(0.12, 0.88, smoothStep((p - 0.22) / 0.30));
  } else {
    return lerp(0.88, 1.0,  smoothStep((p - 0.52) / 0.48));
  }
}

// Interpolate through an array of [r,g,b] color stops
function lerpStops(stops, t) {
  let n  = stops.length - 1;
  let i  = min(floor(t * n), n - 1);
  let lt = (t * n) - i;
  return [
    lerp(stops[i][0], stops[i+1][0], lt),
    lerp(stops[i][1], stops[i+1][1], lt),
    lerp(stops[i][2], stops[i+1][2], lt)
  ];
}

// Ground surface Y at any world X (must match gndPts formula)
function groundY(wx) {
  return 316 + sin(wx * 0.006 + 1) * 9;
}

// Scale an RGB color toward black for night silhouette.
// scale: 1 = full daytime colour, ~0.06 = near-black night
function dn(r, g, b, scale) {
  return [r * scale, g * scale, b * scale];
}

// ============================================================
//  DRAW
// ============================================================
function draw() {
  camX = (camX + SPEED) % (WORLD_W - CANVAS_W);
  tod  = computeTOD();

  // ── Layer 0: Sky (no parallax — fixed backdrop) ───────────
  drawSky();

  // ── Stars fade in at dusk, screen-space before hills ──────
  drawStars();

  // ── Layer 1: Clouds (parallax 0.15 — barely drift) ────────
  push();
  translate(-camX * 0.15, 0);
  drawClouds();
  pop();

  // ── Layer 2: Far hills (parallax 0.35) ────────────────────
  push();
  translate(-camX * 0.35, 0);
  drawFarHills();
  pop();

  // ── Layer 3: Mid hills (parallax 0.62) ────────────────────
  push();
  translate(-camX * 0.62, 0);
  drawMidHills();
  pop();

  // ── Layer 4: Full-speed foreground (parallax 1.0) ─────────
  push();
  translate(-camX, 0);
  drawNearGround();
  drawTrees();
  drawFlowers();
  drawPetals();    // petals by day, fireflies by night
  drawSymbols();
  pop();
}

// ============================================================
//  SKY — multi-stop gradient: afternoon → golden hour → dusk → night
// ============================================================
function drawSky() {
  noStroke();

  // Sky-top colours at each time-of-day stop
  const topStops = [
    [185, 172, 230],   // afternoon : soft lavender-blue
    [255, 152, 75],    // golden hr : warm orange
    [72,  42,  138],   // dusk      : deep violet
    [8,   12,  55]     // night     : navy
  ];
  // Horizon/bottom colours
  const botStops = [
    [255, 210, 178],   // afternoon : peachy cream
    [255, 90,  30],    // golden hr : red-orange
    [178, 68,  115],   // dusk      : magenta-rose
    [18,  13,  62]     // night     : dark indigo
  ];

  let topC = lerpStops(topStops, tod);
  let botC = lerpStops(botStops, tod);

  for (let y = 0; y < CANVAS_H; y++) {
    let t = y / CANVAS_H;
    stroke(
      lerp(topC[0], botC[0], t),
      lerp(topC[1], botC[1], t),
      lerp(topC[2], botC[2], t)
    );
    line(0, y, CANVAS_W, y);
  }
  noStroke();

  // Sunset horizon glow — warm band near hill-line during transition.
  // Uses a sine arch so it appears and disappears smoothly.
  if (tod > 0.14 && tod < 0.74) {
    let intensity = sin(map(tod, 0.14, 0.74, 0, PI));  // 0→peak→0
    let horizY    = CANVAS_H * 0.52;
    for (let y = CANVAS_H * 0.36; y < CANVAS_H * 0.68; y++) {
      let dy = abs(y - horizY) / (CANVAS_H * 0.16);
      let a  = max(0, 1 - dy) * intensity * 95;
      stroke(255, 145, 38, a);
      line(0, y, CANVAS_W, y);
    }
    noStroke();
  }
}

// ============================================================
//  STARS — screen-space; twinkle gently; fade in at dusk
// ============================================================
function drawStars() {
  if (tod < 0.32) return;
  let alpha = map(tod, 0.32, 0.72, 0, 255);
  noStroke();
  for (let s of stars) {
    let tw = (sin(frameCount * 0.038 + s.ph) + 1) * 0.5;  // 0→1 twinkle
    fill(245, 248, 255, alpha * (0.62 + tw * 0.38));
    let sz = s.sz + tw * 0.55;
    ellipse(s.x, s.y, sz, sz);
  }
}

// ============================================================
//  CLOUDS — fade and tint toward dark night wisps
// ============================================================
function drawClouds() {
  // Opacity drops at night; colour shifts from white-pink to dark blue-grey
  let baseA = lerp(192, 28, tod);
  let cr    = lerp(255, 48, tod);
  let cg    = lerp(245, 42, tod);
  let cb    = lerp(250, 88, tod);

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
    fill(cr, cg, cb, baseA);
    ellipse(c.x,           c.y,           80*c.s, 38*c.s);
    ellipse(c.x - 34*c.s,  c.y + 10*c.s,  56*c.s, 30*c.s);
    ellipse(c.x + 38*c.s,  c.y +  8*c.s,  60*c.s, 28*c.s);
    // Rosy blush — only visible in daylight
    let blushA = max(0, lerp(52, -10, tod));
    fill(255, 220, 235, blushA);
    ellipse(c.x, c.y - 5, 60*c.s, 22*c.s);
  }
}

// ============================================================
//  FAR HILLS — lavender → black silhouette
// ============================================================
function drawFarHills() {
  let ns = lerp(1, 0.07, tod);
  let [r, g, b] = dn(205, 188, 225, ns);
  fill(r, g, b);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of farPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);

  // Soft ridge rim-light — only during daylight
  if (tod < 0.55) {
    let ra = map(tod, 0, 0.55, 110, 0);
    stroke(225, 212, 240, ra);
    strokeWeight(1.5);
    noFill();
    beginShape();
    for (let p of farPts) vertex(p.x, p.y - 2);
    endShape();
    noStroke();
  }
}

// ============================================================
//  MID HILLS — sage-green → dark silhouette
// ============================================================
function drawMidHills() {
  let ns = lerp(1, 0.06, tod);
  let [r, g, b] = dn(162, 204, 170, ns);
  fill(r, g, b);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of midPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);
}

// ============================================================
//  NEAR GROUND — rich meadow base
// ============================================================
function drawNearGround() {
  let ns = lerp(1, 0.06, tod);
  let [r, g, b] = dn(130, 182, 142, ns);
  fill(r, g, b);
  noStroke();
  beginShape();
  vertex(0, CANVAS_H);
  for (let p of gndPts) vertex(p.x, p.y);
  vertex(WORLD_W, CANVAS_H);
  endShape(CLOSE);
}

// ============================================================
//  TREES — layered foliage, darken to silhouette at night
// ============================================================
function drawTrees() {
  const treeXs = [
     85,  255,  435,  615,  800,
    1015, 1195, 1385, 1570, 1755,
    1945, 2135, 2325
  ];

  let ns = lerp(1, 0.055, tod);

  for (let tx of treeXs) {
    let gY = groundY(tx);
    let h  = 58 + noise(tx * 0.01)     * 38;
    let w  = 46 + noise(tx * 0.02 + 5) * 18;

    // Trunk
    let [tr, tg, tb] = dn(148, 108, 78, ns);
    fill(tr, tg, tb);
    noStroke();
    rect(tx - 5, gY - h + 12, 10, h);

    // Three foliage blobs — overlapping gives soft depth
    let [f1r, f1g, f1b] = dn(108, 162, 122, ns);
    fill(f1r, f1g, f1b, 218);
    ellipse(tx,      gY - h - 4,   w,        w * 0.95);

    let [f2r, f2g, f2b] = dn(92, 150, 110, ns);
    fill(f2r, f2g, f2b, 200);
    ellipse(tx - 14, gY - h + 9,   w * 0.80, w * 0.80);

    let [f3r, f3g, f3b] = dn(122, 175, 136, ns);
    fill(f3r, f3g, f3b, 200);
    ellipse(tx + 11, gY - h + 11,  w * 0.74, w * 0.74);
  }
}

// ============================================================
//  FLOWERS + GRASS — fade and desaturate toward night
// ============================================================
function drawFlowers() {
  let ns         = lerp(1, 0.055, tod);
  let grassAlpha = lerp(162, 28, tod);

  // Grass blades: two angled strokes per clump
  strokeWeight(1.2);
  for (let x = 0; x < WORLD_W; x += 18) {
    let gy = groundY(x);
    let bh = 7 + noise(x * 0.14) * 10;
    let [gr, gg, gb] = dn(90, 152, 100, ns);
    stroke(gr, gg, gb, grassAlpha);
    line(x,     gy, x - 2, gy - bh);
    line(x + 7, gy, x + 9, gy - bh * 0.75);
  }
  noStroke();

  const flowers = [
    { x:  140, c: [255, 172, 185] },
    { x:  305, c: [255, 228, 142] },
    { x:  485, c: [212, 172, 255] },
    { x:  665, c: [255, 188, 200] },
    { x:  865, c: [255, 235, 152] },
    { x: 1055, c: [188, 172, 255] },
    { x: 1235, c: [255, 198, 168] },
    { x: 1425, c: [172, 218, 255] },
    { x: 1615, c: [255, 172, 212] },
    { x: 1805, c: [255, 225, 152] },
    { x: 1995, c: [192, 255, 192] },
    { x: 2195, c: [255, 192, 225] },
    { x: 2365, c: [255, 240, 158] },
  ];

  let flowerA = lerp(200, 18, tod);

  for (let f of flowers) {
    let gy = groundY(f.x);

    // Stem
    let [sr, sg, sb] = dn(92, 145, 80, ns);
    stroke(sr, sg, sb);
    strokeWeight(1.4);
    line(f.x, gy, f.x, gy - 20);
    noStroke();

    // 6 petals in a ring
    fill(f.c[0] * ns, f.c[1] * ns, f.c[2] * ns, flowerA);
    for (let i = 0; i < 6; i++) {
      let a = (i / 6) * TWO_PI;
      ellipse(f.x + cos(a) * 6, (gy - 20) + sin(a) * 6, 8, 8);
    }

    // Bright center
    fill(255 * ns, 242 * ns, 100 * ns);
    ellipse(f.x, gy - 20, 7, 7);
  }
}

// ============================================================
//  PETALS / FIREFLIES
//  Daytime: drifting pastel oval petals
//  Night:   glowing round fireflies (pale yellow-green)
//  Morphs smoothly between the two as tod rises past 0.55
// ============================================================
function drawPetals() {
  // nightFactor: 0 = full petal, 1 = full firefly
  let nightFactor = constrain(map(tod, 0.52, 0.88, 0, 1), 0, 1);

  noStroke();
  for (let p of petals) {
    // Update position
    p.wx  += p.vx;
    p.y   += sin(frameCount * 0.018 + p.ph) * 0.35;
    p.ang += p.aSpd;

    if (p.wx > WORLD_W) p.wx = 0;
    if (p.y > CANVAS_H - 25) p.y = 85;

    // Cull anything off-screen
    if (p.wx < camX - 15 || p.wx > camX + CANVAS_W + 15) continue;

    // Lerp colours: soft petal pink → firefly yellow-green
    let pr = lerp(p.r, 195, nightFactor);
    let pg = lerp(p.g, 255, nightFactor);
    let pb = lerp(p.b, 110, nightFactor);
    let pa = lerp(p.a, 215, nightFactor);

    // Firefly glow halo — grows in as night approaches
    if (nightFactor > 0.04) {
      fill(195, 255, 110, nightFactor * pa * 0.22);
      ellipse(p.wx, p.y, p.sz * 7, p.sz * 7);
    }

    // Shape: elongated petal by day → round dot by night
    push();
    translate(p.wx, p.y);
    rotate(p.ang);
    fill(pr, pg, pb, pa);
    ellipse(0, 0,
      lerp(p.sz * 2.3, p.sz * 1.15, nightFactor),  // width
      lerp(p.sz,       p.sz * 1.1,  nightFactor)    // height
    );
    pop();
  }
}

// ============================================================
//  SYMBOLS — 4 glowing discoveries that pulse on reveal
// ============================================================
function drawSymbols() {
  for (let s of symbols) {
    s.ph += 0.055;  // advance pulse continuously

    // Visibility cull — world-space (inside translate(-camX))
    let sx = s.wx - camX;
    if (sx < -65 || sx > CANVAS_W + 65) continue;

    let pulse = (sin(s.ph) + 1) * 0.5;   // 0 → 1

    // Radial glow: concentric rings fade outward
    noStroke();
    let maxR = 20 + pulse * 14;
    for (let r = maxR; r > 0; r -= 2.5) {
      let a = map(r, maxR, 0, 0, 65 + pulse * 118);
      fill(255, 228, 115, a);
      ellipse(s.wx, s.wy, r * 2, r * 2);
    }

    // Symbol shape — alpha surges with pulse
    let sa = 175 + pulse * 80;
    fill(255, 245, 158, sa);
    stroke(255, 205, 55, sa);
    strokeWeight(1.5);

    if      (s.type === 'sun' ) drawSunSym (s.wx, s.wy, 10, pulse);
    else if (s.type === 'leaf') drawLeafSym(s.wx, s.wy, 13, pulse);
    else if (s.type === 'star') drawStarSym(s.wx, s.wy, 8, 18, 5);
    else if (s.type === 'moon') drawMoonSym(s.wx, s.wy, 13, pulse);
  }
}

// ─── Symbol: radiant sun with pulsing rays ───────────────────
function drawSunSym(x, y, r, pulse) {
  noStroke();
  fill(255, 235, 98, 200 + pulse * 55);
  ellipse(x, y, r * 2, r * 2);

  stroke(255, 215, 65, 175 + pulse * 80);
  strokeWeight(2);
  for (let i = 0; i < 8; i++) {
    let a  = (i / 8) * TWO_PI;
    let i1 = r + 3;
    let o1 = r + 8 + pulse * 5;
    line(x + cos(a)*i1, y + sin(a)*i1, x + cos(a)*o1, y + sin(a)*o1);
  }
}

// ─── Symbol: botanical leaf with midrib vein ─────────────────
function drawLeafSym(x, y, r, pulse) {
  fill(158, 225, 158, 200 + pulse * 55);
  stroke(95, 182, 108, 220);
  strokeWeight(1.2);
  // Symmetrical leaf from mirrored bezier curves
  beginShape();
  vertex(x, y - r);
  bezierVertex(x + r, y - r*0.3,  x + r, y + r*0.3, x, y + r);
  bezierVertex(x - r, y + r*0.3,  x - r, y - r*0.3, x, y - r);
  endShape(CLOSE);
  // Midrib
  stroke(95, 182, 108, 175);
  line(x, y - r, x, y + r);
}

// ─── Symbol: 5-point star ────────────────────────────────────
function drawStarSym(x, y, r1, r2, n) {
  beginShape();
  for (let i = 0; i < n * 2; i++) {
    let r = (i % 2 === 0) ? r2 : r1;
    let a = (i / (n * 2)) * TWO_PI - HALF_PI;
    vertex(x + cos(a)*r, y + sin(a)*r);
  }
  endShape(CLOSE);
}

// ─── Symbol: crescent moon ───────────────────────────────────
// Carved by overdrawing a smaller disc in the background colour.
function drawMoonSym(x, y, r, pulse) {
  noStroke();
  fill(255, 242, 185, 200 + pulse * 55);
  ellipse(x, y, r * 2, r * 2);
  // Carve out crescent with a deep-indigo cutout
  fill(18, 13, 62, 240);
  ellipse(x + r * 0.48, y, r * 1.52, r * 1.72);
}

// ============================================================
//  HELPER — ground surface Y at any world X
// ============================================================
function groundY(wx) {
  return 316 + sin(wx * 0.006 + 1) * 9;
}
