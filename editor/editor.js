/**
 * Level Editor - Main Application
 */
class LevelEditor {
    constructor() {
        this.levelFormat = new LevelFormat();
        this.merger = new TerrainMerger();
        this.autoSave = new AutoSaveManager('lunarEditorDraft');

        this.currentTool = 'draw';
        this.isDrawing = false;
        this.currentPath = [];
        this.selectedSegment = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.hoverPoint = null;
        this.placementMode = null; // 'launch' or 'landing'

        this.level = null;
        this.undoStack = [];
        this.redoStack = [];

        this.maxUndoStates = 50;
        this.showGrid = true;
        this.gridSize = 50;
        this.fillDirection = 'down'; // 'down' = ground, 'up' = ceiling
        this.platformType = 'launch'; // 'launch' or 'landing'

        this.init();
    }

    init() {
        // Setup canvas
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Setup minimap
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');

        // Initialize viewport
        this.viewport = new Viewport(this.canvas, 5000, 3000);

        // Try to load auto-saved draft
        const saved = this.autoSave.load();
        if (saved) {
            try {
                this.level = this.levelFormat.deserialize(JSON.stringify(saved));
                this.showStatus('Loaded auto-saved draft', 'success');
            } catch (e) {
                this.level = this.levelFormat.createEmpty();
            }
        } else {
            this.level = this.levelFormat.createEmpty();
        }

        // Setup UI
        this.setupEventListeners();
        this.setupUI();

        // Start auto-save
        this.autoSave.start(() => this.level, 30000);

        // Initial render
        this.viewport.fitToWorld();
        this.render();
        this.updateUI();

        // Save initial state
        this.saveState();
    }

    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Minimap
        this.minimap.addEventListener('click', (e) => this.handleMinimapClick(e));

