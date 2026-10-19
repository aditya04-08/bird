
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const GROUND = 55;

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");

const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const finalScoreDisplay = document.getElementById("final-score");
const resultMessage = document.getElementById("result-message");

let state = "ready";
let bird;
let pipes;
let score;
let frame;
let groundOffset = 0;

let best = 0;

try {
  best = Number(localStorage.getItem("birdFlyBest")) || 0;
} catch (error) {
  best = 0;
}

bestDisplay.textContent = best;

function resetGame() {
  bird = {
    x: 95,
    y: 255,
    velocity: 0,
    radius: 15,
    rotation: 0
  };

  pipes = [];
  score = 0;
  frame = 0;
  groundOffset = 0;

  scoreDisplay.textContent = "0";
}

function startGame() {
  resetGame();
  state = "playing";
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  flap();
}

function flap() {
  if (state !== "playing") return;
  bird.velocity = -5.5;
}

function endGame() {
  if (state !== "playing") return;

  state = "over";
  finalScoreDisplay.textContent = score;

  if (score > best) {
    best = score;
    bestDisplay.textContent = best;

    try {
      localStorage.setItem("birdFlyBest", String(best));
    } catch (error) {
      // The game still works if browser storage is unavailable.
    }

    resultMessage.textContent = "New personal best! 🎉";
  } else {
    resultMessage.textContent = "Nice try! Can you beat your best?";
  }

  gameOverScreen.classList.remove("hidden");
}

function addPipe() {
  const gap = Math.max(135, 165 - score * 0.7);
  const margin = 55;
  const minTop = margin;
  const maxTop = H - GROUND - margin - gap;

  const topHeight = minTop +
    Math.random() * Math.max(1, maxTop - minTop);

  pipes.push({
    x: W + 10,
    top: topHeight,
    gap: gap,
    scored: false
  });
}

function update() {
  if (state !== "playing") return;

  frame++;

  // Bird physics
  bird.velocity += 0.28;
  bird.velocity = Math.min(bird.velocity, 7);
  bird.y += bird.velocity;

  bird.rotation = Math.min(
    Math.PI / 4,
    Math.max(-0.45, bird.velocity * 0.09)
  );

  // Scroll the ground
  groundOffset = (groundOffset + 2.5) % 24;

  // Spawn pipes
  if (frame % 95 === 1) {
    addPipe();
  }

  // Move pipes and award points
  for (const pipe of pipes) {
    pipe.x -= 2.5;

    if (!pipe.scored && pipe.x + 54 < bird.x) {
      pipe.scored = true;
      score++;
      scoreDisplay.textContent = score;
    }
  }

  pipes = pipes.filter(pipe => pipe.x > -70);

  // Ceiling and ground collision
  if (
    bird.y - bird.radius < 0 ||
    bird.y + bird.radius > H - GROUND
  ) {
    endGame();
    return;
  }

  // Pipe collision
  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + 54;
    const birdLeft = bird.x - bird.radius + 3;
    const birdRight = bird.x + bird.radius - 3;

    const overlapsPipe =
      birdRight > pipeLeft && birdLeft < pipeRight;

    const outsideGap =
      bird.y - bird.radius + 3 < pipe.top ||
      bird.y + bird.radius - 3 > pipe.top + pipe.gap;

    if (overlapsPipe && outsideGap) {
      endGame();
      return;
    }
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#71d3ff");
  sky.addColorStop(1, "#d2f5ff");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = "#fff1a8";
  ctx.beginPath();
  ctx.arc(320, 85, 30, 0, Math.PI * 2);
  ctx.fill();

  // Decorative clouds
  drawCloud(65, 105, 0.8);
  drawCloud(265, 190, 0.65);
  drawCloud(125, 320, 0.55);
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffffb8";
  ctx.beginPath();
  ctx.arc(0, 10, 18, 0, Math.PI * 2);
  ctx.arc(20, 0, 23, 0, Math.PI * 2);
  ctx.arc(43, 11, 17, 0, Math.PI * 2);
  ctx.rect(-2, 10, 47, 18);
  ctx.fill();

  ctx.restore();
}

