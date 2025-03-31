// Input Handler
import { keys, gameState } from './game-config.js';

// Handle key events
function setupInputHandlers() {
  window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
      keys[e.key] = true;
      e.preventDefault(); // Prevent scrolling with arrow keys
    }
  });

  window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
      keys[e.key] = false;
    }
  });
  
  // Add resize event listener
  window.addEventListener('resize', resizeCanvas);
}

// Set canvas to full window size
function resizeCanvas() {
  const canvas = document.getElementById('gameCanvas');
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
    const canvas = document.getElementById('gameCanvas');
    // These should match the init function, but we're setting them again to be safe
    gameState.lastSpawnTime = performance.now();
  });
}

export { setupInputHandlers, resizeCanvas, setupStartButton };