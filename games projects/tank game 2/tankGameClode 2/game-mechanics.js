// Game Mechanics
import { 
  tank, 
  enemies, 
  bullets, 
  explosions, 
  healthPickups, 
  gameState, 
  keys, 
  enemyProperties, 
  bulletConfig,
  canvas,
  borders
} from './game-config.js';

// Cooldown counter for player shooting
let cooldownCounter = 0;

// Create a new bullet
function shoot(sourceX, sourceY, angle, isEnemy = false, spreadBullets = true) {
  if (!isEnemy && cooldownCounter === 0) {
    if (spreadBullets) {
      // Create multiple bullets with spread for player
      const spreadAngles = [
        angle - bulletConfig.spreadAngle,
        angle,
        angle + bulletConfig.spreadAngle
      ];
      
      spreadAngles.forEach(bulletAngle => {
        createBullet(sourceX, sourceY, bulletAngle, isEnemy);
      });
    } else {
      // Just one bullet if spread not requested
      createBullet(sourceX, sourceY, angle, isEnemy);
    }
    
    cooldownCounter = bulletConfig.shootingCooldown;
  } else if (isEnemy) {
    // Just one bullet for enemies
    createBullet(sourceX, sourceY, angle, isEnemy);
  }
}

// Create a single bullet
function createBullet(sourceX, sourceY, angle, isEnemy) {
  // Determine which tank to use for reference (player or enemy)
  const tankReference = isEnemy ? 
    enemies.find(e => e.x === sourceX && e.y === sourceY) : 
    tank;
  
  if (!tankReference) return;
  
  const tankWidth = tankReference.width || enemyProperties.width;
  
  // Calculate bullet starting position (from cannon tip)
  const bulletX = sourceX + Math.cos(angle) * (tankWidth/2 + 5);
  const bulletY = sourceY + Math.sin(angle) * (tankWidth/2 + 5);
  
  bullets.push({
    x: bulletX,
    y: bulletY,
    angle: angle,
    lifespan: isEnemy ? bulletConfig.lifespan : bulletConfig.playerLifespan,
    speed: isEnemy ? bulletConfig.speed : bulletConfig.playerBulletSpeed,
    size: bulletConfig.size,
    isEnemy: isEnemy
  });
}

// Update all bullets
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Move bullet
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;
    
    // Reduce lifespan
    bullet.lifespan--;
    
    // Check for collision with borders
    if (
      bullet.x < borders.thickness || 
      bullet.x > canvas.width - borders.thickness ||
      bullet.y < borders.thickness || 
      bullet.y > canvas.height - borders.thickness
    ) {
      // Create small impact effect on border
      createExplosion(bullet.x, bullet.y, '#FFFFFF', 10, 1.5);
      bullets.splice(i, 1);
      continue;
    }
    
    // Check collision with enemies (if player bullet)
    if (!bullet.isEnemy) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const distance = Math.sqrt(
          Math.pow(bullet.x - enemy.x, 2) + 
          Math.pow(bullet.y - enemy.y, 2)
        );
        
        if (distance < enemyProperties.width / 2) {
          // Hit an enemy
          enemy.health -= 50;
          
          if (enemy.health <= 0) {
            // Enemy destroyed
            createExplosion(enemy.x, enemy.y, '#FF0000');
            enemies.splice(j, 1);
            gameState.score += 100;
            
            // 30% chance to drop a health pickup when enemy is destroyed
            if (Math.random() < 0.3) {
              dropHealthPickup(enemy.x, enemy.y);
            }
          }
          
          // Remove the bullet
          bullets.splice(i, 1);
          const scoreDisplay = document.getElementById('scoreDisplay');
          scoreDisplay.textContent = gameState.score;
          break;
        }
      }
    }
    // Check collision with player (if enemy bullet)
    else if (!tank.isDestroyed && !tank.isInvulnerable) {
      const distance = Math.sqrt(
        Math.pow(bullet.x - tank.x, 2) + 
        Math.pow(bullet.y - tank.y, 2)
      );
      
      if (distance < tank.width / 2) {
        // Player hit
        tank.health -= (tank.maxHealth / tank.shootsToDestroy);
        const healthDisplay = document.getElementById('healthDisplay');
        healthDisplay.textContent = tank.health;
        
        // Set invulnerability
        tank.isInvulnerable = true;
        tank.invulnerabilityEnd = Date.now() + tank.invulnerabilityTime;
        
        // Create hit effect
        createExplosion(bullet.x, bullet.y, '#FFFFFF', 15, 1);
        
        if (tank.health <= 0) {
          // Player destroyed
          tank.isDestroyed = true;
          createExplosion(tank.x, tank.y, '#3c6e45');
          setTimeout(endGame, 2000);
        }
        
        // Remove the bullet
        bullets.splice(i, 1);
        break;
      }
    }
    
    // Remove bullets that have expired
    if (bullet.lifespan <= 0) {
      bullets.splice(i, 1);
    }
  }
  
  // Update cooldown
  if (cooldownCounter > 0) {
    cooldownCounter--;
  }
}

