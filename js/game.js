/**
 * Game - Main game logic with scrollable world
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.levelLoader = new LevelLoader();
        this.currentLevel = null;
        this.terrain = null;
        this.ship = null;
        this.camera = null;
        
        this.keys = {};
        this.paused = false;
        this.gameOver = false;
        this.won = false;
        this.lastTime = 0;
        this.elapsedTime = 0;

        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.showMenu();
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameOver || this.won) {
                    this.restart();
                } else {
                    this.togglePause();
                }
            }
            
            if (e.code === 'Escape') {
                this.showMenu();
            }
            
            if (e.code === 'KeyR') {
                this.restart();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    async showMenu() {
        this.paused = true;
        document.getElementById('menu-overlay').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        await this.populateLevelList();
    }
    
    hideMenu() {
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.paused = false;
    }
    
    async populateLevelList() {
        const list = document.getElementById('level-list');
        list.innerHTML = '<div class="loading-levels">Discovering levels...</div>';

        try {
            const levels = await this.levelLoader.getAvailableLevels();

            list.innerHTML = '';

            if (levels.length === 0) {
                const isFileProtocol = window.location.protocol === 'file:';
                list.innerHTML = `
                    <div class="no-levels">
                        <strong>No levels found.</strong><br><br>
                        ${isFileProtocol ? `
                            <strong style="color: #ff6b6b;">You opened this file directly!</strong><br><br>
                            Browsers block level loading when opening HTML files directly.<br><br>
                            <strong>To fix this, run a local server:</strong><br>
                            <code>python3 -m http.server 8000</code><br>
                            Then open: <code>http://localhost:8000</code><br><br>
                            Or use: <code>npm start</code><br><br>
                        ` : `
                            Place level files in the <code>levels/</code> folder.<br>
                            Supported names: level1.json, level2.json, etc.<br>
                            Or any .json file in the levels directory.
                        `}
                    </div>
                `;
                return;
            }

            levels.forEach((level, index) => {
                const item = document.createElement('div');
                item.className = 'level-select-item';
                item.innerHTML = `
                    <div class="level-info">
                        <div class="level-name">${level.name}</div>
                        <div class="level-desc">${level.description}</div>
                    </div>
                    ${level.isCustom ? '<button class="delete-level" data-key="' + level.storageKey + '">Delete</button>' : ''}
                `;
                
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-level')) {
                        this.loadLevel(level.data);
                    }
                });
                
                const deleteBtn = item.querySelector('.delete-level');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this level?')) {
                            this.levelLoader.deleteCustomLevel(level.storageKey);
                            this.populateLevelList();
                        }
                    });
                }
                
                list.appendChild(item);
            });
            
            // Import button
            document.getElementById('import-level').onclick = () => {
                document.getElementById('level-file-input').click();
            };
            
            document.getElementById('level-file-input').onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const level = await this.levelLoader.loadFromFile(file);
                        this.loadLevel(level);
                    } catch (err) {
                        alert('Failed to load level: ' + err.message);
                    }
                }
            };
        } catch (error) {
            console.error('Error loading levels:', error);
            list.innerHTML = `
                <div class="no-levels">
                    <strong>Error loading levels.</strong><br><br>
                    ${error.message}<br><br>
                    Check the browser console for details.
                </div>
            `;
        }
    }
    
    loadLevel(levelData) {
        const validation = this.levelLoader.validate(levelData);
        if (!validation.valid) {
            alert('Invalid level: ' + validation.errors.join('\n'));
            return;
        }
        
        this.currentLevel = levelData;
        this.terrain = new Terrain(levelData);
        
        // Create camera
        this.camera = new Camera(
            this.canvas, 
            levelData.world.width, 
            levelData.world.height
        );
        
        // Create ship at launch pad
        const launch = levelData.platforms.launch;
        this.ship = new Ship(launch.x, launch.y - 50);
        
        // Set camera to follow ship
        this.camera.follow(this.ship);
        
        // Initialize camera with wide view of entire world, then zoom in
        this.camera.initializeWideView();
        
        this.gameOver = false;
        this.won = false;
        this.elapsedTime = 0;
        this.lastTime = performance.now();
        this.hideMenu();
        requestAnimationFrame((time) => this.loop(time));
    }
    
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
    }
    
    restart() {
        if (this.currentLevel) {
            this.loadLevel(this.currentLevel);
        }
    }
    
    update(deltaTime) {
        if (this.paused || this.gameOver || this.won) return;
        
        // Guard against invalid deltaTime
        if (!deltaTime || isNaN(deltaTime) || deltaTime < 0) {
            this.lastTime = performance.now();
            return;
        }

        this.elapsedTime += deltaTime;
        
        // Update ship input
        const thrust = this.keys['ArrowUp'] || this.keys['KeyW'];
        const left = this.keys['ArrowLeft'] || this.keys['KeyA'];
        const right = this.keys['ArrowRight'] || this.keys['KeyD'];
        
        this.ship.setInput(thrust, left, right);
        
        // Capture ship geometry before physics step for swept collision checks
        const previousVertices = this.ship.getVertices();
        
        // Update ship with deltaTime (original used gravity = 30)
        this.ship.update(deltaTime, 30);
        
        // Check terrain and platform collisions (use previous frame geometry)
        this.checkCollisions(previousVertices);
        
        // Update camera
        this.camera.update(deltaTime);
        
        // Check win/lose conditions
        if (this.ship.crashed) {
            this.gameOver = true;
        }
        
        if (this.ship.landed) {
            this.won = true;
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    checkCollisions(previousVertices = null) {
        const ship = this.ship;
        const platforms = this.currentLevel.platforms;
        
        // Get ship vertices for collision
        const vertices = ship.getVertices();
        const prevVerts = previousVertices || vertices;
        const currentBounds = this.getPolygonBounds(vertices);
        const previousBounds = this.getPolygonBounds(prevVerts);
        
        // Check terrain collision
        for (let vertex of vertices) {
            if (this.terrain.checkCollision(vertex.x, vertex.y, 5)) {
                const speed = ship.getSpeed();
                
                if (speed > 60) {
                    ship.crash();
                } else {
                    // Landed on terrain (not platform) - slide
                    const normal = this.terrain.getTerrainNormal(vertex.x, vertex.y);
                    ship.vx -= normal.x * 0.5;
                    ship.vy -= normal.y * 0.5;
                    
                    // Push out
                    ship.x += normal.x * 3;
                    ship.y += normal.y * 3;
                }
                return;
            }
        }
        
        // Check landing platform
        if (platforms.landing) {
            const landing = platforms.landing;
            const landingLeft = landing.x - landing.width / 2;
            const landingRight = landing.x + landing.width / 2;
            const landingTop = landing.y - 10;
            const landingBottom = landing.y + 10;
            
            const boundsOverlap =
                currentBounds.maxX >= landingLeft &&
                currentBounds.minX <= landingRight &&
                currentBounds.maxY >= landingTop &&
                currentBounds.minY <= landingBottom;
            
            const crossedBetweenFrames =
                previousBounds.maxY <= landingTop &&
                currentBounds.maxY >= landingTop &&
                currentBounds.maxX >= landingLeft &&
                currentBounds.minX <= landingRight;
            
            const onPlatform = vertices.some(v => 
                v.x >= landingLeft && 
                v.x <= landingRight &&
                v.y >= landingTop && 
                v.y <= landingBottom
            ) || boundsOverlap || crossedBetweenFrames;
            
            if (onPlatform) {
                const speed = ship.getSpeed();
                const angle = Math.abs(ship.angle % (Math.PI * 2));
                const normalizedAngle = angle > Math.PI ? 2 * Math.PI - angle : angle;
                
                if (speed < 25 && normalizedAngle < 0.3) {
                    ship.landed = true;
                    ship.vx = 0;
                    ship.vy = 0;
                    ship.angularVelocity = 0;
                    this.won = true;
                } else if (speed > 60) {
                    ship.crash();
                }
            }
        }
        
        // Check launch platform (collision only)
        if (platforms.launch) {
            const launch = platforms.launch;
            const onPlatform = vertices.some(v => 
                v.x >= launch.x - launch.width/2 && 
                v.x <= launch.x + launch.width/2 &&
                v.y >= launch.y - 10 && 
                v.y <= launch.y + 10
            );
            
            if (onPlatform) {
                const speed = ship.getSpeed();
                
                if (speed > 60) {
                    ship.crash();
                } else {
                    // Rest on platform
                    ship.vx *= 0.9;
                    ship.vy = Math.min(ship.vy, 0);
                }
            }
        }
        
        // World bounds
        if (ship.x < 0 || ship.x > this.currentLevel.world.width || 
            ship.y < 0 || ship.y > this.currentLevel.world.height) {
            ship.crash();
        }
    }
    
    getPolygonBounds(vertices) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        
        vertices.forEach(({ x, y }) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });
        
        return { minX, maxX, minY, maxY };
    }
    
    updateHUD() {
        if (!this.ship) return;
        
        const timerEl = document.getElementById('elapsed-time');
        if (timerEl) {
            timerEl.textContent = this.formatTime(this.elapsedTime);
        }
        
        document.getElementById('fuel').textContent = Math.round(this.ship.getFuelPercent()) + '%';
        document.getElementById('velocity').textContent = this.ship.getSpeed().toFixed(1);
        document.getElementById('altitude').textContent = Math.round(this.currentLevel.world.height - this.ship.y);
        document.getElementById('level-name-display').textContent = this.currentLevel.metadata.name;
        
        // Update indicators
        document.getElementById('fuel-bar').style.width = this.ship.getFuelPercent() + '%';
    }
    
    render() {
        if (!this.terrain || !this.camera) return;
        
        // Clear and setup camera transform
        this.ctx.fillStyle = this.currentLevel.world.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.camera.applyTransform();
        
        // Draw terrain
        this.terrain.render(this.ctx, this.camera);
        
        // Draw platforms
        this.drawPlatforms();
        
        // Draw ship
        this.ship.render(this.ctx);
        
        this.camera.restoreTransform();
        
        // Draw overlays
        this.drawOverlays();
    }
    
    drawPlatforms() {
        const platforms = this.currentLevel.platforms;
        
        // Launch platform
        if (platforms.launch) {
            this.drawPlatform(platforms.launch, '#4ade80', 'START');
        }
        
        // Landing platform
        if (platforms.landing) {
            this.drawPlatform(platforms.landing, '#e94560', 'GOAL');
        }
    }
    
    drawPlatform(platform, color, label) {
        const ctx = this.ctx;
        const scale = this.camera.scale;
        const x = platform.x - platform.width / 2;
        const y = platform.y;

        // Platform body
        ctx.fillStyle = color;
        ctx.fillRect(x, y, platform.width, 10);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(x, y, platform.width, 10);

        // Label - scale font size to keep it readable
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${14 / scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, platform.x, y - 10);

        // Landing zone indicator
        if (label === 'GOAL') {
            ctx.strokeStyle = color;
            ctx.setLineDash([5 / scale, 5 / scale]);
            ctx.lineWidth = 2 / scale;
            ctx.strokeRect(x - 10, y - 30, platform.width + 20, 40);
            ctx.setLineDash([]);
        }
    }
    
    drawOverlays() {
        // Game over screen
        if (this.gameOver) {
            this.drawCenteredText('CRASHED!', '#e94560', 48);
            this.drawCenteredText(`Mission Time: ${this.formatTime(this.elapsedTime)}`, '#facc15', 26, 60);
            this.drawCenteredText('Press SPACE to retry', '#fff', 20, 110);
        }
        
        // Win screen
        if (this.won) {
            this.drawCenteredText('SUCCESSFUL LANDING!', '#4ade80', 48);
            this.drawCenteredText(`Mission Time: ${this.formatTime(this.elapsedTime)}`, '#facc15', 26, 60);
            this.drawCenteredText('Press SPACE to continue', '#fff', 20, 110);
        }
    }
    
    formatTime(milliseconds) {
        const totalMs = Math.max(0, Math.floor(milliseconds));
        const totalSeconds = Math.floor(totalMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const tenths = Math.floor((totalMs % 1000) / 100);
        const minuteStr = minutes.toString().padStart(2, '0');
        const secondStr = seconds.toString().padStart(2, '0');
        return `${minuteStr}:${secondStr}.${tenths}`;
    }
    
    drawCenteredText(text, color, size, offsetY = 0) {
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${size}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + offsetY);
    }
    
    loop(currentTime) {
        if (!this.paused) {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
        }
        requestAnimationFrame((time) => this.loop(time));
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
