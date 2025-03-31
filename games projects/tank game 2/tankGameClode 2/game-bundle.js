// This is a bundle version of the game, with all modules combined
// Use this if you're having issues with ES6 modules

// ===== GAME CONFIG =====
// Tank Game Configuration
// Version 1.0.0

// Game version
const GAME_VERSION = '1.0.0';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const gameState = {
  isGameOver: false,
  score: 0,
  enemiesSpawned: 0,
  maxEnemies: 20,
  enemySpawnInterval: 2000, // milliseconds
  lastSpawnTime: 0,
  isGameStarted: false // Track whether the game has started
};

// Tank properties
const tank = {
  x: 0, // Will be set to center on game start
  y: 0, // Will be set to center on game start
  width: 80,
  height: 50,
  angle: 0,
  barrelAngle: 0, // Separate angle for the barrel
  barrelRotationSpeed: 0.08, // Speed at which barrel rotates
  speed: 3.5,
  rotationSpeed: 0.05,
  health: 100,
  maxHealth: 100,
  shootsToDestroy: 3, // Player can take 3 hits before being destroyed
  isDestroyed: false,
  isInvulnerable: false,
  invulnerabilityTime: 1000, // milliseconds of invulnerability after being hit
  invulnerabilityEnd: 0
};

// Enemy properties
const enemyProperties = {
  width: 70,
  height: 45,
  speed: 1,
  shootsToDestroy: 2, // Enemies take 2 hits to destroy
  shootingRange: 350, // Distance at which enemies will start shooting
  shootingCooldown: 150, // frames between shots (increased to make game easier)
  detectionRange: 500 // Distance at which enemies will start pursuing player
};

// Bullet properties
const bulletConfig = {
  speed: 10, // Increased from 8
  playerBulletSpeed: 12, // Faster bullets for player
  size: 5,
  lifespan: 90, // Increased from 60 to extend range
  playerLifespan: 120, // Extended range for player bullets
  spreadAngle: 0.1, // Angle in radians for bullet spread
  shootingCooldown: 8 // Reduced from 15 to increase fire rate
};

// Game border config
const borders = {
  thickness: 30,
  color: '#333',
  pattern: 'brick' // Options: 'brick', 'metal', 'concrete'
};

// Game containers
const enemies = [];
const bullets = [];
const explosions = [];
const healthPickups = [];

// ===== INPUT HANDLER =====

// Key state tracking
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  ' ': false
};

// Handle key events
function setupInputHandlers() {
  // Key press flags
  let upPressed = false;
  let downPressed = false;
  let leftPressed = false;
  let rightPressed = false;
  let spacePressed = false;
  
  // Update the keys object based on the flags
  function updateKeys() {
    keys.ArrowUp = upPressed;
    keys.ArrowDown = downPressed;
    keys.ArrowLeft = leftPressed;
    keys.ArrowRight = rightPressed;
    keys[' '] = spacePressed;
  }
  
  // Key down handler
  window.addEventListener('keydown', function(e) {
    switch(e.key) {
      case 'ArrowUp':
      case 'Up':
      case 'w':
      case 'W':
        upPressed = true;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'Down':
      case 's':
      case 'S':
        downPressed = true;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'Left':
      case 'a':
      case 'A':
        leftPressed = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'Right':
      case 'd':
      case 'D':
        rightPressed = true;
        e.preventDefault();
        break;
      case ' ':
        spacePressed = true;
        e.preventDefault();
        break;
    }
    updateKeys();
  });
  
  // Key up handler
  window.addEventListener('keyup', function(e) {
    switch(e.key) {
      case 'ArrowUp':
      case 'Up':
      case 'w':
      case 'W':
        upPressed = false;
        break;
      case 'ArrowDown':
      case 'Down':
      case 's':
      case 'S':
        downPressed = false;
        break;
      case 'ArrowLeft':
      case 'Left':
      case 'a':
      case 'A':
        leftPressed = false;
        break;
      case 'ArrowRight':
      case 'Right':
      case 'd':
      case 'D':
        rightPressed = false;
        break;
      case ' ':
        spacePressed = false;
        break;
    }
    updateKeys();
  });
  
  // Add resize event listener
  window.addEventListener('resize', resizeCanvas);
}
// Set canvas to full window size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Set up start button events
function setupStartButton() {
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', () => {
    console.log("Start button clicked");
    gameState.isGameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    resizeCanvas(); // Make sure canvas is correctly sized
    
    // Also make sure the tank is initialized in the right position
    // These should match the init function, but we're setting them again to be safe
    gameState.lastSpawnTime = performance.now();
  });
}