// Create explosion particles
function createExplosion(x, y, color, particleCount = 30, sizeMultiplier = 1) {
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const size = (2 + Math.random() * 3) * sizeMultiplier;
    const lifespan = 30 + Math.random() * 30;
    
    explosions.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      color: color,
      lifespan: lifespan,
      maxLifespan: lifespan
    });
  }
}

// Update explosion particles
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const particle = explosions[i];
    
    // Move particle
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Reduce lifespan
    particle.lifespan--;
    
    // Remove particles that have expired
    if (particle.lifespan <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// Health pickups
function dropHealthPickup(x, y) {
  healthPickups.push({
    x: x,
    y: y,
    width: 20,
    height: 20,
    healAmount: 25
  });
}

function updateHealthPickups() {
  if (tank.isDestroyed) return;
  
  for (let i = healthPickups.length - 1; i >= 0; i--) {
    const pickup = healthPickups[i];
    const distance = Math.sqrt(
      Math.pow(pickup.x - tank.x, 2) + 
      Math.pow(pickup.y - tank.y, 2)
    );
    
    if (distance < (tank.width / 2 + pickup.width / 2)) {
      // Player collected health pickup
      tank.health = Math.min(tank.maxHealth, tank.health + pickup.healAmount);
      const healthDisplay = document.getElementById('healthDisplay');
      healthDisplay.textContent = tank.health;
      
      // Remove the pickup
      healthPickups.splice(i, 1);
      
      // Add score
      gameState.score += 25;
      const scoreDisplay = document.getElementById('scoreDisplay');
      scoreDisplay.textContent = gameState.score;
    }
  }
}

// Spawn a new enemy tank
function spawnEnemy() {
  if (gameState.enemiesSpawned >= gameState.maxEnemies) return;
  
  const borderPadding = borders.thickness + 50; // Keep enemies away from borders
  
  // Determine spawn location (at screen edge, but within borders)
  let x, y;
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  
  switch(side) {
    case 0: // top
      x = borderPadding + Math.random() * (canvas.width - 2 * borderPadding);
      y = borderPadding;
      break;
    case 1: // right
      x = canvas.width - borderPadding;
      y = borderPadding + Math.random() * (canvas.height - 2 * borderPadding);
      break;
    case 2: // bottom
      x = borderPadding + Math.random() * (canvas.width - 2 * borderPadding);
      y = canvas.height - borderPadding;
      break;
    case 3: // left
      x = borderPadding;
      y = borderPadding + Math.random() * (canvas.height - 2 * borderPadding);
      break;
  }
  
  // Create new enemy
  enemies.push({
    x: x,
    y: y,
    width: enemyProperties.width,
    height: enemyProperties.height,
    angle: Math.random() * Math.PI * 2, // Random initial angle
    speed: enemyProperties.speed,
    health: enemyProperties.shootsToDestroy * 50, // Health based on shots to destroy
    shootCooldown: 0
  });
  
  gameState.enemiesSpawned++;
  const enemyCountDisplay = document.getElementById('enemyCountDisplay');
  enemyCountDisplay.textContent = gameState.enemiesSpawned;
}

// Update enemy tanks
function updateEnemies() {
  enemies.forEach(enemy => {
    // Calculate angle to player
    const dx = tank.x - enemy.x;
    const dy = tank.y - enemy.y;
    const targetAngle = Math.atan2(dy, dx);
    
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    // Only pursue if player is in detection range
    if (distanceToPlayer < enemyProperties.detectionRange && !tank.isDestroyed) {
      // Rotate towards player (gradually)
      const angleDiff = targetAngle - enemy.angle;
      
      // Normalize angle difference to be between -PI and PI
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
      
      // Rotate at a fixed rate towards player
      if (normalizedDiff > 0.05) {
        enemy.angle += 0.03;
      } else if (normalizedDiff < -0.05) {
        enemy.angle -= 0.03;
      } else {
        enemy.angle = targetAngle;
      }
      
      // Move forward if not too close to player
      if (distanceToPlayer > enemyProperties.width * 1.5) {
        const newX = enemy.x + Math.cos(enemy.angle) * enemy.speed;
        const newY = enemy.y + Math.sin(enemy.angle) * enemy.speed;
        
        // Check border collisions
        if (
          newX > borders.thickness + enemyProperties.width/2 && 
          newX < canvas.width - borders.thickness - enemyProperties.width/2 &&
          newY > borders.thickness + enemyProperties.height/2 && 
          newY < canvas.height - borders.thickness - enemyProperties.height/2
        ) {
          enemy.x = newX;
          enemy.y = newY;
        }
      }
      
      // Shoot at player if in range
      if (distanceToPlayer < enemyProperties.shootingRange) {
        if (enemy.shootCooldown <= 0) {
          shoot(enemy.x, enemy.y, enemy.angle, true, false); // No spread for enemies
          enemy.shootCooldown = enemyProperties.shootingCooldown;
        }
      }
    } else {
      // Random movement when player not detected
      const newX = enemy.x + Math.cos(enemy.angle) * enemy.speed * 0.5;
      const newY = enemy.y + Math.sin(enemy.angle) * enemy.speed * 0.5;
      
      // Check border collisions before moving
      if (
        newX > borders.thickness + enemyProperties.width/2 && 
        newX < canvas.width - borders.thickness - enemyProperties.width/2 &&
        newY > borders.thickness + enemyProperties.height/2 && 
        newY < canvas.height - borders.thickness - enemyProperties.height/2
      ) {
        enemy.x = newX;
        enemy.y = newY;
      } else {
        // If would hit border, change direction
        enemy.angle += Math.PI / 2; // Turn 90 degrees when hitting a border
      }
      
      // Randomly change direction occasionally
      if (Math.random() < 0.01) {
        enemy.angle += (Math.random() - 0.5) * 0.5;
      }
    }
    
    // Decrease shooting cooldown
    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    }
  });
}

