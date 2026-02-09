/**
 * Level Format Utilities - Shared between Editor and Game
 * Version 2.0
 */

class LevelFormat {
    constructor() {
        this.version = "2.0";
        this.maxSegments = 5;
        this.defaultWorldSize = { width: 5000, height: 3000 };
    }

    /**
     * Create a new empty level
     */
    createEmpty(name = "Untitled Level") {
        const timestamp = new Date().toISOString();
        const id = this.generateId();
        
        return {
            version: this.version,
            metadata: {
                id: id,
                name: name,
                author: "Anonymous",
                created: timestamp,
                modified: timestamp,
                gravity: 0.05,
                fuelMultiplier: 1.0
            },
            world: {
                width: this.defaultWorldSize.width,
                height: this.defaultWorldSize.height,
                backgroundColor: "#0a0a1a"
            },
            segments: [],
            platforms: {
                launch: null,
                landing: null
            },
            camera: {
                startX: 100,
                startY: this.defaultWorldSize.height - 500
            }
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate filename from level name
     */
    generateFilename(name) {
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '');
        
        // Sanitize name for filename
        const sanitized = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 30);
        
        return `${sanitized}_${dateStr}_${timeStr}.json`;
    }

    /**
     * Validate level structure
     */
    validate(level) {
        const errors = [];

        // Check version
        if (level.version !== this.version) {
            errors.push(`Version mismatch: expected ${this.version}, got ${level.version}`);
        }

        // Check metadata
        if (!level.metadata) errors.push("Missing metadata");
        if (!level.metadata?.id) errors.push("Missing metadata.id");
        if (!level.metadata?.name) errors.push("Missing metadata.name");

        // Check world
        if (!level.world) errors.push("Missing world");
        if (!level.world?.width || level.world.width <= 0) errors.push("Invalid world.width");
        if (!level.world?.height || level.world.height <= 0) errors.push("Invalid world.height");

        // Check segments
        if (!Array.isArray(level.segments)) {
            errors.push("segments must be an array");
        } else if (level.segments.length > this.maxSegments) {
            errors.push(`Too many segments: ${level.segments.length} (max ${this.maxSegments})`);
        }

        // Validate each segment
        level.segments?.forEach((seg, i) => {
            if (!seg.id) errors.push(`Segment ${i}: missing id`);
            if (seg.type !== 'terrain') errors.push(`Segment ${i}: invalid type`);
            if (!Array.isArray(seg.points) || seg.points.length < 2) {
                errors.push(`Segment ${i}: must have at least 2 points`);
            }
            if (!seg.color || !/^#[0-9A-Fa-f]{6}$/.test(seg.color)) {
                errors.push(`Segment ${i}: invalid color format`);
            }
        });

        // Check platforms
        if (level.platforms?.launch && !this.validatePlatform(level.platforms.launch)) {
            errors.push("Invalid launch platform");
        }
        if (level.platforms?.landing && !this.validatePlatform(level.platforms.landing)) {
            errors.push("Invalid landing platform");
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate platform structure
     */
    validatePlatform(platform) {
        return platform && 
               typeof platform.x === 'number' && 
               typeof platform.y === 'number' && 
               typeof platform.width === 'number' && 
               platform.width > 0;
    }

    /**
     * Serialize level to JSON string
     */
    serialize(level) {
        const validation = this.validate(level);
        if (!validation.valid) {
            throw new Error(`Invalid level: ${validation.errors.join(', ')}`);
        }
        
        // Update modified timestamp
        level.metadata.modified = new Date().toISOString();
        
        return JSON.stringify(level, null, 2);
    }

    /**
     * Parse JSON string to level object
     */
    deserialize(jsonString) {
        try {
            const level = JSON.parse(jsonString);
            const validation = this.validate(level);
            
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            return level;
        } catch (e) {
            throw new Error(`Failed to parse level: ${e.message}`);
        }
    }

    /**
     * Create a segment
     */
    createSegment(points, color = "#8B4513", fillDirection = "down") {
        return {
            id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: "terrain",
            color: color,
            points: points.map(p => ({ x: p.x, y: p.y })),
            closed: false,
            fillDirection: fillDirection // "down" = ground, "up" = ceiling/cave
        };
    }

    /**
     * Create a platform
     */
    createPlatform(x, y, width) {
        return {
            x: x,
            y: y,
            width: width
        };
    }

    /**
     * Check if two segments overlap or touch
     */
    checkSegmentsOverlap(seg1, seg2) {
        // Get bounding boxes
        const bbox1 = this.getSegmentBounds(seg1);
        const bbox2 = this.getSegmentBounds(seg2);

        // Check bounding box overlap first (optimization)
        if (!this.bboxesOverlap(bbox1, bbox2)) {
            return false;
        }

        // Check if any edges intersect
        const edges1 = this.getSegmentEdges(seg1);
        const edges2 = this.getSegmentEdges(seg2);

        for (let e1 of edges1) {
            for (let e2 of edges2) {
                if (this.lineSegmentsIntersect(e1, e2)) {
                    return true;
                }
            }
        }

        // Check if one segment is completely inside another
        if (this.pointInSegment(seg1.points[0], seg2) || 
            this.pointInSegment(seg2.points[0], seg1)) {
            return true;
        }

        return false;
    }

    /**
     * Get bounding box of segment
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
     * Check if two bounding boxes overlap
     */
    bboxesOverlap(bbox1, bbox2) {
        return !(bbox1.maxX < bbox2.minX || 
                 bbox2.maxX < bbox1.minX || 
                 bbox1.maxY < bbox2.minY || 
                 bbox2.maxY < bbox1.minY);
    }

    /**
     * Get edges of segment as line segments
     */
    getSegmentEdges(segment) {
        const edges = [];
        for (let i = 0; i < segment.points.length - 1; i++) {
            edges.push({
                p1: segment.points[i],
                p2: segment.points[i + 1]
            });
        }
        return edges;
    }

    /**
     * Check if two line segments intersect
     */
    lineSegmentsIntersect(edge1, edge2) {
        const { p1: a1, p2: a2 } = edge1;
        const { p1: b1, p2: b2 } = edge2;

        const d1 = this.direction(b1, b2, a1);
        const d2 = this.direction(b1, b2, a2);
        const d3 = this.direction(a1, a2, b1);
        const d4 = this.direction(a1, a2, b2);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
            return true;
        }

        if (d1 === 0 && this.onSegment(b1, b2, a1)) return true;
        if (d2 === 0 && this.onSegment(b1, b2, a2)) return true;
        if (d3 === 0 && this.onSegment(a1, a2, b1)) return true;
        if (d4 === 0 && this.onSegment(a1, a2, b2)) return true;

        return false;
    }

    /**
     * Calculate direction of point c relative to line ab
     */
    direction(a, b, c) {
        return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
    }

    /**
     * Check if point c lies on segment ab
     */
    onSegment(a, b, c) {
        return Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
               Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y);
    }

    /**
     * Check if point is inside segment polygon (ray casting)
     */
    pointInSegment(point, segment) {
        let inside = false;
        const points = segment.points;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
}

/**
 * Auto-save manager for editor
 */
class AutoSaveManager {
    constructor(storageKey = 'lunarEditorAutoSave') {
        this.storageKey = storageKey;
        this.interval = null;
        this.callback = null;
    }

    /**
     * Start auto-saving every intervalMs milliseconds
     */
    start(callback, intervalMs = 30000) {
        this.callback = callback;
        this.interval = setInterval(() => {
            this.save();
        }, intervalMs);
    }

    /**
     * Stop auto-saving
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Trigger immediate save
     */
    save() {
        if (this.callback) {
            const data = this.callback();
            if (data) {
                localStorage.setItem(this.storageKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                }));
            }
        }
    }

    /**
     * Load saved data
     */
    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.data;
            } catch (e) {
                console.error('Failed to load auto-save:', e);
                return null;
            }
        }
        return null;
    }

    /**
     * Clear saved data
     */
    clear() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Get last save timestamp
     */
    getLastSaveTime() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.timestamp;
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelFormat, AutoSaveManager };
}