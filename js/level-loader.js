/**
 * Level Loader - Handles loading and managing levels
 */
class LevelLoader {
    constructor() {
        this.levelFormat = new LevelFormat();
        this.defaultLevels = this.createDefaultLevels();
    }
    
    /**
     * Create some default levels
     */
    createDefaultLevels() {
        return [
            {
                name: "Tutorial",
                description: "Learn the basics",
                data: this.createTutorialLevel()
            },
            {
                name: "The Gap",
                description: "Navigate the divide",
                data: this.createGapLevel()
            },
            {
                name: "Mountain Pass",
                description: "Climb the heights",
                data: this.createMountainLevel()
            }
        ];
    }
    
    /**
     * Create tutorial level
     */
    createTutorialLevel() {
        return {
            version: "2.0",
            metadata: {
                name: "Tutorial",
                author: "System",
                created: new Date().toISOString(),
                gravity: 0.05,
                fuelMultiplier: 1.0
            },
            world: {
                width: 2000,
                height: 1500,
                backgroundColor: "#0a0a1a"
            },
            segments: [
                {
                    id: "ground",
                    type: "terrain",
                    color: "#8B4513",
                    points: [
                        {x: 0, y: 1200},
                        {x: 500, y: 1200},
                        {x: 1000, y: 1150},
                        {x: 1500, y: 1200},
                        {x: 2000, y: 1200}
                    ],
                    closed: false,
                    fillBelow: true
                }
            ],
            platforms: {
                launch: { x: 200, y: 1200, width: 120 },
                landing: { x: 1800, y: 1200, width: 120 }
            },
            camera: {
                startX: 200,
                startY: 1100
            }
        };
    }
    
    /**
     * Create gap level
     */
    createGapLevel() {
        return {
            version: "2.0",
            metadata: {
                name: "The Gap",
                author: "System",
                created: new Date().toISOString(),
                gravity: 0.05,
                fuelMultiplier: 1.0
            },
            world: {
                width: 3000,
                height: 2000,
                backgroundColor: "#0a0a1a"
            },
            segments: [
                {
                    id: "left_platform",
                    type: "terrain",
                    color: "#8B4513",
                    points: [
                        {x: 0, y: 1500},
                        {x: 800, y: 1500}
                    ],
                    closed: false,
                    fillBelow: true
                },
                {
                    id: "right_platform",
                    type: "terrain",
                    color: "#8B4513",
                    points: [
                        {x: 2200, y: 1500},
                        {x: 3000, y: 1500}
                    ],
                    closed: false,
                    fillBelow: true
                },
                {
                    id: "middle_obstacle",
                    type: "terrain",
                    color: "#654321",
                    points: [
                        {x: 1000, y: 1800},
                        {x: 1400, y: 1200},
                        {x: 1800, y: 1800}
                    ],
                    closed: false,
                    fillBelow: true
                }
            ],
            platforms: {
                launch: { x: 200, y: 1500, width: 120 },
                landing: { x: 2800, y: 1500, width: 120 }
            },
            camera: {
                startX: 200,
                startY: 1400
            }
        };
    }
    
    /**
     * Create mountain level
     */
    createMountainLevel() {
        const points = [];
        for (let x = 0; x <= 4000; x += 100) {
            const y = 1500 + Math.sin(x * 0.01) * 200 + Math.sin(x * 0.003) * 300;
            points.push({x, y});
        }
        
        return {
            version: "2.0",
            metadata: {
                name: "Mountain Pass",
                author: "System",
                created: new Date().toISOString(),
                gravity: 0.05,
                fuelMultiplier: 1.0
            },
            world: {
                width: 4000,
                height: 2500,
                backgroundColor: "#0a0a1a"
            },
            segments: [
                {
                    id: "mountains",
                    type: "terrain",
                    color: "#4a4a4a",
                    points: points,
                    closed: false,
                    fillBelow: true
                }
            ],
            platforms: {
                launch: { x: 200, y: 1500, width: 120 },
                landing: { x: 3800, y: 1300, width: 120 }
            },
            camera: {
                startX: 200,
                startY: 1400
            }
        };
    }
    
    /**
     * Get list of available levels
     */
    getAvailableLevels() {
        const levels = [...this.defaultLevels];
        
        // Load custom levels from localStorage
        const customLevels = this.loadCustomLevels();
        levels.push(...customLevels);
        
        return levels;
    }
    
    /**
     * Load custom levels from localStorage
     */
    loadCustomLevels() {
        const levels = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('lunarLevel_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    levels.push({
                        name: data.metadata?.name || 'Unnamed',
                        description: `Created: ${new Date(data.metadata?.created).toLocaleDateString()}`,
                        data: data,
                        isCustom: true,
                        storageKey: key
                    });
                } catch (e) {
                    console.error('Failed to load level:', key);
                }
            }
        }
        
        return levels;
    }
    
    /**
     * Save custom level to localStorage
     */
    saveCustomLevel(levelData, name) {
        const key = `lunarLevel_${Date.now()}`;
        levelData.metadata.name = name;
        levelData.metadata.modified = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(levelData));
        return key;
    }
    
    /**
     * Delete custom level
     */
    deleteCustomLevel(storageKey) {
        localStorage.removeItem(storageKey);
    }
    
    /**
     * Load level from file
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const level = this.levelFormat.deserialize(e.target.result);
                    resolve(level);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * Validate level data
     */
    validate(levelData) {
        return this.levelFormat.validate(levelData);
    }
}