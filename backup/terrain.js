class Terrain {
    constructor(width, height, level = 1) {
        this.width = width;
        this.height = height;
        this.level = level;
        this.points = [];
        this.landingPads = [];
        this.terrainColor = '#00ff00';
        this.terrainFill = 'rgba(0, 100, 0, 0.8)';
        
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
        
        // Create landing pads - fewer pads at higher levels
        const padWidth = Math.max(70, 90 - (this.level * 3));
        
        // Level 1-2: 2 pads, Level 3+: 1 pad
        const numPads = this.level <= 2 ? 2 : 1;
        
        // Find terrain height at pad positions
        const findTerrainHeight = (xPos) => {
            const index = Math.floor(xPos / step);
            const safeIndex = Math.max(0, Math.min(index, this.points.length - 1));
            return this.points[safeIndex] ? this.points[safeIndex].y : baseHeight;
        };
        
        this.landingPads = [];
        
        // First pad always at 25%
        const pad1X = this.width * 0.25;
        const pad1Y = findTerrainHeight(pad1X) - 15;
        this.landingPads.push({
            x: pad1X,
            y: pad1Y,
            width: padWidth,
            height: 12
        });
        
        // Second pad only for level 1-2 at 75%
        if (numPads === 2) {
            const pad2X = this.width * 0.75;
            const pad2Y = findTerrainHeight(pad2X) - 15;
            this.landingPads.push({
                x: pad2X,
                y: pad2Y,
                width: padWidth,
                height: 12
            });
        }
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
}