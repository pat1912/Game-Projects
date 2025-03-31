// Grid Utility Functions
function getCellsForRect(x, y, width, height) {
    const minCol = Math.floor(x / GRID_SIZE);
    const maxCol = Math.floor((x + width - 1) / GRID_SIZE);
    const minRow = Math.floor(y / GRID_SIZE);
    const maxRow = Math.floor((y + height - 1) / GRID_SIZE);
    const cells = [];
    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            cells.push(`${col},${row}`);
        }
    }
    return cells;
}

function getCellForPoint(x, y) {
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);
    return `${col},${row}`;
}

function buildObstacleGrid() {
    obstacleGrid = {};
    obstacles.forEach(obstacle => {
        let cells;
        if (obstacle.shape === "circle") {
            cells = getCellsForRect(obstacle.x, obstacle.y, obstacle.radius * 2, obstacle.radius * 2);
        } else {
            cells = getCellsForRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        cells.forEach(cell => {
            if (!obstacleGrid[cell]) obstacleGrid[cell] = [];
            obstacleGrid[cell].push(obstacle);
        });
    });
}

function updateTankGrid() {
    tankGrid = {};
    [player, ...enemies].forEach(tank => {
        if (!tank.destroyed) {
            const cells = getCellsForRect(tank.x, tank.y, tank.width, tank.height);
            cells.forEach(cell => {
                if (!tankGrid[cell]) tankGrid[cell] = [];
                tankGrid[cell].push(tank);
            });
        }
    });
}

// Collision Detection
function collidesWithObstacles(newX, newY, obj) {
    const rect = { x: newX, y: newY, width: obj.width || obj.radius * 2 || 0, height: obj.height || obj.radius * 2 || 0 };
    const cells = getCellsForRect(newX, newY, rect.width, rect.height);
    const obstaclesToCheck = new Set();
    cells.forEach(cell => {
        if (obstacleGrid[cell]) {
            obstacleGrid[cell].forEach(obs => obstaclesToCheck.add(obs));
        }
    });
    return Array.from(obstaclesToCheck).some(obstacle => {
        if (obstacle.shape === "circle") {
            const centerX = obstacle.x + obstacle.radius;
            const centerY = obstacle.y + obstacle.radius;
            const closestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width));
            const closestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height));
            const dx = closestX - centerX;
            const dy = closestY - centerY;
            return (dx * dx + dy * dy) < (obstacle.radius * obstacle.radius);
        } else {
            const obsRect = { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
            return rect.x < obsRect.x + obsRect.width &&
                   rect.x + rect.width > obsRect.x &&
                   rect.y < obsRect.y + obsRect.height &&
                   rect.y + rect.height > obsRect.y;
        }
    });
}

function hasLineOfSight(tank, target) {
    const steps = Math.ceil(Math.sqrt((target.x - tank.x) ** 2 + (target.y - tank.y) ** 2) / 10);
    const dx = (target.x - tank.x) / steps;
    const dy = (target.y - tank.y) / steps;
    for (let i = 1; i < steps; i++) {
        const checkX = tank.x + dx * i;
        const checkY = tank.y + dy * i;
        if (collidesWithObstacles(checkX, checkY, { width: 1, height: 1 })) {
            return false;
        }
    }
    return true;
}

function findNearestOpenDirection(tank) {
    const directions = [
        { x: tank.speed, y: 0 }, { x: -tank.speed, y: 0 },
        { x: 0, y: tank.speed }, { x: 0, y: -tank.speed }
    ];
    for (let dir of directions) {
        const newX = tank.x + dir.x;
        const newY = tank.y + dir.y;
        if (!collidesWithObstacles(newX, newY, tank)) {
            return { x: dir.x, y: dir.y };
        }
    }
    return { x: 0, y: 0 };
}

function getObstacleEdge(tank) {
    const blockingObstacle = obstacles.find(obs => {
        const rect = { x: tank.x + tank.velocityX, y: tank.y + tank.velocityY, width: tank.width, height: tank.height };
        if (obs.shape === "circle") {
            const centerX = obs.x + obs.radius;
            const centerY = obs.y + obs.radius;
            const closestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width));
            const closestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height));
            const dx = closestX - centerX;
            const dy = closestY - centerY;
            return (dx * dx + dy * dy) < (obs.radius * obs.radius);
        } else {
            const obsRect = { x: obs.x, y: obs.y, width: obs.width, height: obs.height };
            return rect.x < obsRect.x + obsRect.width &&
                   rect.x + rect.width > obsRect.x &&
                   rect.y < obsRect.y + obsRect.height &&
                   rect.y + rect.height > obsRect.y;
        }
    });
    if (!blockingObstacle) return { x: player.x, y: player.y };
    if (blockingObstacle.shape === "circle") {
        const angleToPlayer = Math.atan2(player.y - tank.y, player.x - tank.x);
        return {
            x: blockingObstacle.x + blockingObstacle.radius * Math.cos(angleToPlayer) * 1.5,
            y: blockingObstacle.y + blockingObstacle.radius * Math.sin(angleToPlayer) * 1.5
        };
    }
    const corners = [
        { x: blockingObstacle.x - tank.width, y: blockingObstacle.y - tank.height },
        { x: blockingObstacle.x + blockingObstacle.width + tank.width, y: blockingObstacle.y - tank.height },
        { x: blockingObstacle.x - tank.width, y: blockingObstacle.y + blockingObstacle.height + tank.height },
        { x: blockingObstacle.x + blockingObstacle.width + tank.width, y: blockingObstacle.y + blockingObstacle.height + tank.height }
    ];
    return corners.reduce((closest, corner) => {
        const distToCorner = Math.sqrt((corner.x - player.x) ** 2 + (corner.y - player.y) ** 2);
        const distToClosest = Math.sqrt((closest.x - player.x) ** 2 + (closest.y - player.y) ** 2);
        return distToCorner < distToClosest ? corner : closest;
    }, corners[0]);
}