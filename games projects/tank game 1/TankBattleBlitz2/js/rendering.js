// Rendering Functions

function drawTank(tank) {
    if (tank.destroyed) {
        if (tank.explosionParticles.length === 0 && tank.explosionFrame === 0) {
            for (let i = 0; i < 30; i++) {
                tank.explosionParticles.push({
                    x: tank.x + tank.width / 2,
                    y: tank.y + tank.height / 2,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    radius: Math.random() * 5 + 2,
                    alpha: 1
                });
            }
            tank.explosionFrame++;
        }
        tank.explosionParticles.forEach(particle => {
            ctx.fillStyle = EXPLOSION_COLOR_END.replace("alpha", particle.alpha);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.03;
            particle.radius *= 0.95;
        });
        tank.explosionParticles = tank.explosionParticles.filter(p => p.alpha > 0);
        return;
    }

    ctx.save();
    ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
    ctx.rotate(tank.bodyAngle * Math.PI / 180);
    ctx.translate(-tank.width / 2, -tank.height / 2);

    ctx.fillStyle = tank.hitTimer > 0 ? "white" : tank.color;
    if (tank.hitTimer > 0) tank.hitTimer--;
    ctx.beginPath();
    ctx.roundRect(6, 6, tank.width - 12, tank.height - 12, [8]);
    ctx.fill();

    ctx.fillStyle = TANK_TREAD_COLOR;
    const treadY = 12 + (tank.treadOffset % 6);
    ctx.fillRect(2, treadY, 10, 12);
    ctx.fillRect(tank.width - 12, treadY, 10, 12);

    const turretX = tank.width / 2;
    const turretY = tank.height / 2;
    const barrelLength = tank.width * 0.6;
    const barrelWidth = 10;
    const barrelTipX = turretX + Math.cos(tank.angle * Math.PI / 180) * barrelLength;
    const barrelTipY = turretY - Math.sin(tank.angle * Math.PI / 180) * barrelLength;

    ctx.fillStyle = TANK_TREAD_COLOR;
    ctx.beginPath();
    ctx.moveTo(turretX - barrelWidth / 2, turretY);
    ctx.lineTo(turretX + barrelWidth / 2, turretY);
    ctx.lineTo(barrelTipX, barrelTipY);
    ctx.lineTo(turretX - barrelWidth / 2, turretY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(turretX, turretY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(8, 8, tank.width - 16, 4);

    ctx.restore();

    tank.bullets.forEach(bullet => {
        ctx.fillStyle = BULLET_COLOR;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

/*
function drawTank(tank) {
	ctx.save();
	// Move to tank position and rotate
	ctx.translate(tank.x, tank.y);
	ctx.rotate(tank.angle);

	// Base green colors
	const bodyColor = '#3c6e45';
	const darkColor = '#2c4a32';
	const trackColor = '#2d3025';
	const lightColor = '#69a575';

	// Tank tracks
	ctx.fillStyle = trackColor;
	ctx.strokeStyle = darkColor;
	ctx.lineWidth = 2;

	// Bottom track
	ctx.fillRect(-tank.width/2, tank.height/4, tank.width, tank.height/4);
	ctx.strokeRect(-tank.width/2, tank.height/4, tank.width, tank.height/4);

	// Top track
	ctx.fillRect(-tank.width/2, -tank.height/2, tank.width, tank.height/4);
	ctx.strokeRect(-tank.width/2, -tank.height/2, tank.width, tank.height/4);

	// Track details
	ctx.lineWidth = 1;
	const segmentCount = 9;
	const segmentWidth = tank.width / segmentCount;

	for (let i = 0; i < segmentCount; i++) {
		const x = -tank.width/2 + i * segmentWidth + segmentWidth/2;

		// Bottom track segments
		ctx.beginPath();
		ctx.moveTo(x, tank.height/4);
		ctx.lineTo(x, tank.height/2);
		ctx.stroke();

		// Top track segments
		ctx.beginPath();
		ctx.moveTo(x, -tank.height/2);
		ctx.lineTo(x, -tank.height/4);
		ctx.stroke();
	}

	// Tank body
	ctx.fillStyle = bodyColor;
	ctx.strokeStyle = darkColor;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.roundRect(-tank.width/2 + 10, -tank.height/4, tank.width - 20, tank.height/2, 5);
	ctx.fill();
	ctx.stroke();

	// Turret
	ctx.fillStyle = bodyColor;
	ctx.beginPath();
	ctx.arc(0, 0, tank.height/4, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	// Turret details
	ctx.fillStyle = lightColor;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(0, 0, tank.height/6, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	// Cannon
	ctx.fillStyle = bodyColor;
	ctx.strokeStyle = darkColor;
	ctx.lineWidth = 2;
	ctx.fillRect(0, -tank.height/20, tank.width/2, tank.height/10);
	ctx.strokeRect(0, -tank.height/20, tank.width/2, tank.height/10);

	// Cannon tip
	ctx.fillRect(tank.width/2, -tank.height/16, tank.width/20, tank.height/8);
	ctx.strokeRect(tank.width/2, -tank.height/16, tank.width/20, tank.height/8);

	ctx.restore();
}
*/

function drawObstacle(obstacle) {
    ctx.fillStyle = obstacle.color;
    if (obstacle.shape === "roundedSquare") {
        ctx.beginPath();
        ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, [obstacle.borderRadius]);
        ctx.fill();
    } else if (obstacle.shape === "rectangle") {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else if (obstacle.shape === "circle") {
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.radius, obstacle.y + obstacle.radius, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderGame() {
    ctx.fillStyle = level === 1 ? DESERT_BG : level === 2 ? FOREST_BG : VOLCANIC_BG;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    obstacles.forEach(drawObstacle);
    drawTank(player);
    enemies.forEach(drawTank);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, 150, 120);
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 60);
    ctx.fillText(`Health: ${player.health}`, 10, 90);

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = "red";
        ctx.font = "52px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Game Over!`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
        ctx.font = "32px Arial";
        ctx.fillText(`Level: ${level}  Score: ${score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 10);
        ctx.fillStyle = "lightgray";
        ctx.font = "24px Arial";
        ctx.fillText("Press R to Restart", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        ctx.textAlign = "left";
    } else if (gameWon) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = "gold";
        ctx.font = "52px Arial";
        ctx.textAlign = "center";
        ctx.fillText("You Win!", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 70);
        ctx.font = "32px Arial";
        ctx.fillText(`Final Score: ${score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 10);
        ctx.fillStyle = "lightgray";
        ctx.font = "24px Arial";
        ctx.fillText("Press R to Restart", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 40);
        ctx.textAlign = "left";
    }
}