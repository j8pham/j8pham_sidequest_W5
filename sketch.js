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
const SPEED    = 0.5;     // autoscroll drift speed (px/frame)
const ARROW_SPD = 2.2;    // manual arrow-key speed (px/frame)

let camX = 0;

// ─── TIME OF DAY ────────────────────────────────────────────
// tod: 0 = bright afternoon, 1 = deep night
let tod = 0;

// ─── UI STATE ────────────────────────────────────────────────
// gameState: 'start' shows the intro card; 'playing' runs the world
let gameState  = 'start';
let autoScroll = false;   // default control is left/right arrows

// Autoscroll toggle button — bottom-right corner
const BTN_W = 152;
const BTN_H = 24;
const BTN_X = CANVAS_W - BTN_W - 8;
const BTN_Y = CANVAS_H - BTN_H - 8;

// ─── TERRAIN PROFILES ───────────────────────────────────────
let farPts = [];
let midPts = [];
let gndPts = [];

// ─── FLOATING PETALS / FIREFLIES ────────────────────────────
let petals = [];

// ─── STARS (screen-space) ───────────────────────────────────
let stars = [];

// ─── HIDDEN SYMBOLS ─────────────────────────────────────────
let symbols = [];

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);

  // Terrain from overlapping sine waves
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

  // Floating petals scattered across the world
  for (let i = 0; i < 55; i++) {
    petals.push({
      wx:   random(WORLD_W),
      y:    random(80, 345),
      sz:   random(3, 7.5),
      vx:   random(0.18, 0.65),
      ph:   random(TWO_PI),
      ang:  random(TWO_PI),
      aSpd: random(-0.025, 0.025),
      r:    random(230, 255),
      g:    random(148, 218),
      b:    random(182, 234),
      a:    random(140, 210)
    });
  }

  // Stars in screen-space (sky is infinite — no parallax)
  for (let i = 0; i < 90; i++) {
    stars.push({
      x:  random(CANVAS_W),
      y:  random(CANVAS_H * 0.62),
      sz: random(0.8, 2.4),
      ph: random(TWO_PI)
    });
  }

  // Hidden symbols: Sun → Leaf → Star → Moon
  let leafGY = 316 + sin(950 * 0.006 + 1) * 9;   // groundY(950) ≈ 320

  symbols = [
    { wx: 150,  wy: 158,         type: 'sun',  ph: 0           },
    { wx: 950,  wy: leafGY - 14, type: 'leaf', ph: HALF_PI     },
    { wx: 1500, wy: 188,         type: 'star', ph: PI          },
    { wx: 2300, wy: 162,         type: 'moon', ph: PI+HALF_PI  }
  ];
}

// ============================================================
//  DRAW
// ============================================================
function draw() {
  // During the start screen the world is visible but frozen.
  // tod stays 0 (afternoon) so it looks inviting.
  if (gameState === 'playing') {
    updateCamera();
    tod = computeTOD();
  } else {
    tod = 0;
  }

  // ── Draw world layers (always rendered, even on start screen) ──
  drawSky();
  drawStars();

  push(); translate(-camX * 0.15, 0); drawClouds();    pop();
  push(); translate(-camX * 0.35, 0); drawFarHills();  pop();
  push(); translate(-camX * 0.62, 0); drawMidHills();  pop();

  push();
  translate(-camX, 0);
  drawNearGround();
  drawTrees();
  drawFlowers();
  drawPetals();
  drawSymbols();
  pop();

  // ── UI overlay ────────────────────────────────────────────
  if (gameState === 'start') {
    drawStartScreen();
  } else {
    drawAutoScrollBtn();
  }
}

// ============================================================
//  CAMERA UPDATE — called only while playing
// ============================================================
function updateCamera() {
  if (autoScroll) {
    // Automatic drift — loops seamlessly
    camX = (camX + SPEED) % (WORLD_W - CANVAS_W);
  } else {
    // Manual arrow-key control with clamped bounds
    if (keyIsDown(LEFT_ARROW))  camX = max(0,                  camX - ARROW_SPD);
    if (keyIsDown(RIGHT_ARROW)) camX = min(WORLD_W - CANVAS_W, camX + ARROW_SPD);
  }
}

// ============================================================
//  MOUSE PRESSED — start screen click, button toggle
// ============================================================
function mousePressed() {
  if (gameState === 'start') {
    gameState = 'playing';
    return;
  }
  // Autoscroll button hit test
  if (mouseX >= BTN_X && mouseX <= BTN_X + BTN_W &&
      mouseY >= BTN_Y && mouseY <= BTN_Y + BTN_H) {
    autoScroll = !autoScroll;
  }
}

// ============================================================
//  KEY PRESSED — any key dismisses the start screen
// ============================================================
function keyPressed() {
  if (gameState === 'start') {
    gameState = 'playing';
  }
}

