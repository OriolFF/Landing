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
                px = this.x + Math.cos(this.angle) * this.width / 3;
                py = this.y + Math.sin(this.angle) * this.width / 3;
                
                pvx = this.vx - Math.cos(this.angle) * 50;
                pvy = this.vy - Math.sin(this.angle) * 50;
            } else if (type === 'right') {
                px = this.x - Math.cos(this.angle) * this.width / 3;
                py = this.y - Math.sin(this.angle) * this.width / 3;
                
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
        this.explosionParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        if (this.crashed) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        this.engineParticles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x - this.x, particle.y - this.y);
            
            const alpha = particle.life / particle.maxLife;
            if (particle.type === 'main') {
                ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
            }
            
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
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
                ctx.beginPath();
                ctx.moveTo(this.width/3, 0);
                ctx.lineTo(this.width/2 + Math.random() * 5 + 5, 0);
                ctx.stroke();
            }
            
            if (this.rightThrusterActive) {
                ctx.beginPath();
                ctx.moveTo(-this.width/3, 0);
                ctx.lineTo(-this.width/2 - Math.random() * 5 - 5, 0);
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

class Terrain {
    constructor(width, height, level = 1) {
        this.width = width;
        this.height = height;
        this.level = level;
        this.points = [];
        this.landingPads = [];
        
        this.generateTerrain();
    }
    
    generateTerrain() {
        // Clear everything
        this.points = [];
        this.landingPads = [];
        
        const baseHeight = this.height * 0.8;
        const step = 20;
        
        // Different environments for each level (cycles through 8 unique biomes)
        const environment = (this.level - 1) % 8;
        
        switch(environment) {
            case 0: // Level 1: Moon - Gray, crater-like, gentle
                this.generateMoonTerrain(baseHeight, step);
                break;
            case 1: // Level 2: Mars - Red, rocky, uneven
                this.generateMarsTerrain(baseHeight, step);
                break;
            case 2: // Level 3: Underwater - Blue, wavy, smooth
                this.generateUnderwaterTerrain(baseHeight, step);
                break;
            case 3: // Level 4: Ice Planet - White/blue, sharp peaks
                this.generateIceTerrain(baseHeight, step);
                break;
            case 4: // Level 5: Volcanic - Orange/red, jagged with spikes
                this.generateVolcanicTerrain(baseHeight, step);
                break;
            case 5: // Level 6: Forest - Green, rolling hills
                this.generateForestTerrain(baseHeight, step);
                break;
            case 6: // Level 7: Desert - Yellow, dunes
                this.generateDesertTerrain(baseHeight, step);
                break;
            case 7: // Level 8: Alien - Purple, weird patterns
                this.generateAlienTerrain(baseHeight, step);
                break;
        }
        
        // Create landing pads (same for all environments)
        const padWidth = Math.max(70, 90 - (this.level * 3));
        
        // Find good landing spots (lower areas)
        const pad1Index = Math.floor((this.width * 0.25) / step);
        const pad2Index = Math.floor((this.width * 0.75) / step);
        
        // Ensure indices are valid
        const idx1 = Math.max(0, Math.min(pad1Index, this.points.length - 1));
        const idx2 = Math.max(0, Math.min(pad2Index, this.points.length - 1));
        
        this.landingPads = [
            {
                x: this.width * 0.25,
                y: this.points[idx1].y - 15,
                width: padWidth,
                height: 12
            },
            {
                x: this.width * 0.75,
                y: this.points[idx2].y - 15,
                width: padWidth,
                height: 12
            }
        ];
    }
    
    generateMoonTerrain(baseHeight, step) {
        // Moon: Gentle rolling hills with occasional craters
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            // Gentle rolling hills
            y += Math.sin(x * 0.005) * 40;
            y += Math.sin(x * 0.015) * 15;
            // Occasional craters
            if (Math.sin(x * 0.02) > 0.7) {
                y += Math.sin(x * 0.1) * 20;
            }
            y = Math.max(this.height * 0.65, Math.min(this.height * 0.85, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#888888';
        this.terrainFill = 'rgba(136, 136, 136, 0.9)';
    }
    
    generateMarsTerrain(baseHeight, step) {
        // Mars: Rocky, uneven, red terrain
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            y += Math.sin(x * 0.008) * 50;
            y += Math.sin(x * 0.025) * 25;
            y += Math.sin(x * 0.05) * 10;
            // Random rocky variations
            y += (Math.random() - 0.5) * 15;
            y = Math.max(this.height * 0.6, Math.min(this.height * 0.88, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#CD5C5C';
        this.terrainFill = 'rgba(205, 92, 92, 0.9)';
    }
    
    generateUnderwaterTerrain(baseHeight, step) {
        // Underwater: Smooth wavy terrain with underwater feel
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            y += Math.sin(x * 0.003) * 60;
            y += Math.sin(x * 0.012) * 30;
            y += Math.sin(x * 0.008) * 20;
            // Very smooth, minimal randomness
            y += (Math.random() - 0.5) * 5;
            y = Math.max(this.height * 0.62, Math.min(this.height * 0.86, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#4169E1';
        this.terrainFill = 'rgba(65, 105, 225, 0.85)';
    }
    
    generateIceTerrain(baseHeight, step) {
        // Ice Planet: Sharp peaks and valleys
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            // Sharp triangular waves
            y += Math.abs(Math.sin(x * 0.01)) * 70;
            y += Math.sin(x * 0.03) * 30;
            // Sharp peaks
            if (Math.sin(x * 0.008) > 0.5) {
                y -= Math.abs(Math.sin(x * 0.05)) * 40;
            }
            y = Math.max(this.height * 0.55, Math.min(this.height * 0.9, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#E0FFFF';
        this.terrainFill = 'rgba(224, 255, 255, 0.9)';
    }
    
    generateVolcanicTerrain(baseHeight, step) {
        // Volcanic: Jagged, spiky, dangerous looking
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            y += Math.sin(x * 0.006) * 45;
            // Spikes
            if (Math.random() > 0.7) {
                y -= Math.random() * 40;
            }
            y += Math.sin(x * 0.04) * 20;
            y = Math.max(this.height * 0.58, Math.min(this.height * 0.92, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#FF4500';
        this.terrainFill = 'rgba(255, 69, 0, 0.9)';
    }
    
    generateForestTerrain(baseHeight, step) {
        // Forest: Rolling green hills
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            y += Math.sin(x * 0.004) * 35;
            y += Math.sin(x * 0.01) * 20;
            y += Math.sin(x * 0.025) * 10;
            y = Math.max(this.height * 0.68, Math.min(this.height * 0.84, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#228B22';
        this.terrainFill = 'rgba(34, 139, 34, 0.9)';
    }
    
    generateDesertTerrain(baseHeight, step) {
        // Desert: Sandy dunes with smooth curves
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            // Dune-like curves
            y += Math.sin(x * 0.004) * 55;
            y += Math.sin(x * 0.012) * 25;
            y += Math.sin(x * 0.008) * 15;
            y = Math.max(this.height * 0.64, Math.min(this.height * 0.86, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#F4A460';
        this.terrainFill = 'rgba(244, 164, 96, 0.9)';
    }
    
    generateAlienTerrain(baseHeight, step) {
        // Alien: Weird purple patterns with strange shapes
        for (let x = 0; x <= this.width; x += step) {
            let y = baseHeight;
            y += Math.sin(x * 0.003) * 40;
            y += Math.sin(x * 0.007) * 30;
            y += Math.sin(x * 0.013) * 20;
            y += Math.sin(x * 0.021) * 15;
            // Weird alien bumps
            if (Math.sin(x * 0.03) > 0.6) {
                y -= 25;
            }
            y = Math.max(this.height * 0.6, Math.min(this.height * 0.88, y));
            this.points.push({ x, y });
        }
        this.terrainColor = '#9932CC';
        this.terrainFill = 'rgba(153, 50, 204, 0.9)';
    }
    
    draw(ctx) {
        // Use environment-specific colors, fallback to default green
        ctx.strokeStyle = this.terrainColor || '#00ff00';
        ctx.fillStyle = this.terrainFill || 'rgba(0, 100, 0, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        this.landingPads.forEach(pad => {
            ctx.strokeStyle = '#ffff00';
            ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(pad.x - pad.width/2, pad.y);
            ctx.lineTo(pad.x + pad.width/2, pad.y);
            ctx.lineTo(pad.x + pad.width/2, pad.y + pad.height);
            ctx.lineTo(pad.x - pad.width/2, pad.y + pad.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(pad.x - pad.width/2, pad.y - 10);
            ctx.lineTo(pad.x + pad.width/2, pad.y - 10);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('LANDING', pad.x, pad.y + pad.height + 15);
        });
    }
    
    checkCollision(ship) {
        // Ship leaves screen boundaries - game over
        if (ship.x < -50 || ship.x > this.width + 50 || ship.y > this.height + 50 || ship.y < -50) {
            return {collision: true, landingPad: null, outOfBounds: true};
        }
        
        // Check landing pad collision first (priority)
        for (const pad of this.landingPads) {
            if (ship.x >= pad.x - pad.width/2 && ship.x <= pad.x + pad.width/2) {
                const shipBottom = ship.y + ship.height/2;
                
                if (shipBottom >= pad.y && shipBottom <= pad.y + pad.height + 5) {
                    const speed = ship.getSpeed();
                    const angleOk = Math.abs(ship.angle) < 0.3;
                    const speedOk = speed < 25;
                    const verticalSpeedOk = Math.abs(ship.vy) < 20;
                    const horizontalSpeedOk = Math.abs(ship.vx) < 20;
                    
                    if (angleOk && speedOk && horizontalSpeedOk && verticalSpeedOk) {
                        return {collision: true, landingPad: pad, success: true};
                    } else {
                        return {collision: true, landingPad: pad, success: false};
                    }
                }
            }
        }
        
        // Improved terrain collision - check all ship vertices
        const vertices = ship.getVertices();
        for (const vertex of vertices) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                
                if (vertex.x >= p1.x && vertex.x <= p2.x &&
                    vertex.y >= Math.min(p1.y, p2.y) && vertex.y <= Math.max(p1.y, p2.y)) {
                    return {collision: true, landingPad: null};
                }
            }
        }
        
        return {collision: false, landingPad: null};
    }
    
    pointAboveLine(point, lineStart, lineEnd) {
        const crossProduct = (point.y - lineStart.y) * (lineEnd.x - lineStart.x) - (point.x - lineStart.x) * (lineEnd.y - lineStart.y);
        return crossProduct < 0;
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
                
                this.showGameMessage('PERFECT LANDING! Next level...', false, true);
                
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
    
    showGameMessage(message, isDanger, showScore = false) {
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
        
        if (!isDanger) {
            setTimeout(() => {
                overlay.classList.add('hidden');
                restartBtn.textContent = 'Restart'; // Reset button text
            }, 3000); // Longer display for score breakdown
        }
    }
    
    nextLevel() {
        this.level++;
        this.landingProcessed = false; // Reset landing flag
        this.gravity = Math.min(30 + this.level * 2, 50);
        
        // Create new ship and terrain immediately
        this.ship = new Ship(this.canvas.width / 2, 100);
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this.level);
        
        // Reset timing
        this.lastTime = performance.now();
        
        // Hide overlay
        document.getElementById('gameOverlay').classList.add('hidden');
    }
    
    restart() {
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
        
        // Clear any pending updates
        this.lastTime = performance.now();
        
        // Reset button text
        document.getElementById('restartBtn').textContent = 'Restart';
        document.getElementById('gameOverlay').classList.add('hidden');
        
        this.updateHUD();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (deltaTime < 100) {
            this.update(deltaTime);
        }
        
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener('load', () => {
    new Game();
});