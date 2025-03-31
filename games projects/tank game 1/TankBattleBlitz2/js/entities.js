// Tank Creation
function createTank(x, y, color, isPlayer = false) {
    return {
        x, y, color,
        width: TANK_WIDTH,
        height: TANK_HEIGHT,
        speed: isPlayer ? PLAYER_SPEED : (ENEMY_SPEED_BASE + (level - 1) * ENEMY_SPEED_INCREMENT),
        health: isPlayer ? PLAYER_HEALTH : (ENEMY_HEALTH_BASE + (level - 1) * ENEMY_HEALTH_INCREMENT),
        angle: 0,
        bodyAngle: 0,
        bullets: [],
        isPlayer,
        velocityX: 0,
        velocityY: 0,
        treadOffset: 0,
        stuckTime: 0,
        detourX: null,
        detourY: null,
        retreating: false,
        retreatAngle: 0,
        retreatFrames: 0,
        destroyed: false,
        explosionFrame: 0,
        explosionParticles: [],
        hitTimer: 0
    };
}

function createBullet(x, y, angle) {
    return { x, y, speed: BULLET_SPEED, angle, radius: BULLET_RADIUS, distanceTraveled: 0 };
}

function createObstacle(x, y) {
    const shapes = ["roundedSquare", "rectangle", "circle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const colors = [OBSTACLE_BROWN, OBSTACLE_GRAY, OBSTACLE_GREEN, OBSTACLE_ORANGE];
    const color = colors[Math.floor(Math.random() * colors.length)];
    if (shape === "roundedSquare") return { x, y, width: 40, height: 40, color, shape, borderRadius: 8 };
    if (shape === "rectangle") return { x, y, width: Math.random() < 0.5 ? 60 : 30, height: Math.random() < 0.5 ? 30 : 60, color, shape };
    return { x, y, radius: 20, color, shape };
}

function spawnTankSafely(color, obstacles, isPlayer = false) {
    let x, y, attempts = 0;
    const maxAttempts = 50;
    do {
        if (isPlayer && attempts === 0) {
            x = SCREEN_WIDTH / 2;
            y = SCREEN_HEIGHT / 2;
        } else {
            x = Math.random() * (SCREEN_WIDTH - TANK_WIDTH);
            y = Math.random() * (SCREEN_HEIGHT - TANK_HEIGHT);
        }
        attempts++;
    } while (collidesWithObstacles(x, y, { width: TANK_WIDTH, height: TANK_HEIGHT }) && attempts < maxAttempts);
    if (attempts >= maxAttempts) {
        x = SCREEN_WIDTH - 64;
        y = SCREEN_HEIGHT - 64;
    }
    return createTank(x, y, color, isPlayer);
}

function spawnObstacleSafely(obstacles) {
    let x, y, attempts = 0;
    const maxAttempts = 50;
    let newObstacle;
    do {
        x = Math.random() * (SCREEN_WIDTH - 60);
        y = Math.random() * (SCREEN_HEIGHT - 60);
        newObstacle = createObstacle(x, y);
        attempts++;
    } while (collidesWithObstacles(x, y, newObstacle) && attempts < maxAttempts);
    return newObstacle;
}