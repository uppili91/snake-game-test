const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreSpan = document.getElementById("score");
const levelSpan = document.getElementById("level");
let interval;

const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let fruit = { x: 15, y: 15 };
let velocity = { x: 0, y: 0 };
let growing = false;
let score = 0;
let level = 1;
let speed = 100;

document.addEventListener("keydown", keyDown);

function keyDown(event) {
    switch (event.key) {
        case "ArrowLeft":
            if (velocity.x === 0) velocity = { x: -1, y: 0 };
            break;
        case "ArrowRight":
            if (velocity.x === 0) velocity = { x: 1, y: 0 };
            break;
        case "ArrowUp":
            if (velocity.y === 0) velocity = { x: 0, y: -1 };
            break;
        case "ArrowDown":
            if (velocity.y === 0) velocity = { x: 0, y: 1 };
            break;
    }
}

function startGame() {
    clearInterval(interval);
    snake = [{ x: 10, y: 10 }];
    velocity = { x: 0, y: 0 };
    fruit = { x: 15, y: 15 };
    score = 0;
    level = 1;
    speed = parseInt(document.getElementById("difficulty").value);
    updateStatus();
    interval = setInterval(gameLoop, speed);
}

function gameLoop() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    if (head.x === fruit.x && head.y === fruit.y) {
        fruit = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        growing = true;
        score += 10;
        if (score % 50 === 0) levelUp();
    }

    snake.unshift(head);

    if (!growing) {
        snake.pop();
    } else {
        growing = false;
    }

    if (
        head.x < 0 || head.y < 0 ||
        head.x >= tileCount || head.y >= tileCount ||
        snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        alert("Game Over! Final Score: " + score);
        clearInterval(interval);
    }

    drawGame();
    updateStatus();
}

function levelUp() {
    level++;
    speed = Math.max(30, speed - 10);
    clearInterval(interval);
    interval = setInterval(gameLoop, speed);
}

function updateStatus() {
    scoreSpan.textContent = score;
    levelSpan.textContent = level;
}

function drawGame() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4caf50";
    for (const segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    }

    ctx.fillStyle = "#e53935";
    ctx.fillRect(fruit.x * gridSize, fruit.y * gridSize, gridSize, gridSize);
}


// High Score Tracking
let highScore = localStorage.getItem("highScore") || 0;
document.getElementById("score").insertAdjacentHTML("afterend", ` | High Score: <span id="highScore">${highScore}</span>`);

// Sound Effects
const eatSound = new Audio("eat.mp3");
const gameOverSound = new Audio("gameover.mp3");

// Touch Controls for Mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        velocity = dx > 0 && velocity.x === 0 ? { x: 1, y: 0 } : dx < 0 && velocity.x === 0 ? { x: -1, y: 0 } : velocity;
    } else {
        velocity = dy > 0 && velocity.y === 0 ? { x: 0, y: 1 } : dy < 0 && velocity.y === 0 ? { x: 0, y: -1 } : velocity;
    }
});

function gameLoop() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    if (head.x === fruit.x && head.y === fruit.y) {
        eatSound.play();
        fruit = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        growing = true;
        score += 10;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
            document.getElementById("highScore").textContent = highScore;
        }
        if (score % 50 === 0) levelUp();
    }

    snake.unshift(head);

    if (!growing) {
        snake.pop();
    } else {
        growing = false;
    }

    if (
        head.x < 0 || head.y < 0 ||
        head.x >= tileCount || head.y >= tileCount ||
        snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        gameOverSound.play();
        alert("Game Over! Final Score: " + score);
        clearInterval(interval);
    }

    drawGame();
    updateStatus();
}
