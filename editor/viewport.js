/**
 * Viewport Manager - Handles panning, zooming, and coordinate transformations
 */
class Viewport {
    constructor(canvas, worldWidth, worldHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Viewport state
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 3;
        
        // Game screen aspect ratio (16:9)
        this.screenAspectRatio = 16 / 9;
        this.screenWidth = 1920;
        this.screenHeight = 1080;
        
        // Panning state
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        this.setupEventListeners();
        this.resize();
    }
    
    setupEventListeners() {
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.setZoom(this.zoom * zoomFactor);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
    
    /**
     * Set zoom level and clamp to bounds
     */
    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.clampToWorldBounds();
    }
    
    /**
     * Set viewport position and clamp to world bounds
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.clampToWorldBounds();
    }
    
    /**
     * Move viewport by delta
     */
    pan(deltaX, deltaY) {
        this.x -= deltaX / this.zoom;
        this.y -= deltaY / this.zoom;
        this.clampToWorldBounds();
    }
    
    /**
     * Start panning
     */
    startPan(screenX, screenY) {
        this.isPanning = true;
        this.lastPanX = screenX;
        this.lastPanY = screenY;
        this.canvas.classList.add('panning');
    }
    
    /**
     * Update panning
     */
    updatePan(screenX, screenY) {
        if (!this.isPanning) return;
        
        const deltaX = screenX - this.lastPanX;
        const deltaY = screenY - this.lastPanY;
        
        this.pan(deltaX, deltaY);
        
        this.lastPanX = screenX;
        this.lastPanY = screenY;
    }
    
    /**
     * End panning
     */
    endPan() {
        this.isPanning = false;
        this.canvas.classList.remove('panning');
    }
    
    /**
     * Clamp viewport to world bounds (with padding for edges)
     */
    clampToWorldBounds() {
        const visibleWidth = this.canvas.width / this.zoom;
        const visibleHeight = this.canvas.height / this.zoom;
        
        // Allow seeing slightly outside world bounds, but not too far
        const paddingX = visibleWidth * 0.1;
        const paddingY = visibleHeight * 0.1;
        
        this.x = Math.max(-paddingX, Math.min(this.worldWidth + paddingX - visibleWidth, this.x));
        this.y = Math.max(-paddingY, Math.min(this.worldHeight + paddingY - visibleHeight, this.y));
    }
    
    /**
     * Center viewport on a world position
     */
    centerOn(worldX, worldY) {
        const visibleWidth = this.canvas.width / this.zoom;
        const visibleHeight = this.canvas.height / this.zoom;
        
        this.x = worldX - visibleWidth / 2;
        this.y = worldY - visibleHeight / 2;
        this.clampToWorldBounds();
    }
    
    /**
     * Get current viewport bounds in world coordinates
     */
    getBounds() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + this.canvas.width / this.zoom,
            bottom: this.y + this.canvas.height / this.zoom
        };
    }
    
    /**
     * Get screen viewport rectangle (for game screen reference)
     */
    getScreenViewportRect() {
        // Calculate what would be visible on game screen at current position
        const scale = Math.min(
            this.canvas.width / this.screenWidth,
            this.canvas.height / this.screenHeight
        );
        
        const screenW = this.screenWidth * scale * this.zoom;
        const screenH = this.screenHeight * scale * this.zoom;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: centerX - screenW / 2,
            y: centerY - screenH / 2,
            width: screenW,
            height: screenH
        };
    }
    
    /**
     * Check if a world point is visible in current viewport
     */
    isVisible(worldX, worldY, margin = 100) {
        const bounds = this.getBounds();
        return worldX >= bounds.left - margin && 
               worldX <= bounds.right + margin &&
               worldY >= bounds.top - margin && 
               worldY <= bounds.bottom + margin;
    }
    
    /**
     * Get visible world area
     */
    getVisibleArea() {
        return {
            x: this.x,
            y: this.y,
            width: this.canvas.width / this.zoom,
            height: this.canvas.height / this.zoom
        };
    }
    
    /**
     * Convert minimap coordinates to world coordinates
     */
    minimapToWorld(minimapX, minimapY, minimapWidth, minimapHeight) {
        return {
            x: (minimapX / minimapWidth) * this.worldWidth,
            y: (minimapY / minimapHeight) * this.worldHeight
        };
    }
    
    /**
     * Convert world coordinates to minimap coordinates
     */
    worldToMinimap(worldX, worldY, minimapWidth, minimapHeight) {
        return {
            x: (worldX / this.worldWidth) * minimapWidth,
            y: (worldY / this.worldHeight) * minimapHeight
        };
    }
    
    /**
     * Get viewport rectangle on minimap
     */
    getMinimapViewportRect(minimapWidth, minimapHeight) {
        const bounds = this.getBounds();
        
        const topLeft = this.worldToMinimap(bounds.left, bounds.top, minimapWidth, minimapHeight);
        const bottomRight = this.worldToMinimap(bounds.right, bounds.bottom, minimapWidth, minimapHeight);
        
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }
    
    /**
     * Reset viewport to show entire world
     */
    fitToWorld() {
        const scaleX = this.canvas.width / this.worldWidth;
        const scaleY = this.canvas.height / this.worldHeight;
        this.zoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
        this.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    }
    
    /**
     * Update world dimensions
     */
    setWorldDimensions(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.clampToWorldBounds();
    }
    
    /**
     * Clear and prepare canvas for rendering
     */
    clear(backgroundColor = '#0a0a1a') {
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Main render method - to be overridden
     */
    render() {
        this.clear();
    }
}