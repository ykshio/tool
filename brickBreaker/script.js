const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const messageText = document.getElementById("messageText");
const restartBtn = document.getElementById("restartBtn");

const ballRadius = 8;
let x, y, dx, dy;
let ballLaunched = false;
let speedMultiplier = 1;

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX;

let rightPressed = false;
let leftPressed = false;
let shiftPressed = false;
let isPaused = false;
let spacePressed = false;

let score = 0;
let lives = 3;

const heartImage = new Image();
heartImage.src = "images/heart.svg";

let bricks = [];

const brickHeight = 20;
const brickPadding = 8;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let brickColumnCount;
let brickRowCount;
let brickWidth;

function adjustBrickLayout() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // 横方向：最大列数は canvas幅-左右余白 を (minBrickWidth+padding) で割った値
  const minBrickWidth = 40;
  brickColumnCount = Math.floor((canvasWidth - 2 * brickOffsetLeft) / (minBrickWidth + brickPadding));

  // 列数に合わせてブロック幅を計算（paddingも含む）
  brickWidth = (canvasWidth - 2 * brickOffsetLeft - (brickColumnCount - 1) * brickPadding) / brickColumnCount;

  // 縦方向：行数は canvas高さの30%くらいを目安に
  const availableHeight = canvasHeight * 0.3;
  brickRowCount = Math.floor((availableHeight - brickOffsetTop) / (brickHeight + brickPadding));
}

function initBricks() {
  bricks = [];
  const totalBricks = brickRowCount * brickColumnCount;
  const activeBricks = Math.floor(Math.random() * (totalBricks * 0.3)) + Math.floor(totalBricks * 0.3); // 30～60%のランダム

  const indices = [];
  for (let i = 0; i < totalBricks; i++) indices.push(i);
  indices.sort(() => Math.random() - 0.5);
  const activeIndices = new Set(indices.slice(0, activeBricks));

  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      const index = c * brickRowCount + r;
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: activeIndices.has(index) ? 1 : 0
      };
    }
  }
}

function resetBallAndPaddle() {
  paddleX = (canvas.width - paddleWidth) / 2;
  x = paddleX + paddleWidth / 2;
  y = canvas.height - paddleHeight - ballRadius;
  dx = 2;
  dy = -2;
  ballLaunched = false;
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("keydown", controlHandler);
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") spacePressed = false;
});

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  else if (e.key === "Shift") shiftPressed = true;
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  else if (e.key === "Shift") shiftPressed = false;
}

function controlHandler(e) {
  if (e.code === "Space" && !spacePressed) {
    spacePressed = true;
    if (!ballLaunched && !isPaused) {
      ballLaunched = true;
    } else if (ballLaunched) {
      isPaused = !isPaused;
      overlay.textContent = isPaused ? "PAUSED" : "";
      overlay.classList.toggle("hidden", !isPaused);
    }
  }
}

// タッチ操作対応
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', () => {
  rightPressed = false;
  leftPressed = false;
});
function handleTouch(e) {
  e.preventDefault();
  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  if (touchX < canvas.width / 2) {
    leftPressed = true;
    rightPressed = false;
  } else {
    rightPressed = true;
    leftPressed = false;
  }
}

// タップで発射・ポーズ切替
canvas.addEventListener('click', () => {
  if (!ballLaunched && !isPaused) {
    ballLaunched = true;
  } else if (ballLaunched) {
    isPaused = !isPaused;
    overlay.textContent = isPaused ? "PAUSED" : "";
    overlay.classList.toggle("hidden", !isPaused);
  }
});

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0f0";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: " + score, 8, 20);
}

function drawLives() {
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImage, canvas.width - 20 * (i + 1), 5, 16, 16);
  }
}

function collisionDetection() {
  let remainingBricks = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        remainingBricks++;
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
        }
      }
    }
  }

  if (remainingBricks === 0) {
    messageText.textContent = "ステージクリア！🎉";
    overlay.classList.remove("hidden");
    restartBtn.classList.remove("hidden");
    isPaused = true;
  }
}

function draw() {
  if (isPaused) {
    requestAnimationFrame(draw);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (!ballLaunched) {
    x = paddleX + paddleWidth / 2;
    y = canvas.height - paddleHeight - ballRadius;
  } else {
    speedMultiplier = shiftPressed ? 2 : 1;
    x += dx * speedMultiplier;
    y += dy * speedMultiplier;

    if (x > canvas.width - ballRadius || x < ballRadius) dx = -dx;
    if (y < ballRadius) dy = -dy;
    else if (y > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy;
      } else {
        lives--;
        if (lives <= 0) {
          messageText.textContent = "ゲームオーバー！😭";
          overlay.classList.remove("hidden");
          restartBtn.classList.remove("hidden");
          isPaused = true;
          return;
        } else {
          resetBallAndPaddle();
        }
      }
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
  else if (leftPressed && paddleX > 0) paddleX -= 5;

  requestAnimationFrame(draw);
}

// リスタート処理
restartBtn.addEventListener("click", () => {
  score = 0;
  lives = 3;
  isPaused = false;
  initBricks();
  resetBallAndPaddle();
  overlay.classList.add("hidden");
  messageText.textContent = "";
  restartBtn.classList.add("hidden");
  draw();
});

// 初期化
adjustBrickLayout();
initBricks();
resetBallAndPaddle();
draw();
