let spriteSheet;
let frames = [];
const TOTAL_FRAMES = 8;
let currentFrame = 0;
let animTimer = 0;
const ANIM_FPS = 10; // animation frames per second
let spriteSheet2;
let frames2 = [];
const TOTAL_FRAMES2 = 8;
let currentFrame2 = 0;
let animTimer2 = 0;
// animation toggle (start disabled)
let animating = false;
// user-confirmed per-frame dimensions (updated)
const FRAME1_W = 225;
const FRAME1_H = 454;
const FRAME2_W = 287;
const FRAME2_H = 483;

function preload() {
  // left character: use the requested file. Use relative path for browser compatibility.
  // Absolute Windows paths may be blocked by the browser when served over HTTP.
  spriteSheet = loadImage('1/1.png');
  // load a single-frame image for character two as requested
  spriteSheet2 = loadImage('2/1.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  if (spriteSheet) {
    // prefer user-confirmed frame size when the source image contains full frames
    if (spriteSheet.width >= FRAME1_W && spriteSheet.height >= FRAME1_H * TOTAL_FRAMES) {
      const sx = Math.floor((spriteSheet.width - FRAME1_W) / 2);
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const y = i * FRAME1_H;
        frames.push(spriteSheet.get(sx, y, FRAME1_W, FRAME1_H));
      }
    } else if (spriteSheet.width >= FRAME1_W && spriteSheet.height >= FRAME1_H) {
      // single-frame image matching FRAME1 dimensions
      const sx = Math.floor((spriteSheet.width - FRAME1_W) / 2);
      frames.push(spriteSheet.get(sx, 0, FRAME1_W, FRAME1_H));
    } else {
      // fallback: evenly split vertically across the sheet (best-effort)
      const perH = Math.floor(spriteSheet.height / TOTAL_FRAMES);
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const y = i * perH;
        const h = (i === TOTAL_FRAMES - 1) ? (spriteSheet.height - perH * (TOTAL_FRAMES - 1)) : perH;
        frames.push(spriteSheet.get(0, y, spriteSheet.width, h));
      }
    }
  }
  if (spriteSheet2) {
    // If spriteSheet2 looks like a vertical sheet matching FRAME2 dimensions, slice it.
    if (spriteSheet2.width >= FRAME2_W && spriteSheet2.height >= FRAME2_H * TOTAL_FRAMES2) {
      const sx2 = Math.floor((spriteSheet2.width - FRAME2_W) / 2);
      for (let i = 0; i < TOTAL_FRAMES2; i++) {
        const y = i * FRAME2_H;
        frames2.push(spriteSheet2.get(sx2, y, FRAME2_W, FRAME2_H));
      }
    } else {
      // Otherwise treat it as a single full-frame image
      frames2.push(spriteSheet2.get(0, 0, spriteSheet2.width, spriteSheet2.height));
    }
  }
  // Ensure current frame indices are within bounds if images loaded
  if (frames.length > 0) currentFrame = currentFrame % frames.length;
  if (frames2.length > 0) currentFrame2 = currentFrame2 % frames2.length;
}

function draw() {
  background(173, 216, 230);

  const cx = width / 2;
  const cy = height / 2;

  // If frames are ready, draw both characters as a centered group
  if (frames.length > 0 && frames2.length > 0) {
    imageMode(CENTER);

    // get current images and their sizes
    const img1 = frames[currentFrame];
    const img2 = frames2[currentFrame2];
    const w1 = img1.width;
    const h1 = img1.height;
    const w2 = img2.width;
    const h2 = img2.height;

    // choose scale so both characters fully visible and not exceed window
    const gap = 20; // gap between characters (unscaled)
    const combinedOriginalW = w1 + gap + w2;
    const maxAllowedW = width * 0.95; // allow more margin so they can fit
    const baseScale = 1.0; // do not force upscale — ensure full visibility first
    let scale = baseScale;
    if (combinedOriginalW * scale > maxAllowedW) {
      scale = maxAllowedW / combinedOriginalW;
    }
    // also constrain by height so they don't overflow vertically
    const maxAllowedH = height * 0.95;
    const maxSpriteH = Math.max(h1, h2);
    if (maxSpriteH * scale > maxAllowedH) {
      scale = Math.min(scale, maxAllowedH / maxSpriteH);
    }

    const dispW1 = w1 * scale;
    const dispH1 = h1 * scale;
    const dispW2 = w2 * scale;
    const dispH2 = h2 * scale;

    // center the pair as a single group
    const gapScaled = gap * scale;
    const combinedW = dispW1 + gapScaled + dispW2;
    const startX = cx - combinedW / 2;
    const firstX = startX + dispW1 / 2;
    const secondX = startX + dispW1 + gapScaled + dispW2 / 2;

    // floating (bobbing) effect, but limit amplitude so sprites stay fully visible
    const speed = 0.004; // controls how fast they bob
    const dispHMax = Math.max(dispH1, dispH2);
    // compute maximum allowed vertical shift so top/bottom remain inside canvas with 10px margin
    const maxUp = cy - dispHMax / 2 - 10;
    const maxDown = height - cy - dispHMax / 2 - 10;
    const maxAllowedBob = Math.max(0, Math.min(maxUp, maxDown));
    const desiredAmplitude = 50 * scale;
    const amplitude = Math.max(0, Math.min(desiredAmplitude, maxAllowedBob));
    const bob = Math.sin(millis() * speed) * amplitude;
    let yPos = cy + bob;
    // ensure the pair stays fully visible: if the top of the taller sprite
    // goes above a small margin, shift the whole group down; similarly for bottom.
    const margin = 10;
    const top = yPos - dispHMax / 2;
    if (top < margin) {
      yPos += (margin - top);
    }
    const bottom = yPos + dispHMax / 2;
    if (bottom > height - margin) {
      yPos -= (bottom - (height - margin));
    }

    // draw exactly one instance of each character, scaled
    image(img1, firstX, yPos, dispW1, dispH1);
    image(img2, secondX, yPos, dispW2, dispH2);

    // advance frame timers independently only when animating is enabled
    if (typeof animating !== 'undefined' && animating) {
      animTimer += deltaTime;
      const frameDuration = 1000 / ANIM_FPS;
      if (animTimer >= frameDuration) {
        currentFrame = (currentFrame + 1) % frames.length;
        animTimer = 0;
      }

      animTimer2 += deltaTime;
      const frameDuration2 = 1000 / ANIM_FPS;
      if (animTimer2 >= frameDuration2) {
        currentFrame2 = (currentFrame2 + 1) % frames2.length;
        animTimer2 = 0;
      }
    }
  } else {
    // fallback: simple centered placeholder if frames not ready
    noStroke();
    fill(100);
    rectMode(CENTER);
    rect(cx, cy, 160, 120);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  // toggle animation on mouse click
  animating = !animating;
}