// ============================================================
//  START SCREEN — warm card overlay on top of frozen world
// ============================================================
function drawStartScreen() {
  // Soft dark vignette behind the card
  noStroke();
  fill(18, 12, 38, 155);
  rect(0, 0, CANVAS_W, CANVAS_H);

  let cx = CANVAS_W  / 2;
  let cy = CANVAS_H / 2 - 4;
  let cw = 470;
  let ch = 205;

  // Card drop-shadow
  fill(0, 0, 0, 55);
  rect(cx - cw/2 + 5, cy - ch/2 + 5, cw, ch, 16);

  // Card face — warm parchment
  fill(255, 248, 232, 242);
  rect(cx - cw/2, cy - ch/2, cw, ch, 14);

  // Card border accent
  stroke(215, 185, 145, 180);
  strokeWeight(1.5);
  noFill();
  rect(cx - cw/2, cy - ch/2, cw, ch, 14);
  noStroke();

  // ── Title ───────────────────────────────────────────────
  textAlign(CENTER, CENTER);
  textSize(17);
  fill(72, 50, 28);
  text('Meditative Nature Scroll', cx, cy - ch/2 + 28);

  // Divider
  stroke(205, 178, 140, 160);
  strokeWeight(1);
  line(cx - cw/2 + 32, cy - ch/2 + 50, cx + cw/2 - 32, cy - ch/2 + 50);
  noStroke();

  // ── Control rows ────────────────────────────────────────
  textSize(13);
  let rowY1 = cy - 22;
  let rowY2 = cy + 12;
  let iconX  = cx - 175;
  let descX  = cx - 132;

  // Row 1 — Arrow keys
  fill(60, 42, 22);
  textAlign(LEFT, CENTER);
  text('\u2190 \u2192', iconX, rowY1);           // ← →
  fill(105, 78, 50);
  text('Arrow keys  \u2014  explore at your own pace', descX, rowY1);

  // Row 2 — Autoscroll
  fill(60, 42, 22);
  text('\u21BB', iconX, rowY2);                  // ↻
  fill(105, 78, 50);
  text('Autoscroll  \u2014  camera drifts on its own', descX, rowY2);

  // Sub-hint
  textSize(11);
  fill(148, 115, 78);
  textAlign(CENTER, CENTER);
  text('Toggle autoscroll with the button in the bottom-right corner', cx, cy + ch/2 - 38);

  // ── Start prompt — pulse gently ─────────────────────────
  let pulse = (sin(frameCount * 0.07) + 1) * 0.5;
  fill(88, 62, 34, lerp(155, 245, pulse));
  textSize(12);
  text('Click anywhere or press any key to begin', cx, cy + ch/2 - 18);
}

