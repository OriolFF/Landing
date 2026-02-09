/**
 * Camera - Smooth laggy camera that follows the ship
 */
class Camera {
    constructor(canvas, worldWidth, worldHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Camera position (top-left corner of viewport)
        this.x = 0;
        this.y = 0;
        
        // Smoothing factor (0 = no follow, 1 = instant)
        this.smoothing = 0.1;
        
        // Target to follow
        this.target = null;
        
        // Margin from edges
        this.margin = 100;
    }
    
    /**
     * Set the target to follow
     */
    follow(target) {
        this.target = target;
    }
    
    /**
     * Update camera position with lag
     */
    update() {
        if (!this.target) return;
        
        // Calculate desired position (center target)
        const targetX = this.target.x - this.canvas.width / 2;
        const targetY = this.target.y - this.canvas.height / 2;
        
        // Smooth interpolation
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
        
        // Clamp to world bounds
        this.clampToBounds();
    }
    
    /**
     * Clamp camera to world bounds
     */
    clampToBounds() {
        // Don't show beyond left/top edges
        this.x = Math.max(-this.margin, this.x);
        this.y = Math.max(-this.margin, this.y);
        
        // Don't show beyond right/bottom edges
        const maxX = this.worldWidth - this.canvas.width + this.margin;
        const maxY = this.worldHeight - this.canvas.height + this.margin;
        
        this.x = Math.min(maxX, this.x);
        this.y = Math.min(maxY, this.y);
    }
    
    /**
     * Set world dimensions
     */
    setWorldDimensions(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.clampToBounds();
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
    
    /**
     * Get current viewport bounds
     */
    getBounds() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + this.canvas.width,
            bottom: this.y + this.canvas.height
        };
    }
    
    /**
     * Check if point is visible (with margin)
     */
    isVisible(worldX, worldY, margin = 100) {
        const bounds = this.getBounds();
        return worldX >= bounds.left - margin && 
               worldX <= bounds.right + margin &&
               worldY >= bounds.top - margin && 
               worldY <= bounds.bottom + margin;
    }
    
    /**
     * Check if rectangle is visible
     */
    isRectVisible(x, y, width, height, margin = 100) {
        const bounds = this.getBounds();
        return !(x + width < bounds.left - margin ||
                 x > bounds.right + margin ||
                 y + height < bounds.top - margin ||
                 y > bounds.bottom + margin);
    }
    
    /**
     * Transform context for rendering
     */
    applyTransform() {
        this.ctx.save();
        this.ctx.translate(-this.x, -this.y);
    }
    
    /**
     * Restore context transform
     */
    restoreTransform() {
        this.ctx.restore();
    }
    
    /**
     * Set initial position
     */
    setPosition(x, y) {
        this.x = x - this.canvas.width / 2;
        this.y = y - this.canvas.height / 2;
        this.clampToBounds();
    }
}