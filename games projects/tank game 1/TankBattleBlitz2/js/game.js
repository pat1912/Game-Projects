const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Objects
let player, enemies = [], obstacles = [], score = 0, level = 1, focused = true, startTime, enemySpawned = false, gameOver = false, enemySpawnTimes = [], gameWon = false;
let obstacleGrid = {}, tankGrid = {};

// Game Setup
function resetGame() {
    obstacles = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        obstacles.push(spawnObstacleSafely(obstacles));
    }
    buildObstacleGrid();
    player = spawnTankSafely(PLAYER_COLOR_GREEN, obstacles, true);
    enemies = [];
    score = 0;
    level = 1;
    focused = true;
    startTime = Date.now();
    enemySpawned = false;
    gameOver = false;
    gameWon = false;
    enemySpawnTimes = [];
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(e => console.log("Music restart error:", e));
}

function resetObstacles() {
    obstacles = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        obstacles.push(spawnObstacleSafely(obstacles));
    }
    buildObstacleGrid();
    player = spawnTankSafely(PLAYER_COLOR_GREEN, obstacles, true);
    enemies = enemies.map(enemy => spawnTankSafely(enemy.color, obstacles));
}

resetGame();

// Main Game Loop
function gameLoop() {
    if (focused && !gameOver && !gameWon) {
        updateTankGrid();
        updatePlayer();
        spawnEnemies();
        updateEnemies();
        updateBullets();
    }
    renderGame();
    if ((gameOver || gameWon) && keys["r"]) resetGame();
    requestAnimationFrame(gameLoop);
}

gameLoop();