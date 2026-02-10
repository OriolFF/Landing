/**
 * Level Loader - Handles loading and managing levels
 */
class LevelLoader {
    constructor() {
        this.levelFormat = new LevelFormat();
    }

    /**
     * Get list of available levels
     * Works on static sites (GitHub Pages) by trying to load level files directly
     */
    async getAvailableLevels() {
        const levels = [];

        // Load levels from levels/ directory (works on static sites)
        try {
            const fileLevels = await this.loadLevelsFromDirectory();
            levels.push(...fileLevels);
        } catch (e) {
            console.log('Could not load levels from directory:', e.message);
        }

        // Load custom levels from localStorage
        const customLevels = this.loadCustomLevels();
        levels.push(...customLevels);

        return levels;
    }

    /**
     * Load levels from levels/ directory dynamically
     * Works on static sites by trying to load files in parallel
     */
    async loadLevelsFromDirectory() {
        const levels = [];
        const potentialFiles = [];
        
        // Check if running from file:// protocol (direct file open)
        if (window.location.protocol === 'file:') {
            console.error('ERROR: Cannot load levels when opening file directly.');
            console.error('Please use a local server instead:');
            console.error('  python3 -m http.server 8000');
            console.error('  OR npm start');
            console.error('Then open: http://localhost:8000');
            throw new Error('Cannot load levels from file:// protocol. Please use a local server.');
        }
        
        // Add numbered levels (level1.json through level20.json)
        for (let i = 1; i <= 20; i++) {
            potentialFiles.push(`level${i}.json`);
        }
        
        // Add descriptive names
        const descriptiveNames = [
            'tutorial', 'easy', 'medium', 'hard', 'expert', 
            'beginner', 'advanced', 'master',
            'dificil1', 'levelstlar'  // Your existing custom levels
        ];
        descriptiveNames.forEach(name => {
            if (!potentialFiles.includes(`${name}.json`)) {
                potentialFiles.push(`${name}.json`);
            }
        });
        
        // Try to load all files in parallel
        const loadPromises = potentialFiles.map(async (filename) => {
            try {
                const response = await fetch(`levels/${filename}`);
                if (response.ok) {
                    const data = await response.json();
                    const validation = this.validate(data);
                    if (validation.valid) {
                        console.log(`Loaded level: ${filename}`);
                        return {
                            name: data.metadata?.name || filename.replace('.json', ''),
                            description: `By: ${data.metadata?.author || 'Unknown'}`,
                            data: data,
                            isFile: true,
                            filename: filename
                        };
                    } else {
                        console.warn(`Invalid level file ${filename}:`, validation.errors);
                    }
                }
            } catch (e) {
                // File doesn't exist or fetch failed - only log in debug mode
                if (window.location.search.includes('debug')) {
                    console.debug(`Failed to load ${filename}:`, e.message);
                }
            }
            return null;
        });
        
        // Wait for all attempts and collect successful loads
        const results = await Promise.all(loadPromises);
        results.forEach(level => {
            if (level) levels.push(level);
        });
        
        console.log(`Discovered ${levels.length} level(s)`);
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