// Main Game Loop
import { 
  gameState, 
  canvas, 
  ctx, 
  tank 
} from './game-config.js';

import { 
  updateTank, 
  updateEnemies, 
  updateBullets, 
  updateExplosions, 
  updateHealthPickups,
  spawnEnemy, 
  checkLevelComplete 
} from './game-mechanics.js';

import { 
  drawTank, 
  drawBullets, 
  drawExplosions, 
  drawHealthPickups, 
  drawBorders,
  renderHitAnimation
} from './render.js';

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
    const enemies = window.enemies || []; // Import from game-config
    enemies.forEach(enemy => drawTank(enemy, true));
    
    // Draw effects
    drawExplosions();
    drawHealthPickups();
  }
  
  // Continue loop
  requestAnimationFrame(gameLoop);
}

export { gameLoop };