// ============================================================
//  AUTOSCROLL BUTTON — bottom-right during play
// ============================================================
function drawAutoScrollBtn() {
  let x = BTN_X;
  let y = BTN_Y;

  // Drop shadow
  noStroke();
  fill(0, 0, 0, 45);
  rect(x + 2, y + 2, BTN_W, BTN_H, 7);

  // Face — green tint when on, warm cream when off
  if (autoScroll) {
    fill(88, 168, 112, 218);
  } else {
    fill(242, 228, 208, 218);
  }
  rect(x, y, BTN_W, BTN_H, 7);

  // Border
  if (autoScroll) {
    stroke(60, 132, 82, 200);
  } else {
    stroke(185, 158, 122, 190);
  }
  strokeWeight(1);
  noFill();
  rect(x, y, BTN_W, BTN_H, 7);
  noStroke();

  // Label
  textAlign(CENTER, CENTER);
  textSize(11);
  if (autoScroll) {
    fill(22, 55, 32);
    text('\u21BB  AUTOSCROLL: ON', x + BTN_W/2, y + BTN_H/2);
  } else {
    fill(75, 52, 28);
    text('\u2190\u2192  ARROWS: ON', x + BTN_W/2, y + BTN_H/2);
  }
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
//   Segment A  camX 0→352  (p 0→0.22)   tod 0→0.12   slow afternoon
//   Segment B  camX 352→832 (p 0.22→0.52) tod 0.12→0.88  FAST at the Leaf
//   Segment C  camX 832→1600 (p 0.52→1)  tod 0.88→1.0  slow tail to night
function computeTOD() {
  let p = camX / (WORLD_W - CANVAS_W);

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

// Ground surface Y at any world X (matches gndPts formula)
function groundY(wx) {
  return 316 + sin(wx * 0.006 + 1) * 9;
}

// Scale an RGB colour toward black for night silhouette
function dn(r, g, b, scale) {
  return [r * scale, g * scale, b * scale];
}

// ============================================================
//  SKY — afternoon → golden hour → dusk → night
// ============================================================
function drawSky() {
  noStroke();

  const topStops = [
    [185, 172, 230],   // afternoon: soft lavender-blue
    [255, 152, 75],    // golden hr: warm orange
    [72,  42,  138],   // dusk:      deep violet
    [8,   12,  55]     // night:     navy
  ];
  const botStops = [
    [255, 210, 178],   // afternoon: peachy cream
    [255, 90,  30],    // golden hr: red-orange
    [178, 68,  115],   // dusk:      magenta-rose
    [18,  13,  62]     // night:     dark indigo
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

  // Sunset horizon glow — warm band, sine-arched so it fades in and out
  if (tod > 0.14 && tod < 0.74) {
    let intensity = sin(map(tod, 0.14, 0.74, 0, PI));
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
//  STARS — screen-space, twinkle in at dusk
// ============================================================
function drawStars() {
  if (tod < 0.32) return;
  let alpha = map(tod, 0.32, 0.72, 0, 255);
  noStroke();
  for (let s of stars) {
    let tw = (sin(frameCount * 0.038 + s.ph) + 1) * 0.5;
    fill(245, 248, 255, alpha * (0.62 + tw * 0.38));
    ellipse(s.x, s.y, s.sz + tw * 0.55);
  }
}

// ============================================================
//  CLOUDS — fade and tint toward dark wisps at night
// ============================================================
function drawClouds() {
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
//  MID HILLS — sage-green → silhouette
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
//  NEAR GROUND
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
//  TREES — darken to silhouette at night
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

    let [tr, tg, tb] = dn(148, 108, 78, ns);
    fill(tr, tg, tb); noStroke();
    rect(tx - 5, gY - h + 12, 10, h);

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
//  FLOWERS + GRASS — fade and desaturate at night
// ============================================================
function drawFlowers() {
  let ns         = lerp(1, 0.055, tod);
  let grassAlpha = lerp(162, 28, tod);

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
    let [sr, sg, sb] = dn(92, 145, 80, ns);
    stroke(sr, sg, sb);
    strokeWeight(1.4);
    line(f.x, gy, f.x, gy - 20);
    noStroke();

    fill(f.c[0] * ns, f.c[1] * ns, f.c[2] * ns, flowerA);
    for (let i = 0; i < 6; i++) {
      let a = (i / 6) * TWO_PI;
      ellipse(f.x + cos(a) * 6, (gy - 20) + sin(a) * 6, 8, 8);
    }
    fill(255 * ns, 242 * ns, 100 * ns);
    ellipse(f.x, gy - 20, 7, 7);
  }
}

// ============================================================
//  PETALS / FIREFLIES
//  Daytime: drifting pastel oval petals
//  Night:   glowing round fireflies (pale yellow-green)
// ============================================================
function drawPetals() {
  let nightFactor = constrain(map(tod, 0.52, 0.88, 0, 1), 0, 1);

  noStroke();
  for (let p of petals) {
    p.wx  += p.vx;
    p.y   += sin(frameCount * 0.018 + p.ph) * 0.35;
    p.ang += p.aSpd;

    if (p.wx > WORLD_W) p.wx = 0;
    if (p.y > CANVAS_H - 25) p.y = 85;
    if (p.wx < camX - 15 || p.wx > camX + CANVAS_W + 15) continue;

    let pr = lerp(p.r, 195, nightFactor);
    let pg = lerp(p.g, 255, nightFactor);
    let pb = lerp(p.b, 110, nightFactor);
    let pa = lerp(p.a, 215, nightFactor);

    if (nightFactor > 0.04) {
      fill(195, 255, 110, nightFactor * pa * 0.22);
      ellipse(p.wx, p.y, p.sz * 7, p.sz * 7);
    }

    push();
    translate(p.wx, p.y);
    rotate(p.ang);
    fill(pr, pg, pb, pa);
    ellipse(0, 0,
      lerp(p.sz * 2.3, p.sz * 1.15, nightFactor),
      lerp(p.sz,       p.sz * 1.1,  nightFactor)
    );
    pop();
  }
}

// ============================================================
//  SYMBOLS — glowing discoveries; pulse when revealed
// ============================================================
function drawSymbols() {
  for (let s of symbols) {
    s.ph += 0.055;

    let sx = s.wx - camX;
    if (sx < -65 || sx > CANVAS_W + 65) continue;

    let pulse = (sin(s.ph) + 1) * 0.5;

    noStroke();
    let maxR = 20 + pulse * 14;
    for (let r = maxR; r > 0; r -= 2.5) {
      let a = map(r, maxR, 0, 0, 65 + pulse * 118);
      fill(255, 228, 115, a);
      ellipse(s.wx, s.wy, r * 2, r * 2);
    }

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

// ─── Symbol: radiant sun ─────────────────────────────────────
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

// ─── Symbol: botanical leaf ──────────────────────────────────
function drawLeafSym(x, y, r, pulse) {
  fill(158, 225, 158, 200 + pulse * 55);
  stroke(95, 182, 108, 220);
  strokeWeight(1.2);
  beginShape();
  vertex(x, y - r);
  bezierVertex(x + r, y - r*0.3,  x + r, y + r*0.3, x, y + r);
  bezierVertex(x - r, y + r*0.3,  x - r, y - r*0.3, x, y - r);
  endShape(CLOSE);
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
function drawMoonSym(x, y, r, pulse) {
  noStroke();
  fill(255, 242, 185, 200 + pulse * 55);
  ellipse(x, y, r * 2, r * 2);
  // Carve crescent with a disc matching the night sky
  fill(18, 13, 62, 240);
  ellipse(x + r * 0.48, y, r * 1.52, r * 1.72);
}

// ============================================================
//  HELPER — ground surface Y at any world X
// ============================================================
function groundY(wx) {
  return 316 + sin(wx * 0.006 + 1) * 9;
}