// Update tank position and rotation based on key states
function updateTank() {
  if (tank.isDestroyed) return;
  
  // Check invulnerability
  if (tank.isInvulnerable && Date.now() >= tank.invulnerabilityEnd) {
    tank.isInvulnerable = false;
  }
  
  // Rotation
  if (keys.ArrowLeft) {
    tank.angle -= tank.rotationSpeed;
  }
  if (keys.ArrowRight) {
    tank.angle += tank.rotationSpeed;
  }
  
  // Movement
  let newX = tank.x;
  let newY = tank.y;
  
  if (keys.ArrowUp) {
    newX += Math.cos(tank.angle) * tank.speed;
    newY += Math.sin(tank.angle) * tank.speed;
  }
  if (keys.ArrowDown) {
    newX -= Math.cos(tank.angle) * tank.speed * 0.6; // Slower backward movement
    newY -= Math.sin(tank.angle) * tank.speed * 0.6;
  }
  
  // Keep tank within borders
  if (
    newX > borders.thickness + tank.width/2 && 
    newX < canvas.width - borders.thickness - tank.width/2 &&
    newY > borders.thickness + tank.height/2 && 
    newY < canvas.height - borders.thickness - tank.height/2
  ) {
    tank.x = newX;
    tank.y = newY;
  }
  
  // Update barrel angle - intelligent targeting
  updateBarrelAngle();
  
  // Shooting
  if (keys[' ']) {
    // Use barrel angle for shooting, not tank angle
    shoot(tank.x, tank.y, tank.barrelAngle, false);
  }
}

