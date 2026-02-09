/**
 * Ship - Exact replica of original game mechanics
 */
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
        this.fuel = 4000;
        this.maxFuel = 4000;
        
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
    
    /**
     * Update ship physics (exact replica of original)
     */
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
    }
    
    /**
     * Create engine particles (exact replica)
     */
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
    
    /**
     * Update engine particles
     */
    updateEngineParticles(dt) {
        this.engineParticles = this.engineParticles.filter(particle => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt * 2;
            particle.size *= 0.98;
            
            return particle.life > 0;
        });
    }
    
    /**
     * Create explosion
     */
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
    
    /**
     * Update explosion particles
     */
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
    
    /**
     * Render ship (exact replica of original)
     */
    render(ctx) {
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
        
        // Draw ship body (triangle with legs)
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
        
        // Draw cockpit window
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, -this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw thruster flames
        if (this.fuel > 0) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            
            if (this.mainThrusterActive) {
                // Main thruster - positioned at bottom center of ship
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
    
    /**
     * Set input state
     */
    setInput(thrust, left, right) {
        this.mainThrusterActive = thrust;
        // Inverted: left key fires right thruster, right key fires left thruster
        this.leftThrusterActive = right;
        this.rightThrusterActive = left;
    }
    
    /**
     * Get speed
     */
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    
    /**
     * Get fuel percentage
     */
    getFuelPercent() {
        return (this.fuel / this.maxFuel) * 100;
    }
    
    /**
     * Get vertices for collision detection
     */
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
    
    /**
     * Reset ship
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.fuel = this.maxFuel;
        this.crashed = false;
        this.landed = false;
        this.engineParticles = [];
        this.explosionParticles = [];
        this.mainThrusterActive = false;
        this.leftThrusterActive = false;
        this.rightThrusterActive = false;
    }
    
    /**
     * Crash the ship
     */
    crash() {
        this.crashed = true;
        this.createExplosion();
    }
}