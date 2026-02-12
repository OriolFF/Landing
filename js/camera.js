/**
 * Camera - Smooth laggy camera that follows the ship with zoom
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

        // Zoom/scale
        this.scale = 1;
        this.targetScale = 1;
        this.minScale = 0.3; // Zoomed out to see full world
        this.maxScale = 0.8; // Not too close to the ship
        this.scaleSmoothing = 0.015;

        // Smoothing factor (0 = no follow, 1 = instant)
        this.smoothing = 0.06;

        // Target to follow
        this.target = null;

        // Margin from edges
        this.margin = 100;

        // Initial zoom state
        this.hasInitialZoomed = false;

        // Intro sweep to showcase the level
        this.introDuration = 4000; // ms
        this.introElapsed = 0;
        this.introActive = false;
        this.introStartX = 0;
        this.introStartY = 0;
        this.introStartScale = 1;
    }
    
    /**
     * Set the target to follow
     */
    follow(target) {
        this.target = target;
    }

    /**
     * Calculate scale to fit entire world in view
     */
    calculateFitWorldScale() {
        const scaleX = this.canvas.width / (this.worldWidth + this.margin * 2);
        const scaleY = this.canvas.height / (this.worldHeight + this.margin * 2);
        return Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1:1
    }

    /**
     * Initialize camera to show full world
     */
    initializeWideView() {
        this.scale = this.calculateFitWorldScale();
        this.minScale = this.scale;
        this.targetScale = this.maxScale;

        // Center on world
        const scaledWorldWidth = this.worldWidth * this.scale;
        const scaledWorldHeight = this.worldHeight * this.scale;
        this.x = (this.worldWidth - this.canvas.width / this.scale) / 2;
        this.y = (this.worldHeight - this.canvas.height / this.scale) / 2;

        this.introStartX = this.x;
        this.introStartY = this.y;
        this.introStartScale = this.scale;
        this.introElapsed = 0;
        this.introActive = true;
        this.hasInitialZoomed = false;
    }
    
    /**
     * Update camera position with lag
     */
    update(deltaTime = 16.67) {
        if (!this.target) return;

        if (this.introActive) {
            this.introElapsed += deltaTime;
            const t = Math.min(1, this.introElapsed / this.introDuration);
            const eased = 1 - Math.pow(1 - t, 3);

            // Smooth zoom from full world to gameplay scale
            const desiredScale = this.introStartScale + (this.targetScale - this.introStartScale) * eased;
            this.scale += (desiredScale - this.scale) * 0.2;

            // Determine target position at current scale
            const viewportWidth = this.canvas.width / this.scale;
            const viewportHeight = this.canvas.height / this.scale;
            const targetX = this.target.x - viewportWidth / 2;
            const targetY = this.target.y - viewportHeight / 2;

            this.x = this.introStartX + (targetX - this.introStartX) * eased;
            this.y = this.introStartY + (targetY - this.introStartY) * eased;

            if (t >= 1) {
                this.introActive = false;
                this.hasInitialZoomed = true;
                this.scale = this.targetScale;
            }
        } else {
            // Gradually adjust scale if needed
            const scaleDiff = this.targetScale - this.scale;
            if (Math.abs(scaleDiff) > 0.001) {
                this.scale += scaleDiff * this.scaleSmoothing;
            }

            // Calculate desired position (center target, accounting for scale)
            const viewportWidth = this.canvas.width / this.scale;
            const viewportHeight = this.canvas.height / this.scale;
            const targetX = this.target.x - viewportWidth / 2;
            const targetY = this.target.y - viewportHeight / 2;

            // Smooth interpolation
            this.x += (targetX - this.x) * this.smoothing;
            this.y += (targetY - this.y) * this.smoothing;
        }

        // Clamp to world bounds
        this.clampToBounds();
    }
    
    /**
     * Clamp camera to world bounds
     */
    clampToBounds() {
        const viewportWidth = this.canvas.width / this.scale;
        const viewportHeight = this.canvas.height / this.scale;

        // Don't show beyond left/top edges
        this.x = Math.max(-this.margin, this.x);
        this.y = Math.max(-this.margin, this.y);

        // Don't show beyond right/bottom edges
        const maxX = this.worldWidth - viewportWidth + this.margin;
        const maxY = this.worldHeight - viewportHeight + this.margin;

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
            x: (worldX - this.x) * this.scale,
            y: (worldY - this.y) * this.scale
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.scale + this.x,
            y: screenY / this.scale + this.y
        };
    }
    
    /**
     * Get current viewport bounds in world coordinates
     */
    getBounds() {
        const viewportWidth = this.canvas.width / this.scale;
        const viewportHeight = this.canvas.height / this.scale;
        return {
            left: this.x,
            top: this.y,
            right: this.x + viewportWidth,
            bottom: this.y + viewportHeight
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
        // Apply scale first, then translate
        this.ctx.scale(this.scale, this.scale);
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
