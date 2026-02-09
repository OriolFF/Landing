/**
 * Terrain Merger - Handles merging overlapping terrain segments
 */
class TerrainMerger {
    constructor() {
        this.levelFormat = new LevelFormat();
    }
    
    /**
     * Check if any segments need merging and return merged result
     */
    mergeOverlappingSegments(segments) {
        if (segments.length < 2) return segments;
        
        const merged = [...segments];
        let changed = true;
        
        while (changed) {
            changed = false;
            
            for (let i = 0; i < merged.length; i++) {
                for (let j = i + 1; j < merged.length; j++) {
                    const seg1 = merged[i];
                    const seg2 = merged[j];
                    
                    if (this.shouldMerge(seg1, seg2)) {
                        // Merge segments
                        const newSegment = this.mergeTwoSegments(seg1, seg2);
                        
                        // Replace first with merged, remove second
                        merged[i] = newSegment;
                        merged.splice(j, 1);
                        
                        changed = true;
                        break;
                    }
                }
                
                if (changed) break;
            }
        }
        
        return merged;
    }
    
    /**
     * Check if two segments should be merged
     */
    shouldMerge(seg1, seg2) {
        // Check if segments overlap or touch
        if (this.levelFormat.checkSegmentsOverlap(seg1, seg2)) {
            return true;
        }
        
        // Check if endpoints are very close (touching)
        const threshold = 20; // pixels
        
        for (let p1 of [seg1.points[0], seg1.points[seg1.points.length - 1]]) {
            for (let p2 of [seg2.points[0], seg2.points[seg2.points.length - 1]]) {
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < threshold) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Merge two segments into one
     */
    mergeTwoSegments(seg1, seg2) {
        // Find connection points (closest endpoints)
        const pairs = [
            { p1: seg1.points[0], p2: seg2.points[0], end1: 'start', end2: 'start' },
            { p1: seg1.points[0], p2: seg2.points[seg2.points.length - 1], end1: 'start', end2: 'end' },
            { p1: seg1.points[seg1.points.length - 1], p2: seg2.points[0], end1: 'end', end2: 'start' },
            { p1: seg1.points[seg1.points.length - 1], p2: seg2.points[seg2.points.length - 1], end1: 'end', end2: 'end' }
        ];
        
        let bestPair = pairs[0];
        let minDist = Infinity;
        
        for (let pair of pairs) {
            const dist = Math.hypot(pair.p1.x - pair.p2.x, pair.p1.y - pair.p2.y);
            if (dist < minDist) {
                minDist = dist;
                bestPair = pair;
            }
        }
        
        // Build merged point array
        let points1 = [...seg1.points];
        let points2 = [...seg2.points];
        
        // Reverse if needed so connection is at end of first and start of second
        if (bestPair.end1 === 'start') {
            points1.reverse();
        }
        if (bestPair.end2 === 'end') {
            points2.reverse();
        }
        
        // Merge points
        let mergedPoints = [...points1];
        
        // Add intermediate points if there's a gap
        const lastP1 = points1[points1.length - 1];
        const firstP2 = points2[0];
        const gap = Math.hypot(lastP1.x - firstP2.x, lastP1.y - firstP2.y);
        
        if (gap > 10) {
            // Add intermediate point
            mergedPoints.push({
                x: (lastP1.x + firstP2.x) / 2,
                y: (lastP1.y + firstP2.y) / 2
            });
        }
        
        // Add second segment points (skip first if very close to connection)
        const threshold = 5;
        const p1Last = mergedPoints[mergedPoints.length - 1];
        const p2First = points2[0];
        
        if (Math.hypot(p1Last.x - p2First.x, p1Last.y - p2First.y) < threshold) {
            mergedPoints.push(...points2.slice(1));
        } else {
            mergedPoints.push(...points2);
        }
        
        // Simplify merged points (remove duplicates and very close points)
        mergedPoints = this.simplifyPoints(mergedPoints);
        
        // Use color of first segment (or blend if you want)
        return {
            id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: "terrain",
            color: seg1.color,
            points: mergedPoints,
            closed: false,
            fillBelow: true
        };
    }
    
    /**
     * Simplify point array by removing duplicates and very close points
     */
    simplifyPoints(points) {
        if (points.length < 3) return points;
        
        const simplified = [points[0]];
        const threshold = 5; // minimum distance between points
        
        for (let i = 1; i < points.length; i++) {
            const last = simplified[simplified.length - 1];
            const current = points[i];
            const dist = Math.hypot(last.x - current.x, last.y - current.y);
            
            if (dist >= threshold) {
                simplified.push(current);
            }
        }
        
        // Always keep last point
        if (simplified[simplified.length - 1] !== points[points.length - 1]) {
            simplified.push(points[points.length - 1]);
        }
        
        return simplified;
    }
    
    /**
     * Optimize all segments (simplify, merge, etc.)
     */
    optimizeSegments(segments) {
        // First simplify each segment
        const simplified = segments.map(seg => ({
            ...seg,
            points: this.simplifyPoints(seg.points)
        }));
        
        // Then merge overlapping
        return this.mergeOverlappingSegments(simplified);
    }
    
    /**
     * Check if adding new segment would exceed limit
     */
    canAddSegment(segments, maxSegments = 5) {
        // Count segments after potential merges
        const testSegments = [...segments, { points: [{x:0, y:0}] }];
        const merged = this.mergeOverlappingSegments(testSegments);
        return merged.length <= maxSegments;
    }
    
    /**
     * Preview what segments would look like after merge
     */
    previewMerge(segments) {
        const merged = this.mergeOverlappingSegments(segments);
        
        return {
            original: segments,
            merged: merged,
            count: merged.length,
            wasMerged: merged.length < segments.length
        };
    }
}