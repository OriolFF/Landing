/**
 * Terrain Renderer - Handles multi-segment terrain rendering and collision
 */
class Terrain {
    constructor(level) {
        this.segments = level.segments || [];
        this.worldWidth = level.world.width;
        this.worldHeight = level.world.height;
        this.backgroundColor = level.world.backgroundColor;
    }
    
    /**
     * Render terrain with viewport culling
     */
    render(ctx, camera) {
        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(camera.x, camera.y, camera.canvas.width, camera.canvas.height);
        
        // Draw world border
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
        
        // Draw each segment
        this.segments.forEach(segment => {
            this.renderSegment(ctx, segment, camera);
        });
    }
    
    /**
     * Render a single segment with culling
     */
    renderSegment(ctx, segment, camera) {
        if (segment.points.length < 2) return;
        
        // Get segment bounds
        const bounds = this.getSegmentBounds(segment);
        
        // Cull if not visible
        if (!camera.isRectVisible(
            bounds.minX, 
            bounds.minY, 
            bounds.maxX - bounds.minX, 
            bounds.maxY - bounds.minY,
            100
        )) {
            return;
        }
        
        // Determine fill direction (default to 'down' for backward compatibility)
        const fillDirection = segment.fillDirection || 'down';
        const fillUp = fillDirection === 'up';
        
        // Draw filled area
        ctx.beginPath();
        const first = segment.points[0];
        ctx.moveTo(first.x, first.y);
        
        for (let i = 1; i < segment.points.length; i++) {
            const p = segment.points[i];
            ctx.lineTo(p.x, p.y);
        }
        
        // Close path to edge of world based on fill direction
        const last = segment.points[segment.points.length - 1];
        if (fillUp) {
            // Fill up to top of world (ceiling/cave)
            ctx.lineTo(last.x, 0);
            ctx.lineTo(first.x, 0);
        } else {
            // Fill down to bottom of world (ground)
            ctx.lineTo(last.x, this.worldHeight);
            ctx.lineTo(first.x, this.worldHeight);
        }
        ctx.closePath();
        
        ctx.fillStyle = segment.color + '60'; // Add transparency
        ctx.fill();
        
        // Draw terrain outline
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        
        for (let i = 1; i < segment.points.length; i++) {
            const p = segment.points[i];
            ctx.lineTo(p.x, p.y);
        }
        
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = segment.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    /**
     * Check collision with terrain
     */
    checkCollision(x, y, radius = 10) {
        for (let segment of this.segments) {
            if (this.checkSegmentCollision(segment, x, y, radius)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check collision with a specific segment
     */
    checkSegmentCollision(segment, x, y, radius) {
        // Determine fill direction
        const fillDirection = segment.fillDirection || 'down';
        const fillUp = fillDirection === 'up';
        
        for (let i = 0; i < segment.points.length - 1; i++) {
            const p1 = segment.points[i];
            const p2 = segment.points[i + 1];
            
            // Check if x is between segment points
            if (x >= Math.min(p1.x, p2.x) - radius && x <= Math.max(p1.x, p2.x) + radius) {
                // Get terrain height at this x
                const terrainY = this.getTerrainHeightAtX(segment, x);
                
                if (terrainY !== null) {
                    if (fillUp) {
                        // Ceiling: collision when ship is above/in the filled area
                        if (y - radius <= terrainY) {
                            return true;
                        }
                    } else {
                        // Ground: collision when ship is below/in the filled area
                        if (y + radius >= terrainY) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Check distance to individual points
        for (let p of segment.points) {
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < radius) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get terrain height at specific x coordinate
     */
    getTerrainHeightAtX(segment, x) {
        for (let i = 0; i < segment.points.length - 1; i++) {
            const p1 = segment.points[i];
            const p2 = segment.points[i + 1];
            
            if ((x >= p1.x && x <= p2.x) || (x >= p2.x && x <= p1.x)) {
                // Linear interpolation
                const t = (x - p1.x) / (p2.x - p1.x);
                return p1.y + t * (p2.y - p1.y);
            }
        }
        return null;
    }
    
    /**
     * Get terrain normal at point (for realistic collision response)
    **/
    getTerrainNormal(x, y) {
        // Find the closest point on terrain
        let closestPoint = null;
        let closestDist = Infinity;
        let closestEdge = null;
        
        for (let segment of this.segments) {
            for (let i = 0; i < segment.points.length - 1; i++) {
                const p1 = segment.points[i];
                const p2 = segment.points[i + 1];
                
                const closest = this.getClosestPointOnLine(x, y, p1, p2);
                const dist = Math.hypot(closest.x - x, closest.y - y);
                
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = closest;
                    closestEdge = { p1, p2 };
                }
            }
        }
        
        if (closestEdge) {
            // Calculate normal perpendicular to edge
            const dx = closestEdge.p2.x - closestEdge.p1.x;
            const dy = closestEdge.p2.y - closestEdge.p1.y;
            const len = Math.hypot(dx, dy);
            
            // Normal pointing upward
            return {
                x: -dy / len,
                y: dx / len
            };
        }
        
        return { x: 0, y: -1 }; // Default upward
    }
    
    /**
     * Get closest point on line segment
     */
    getClosestPointOnLine(px, py, lineStart, lineEnd) {
        const A = px - lineStart.x;
        const B = py - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        return { x: xx, y: yy };
    }
    
    /**
     * Get segment bounds
     */
    getSegmentBounds(segment) {
        const xs = segment.points.map(p => p.x);
        const ys = segment.points.map(p => p.y);
        
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }
    
    /**
     * Check platform collision
     */
    checkPlatformCollision(platform, x, y, width, height) {
        const platLeft = platform.x - platform.width / 2;
        const platRight = platform.x + platform.width / 2;
        const platTop = platform.y;
        const platBottom = platform.y + 10;
        
        return !(x + width < platLeft ||
                 x > platRight ||
                 y + height < platTop ||
                 y > platBottom);
    }
}