// ===== RENDERING =====
// Draw the tank (either player or enemy)
function drawTank(tankObj, isEnemy = false) {
  ctx.save();
  
  // Move to tank position
  ctx.translate(tankObj.x, tankObj.y);
  
  // For player tank, we'll draw the body at the tank angle, but the barrel at its own angle
  if (!isEnemy) {
    // Rotate for tank body
    ctx.rotate(tankObj.angle);
  } else {
    // For enemies, rotate everything together (keeping old behavior)
    ctx.rotate(tankObj.angle);
  }
  
  // Set colors based on type (player or enemy)
  let bodyColor, darkColor, trackColor, lightColor;
  
  if (isEnemy) {
    bodyColor = '#8B0000'; // Dark red
    darkColor = '#660000'; // Darker red
    trackColor = '#333333'; // Dark grey
    lightColor = '#CC0000'; // Lighter red
    
    // Draw enemy health bar
    const healthPercent = tankObj.health / (enemyProperties.shootsToDestroy * 50);
    drawHealthBar(0, -tankObj.height/2 - 15, tankObj.width, 5, healthPercent, '#FF0000');
  } else {
    bodyColor = '#3c6e45'; // Green
    darkColor = '#2c4a32'; // Dark green
    trackColor = '#2d3025'; // Dark grey
    lightColor = '#69a575'; // Light green
    
    // Flash white if invulnerable
    if (tankObj.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      bodyColor = '#FFFFFF';
      darkColor = '#CCCCCC';
      lightColor = '#FFFFFF';
    }
  }
  
  // Tank tracks
  ctx.fillStyle = trackColor;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  
  // Bottom track
  ctx.fillRect(-tankObj.width/2, tankObj.height/4, tankObj.width, tankObj.height/4);
  ctx.strokeRect(-tankObj.width/2, tankObj.height/4, tankObj.width, tankObj.height/4);
  
  // Top track
  ctx.fillRect(-tankObj.width/2, -tankObj.height/2, tankObj.width, tankObj.height/4);
  ctx.strokeRect(-tankObj.width/2, -tankObj.height/2, tankObj.width, tankObj.height/4);
  
  // Track details
  ctx.lineWidth = 1;
  const segmentCount = 9;
  const segmentWidth = tankObj.width / segmentCount;
  
  for (let i = 0; i < segmentCount; i++) {
    const x = -tankObj.width/2 + i * segmentWidth + segmentWidth/2;
    
    // Bottom track segments
    ctx.beginPath();
    ctx.moveTo(x, tankObj.height/4);
    ctx.lineTo(x, tankObj.height/2);
    ctx.stroke();
    
    // Top track segments
    ctx.beginPath();
    ctx.moveTo(x, -tankObj.height/2);
    ctx.lineTo(x, -tankObj.height/4);
    ctx.stroke();
  }
  
  // Tank body
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tankObj.width/2 + 10, -tankObj.height/4, tankObj.width - 20, tankObj.height/2, 5);
  ctx.fill();
  ctx.stroke();
  
  // Save state before drawing turret (for player tank)
  if (!isEnemy) {
    ctx.save();
    // Reset rotation and apply barrel's angle
    ctx.rotate(-tankObj.angle + tankObj.barrelAngle);
  }
  
  // Turret
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, tankObj.height/4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Turret details
  ctx.fillStyle = lightColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, tankObj.height/6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Cannon
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.fillRect(0, -tankObj.height/20, tankObj.width/2, tankObj.height/10);
  ctx.strokeRect(0, -tankObj.height/20, tankObj.width/2, tankObj.height/10);
  
  // Cannon tip
  ctx.fillRect(tankObj.width/2, -tankObj.height/16, tankObj.width/20, tankObj.height/8);
  ctx.strokeRect(tankObj.width/2, -tankObj.height/16, tankObj.width/20, tankObj.height/8);
  
  // Restore state for player tank (after drawing barrel)
  if (!isEnemy) {
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw a health bar
function drawHealthBar(x, y, width, height, fillPercent, color) {
  ctx.save();
  
  // Health bar background
  ctx.fillStyle = '#333333';
  ctx.fillRect(x - width/2, y, width, height);
  
  // Health fill
  ctx.fillStyle = color;
  ctx.fillRect(x - width/2, y, width * fillPercent, height);
  
  // Health bar border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width/2, y, width, height);
  
  ctx.restore();
}

// Draw all bullets
function drawBullets() {
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size || 5, 0, Math.PI * 2);
    
    if (bullet.isEnemy) {
      ctx.fillStyle = '#FF0000'; // Red for enemy bullets
    } else {
      ctx.fillStyle = '#FFFF00'; // Yellow for player bullets
    }
    
    ctx.fill();
    
    // Add a trail effect for player bullets
    if (!bullet.isEnemy) {
      const trailLength = 5;
      const trailX = bullet.x - Math.cos(bullet.angle) * trailLength;
      const trailY = bullet.y - Math.sin(bullet.angle) * trailLength;
      
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(trailX, trailY);
      ctx.strokeStyle = '#FFAA00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Draw all explosions
function drawExplosions() {
  explosions.forEach(particle => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (particle.lifespan / particle.maxLifespan), 0, Math.PI * 2);
    
    // Fade from color to yellow to white
    const fadeRatio = particle.lifespan / particle.maxLifespan;
    if (fadeRatio > 0.6) {
      ctx.fillStyle = particle.color;
    } else if (fadeRatio > 0.3) {
      ctx.fillStyle = '#FFA500'; // Orange
    } else {
      ctx.fillStyle = '#FFFFFF'; // White
    }
    
    ctx.fill();
  });
}

