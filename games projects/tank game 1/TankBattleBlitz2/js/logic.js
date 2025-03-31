// Game Logic Functions
function updatePlayer() {
    if (player.destroyed) return;
    let moving = false;
    if (keys["ArrowUp"] && keys["ArrowRight"]) {
        player.velocityY = -player.speed;
        player.velocityX = player.speed;
        player.bodyAngle = 45;
        moving = true;
    } else if (keys["ArrowUp"] && keys["ArrowLeft"]) {
        player.velocityY = -player.speed;
        player.velocityX = -player.speed;
        player.bodyAngle = 315;
        moving = true;
    } else if (keys["ArrowDown"] && keys["ArrowRight"]) {
        player.velocityY = player.speed;
        player.velocityX = player.speed;
        player.bodyAngle = 135;
        moving = true;
    } else if (keys["ArrowDown"] && keys["ArrowLeft"]) {
        player.velocityY = player.speed;
        player.velocityX = -player.speed;
        player.bodyAngle = 225;
        moving = true;
    } else if (keys["ArrowUp"]) {
        player.velocityY = -player.speed;
        player.velocityX = 0;
        player.bodyAngle = 0;
        moving = true;
    } else if (keys["ArrowDown"]) {
        player.velocityY = player.speed;
        player.velocityX = 0;
        player.bodyAngle = 180;
        moving = true;
    } else if (keys["ArrowLeft"]) {
        player.velocityX = -player.speed;
        player.velocityY = 0;
        player.bodyAngle = 270;
        moving = true;
    } else if (keys["ArrowRight"]) {
        player.velocityX = player.speed;
        player.velocityY = 0;
        player.bodyAngle = 90;
        moving = true;
    } else {
        player.velocityX = 0;
        player.velocityY = 0;
    }

    if (moving) {
        const newX = player.x + player.velocityX;
        const newY = player.y + player.velocityY;
        if (!collidesWithObstacles(newX, newY, player)) {
            player.x = newX;
            player.y = newY;
            player.treadOffset += 1;
        }
    }

    player.x = Math.max(0, Math.min(player.x, SCREEN_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, SCREEN_HEIGHT - player.height));

    if (keys[" "] && !player.lastShot) {
        [-15, 0, 15].forEach(spread => {
            player.bullets.push(createBullet(player.x + player.width / 2, player.y + player.height / 2, player.angle + spread));
        });
        shootSound.play().catch(e => console.log("Shoot sound error:", e));
        player.lastShot = true;
        setTimeout(() => { player.lastShot = false; }, 200);
    }

    if (enemies.length > 0) {
        const closestEnemy = enemies.reduce((closest, e) => {
            const distToE = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
            const distToClosest = closest ? Math.sqrt((closest.x - player.x) ** 2 + (closest.y - player.y) ** 2) : Infinity;
            return distToE < distToClosest ? e : closest;
        }, null);
        if (closestEnemy) {
            const dx = closestEnemy.x - player.x;
            const dy = closestEnemy.y - player.y;
            player.angle = Math.atan2(-dy, dx) * 180 / Math.PI;
        }
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.destroyed) return;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 100) {
            if (enemy.retreating) {
                enemy.retreatFrames += 1;
                const retreatSpeed = enemy.speed * 0.75;
                enemy.velocityX = -Math.cos(enemy.retreatAngle) * retreatSpeed;
                enemy.velocityY = -Math.sin(enemy.retreatAngle) * retreatSpeed;
                enemy.retreatAngle += Math.PI / 20;
                const newX = enemy.x + enemy.velocityX;
                const newY = enemy.y + enemy.velocityY;
                if (!collidesWithObstacles(newX, newY, enemy)) {
                    enemy.x = newX;
                    enemy.y = newY;
                }
                if (enemy.retreatFrames >= 20) {
                    enemy.retreating = false;
                    enemy.retreatFrames = 0;
                    enemy.stuckTime = 0;
                }
            } else {
                let targetX = enemy.detourX !== null ? enemy.detourX : player.x;
                let targetY = enemy.detourY !== null ? enemy.detourY : player.y;
                enemy.velocityX = (targetX - enemy.x) * 0.03;
                enemy.velocityY = (targetY - enemy.y) * 0.03;
                const speed = Math.sqrt(enemy.velocityX ** 2 + enemy.velocityY ** 2);
                if (speed > enemy.speed) {
                    enemy.velocityX = enemy.velocityX / speed * enemy.speed;
                    enemy.velocityY = enemy.velocityY / speed * enemy.speed;
                }
                const newX = enemy.x + enemy.velocityX;
                const newY = enemy.y + enemy.velocityY;
                if (!collidesWithObstacles(newX, newY, enemy)) {
                    enemy.x = newX;
                    enemy.y = newY;
                    enemy.stuckTime = 0;
                    if (enemy.detourX !== null && Math.abs(enemy.x - enemy.detourX) < 10 && Math.abs(enemy.y - enemy.detourY) < 10) {
                        enemy.detourX = null;
                        enemy.detourY = null;
                    }
                } else {
                    enemy.stuckTime += 16;
                    if (enemy.stuckTime > 500) {
                        enemy.retreating = true;
                        enemy.retreatAngle = enemy.angle * Math.PI / 180 + Math.PI;
                        enemy.retreatFrames = 0;
                    } else {
                        const openDir = findNearestOpenDirection(enemy);
                        enemy.velocityX = openDir.x;
                        enemy.velocityY = openDir.y;
                        const altX = enemy.x + enemy.velocityX;
                        const altY = enemy.y + enemy.velocityY;
                        if (!collidesWithObstacles(altX, altY, enemy)) {
                            enemy.x = altX;
                            enemy.y = altY;
                        }
                    }
                    if (enemy.stuckTime > 1500) {
                        const edge = getObstacleEdge(enemy);
                        enemy.detourX = edge.x;
                        enemy.detourY = edge.y;
                        enemy.retreating = false;
                        enemy.stuckTime = 0;
                    }
                }
            }
            enemy.x = Math.max(0, Math.min(enemy.x, SCREEN_WIDTH - enemy.width));
            enemy.y = Math.max(0, Math.min(enemy.y, SCREEN_HEIGHT - enemy.height));
            if (enemy.velocityX !== 0 || enemy.velocityY !== 0) {
                enemy.angle = Math.atan2(-enemy.velocityY, enemy.velocityX) * 180 / Math.PI;
            }
        }

        if (Math.random() < 0.025 && hasLineOfSight(enemy, player)) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 350) {
                const shootAngle = Math.atan2(-dy, dx) * 180 / Math.PI;
                enemy.bullets.push(createBullet(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, shootAngle));
                shootSound.play().catch(e => console.log("Shoot sound error:", e));
            }
        }
    });
}

