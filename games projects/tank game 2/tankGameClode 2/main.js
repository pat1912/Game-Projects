// Main Application
import { GAME_VERSION, gameState, tank, canvas } from './game-config.js';
import { setupInputHandlers, resizeCanvas, setupStartButton } from './input-handler.js';
import { gameLoop } from './game-loop.js';
import { initTank, resetGame } from './game-mechanics.js';

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