function drawPipe(pipe) {
  const width = 54;
  const capHeight = 22;
  const bottomY = pipe.top + pipe.gap;
  const groundY = H - GROUND;

  // Pipe gradient
  const gradient = ctx.createLinearGradient(
    pipe.x, 0, pipe.x + width, 0
  );

  gradient.addColorStop(0, "#36a852");
  gradient.addColorStop(0.5, "#78d75c");
  gradient.addColorStop(1, "#248541");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#237b3d";
  ctx.lineWidth = 2;

  // Top pipe body
  ctx.fillRect(pipe.x + 4, 0, width - 8, pipe.top - capHeight);
  ctx.strokeRect(pipe.x + 4, -2, width - 8, pipe.top - capHeight + 2);

  // Top pipe cap
  ctx.fillRect(pipe.x, pipe.top - capHeight, width, capHeight);
  ctx.strokeRect(pipe.x, pipe.top - capHeight, width, capHeight);

  // Bottom pipe body
  ctx.fillRect(pipe.x + 4, bottomY + capHeight, width - 8,
    groundY - bottomY - capHeight);
  ctx.strokeRect(pipe.x + 4, bottomY + capHeight, width - 8,
    groundY - bottomY - capHeight);

  // Bottom pipe cap
  ctx.fillRect(pipe.x, bottomY, width, capHeight);
  ctx.strokeRect(pipe.x, bottomY, width, capHeight);

  // Highlights
  ctx.fillStyle = "#c0f59b70";
  ctx.fillRect(pipe.x + 9, 0, 5, pipe.top - capHeight);
  ctx.fillRect(pipe.x + 9, bottomY + capHeight, 5,
    groundY - bottomY - capHeight);
}

function drawBird() {
  ctx.save();

  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Shadow
  ctx.fillStyle = "#36637b35";
  ctx.beginPath();
  ctx.ellipse(1, 19, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGradient = ctx.createLinearGradient(-16, -15, 16, 17);
  bodyGradient.addColorStop(0, "#fff68a");
  bodyGradient.addColorStop(1, "#ffb82e");

  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = "#d78a21";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wing animation
  const wingAngle = Math.sin(frame * 0.35) * 0.35;

  ctx.save();
  ctx.rotate(wingAngle);

  ctx.fillStyle = "#ffdb55";
  ctx.beginPath();
  ctx.ellipse(-6, 4, 9, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -6, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#24394b";
  ctx.beginPath();
  ctx.arc(10, -6, 2.7, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#ff8247";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(25, 4);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d65c32";
  ctx.stroke();

  ctx.restore();
}

function drawGround() {
  const y = H - GROUND;

  ctx.fillStyle = "#87d64e";
  ctx.fillRect(0, y, W, 12);

  ctx.fillStyle = "#5fae39";
  for (let x = -24; x < W + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x - groundOffset, y);
    ctx.lineTo(x + 8 - groundOffset, y + 6);
    ctx.lineTo(x + 16 - groundOffset, y);
    ctx.fill();
  }

  ctx.fillStyle = "#e8c17c";
  ctx.fillRect(0, y + 12, W, GROUND - 12);

  ctx.strokeStyle = "#d5a35d";
  ctx.lineWidth = 1;

  for (let x = -24; x < W + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x - groundOffset, y + 13);
    ctx.lineTo(x - groundOffset, H);
    ctx.stroke();
  }

  for (let x = -24; x < W + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x - groundOffset, y + 30);
    ctx.lineTo(x + 12 - groundOffset, y + 30);
    ctx.stroke();
  }
}

function draw() {
  drawBackground();

  for (const pipe of pipes) {
    drawPipe(pipe);
  }

  drawGround();

  if (bird) {
    drawBird();
  }

  if (state === "ready") {
    ctx.fillStyle = "#ffffffd9";
    ctx.font = "bold 16px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TAP TO FLY!", W / 2, 420);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input controls
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();

  if (state === "ready") {
    startGame();
  } else if (state === "playing") {
    flap();
  }
});

document.addEventListener("keydown", event => {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp"
  ) {
    event.preventDefault();

    if (event.repeat) return;

    if (state === "ready") {
      startGame();
    } else if (state === "playing") {
      flap();
    } else if (state === "over") {
      startGame();
    }
  }
});

// Initialize and run
resetGame();
loop();