function spawnEnemies() {
    const currentTime = Date.now();
    const baseDelay = 5000 - Math.max(0, (level - 2) * 2000);
    if (level === 1 && enemySpawnTimes.length < 20 && (currentTime - startTime) > enemySpawnTimes.length * 5000) {
        enemies.push(spawnTankSafely(ENEMY_TANK_RED, obstacles));
        enemySpawnTimes.push(startTime + enemySpawnTimes.length * 5000);
        if (enemySpawnTimes.length === 20) enemySpawned = true;
    } else if (level === 1 && enemies.length === 0 && enemySpawned) {
        level = 2;
        enemySpawnTimes = [];
        startTime = currentTime;
        resetObstacles();
    } else if (level === 2 && enemySpawnTimes.length < 20 && (currentTime - startTime) > enemySpawnTimes.length * 5000) {
        for (let i = 0; i < 2; i++) {
            enemies.push(spawnTankSafely(ENEMY_TANK_YELLOW, obstacles));
        }
        enemySpawnTimes.push(startTime + enemySpawnTimes.length * 5000);
    } else if (level === 2 && enemies.length === 0 && enemySpawnTimes.length === 20) {
        level = 3;
        enemySpawnTimes = [];
        startTime = currentTime;
        resetObstacles();
    } else if (level === 3 && enemySpawnTimes.length < 14 && (currentTime - startTime) > enemySpawnTimes.length * 5000) {
        for (let i = 0; i < 6; i++) {
            enemies.push(spawnTankSafely(ENEMY_TANK_PURPLE, obstacles));
        }
        enemySpawnTimes.push(startTime + enemySpawnTimes.length * 5000);
    } else if (level === 3 && enemies.length === 0 && enemySpawnTimes.length === 14) {
        gameWon = true;
    }
}

function updateBullets() {
    [player, ...enemies].forEach(tank => {
        tank.bullets.forEach(bullet => {
            const newX = bullet.x + Math.cos(bullet.angle * Math.PI / 180) * bullet.speed;
            const newY = bullet.y - Math.sin(bullet.angle * Math.PI / 180) * bullet.speed;
            if (!collidesWithObstacles(newX, newY, bullet)) {
                bullet.x = newX;
                bullet.y = newY;
                bullet.distanceTraveled += bullet.speed;
            } else {
                bullet.distanceTraveled = BULLET_MAX_DISTANCE + 1;
            }

            const bulletCells = getCellsForRect(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2);
            bulletCells.forEach(cell => {
                if (tankGrid[cell]) {
                    tankGrid[cell].forEach(otherTank => {
                        if (otherTank !== tank && !otherTank.destroyed &&
                            bullet.x > otherTank.x && bullet.x < otherTank.x + otherTank.width &&
                            bullet.y > otherTank.y && bullet.y < otherTank.y + otherTank.height) {
                            otherTank.health -= 1;
                            otherTank.hitTimer = 5;
                            tank.bullets = tank.bullets.filter(b => b !== bullet);
                            if (otherTank.health <= 0) {
                                explosionSound.play().catch(e => console.log("Explosion sound error:", e));
                                otherTank.destroyed = true;
                                if (otherTank === player) {
                                    setTimeout(() => { gameOver = true; }, 500);
                                } else {
                                    setTimeout(() => {
                                        enemies = enemies.filter(e => e !== otherTank);
                                        score += 1;
                                        if (tank.isPlayer) player.health += 1;
                                    }, 500);
                                }
                            }
                        }
                    });
                }
            });
        });
        tank.bullets = tank.bullets.filter(b => b.distanceTraveled <= BULLET_MAX_DISTANCE);
    });
}