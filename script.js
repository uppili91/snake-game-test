const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let fruit = { x: 15, y: 15 };
let velocity = { x: 0, y: 0 };
let growing = false;

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

function gameLoop() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    if (head.x === fruit.x && head.y === fruit.y) {
        fruit = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        growing = true;
    }

    snake.unshift(head);

    if (!growing) {
        snake.pop();
    } else {
        growing = false;
    }

    // Check for collision with walls or self
    if (
        head.x < 0 || head.y < 0 ||
        head.x >= tileCount || head.y >= tileCount ||
        snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        alert("Game Over!");
        snake = [{ x: 10, y: 10 }];
        velocity = { x: 0, y: 0 };
    }

    drawGame();
}

function drawGame() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    for (const segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    }

    ctx.fillStyle = "red";
    ctx.fillRect(fruit.x * gridSize, fruit.y * gridSize, gridSize, gridSize);
}

setInterval(gameLoop, 100);