// Draw health pickups
function drawHealthPickups() {
  ctx.save();
  
  healthPickups.forEach(pickup => {
    // Draw cross symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    
    // Horizontal bar
    ctx.fillRect(pickup.x - pickup.width/2, pickup.y - pickup.height/6, pickup.width, pickup.height/3);
    
    // Vertical bar
    ctx.fillRect(pickup.x - pickup.width/6, pickup.y - pickup.height/2, pickup.width/3, pickup.height);
    
    // Outline
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.width/2, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  ctx.restore();
}

// Draw game borders
function drawBorders() {
  ctx.save();
  
  const { thickness, color, pattern } = borders;
  
  // Draw four borders around the canvas
  ctx.fillStyle = color;
  
  // Top border
  ctx.fillRect(0, 0, canvas.width, thickness);
  
  // Bottom border
  ctx.fillRect(0, canvas.height - thickness, canvas.width, thickness);
  
  // Left border
  ctx.fillRect(0, 0, thickness, canvas.height);
  
  // Right border
  ctx.fillRect(canvas.width - thickness, 0, thickness, canvas.height);
  
  // Add pattern based on border type
  if (pattern === 'brick') {
    drawBrickPattern();
  } else if (pattern === 'metal') {
    drawMetalPattern();
  } else if (pattern === 'concrete') {
    drawConcretePattern();
  }
  
  ctx.restore();
}

// Draw brick pattern
function drawBrickPattern() {
  const { thickness } = borders;
  
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  
  // Horizontal lines
  const brickHeight = thickness / 3;
  for (let y = brickHeight; y < thickness; y += brickHeight) {
    // Top border
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    
    // Bottom border
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - thickness + y);
    ctx.lineTo(canvas.width, canvas.height - thickness + y);
    ctx.stroke();
  }
  
  // Vertical lines
  const brickWidth = thickness * 2;
  for (let y = 0; y < canvas.height; y += brickHeight) {
    // Left border bricks
    for (let x = 0; x < canvas.width; x += brickWidth) {
      // Offset every other row
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      
      ctx.beginPath();
      ctx.moveTo(offset + x, Math.max(0, y));
      ctx.lineTo(offset + x, Math.min(y + brickHeight, thickness));
      ctx.stroke();
      
      // Bottom section
      if (y >= canvas.height - thickness) {
        ctx.beginPath();
        ctx.moveTo(offset + x, canvas.height - thickness + Math.max(0, y - (canvas.height - thickness)));
        ctx.lineTo(offset + x, Math.min(y + brickHeight, canvas.height));
        ctx.stroke();
      }
    }
    
    // Right and left side bricks
    if (y < canvas.height) {
      // Left side
      ctx.beginPath();
      ctx.moveTo(thickness, y);
      ctx.lineTo(thickness, Math.min(y + brickHeight, canvas.height));
      ctx.stroke();
      
      // Right side
      ctx.beginPath();
      ctx.moveTo(canvas.width - thickness, y);
      ctx.lineTo(canvas.width - thickness, Math.min(y + brickHeight, canvas.height));
      ctx.stroke();
    }
  }
}

// Draw metal pattern (simpler alternative)
function drawMetalPattern() {
  const { thickness } = borders;
  
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  
  // Diagonal lines for metal texture
  const lineSpacing = 10;
  
  // Draw on all four borders
  
  // Top border
  for (let x = -thickness; x < canvas.width + thickness; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + thickness, thickness);
    ctx.stroke();
  }
  
  // Bottom border
  for (let x = -thickness; x < canvas.width + thickness; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - thickness);
    ctx.lineTo(x + thickness, canvas.height);
    ctx.stroke();
  }
  
  // Left border
  for (let y = -thickness; y < canvas.height + thickness; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(thickness, y + thickness);
    ctx.stroke();
  }
  
  // Right border
  for (let y = -thickness; y < canvas.height + thickness; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(canvas.width - thickness, y);
    ctx.lineTo(canvas.width, y + thickness);
    ctx.stroke();
  }
}

