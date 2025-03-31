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

// Track key states
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  ' ': false // Space
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

// Export all configurations
export {
  GAME_VERSION,
  canvas,
  ctx,
  gameState,
  tank,
  enemyProperties,
  bulletConfig,
  keys,
  borders,
  enemies,
  bullets,
  explosions,
  healthPickups
};