// Intelligent barrel targeting
function updateBarrelAngle() {
  // Find closest enemy for targeting
  let closestEnemy = null;
  let closestDistance = Infinity;
  
  enemies.forEach(enemy => {
    const dx = enemy.x - tank.x;
    const dy = enemy.y - tank.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestEnemy = enemy;
    }
  });
  
  // If we have a target and it's within range, aim barrel at it
  if (closestEnemy && closestDistance < enemyProperties.detectionRange) {
    const dx = closestEnemy.x - tank.x;
    const dy = closestEnemy.y - tank.y;
    const targetAngle = Math.atan2(dy, dx);
    
    // Gradually rotate barrel to target
    const angleDiff = targetAngle - tank.barrelAngle;
    
    // Normalize angle difference to be between -PI and PI
    let normalizedDiff = angleDiff;
    while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    // Rotate at a fixed rate towards enemy
    if (normalizedDiff > 0.05) {
      tank.barrelAngle += tank.barrelRotationSpeed;
    } else if (normalizedDiff < -0.05) {
      tank.barrelAngle -= tank.barrelRotationSpeed;
    } else {
      tank.barrelAngle = targetAngle;
    }
  } else {
    // No target, gradually return to tank's angle
    const angleDiff = tank.angle - tank.barrelAngle;
    
    // Normalize angle difference to be between -PI and PI
    let normalizedDiff = angleDiff;
    while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    // Rotate back to tank's angle when no enemy
    if (normalizedDiff > 0.05) {
      tank.barrelAngle += tank.barrelRotationSpeed * 0.5;
    } else if (normalizedDiff < -0.05) {
      tank.barrelAngle -= tank.barrelRotationSpeed * 0.5;
    } else {
      tank.barrelAngle = tank.angle;
    }
  }
}

// End game
function endGame() {
  gameState.isGameOver = true;
  const finalScoreDisplay = document.getElementById('finalScore');
  finalScoreDisplay.textContent = gameState.score;
  const gameOverScreen = document.getElementById('gameOver');
  gameOverScreen.style.display = 'block';
}

// Check for level completion
function checkLevelComplete() {
  if (gameState.enemiesSpawned >= gameState.maxEnemies && enemies.length === 0 && !tank.isDestroyed) {
    gameState.score += 500; // Bonus for completing the level
    const scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.textContent = gameState.score;
    setTimeout(() => {
      endGame();
    }, 1000);
  }
}

// Initialize tank position
function initTank() {
  tank.x = canvas.width / 2;
  tank.y = canvas.height / 2;
  tank.angle = 0;
  tank.barrelAngle = 0;
  tank.health = tank.maxHealth;
  tank.isDestroyed = false;
  tank.isInvulnerable = false;
}

// Reset game state
function resetGame() {
  gameState.isGameOver = false;
  gameState.score = 0;
  gameState.enemiesSpawned = 0;
  gameState.lastSpawnTime = 0;
  
  // Reset arrays
  enemies.length = 0;
  bullets.length = 0;
  explosions.length = 0;
  healthPickups.length = 0;
  
  // Reset displays
  document.getElementById('healthDisplay').textContent = tank.maxHealth;
  document.getElementById('scoreDisplay').textContent = '0';
  document.getElementById('enemyCountDisplay').textContent = '0';
  document.getElementById('gameOver').style.display = 'none';
  
  // Reset tank
  initTank();
}

export {
  shoot,
  updateBullets,
  createExplosion,
  updateExplosions,
  dropHealthPickup,
  updateHealthPickups,
  spawnEnemy,
  updateEnemies,
  updateTank,
  endGame,
  checkLevelComplete,
  initTank,
  resetGame
};