// Draw concrete pattern
function drawConcretePattern() {
  const { thickness } = borders;
  
  // Add speckles for concrete texture
  ctx.fillStyle = '#555';
  
  const speckleCount = thickness * 10;
  
  // Top border
  for (let i = 0; i < speckleCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * thickness;
    const size = 1 + Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Bottom border
  for (let i = 0; i < speckleCount; i++) {
    const x = Math.random() * canvas.width;
    const y = canvas.height - thickness + Math.random() * thickness;
    const size = 1 + Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Left border
  for (let i = 0; i < speckleCount; i++) {
    const x = Math.random() * thickness;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Right border
  for (let i = 0; i < speckleCount; i++) {
    const x = canvas.width - thickness + Math.random() * thickness;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Render hit animation on player
function renderHitAnimation() {
  if (tank.isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    
    // Draw hit flash
    ctx.beginPath();
    ctx.arc(0, 0, tank.width/1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
}

// ===== GAME MECHANICS =====
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
    newX -= Math.cos(tank.angle) * tank.speed; 
    newY -= Math.sin(tank.angle) * tank.speed;
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
    // REMOVE THIS ENTIRE ELSE BLOCK that makes the barrel return to tank angle
    // No target, gradually return to tank's angle
    // const angleDiff = tank.angle - tank.barrelAngle;
    
    // Normalize angle difference to be between -PI and PI
    // let normalizedDiff = angleDiff;
    // while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    // while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    // Rotate back to tank's angle when no enemy
    // if (normalizedDiff > 0.05) {
    //   tank.barrelAngle += tank.barrelRotationSpeed * 0.5;
    // } else if (normalizedDiff < -0.05) {
    //   tank.barrelAngle -= tank.barrelRotationSpeed * 0.5;
    // } else {
    //   tank.barrelAngle = tank.angle;
    // }
    
    // REPLACE WITH THIS:
    // No target, keep current barrel angle
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

// ===== GAME LOOP =====
// Main game loop
function gameLoop(timestamp) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw borders regardless of game state
  drawBorders();
    
  // Only update game if game is started and not over
  if (gameState.isGameStarted && !gameState.isGameOver) {
    // Spawn enemies
    if (timestamp - gameState.lastSpawnTime > gameState.enemySpawnInterval && 
        gameState.enemiesSpawned < gameState.maxEnemies) {
      spawnEnemy();
      gameState.lastSpawnTime = timestamp;
    }
    
    // Update game objects
    updateTank();
    updateEnemies();
    updateBullets();
    updateExplosions();
    updateHealthPickups();
    
    // Check if level is complete
    checkLevelComplete();
    
    // Draw game objects
    drawBullets();
    if (!tank.isDestroyed) {
      drawTank(tank);
      renderHitAnimation();
    }
    
    // Draw enemies
    enemies.forEach(enemy => drawTank(enemy, true));
    
    // Draw effects
    drawExplosions();
    drawHealthPickups();
  }
  
  // Continue loop
  requestAnimationFrame(gameLoop);
}

// ===== INITIALIZATION =====
// Initialize the game
function initGame() {
  console.log("Game initializing, version:", GAME_VERSION);
  
  // Display version in both places
  document.getElementById('gameVersion').textContent = GAME_VERSION;
  document.getElementById('versionDisplay').textContent = GAME_VERSION;
  
  // Set up event listeners
  setupInputHandlers();
  setupStartButton();
  
  // Set initial canvas size
  resizeCanvas();
  
  // Initialize tank position
  initTank();
  
  // Reset game state
  resetGame();
  
  // Start game loop
  gameState.lastSpawnTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Start everything when the page loads
window.addEventListener('load', initGame);