class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        
        this.width = 20;
        this.height = 30;
        
        this.mass = 1000;
        this.fuel = 400;
        this.maxFuel = 400;
        
        this.thrustPower = 80;
        this.lateralThrustPower = 30;
        this.angularThrustPower = 3;
        
        this.mainThrusterActive = false;
        this.leftThrusterActive = false;
        this.rightThrusterActive = false;
        
        this.crashed = false;
        this.landed = false;
        
        this.engineParticles = [];
        this.explosionParticles = [];
    }
    
    update(deltaTime, gravity) {
        const dt = deltaTime / 1000;
        
        if (this.crashed) {
            this.updateExplosionParticles(dt);
            return;
        }
        
        if (this.landed) return;
        
        if (this.fuel > 0) {
            if (this.mainThrusterActive) {
                const thrustX = Math.sin(this.angle) * this.thrustPower;
                const thrustY = -Math.cos(this.angle) * this.thrustPower;
                
                this.vx += thrustX * dt;
                this.vy += thrustY * dt;
                
                this.fuel = Math.max(0, this.fuel - 0.3);
                
                this.createEngineParticles('main');
            }
            
            if (this.leftThrusterActive) {
                this.angularVelocity += this.angularThrustPower * dt;
                this.vx += Math.cos(this.angle) * this.lateralThrustPower * dt * 0.5;
                this.vy += Math.sin(this.angle) * this.lateralThrustPower * dt * 0.5;
                
                this.fuel = Math.max(0, this.fuel - 0.15);
                
                this.createEngineParticles('left');
            }
            
            if (this.rightThrusterActive) {
                this.angularVelocity -= this.angularThrustPower * dt;
                this.vx -= Math.cos(this.angle) * this.lateralThrustPower * dt * 0.5;
                this.vy -= Math.sin(this.angle) * this.lateralThrustPower * dt * 0.5;
                
                this.fuel = Math.max(0, this.fuel - 0.15);
                
                this.createEngineParticles('right');
            }
        }
        
        this.vy += gravity * dt;
        
        this.angle += this.angularVelocity * dt;
        this.angularVelocity *= 0.98;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.updateEngineParticles(dt);
        this.updateExplosionParticles(dt);
    }
    
    createEngineParticles(type) {
        const particleCount = type === 'main' ? 3 : 2;
        
        for (let i = 0; i < particleCount; i++) {
            let px = this.x;
            let py = this.y;
            let pvx = 0;
            let pvy = 0;
            
            if (type === 'main') {
                px = this.x - Math.sin(this.angle) * this.height / 2;
                py = this.y + Math.cos(this.angle) * this.height / 2;
                
                const spread = 0.3;
                pvx = this.vx - Math.sin(this.angle + (Math.random() - 0.5) * spread) * 100;
                pvy = this.vy + Math.cos(this.angle + (Math.random() - 0.5) * spread) * 100;
            } else if (type === 'left') {
                // Left thruster is on the left side of the ship
                px = this.x - Math.cos(this.angle) * this.width / 3;
                py = this.y - Math.sin(this.angle) * this.width / 3;
                
                // Flame points LEFT (negative direction)
                pvx = this.vx - Math.cos(this.angle) * 50;
                pvy = this.vy - Math.sin(this.angle) * 50;
            } else if (type === 'right') {
                // Right thruster is on the right side of the ship
                px = this.x + Math.cos(this.angle) * this.width / 3;
                py = this.y + Math.sin(this.angle) * this.width / 3;
                
                // Flame points RIGHT (positive direction)
                pvx = this.vx + Math.cos(this.angle) * 50;
                pvy = this.vy + Math.sin(this.angle) * 50;
            }
            
            this.engineParticles.push({
                x: px,
                y: py,
                vx: pvx + (Math.random() - 0.5) * 20,
                vy: pvy + (Math.random() - 0.5) * 20,
                life: 1.0,
                maxLife: 1.0,
                size: Math.random() * 3 + 2,
                type: type
            });
        }
    }
    
    updateEngineParticles(dt) {
        this.engineParticles = this.engineParticles.filter(particle => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt * 2;
            particle.size *= 0.98;
            
            return particle.life > 0;
        });
    }
    
    createExplosion() {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.explosionParticles.push({
                x: this.x,
                y: this.y,
                vx: vx + (Math.random() - 0.5) * 50,
                vy: vy + (Math.random() - 0.5) * 50,
                life: 1.0,
                maxLife: 1.0,
                size: Math.random() * 8 + 4,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
            });
        }
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 300 + 200;
            
            this.explosionParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                size: Math.random() * 12 + 6,
                color: '#ffffff'
            });
        }
    }
    
    updateExplosionParticles(dt) {
        this.explosionParticles = this.explosionParticles.filter(particle => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 200 * dt;
            particle.life -= dt * 1.5;
            particle.size *= 0.95;
            
            return particle.life > 0;
        });
    }
    
    draw(ctx) {
        // Draw engine particles FIRST (in world coordinates, before ship rotation)
        this.engineParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            if (particle.type === 'main') {
                ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
            }
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw explosion particles
        this.explosionParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        if (this.crashed) return;
        
        // Now draw the ship with rotation
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.strokeStyle = '#00ff00';
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.lineTo(-this.width/4, this.height/3);
        ctx.lineTo(0, this.height/4);
        ctx.lineTo(this.width/4, this.height/3);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, -this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.fuel > 0) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            
            if (this.mainThrusterActive) {
                ctx.beginPath();
                ctx.moveTo(-this.width/4, this.height/3);
                ctx.lineTo(0, this.height/2 + Math.random() * 10 + 10);
                ctx.lineTo(this.width/4, this.height/3);
                ctx.stroke();
            }
            
            if (this.leftThrusterActive) {
                // Left thruster on left side (negative x), flame points left (negative x)
                ctx.beginPath();
                ctx.moveTo(-this.width/3, 0);
                ctx.lineTo(-this.width/2 - Math.random() * 5 - 5, 0);
                ctx.stroke();
            }
            
            if (this.rightThrusterActive) {
                // Right thruster on right side (positive x), flame points right (positive x)
                ctx.beginPath();
                ctx.moveTo(this.width/3, 0);
                ctx.lineTo(this.width/2 + Math.random() * 5 + 5, 0);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    
    getVertices() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        const vertices = [
            {x: 0, y: -this.height/2},
            {x: -this.width/2, y: this.height/2},
            {x: -this.width/4, y: this.height/3},
            {x: 0, y: this.height/4},
            {x: this.width/4, y: this.height/3},
            {x: this.width/2, y: this.height/2}
        ];
        
        return vertices.map(v => ({
            x: this.x + v.x * cos - v.y * sin,
            y: this.y + v.x * sin + v.y * cos
        }));
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.ship = new Ship(this.canvas.width / 2, 100);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, 1);
        
        this.gravity = 30;
        this.score = 0;
        this.level = 1;
        this.paused = false;
        this.gameOver = false;
        this.landingProcessed = false;
        this.landingProcessed = false;
        
        this.keys = {};
        this.setupControls();
        
        this.lastTime = 0;
        this.parallaxOffset = 0;
        this.animationId = null;
        
        this.gameLoop();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.terrain) {
            this.terrain.width = this.canvas.width;
            this.terrain.height = this.canvas.height;
            this.terrain.generateTerrain();
        }
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.paused = !this.paused;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    handleInput() {
        this.ship.mainThrusterActive = this.keys['ArrowUp'];
        this.ship.leftThrusterActive = this.keys['ArrowRight'];
        this.ship.rightThrusterActive = this.keys['ArrowLeft'];
    }
    
    update(deltaTime) {
        if (this.paused) return;
        
        // Continue updating explosion particles even after game over
        if (this.gameOver) {
            if (this.ship && this.ship.crashed) {
                this.ship.update(deltaTime, this.gravity);
            }
            return;
        }
        
        this.handleInput();
        
        this.ship.update(deltaTime, this.gravity);
        
        const collision = this.terrain.checkCollision(this.ship);
        if (collision.collision && !this.landingProcessed) {
            this.landingProcessed = true;
            
            if (collision.success) {
                this.ship.landed = true;
                this.score += Math.floor(1000 * (1 + this.level * 0.5));
                this.score += Math.floor(this.ship.fuel * 10);
                
                this.showGameMessage('PERFECT LANDING! Next level...', false, true, false);
                
                // Pause game physics immediately after landing
                this.ship.landed = true;
                
                setTimeout(() => {
                    this.nextLevel();
                }, 2000);
            } else if (collision.outOfBounds) {
                this.ship.crashed = true;
                this.ship.createExplosion();
                this.gameOver = true;
                this.showGameMessage('LOST IN SPACE!', true);
            } else {
                this.ship.crashed = true;
                this.ship.createExplosion();
                this.gameOver = true;
                this.showGameMessage('CRASHED!', true);
            }
        }
        
        if (this.ship.y > this.canvas.height + 100) {
            this.ship.crashed = true;
            this.ship.createExplosion();
            this.gameOver = true;
            this.showGameMessage('LOST IN SPACE!', true);
        }
        
        this.parallaxOffset = this.ship.x * 0.1;
        this.updateParallax();
        
        this.updateHUD();
    }
    
    updateParallax() {
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach((layer, index) => {
            const speed = parseFloat(layer.dataset.speed);
            const offset = this.parallaxOffset * speed;
            layer.style.transform = `translateX(${-offset}px)`;
        });
    }
    
    updateHUD() {
        const fuelPercentage = Math.floor((this.ship.fuel / this.ship.maxFuel) * 100);
        document.getElementById('fuel').textContent = `${fuelPercentage}%`;
        document.getElementById('velocity').textContent = `${this.ship.getSpeed().toFixed(1)} m/s`;
        document.getElementById('altitude').textContent = `${Math.floor(this.canvas.height - this.ship.y)}m`;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        // Update environment name
        const environments = ['Moon', 'Mars', 'Underwater', 'Ice Planet', 'Volcanic', 'Forest', 'Desert', 'Alien World'];
        const envIndex = (this.level - 1) % 8;
        document.getElementById('environment').textContent = environments[envIndex];
        
        // Landing indicators
        const verticalSpeed = Math.abs(this.ship.vy);
        const horizontalSpeed = Math.abs(this.ship.vx);
        const inclination = Math.abs(this.ship.angle) * (180 / Math.PI);
        
        const verticalOk = verticalSpeed < 20;
        const horizontalOk = horizontalSpeed < 20;
        const inclinationOk = inclination < 17; // ~0.3 radians
        
        document.getElementById('verticalSpeed').textContent = `${verticalSpeed.toFixed(1)} m/s`;
        document.getElementById('verticalSpeed').className = verticalOk ? 'hud-good' : 'hud-bad';
        
        document.getElementById('horizontalSpeed').textContent = `${horizontalSpeed.toFixed(1)} m/s`;
        document.getElementById('horizontalSpeed').className = horizontalOk ? 'hud-good' : 'hud-bad';
        
        document.getElementById('inclination').textContent = `${inclination.toFixed(1)}°`;
        document.getElementById('inclination').className = inclinationOk ? 'hud-good' : 'hud-bad';
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.terrain.draw(this.ctx);
        this.ship.draw(this.ctx);
        
        if (this.paused && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '32px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    showGameMessage(message, isDanger, showScore = false, autoHide = true) {
        const overlay = document.getElementById('gameOverlay');
        const messageEl = document.getElementById('gameMessage');
        const restartBtn = document.getElementById('restartBtn');
        
        if (showScore && !isDanger) {
            const fuelBonus = Math.floor(this.ship.fuel * 10);
            const levelBonus = Math.floor(1000 * (1 + this.level * 0.5));
            const totalBonus = fuelBonus + levelBonus;
            
            messageEl.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 15px;">${message}</div>
                <div style="font-size: 16px; color: #00ff00;">
                    <div>Level Bonus: +${levelBonus}</div>
                    <div>Fuel Bonus: +${fuelBonus}</div>
                    <div style="border-top: 1px solid #00ff00; margin-top: 8px; padding-top: 8px;">
                        <strong>Total: +${totalBonus}</strong>
                    </div>
                </div>
            `;
        } else {
            messageEl.textContent = message;
        }
        
        messageEl.className = isDanger ? 'danger' : '';
        
        // Change button text based on game state
        if (!isDanger) {
            restartBtn.textContent = 'Next Level';
        } else {
            restartBtn.textContent = 'Restart';
        }
        
        overlay.classList.remove('hidden');
        
        // Only auto-hide for crashes, not for successful landings
        if (!isDanger && autoHide) {
            setTimeout(() => {
                overlay.classList.add('hidden');
                restartBtn.textContent = 'Restart'; // Reset button text
            }, 3000); // Longer display for score breakdown
        }
    }
    
    nextLevel() {
        // Stop game loop immediately
        this.stopGameLoop();
        
        this.level++;
        this.landingProcessed = false;
        this.gravity = Math.min(30 + this.level * 2, 50);
        
        // Show loading screen
        const overlay = document.getElementById('gameOverlay');
        const messageEl = document.getElementById('gameMessage');
        const restartBtn = document.getElementById('restartBtn');
        
        messageEl.textContent = 'Loading Level ' + this.level + '...';
        restartBtn.style.display = 'none';
        overlay.classList.remove('hidden');
        
        // Create new terrain while game loop is stopped
        this.ship = new Ship(this.canvas.width / 2, 100);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this.level);
        
        // Clear and draw new terrain once
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.terrain.draw(this.ctx);
        this.ship.draw(this.ctx);
        
        // Reset timing
        this.lastTime = 0;
        
        // Update HUD with new level info
        this.updateHUD();
        
        // Restart game loop
        this.gameLoop();
        
        // Use requestAnimationFrame to ensure browser renders before hiding
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                restartBtn.style.display = 'block';
                restartBtn.textContent = 'Restart';
                overlay.classList.add('hidden');
            });
        });
    }
    
    restart() {
        // Stop game loop if running
        this.stopGameLoop();
        
        // Properly reset ship with fresh state
        this.ship = new Ship(this.canvas.width / 2, 100);
        
        // Regenerate terrain for current level
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this.level);
        
        // Reset game state
        this.gravity = Math.min(30 + this.level * 2, 50);
        this.score = 0;
        this.paused = false;
        this.gameOver = false;
        this.landingProcessed = false;
        
        // Reset timing
        this.lastTime = 0;
        
        // Reset button text and hide overlay
        document.getElementById('restartBtn').textContent = 'Restart';
        document.getElementById('gameOverlay').classList.add('hidden');
        this.updateHUD();
        
        // Restart game loop
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (deltaTime < 100) {
            this.update(deltaTime);
        }
        
        this.draw();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

window.addEventListener('load', () => {
    new Game();
});