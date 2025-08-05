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

  const minBrickWidth = 40;
  brickColumnCount = Math.floor((canvasWidth - 2 * brickOffsetLeft) / (minBrickWidth + brickPadding));

  brickWidth = (canvasWidth - 2 * brickOffsetLeft - (brickColumnCount - 1) * brickPadding) / brickColumnCount;

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

// タッチ＆マウスイベントの共通関数を作成（押下・離上を処理）
function addButtonPressListeners(button, onPress, onRelease) {
  // タッチ操作
  button.addEventListener("touchstart", e => {
    e.preventDefault();
    onPress();
  });
  button.addEventListener("touchend", e => {
    e.preventDefault();
    onRelease();
  });
  button.addEventListener("touchcancel", e => {
    e.preventDefault();
    onRelease();
  });
  // マウス操作
  button.addEventListener("mousedown", e => {
    e.preventDefault();
    onPress();
  });
  button.addEventListener("mouseup", e => {
    e.preventDefault();
    onRelease();
  });
  button.addEventListener("mouseleave", e => {
    e.preventDefault();
    onRelease();
  });
}

// ボタン操作セットアップ
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnSpace = document.getElementById("btnSpace");
const btnShift = document.getElementById("btnShift");

addButtonPressListeners(btnLeft,
  () => { leftPressed = true; },
  () => { leftPressed = false; }
);

addButtonPressListeners(btnRight,
  () => { rightPressed = true; },
  () => { rightPressed = false; }
);

addButtonPressListeners(btnShift,
  () => { shiftPressed = true; },
  () => { shiftPressed = false; }
);

// btnSpaceはクリック／タッチで「発射 or ポーズ切替」
btnSpace.addEventListener("touchstart", e => {
  e.preventDefault();
  if (!ballLaunched && !isPaused) {
    ballLaunched = true;
  } else if (ballLaunched) {
    isPaused = !isPaused;
    overlay.textContent = isPaused ? "PAUSED" : "";
    overlay.classList.toggle("hidden", !isPaused);
  }
});
btnSpace.addEventListener("click", e => {
  e.preventDefault();
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

adjustBrickLayout();
initBricks();
resetBallAndPaddle();
draw();
