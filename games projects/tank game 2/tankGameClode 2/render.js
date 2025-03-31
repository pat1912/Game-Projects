// Rendering System
import { 
  ctx, 
  tank, 
  enemies, 
  bullets, 
  explosions, 
  healthPickups, 
  borders, 
  enemyProperties,
  canvas
} from './game-config.js';

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

export { 
  drawTank, 
  drawHealthBar, 
  drawBullets, 
  drawExplosions, 
  drawHealthPickups, 
  drawBorders,
  renderHitAnimation
};