        // Window resize
        window.addEventListener('resize', () => this.render());
    }

    setupUI() {
        // Tools
        document.getElementById('tool-draw').addEventListener('click', () => this.setTool('draw'));
        document.getElementById('tool-select').addEventListener('click', () => this.setTool('select'));
        document.getElementById('tool-platform').addEventListener('click', () => this.setTool('platform'));
        document.getElementById('tool-pan').addEventListener('click', () => this.setTool('pan'));

        // Actions
        document.getElementById('action-grid').addEventListener('click', () => this.toggleGrid());
        document.getElementById('fill-toggle').addEventListener('click', () => this.toggleFillDirection());
        document.getElementById('platform-toggle').addEventListener('click', () => this.togglePlatformType());
        document.getElementById('action-undo').addEventListener('click', () => this.undo());
        document.getElementById('action-redo').addEventListener('click', () => this.redo());
        document.getElementById('action-clear').addEventListener('click', () => this.clearAll());

        // Save actions
        document.getElementById('action-save-draft').addEventListener('click', () => this.saveDraft());
        document.getElementById('action-export').addEventListener('click', () => this.exportLevel());

        // Level settings
        document.getElementById('level-name').addEventListener('change', (e) => {
            this.level.metadata.name = e.target.value;
            this.saveState();
        });

        document.getElementById('world-width').addEventListener('change', (e) => {
            this.level.world.width = parseInt(e.target.value);
            this.viewport.setWorldDimensions(this.level.world.width, this.level.world.height);
            this.saveState();
            this.render();
        });

        document.getElementById('world-height').addEventListener('change', (e) => {
            this.level.world.height = parseInt(e.target.value);
            this.viewport.setWorldDimensions(this.level.world.width, this.level.world.height);
            this.saveState();
            this.render();
        });

        document.getElementById('bg-color').addEventListener('change', (e) => {
            this.level.world.backgroundColor = e.target.value;
            this.saveState();
            this.render();
        });

        document.getElementById('gravity').addEventListener('change', (e) => {
            this.level.metadata.gravity = parseFloat(e.target.value);
            this.saveState();
        });

        document.getElementById('terrain-color').addEventListener('change', (e) => {
            if (this.selectedSegment) {
                this.selectedSegment.color = e.target.value;
                this.saveState();
                this.render();
            }
        });

        document.getElementById('selected-color').addEventListener('change', (e) => {
            if (this.selectedSegment) {
                this.selectedSegment.color = e.target.value;
                this.saveState();
                this.render();
            }
        });

        document.getElementById('delete-segment').addEventListener('click', () => {
            if (this.selectedSegment) {
                this.level.segments = this.level.segments.filter(s => s !== this.selectedSegment);
                this.selectedSegment = null;
                this.updateUI();
                this.saveState();
                this.render();
            }
        });

        document.getElementById('platform-width').addEventListener('change', (e) => {
            const width = parseInt(e.target.value);
            if (this.placementMode === 'launch' && this.level.platforms.launch) {
                this.level.platforms.launch.width = width;
            } else if (this.placementMode === 'landing' && this.level.platforms.landing) {
                this.level.platforms.landing.width = width;
            }
            this.saveState();
            this.render();
        });

        // Modal
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-confirm').addEventListener('click', () => this.handleModalConfirm());
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.viewport.screenToWorld(screenX, screenY);

        if (e.button === 1 || (e.button === 0 && this.currentTool === 'pan')) {
            // Middle mouse or pan tool - start panning
            this.viewport.startPan(screenX, screenY);
            return;
        }

        if (e.button === 2) {
            // Right click - pan
            this.viewport.startPan(screenX, screenY);
            return;
        }

        switch (this.currentTool) {
            case 'draw':
                this.startDrawing(worldPos);
                break;
            case 'select':
                this.startSelecting(worldPos);
                break;
            case 'platform':
                this.placePlatform(worldPos);
                break;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.viewport.screenToWorld(screenX, screenY);

        // Update coordinate display
        document.getElementById('coordinates').textContent =
            `X: ${Math.round(worldPos.x)} | Y: ${Math.round(worldPos.y)}`;

        // Handle panning
        if (this.viewport.isPanning) {
            this.viewport.updatePan(screenX, screenY);
            this.render();
            return;
        }

        // Handle drawing
        if (this.isDrawing && this.currentTool === 'draw') {
            this.continueDrawing(worldPos);
        }

        // Handle dragging
        if (this.isDragging && this.selectedSegment) {
            this.continueDragging(worldPos);
        }

        // Update hover point for selection
        if (this.currentTool === 'select') {
            this.updateHoverPoint(worldPos);
        }
    }

    handleMouseUp(e) {
        if (this.viewport.isPanning) {
            this.viewport.endPan();
        }

        if (this.isDrawing) {
            this.finishDrawing();
        }

        if (this.isDragging) {
            this.isDragging = false;
            this.saveState();
        }
    }

    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveDraft();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportLevel();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
            }
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'd':
                this.setTool('draw');
                break;
            case 's':
                this.setTool('select');
                break;
            case 'p':
                this.setTool('platform');
                break;
            case ' ':
                e.preventDefault();
                this.setTool('pan');
                break;
            case 'g':
                this.toggleGrid();
                break;
            case 'f':
                this.toggleFillDirection();
                break;
            case 't':
                this.togglePlatformType();
                break;
            case 'delete':
            case 'backspace':
                if (this.selectedSegment) {
                    this.level.segments = this.level.segments.filter(s => s !== this.selectedSegment);
                    this.selectedSegment = null;
                    this.updateUI();
                    this.saveState();
                    this.render();
                }
                break;
        }
    }

    handleMinimapClick(e) {
        const rect = this.minimap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const worldPos = this.viewport.minimapToWorld(x, y, this.minimap.width, this.minimap.height);
        this.viewport.centerOn(worldPos.x, worldPos.y);
        this.render();
    }

    setTool(tool) {
        this.currentTool = tool;

        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tool-${tool}`).classList.add('active');

        // Update cursor
        this.canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';

        // Show/hide platform settings
        const platformGroup = document.getElementById('platform-width-group');
        const placingIndicator = document.getElementById('placing-platform-type')?.parentElement;
        if (tool === 'platform') {
            platformGroup.style.display = 'flex';
            if (placingIndicator) placingIndicator.style.display = 'flex';
            this.showStatus(`Click to place ${this.platformType.toUpperCase()} platform (Press T to toggle)`, 'info');
        } else {
            platformGroup.style.display = 'none';
            if (placingIndicator) placingIndicator.style.display = 'none';
        }
    }

    startDrawing(worldPos) {
        if (this.level.segments.length >= 5) {
            this.showStatus('Maximum 5 terrain segments allowed', 'error');
            return;
        }

        this.isDrawing = true;
        this.currentPath = [worldPos];
    }

    continueDrawing(worldPos) {
        if (this.currentPath.length > 0) {
            const lastPoint = this.currentPath[this.currentPath.length - 1];
            const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);

            // Only add point if far enough from last
            if (dist > 10) {
                this.currentPath.push(worldPos);
            }
        }

        this.render();
    }

    finishDrawing() {
        this.isDrawing = false;

        if (this.currentPath.length >= 2) {
            const color = document.getElementById('terrain-color').value;
            const newSegment = this.levelFormat.createSegment(this.currentPath, color, this.fillDirection);

            // Add segment and check for merges
            this.level.segments.push(newSegment);

            // Merge overlapping segments
            const originalCount = this.level.segments.length;
            this.level.segments = this.merger.mergeOverlappingSegments(this.level.segments);

            if (this.level.segments.length < originalCount) {
                this.showStatus('Segments merged automatically', 'success');
            }

            this.saveState();
            this.updateUI();
        }

        this.currentPath = [];
        this.render();
    }

    toggleFillDirection() {
        this.fillDirection = this.fillDirection === 'down' ? 'up' : 'down';
        const btn = document.getElementById('fill-toggle');
        if (this.fillDirection === 'down') {
            btn.textContent = 'Fill: DOWN (Ground)';
            this.showStatus('Drawing ground terrain (fills down)', 'info');
        } else {
            btn.textContent = 'Fill: UP (Ceiling)';
            this.showStatus('Drawing cave ceiling (fills up)', 'info');
        }
    }

    startSelecting(worldPos) {
        // Check if clicking on a point
        const point = this.findNearestPoint(worldPos);

        if (point) {
            this.selectedSegment = point.segment;
            this.hoverPoint = point;
            this.isDragging = true;
            this.dragOffset = {
                x: worldPos.x - point.point.x,
                y: worldPos.y - point.point.y
            };
        } else {
            // Check if clicking on a segment
            const segment = this.findSegmentAt(worldPos);
            this.selectedSegment = segment;
        }

        this.updateUI();
        this.render();
    }

    continueDragging(worldPos) {
        if (this.hoverPoint) {
            this.hoverPoint.point.x = worldPos.x - this.dragOffset.x;
            this.hoverPoint.point.y = worldPos.y - this.dragOffset.y;
            this.render();
        } else if (this.selectedSegment) {
            // Move entire segment
            const dx = worldPos.x - this.dragOffset.x;
            const dy = worldPos.y - this.dragOffset.y;

            this.selectedSegment.points.forEach(p => {
                p.x += dx;
                p.y += dy;
            });

            this.dragOffset = { x: worldPos.x, y: worldPos.y };
            this.render();
        }
    }

    placePlatform(worldPos) {
        const width = parseInt(document.getElementById('platform-width').value) || 120;

        // Use platformType to determine which platform to place
        if (this.platformType === 'landing') {
            this.level.platforms.landing = this.levelFormat.createPlatform(worldPos.x, worldPos.y, width);
            this.showStatus('Landing platform placed', 'success');
        } else {
            this.level.platforms.launch = this.levelFormat.createPlatform(worldPos.x, worldPos.y, width);
            this.level.camera.startX = worldPos.x;
            this.level.camera.startY = worldPos.y - 100;
            this.showStatus('Launch platform placed', 'success');
        }

        this.saveState();
        this.updateUI();
        this.render();
    }

    togglePlatformType() {
        this.platformType = this.platformType === 'launch' ? 'landing' : 'launch';
        const btn = document.getElementById('platform-toggle');
        if (this.platformType === 'launch') {
            btn.textContent = 'Platform: LAUNCH';
            this.showStatus('Now placing LAUNCH platform', 'info');
        } else {
            btn.textContent = 'Platform: LANDING';
            this.showStatus('Now placing LANDING platform', 'info');
        }
    }

    findNearestPoint(worldPos, threshold = 15) {
        for (let segment of this.level.segments) {
            for (let point of segment.points) {
                const dist = Math.hypot(point.x - worldPos.x, point.y - worldPos.y);
                if (dist < threshold) {
                    return { segment, point, index: segment.points.indexOf(point) };
                }
            }
        }
        return null;
    }

    findSegmentAt(worldPos) {
        for (let segment of this.level.segments) {
            // Simple bounding box check first
            const bounds = this.levelFormat.getSegmentBounds(segment);
            if (worldPos.x >= bounds.minX && worldPos.x <= bounds.maxX &&
                worldPos.y >= bounds.minY && worldPos.y <= bounds.maxY) {

                // Check if point is near any edge
                for (let i = 0; i < segment.points.length - 1; i++) {
                    const p1 = segment.points[i];
                    const p2 = segment.points[i + 1];
                    const dist = this.pointToLineDistance(worldPos, p1, p2);
                    if (dist < 20) {
                        return segment;
                    }
                }
            }
        }
        return null;
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
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

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    updateHoverPoint(worldPos) {
        this.hoverPoint = this.findNearestPoint(worldPos);
        this.render();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        document.getElementById('action-grid').textContent = `Grid: ${this.showGrid ? 'ON' : 'OFF'}`;
        this.render();
    }

    saveState() {
        const state = JSON.stringify(this.level);
        this.undoStack.push(state);

        if (this.undoStack.length > this.maxUndoStates) {
            this.undoStack.shift();
        }

        this.redoStack = [];
        this.updateUndoButtons();
    }

    undo() {
        if (this.undoStack.length <= 1) return;

        this.redoStack.push(this.undoStack.pop());
        const state = this.undoStack[this.undoStack.length - 1];
        this.level = JSON.parse(state);
        this.selectedSegment = null;
        this.updateUI();
        this.render();
        this.updateUndoButtons();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.level = JSON.parse(state);
        this.selectedSegment = null;
        this.updateUI();
        this.render();
        this.updateUndoButtons();
    }

    updateUndoButtons() {
        document.getElementById('action-undo').disabled = this.undoStack.length <= 1;
        document.getElementById('action-redo').disabled = this.redoStack.length === 0;
    }

    clearAll() {
        if (confirm('Clear all terrain and platforms? This cannot be undone.')) {
            this.level.segments = [];
            this.level.platforms.launch = null;
            this.level.platforms.landing = null;
            this.selectedSegment = null;
            this.saveState();
            this.updateUI();
            this.render();
        }
    }

    saveDraft() {
        const json = this.levelFormat.serialize(this.level);
        const filename = this.levelFormat.generateFilename(this.level.metadata.name);

        this.downloadFile(json, filename, 'application/json');

        this.showStatus(`Saved as ${filename}`, 'success');
        document.getElementById('last-saved').textContent =
            `Last saved: ${new Date().toLocaleTimeString()}`;

        // Also save to drafts folder (simulated - in real app would be server-side)
        console.log('Draft saved:', filename);
    }

    async exportLevel() {
        // Validate level
        const validation = this.levelFormat.validate(this.level);

        if (!validation.valid) {
            this.showModal('Export Error',
                `Cannot export level with errors:\n${validation.errors.join('\n')}`,
                'error');
            return;
        }

        if (!this.level.platforms.launch || !this.level.platforms.landing) {
            this.showModal('Export Error',
                'Level must have both launch and landing platforms.',
                'error');
            return;
        }

        const filename = this.generateSimpleFilename(this.level.metadata.name);
        const json = this.levelFormat.serialize(this.level);

        // Download the level file
        this.downloadFile(json, filename, 'application/json');

        this.showStatus(`Downloaded ${filename}`, 'success');
        this.showModal('Export Complete',
            `<strong>Level downloaded!</strong><br><br>
            <strong>Filename:</strong> ${filename}<br><br>
            To add this level to the game:<br>
            1. Place the downloaded file in the <code>levels/</code> folder<br>
            2. Refresh the game to see it in the level list<br><br>
            <em>For GitHub Pages: Upload the file to your repository's <code>levels/</code> folder.</em>`,
            'success');

        console.log('Level exported:', filename);
    }

    generateSimpleFilename(name) {
        // Sanitize name for filename
        const sanitized = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 30);

        return `${sanitized || 'level'}.json`;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showModal(title, content, type = 'info') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-content').innerHTML =
            `<div class="modal-${type}">${content}</div>`;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    handleModalConfirm() {
        this.hideModal();
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-text');
        statusEl.textContent = message;
        statusEl.className = type;

        setTimeout(() => {
            statusEl.textContent = 'Ready';
            statusEl.className = '';
        }, 3000);
    }

    updateUI() {
        // Update segment count
        document.getElementById('segment-count').textContent =
            `${this.level.segments.length} / 5`;

        // Update platform status
        const launchStatus = document.querySelector('#launch-status .platform-value');
        const landingStatus = document.querySelector('#landing-status .platform-value');

        if (this.level.platforms.launch) {
            launchStatus.textContent = 'Set';
            launchStatus.classList.add('set');
        } else {
            launchStatus.textContent = 'Not Set';
            launchStatus.classList.remove('set');
        }

        if (this.level.platforms.landing) {
            landingStatus.textContent = 'Set';
            landingStatus.classList.add('set');
        } else {
            landingStatus.textContent = 'Not Set';
            landingStatus.classList.remove('set');
        }

        // Update placing platform type display
        const placingIndicator = document.getElementById('placing-platform-type');
        if (placingIndicator) {
            placingIndicator.textContent = this.platformType.toUpperCase();
        }

        // Update selected segment panel
        const segmentPanel = document.getElementById('segment-panel');
        if (this.selectedSegment) {
            segmentPanel.style.display = 'block';
            document.getElementById('selected-points-count').textContent =
                this.selectedSegment.points.length;
            document.getElementById('selected-color').value = this.selectedSegment.color;

            // Show fill direction
            const fillDir = this.selectedSegment.fillDirection || 'down';
            const fillText = fillDir === 'up' ? 'Ceiling (Up)' : 'Ground (Down)';
            document.getElementById('selected-fill-direction').textContent = fillText;
        } else {
            segmentPanel.style.display = 'none';
        }
    }

    render() {
        this.viewport.clear(this.level.world.backgroundColor);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw world bounds
        this.drawWorldBounds();

        // Draw segments
        this.drawSegments();

        // Draw current path (while drawing)
        if (this.isDrawing && this.currentPath.length > 0) {
            this.drawPath(this.currentPath, '#ffffff', 2);
        }

        // Draw platforms
        this.drawPlatforms();

        // Draw viewport indicator
        this.drawViewportIndicator();

        // Update minimap
        this.drawMinimap();
    }

    drawGrid() {
        const bounds = this.viewport.getBounds();
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        const startX = Math.floor(bounds.left / this.gridSize) * this.gridSize;
        const startY = Math.floor(bounds.top / this.gridSize) * this.gridSize;

        ctx.beginPath();

        for (let x = startX; x <= bounds.right; x += this.gridSize) {
            const screenX = (x - this.viewport.x) * this.viewport.zoom;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.canvas.height);
        }

        for (let y = startY; y <= bounds.bottom; y += this.gridSize) {
            const screenY = (y - this.viewport.y) * this.viewport.zoom;
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.canvas.width, screenY);
        }

        ctx.stroke();
    }

    drawWorldBounds() {
        const ctx = this.ctx;
        const topLeft = this.viewport.worldToScreen(0, 0);
        const bottomRight = this.viewport.worldToScreen(
            this.level.world.width,
            this.level.world.height
        );

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        // Draw border
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 3;
        ctx.strokeRect(topLeft.x, topLeft.y, width, height);

        // Draw label
        ctx.fillStyle = '#e94560';
        ctx.font = '12px sans-serif';
        ctx.fillText('WORLD BOUNDS', topLeft.x + 5, topLeft.y - 5);
    }

    drawSegments() {
        const ctx = this.ctx;

        this.level.segments.forEach((segment, index) => {
            if (segment.points.length < 2) return;

            // Determine fill direction (default to 'down' for backward compatibility)
            const fillDirection = segment.fillDirection || 'down';
            const fillUp = fillDirection === 'up';

            // Draw filled area
            ctx.beginPath();
            const first = this.viewport.worldToScreen(segment.points[0].x, segment.points[0].y);
            ctx.moveTo(first.x, first.y);

            for (let i = 1; i < segment.points.length; i++) {
                const p = this.viewport.worldToScreen(segment.points[i].x, segment.points[i].y);
                ctx.lineTo(p.x, p.y);
            }

            // Close path to edge of world based on fill direction
            if (fillUp) {
                // Fill up to top of world (ceiling/cave)
                const last = this.viewport.worldToScreen(
                    segment.points[segment.points.length - 1].x,
                    0
                );
                const firstTop = this.viewport.worldToScreen(
                    segment.points[0].x,
                    0
                );
                ctx.lineTo(last.x, last.y);
                ctx.lineTo(firstTop.x, firstTop.y);
            } else {
                // Fill down to bottom of world (ground)
                const last = this.viewport.worldToScreen(
                    segment.points[segment.points.length - 1].x,
                    this.level.world.height
                );
                const firstBottom = this.viewport.worldToScreen(
                    segment.points[0].x,
                    this.level.world.height
                );
                ctx.lineTo(last.x, last.y);
                ctx.lineTo(firstBottom.x, firstBottom.y);
            }

            ctx.closePath();

            ctx.fillStyle = segment.color + '40'; // Add transparency
            ctx.fill();

            // Draw outline
            ctx.beginPath();
            const start = this.viewport.worldToScreen(segment.points[0].x, segment.points[0].y);
            ctx.moveTo(start.x, start.y);

            for (let i = 1; i < segment.points.length; i++) {
                const p = this.viewport.worldToScreen(segment.points[i].x, segment.points[i].y);
                ctx.lineTo(p.x, p.y);
            }

            ctx.strokeStyle = segment.color;
            ctx.lineWidth = this.selectedSegment === segment ? 4 : 2;
            ctx.stroke();

            // Draw points
            segment.points.forEach((p, i) => {
                const screenP = this.viewport.worldToScreen(p.x, p.y);
                ctx.fillStyle = this.hoverPoint && this.hoverPoint.point === p ? '#fff' : segment.color;
                ctx.beginPath();
                ctx.arc(screenP.x, screenP.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawPath(points, color, width) {
        if (points.length < 2) return;

        const ctx = this.ctx;
        ctx.beginPath();

        const first = this.viewport.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < points.length; i++) {
            const p = this.viewport.worldToScreen(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawPlatforms() {
        const ctx = this.ctx;

        // Launch platform
        if (this.level.platforms.launch) {
            this.drawPlatform(this.level.platforms.launch, '#4ade80', 'LAUNCH');
        }

        // Landing platform
        if (this.level.platforms.landing) {
            this.drawPlatform(this.level.platforms.landing, '#e94560', 'LANDING');
        }
    }

    drawPlatform(platform, color, label) {
        const ctx = this.ctx;
        const topLeft = this.viewport.worldToScreen(
            platform.x - platform.width / 2,
            platform.y
        );
        const bottomRight = this.viewport.worldToScreen(
            platform.x + platform.width / 2,
            platform.y + 10
        );

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        // Draw platform
        ctx.fillStyle = color;
        ctx.fillRect(topLeft.x, topLeft.y, width, height);

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(topLeft.x, topLeft.y, width, height);

        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, topLeft.x + width / 2, topLeft.y - 5);
    }

    drawViewportIndicator() {
        const indicator = document.getElementById('viewport-indicator');
        const rect = this.viewport.getScreenViewportRect();

        indicator.style.left = rect.x + 'px';
        indicator.style.top = rect.y + 'px';
        indicator.style.width = rect.width + 'px';
        indicator.style.height = rect.height + 'px';
        indicator.classList.remove('hidden');
    }

    drawMinimap() {
        const ctx = this.minimapCtx;
        const w = this.minimap.width;
        const h = this.minimap.height;

        // Clear
        ctx.fillStyle = this.level.world.backgroundColor;
        ctx.fillRect(0, 0, w, h);

        // Draw world bounds
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        // Draw segments
        this.level.segments.forEach(segment => {
            if (segment.points.length < 2) return;

            ctx.beginPath();
            const first = this.viewport.worldToMinimap(
                segment.points[0].x,
                segment.points[0].y,
                w, h
            );
            ctx.moveTo(first.x, first.y);

            for (let i = 1; i < segment.points.length; i++) {
                const p = this.viewport.worldToMinimap(
                    segment.points[i].x,
                    segment.points[i].y,
                    w, h
                );
                ctx.lineTo(p.x, p.y);
            }

            ctx.strokeStyle = segment.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw platforms
        if (this.level.platforms.launch) {
            const p = this.viewport.worldToMinimap(
                this.level.platforms.launch.x,
                this.level.platforms.launch.y,
                w, h
            );
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }

        if (this.level.platforms.landing) {
            const p = this.viewport.worldToMinimap(
                this.level.platforms.landing.x,
                this.level.platforms.landing.y,
                w, h
            );
            ctx.fillStyle = '#e94560';
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }

        // Draw viewport rectangle
        const vpRect = this.viewport.getMinimapViewportRect(w, h);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(vpRect.x, vpRect.y, vpRect.width, vpRect.height);
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new LevelEditor();
});