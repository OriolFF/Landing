/**
 * Lunar Lander Level Editor Server
 * Handles auto-export of levels from editor to game
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const LEVELS_DIR = path.join(__dirname, 'levels');

// Ensure levels directory exists
if (!fs.existsSync(LEVELS_DIR)) {
    fs.mkdirSync(LEVELS_DIR, { recursive: true });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API: Export level
    if (pathname === '/api/export-level' && req.method === 'POST') {
        await handleExportLevel(req, res);
        return;
    }
    
    // API: List levels
    if (pathname === '/api/levels' && req.method === 'GET') {
        await handleListLevels(req, res);
        return;
    }
    
    // Serve static files
    await serveStaticFile(req, res, pathname);
});

/**
 * Handle level export from editor
 */
async function handleExportLevel(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            const { levelData, filename } = data;
            
            if (!levelData || !filename) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing levelData or filename' }));
                return;
            }
            
            // Sanitize filename
            const safeFilename = sanitizeFilename(filename);
            const filePath = path.join(LEVELS_DIR, safeFilename);
            
            // Validate level data structure
            const validation = validateLevel(levelData);
            if (!validation.valid) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid level data', details: validation.errors }));
                return;
            }
            
            // Write level file
            fs.writeFileSync(filePath, JSON.stringify(levelData, null, 2));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: `Level exported to ${safeFilename}`,
                filename: safeFilename 
            }));
            
            console.log(`[EXPORT] Level saved: ${safeFilename}`);
            
        } catch (error) {
            console.error('[EXPORT ERROR]', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to export level', message: error.message }));
        }
    });
}

/**
 * Handle listing all available levels
 */
async function handleListLevels(req, res) {
    try {
        const files = fs.readdirSync(LEVELS_DIR);
        const levels = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(LEVELS_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);
                    
                    levels.push({
                        filename: file,
                        name: data.metadata?.name || file.replace('.json', ''),
                        author: data.metadata?.author || 'Unknown',
                        created: data.metadata?.created || null,
                        modified: data.metadata?.modified || null
                    });
                } catch (e) {
                    console.warn(`[LIST] Failed to parse level ${file}:`, e.message);
                }
            }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ levels }));
        
    } catch (error) {
        console.error('[LIST ERROR]', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to list levels' }));
    }
}

/**
 * Serve static files
 */
async function serveStaticFile(req, res, pathname) {
    // Default to index.html for root
    let relativePath = pathname === '/' ? '/index.html' : pathname;
    
    // Security: prevent directory traversal
    relativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(__dirname, relativePath);
    
    // Check if filePath is a directory
    try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch (e) {
        // Path doesn't exist, will be handled by readFile error
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

/**
 * Sanitize filename for safe file system operations
 */
function sanitizeFilename(filename) {
    // Remove any path components
    filename = path.basename(filename);
    
    // Ensure it ends with .json
    if (!filename.endsWith('.json')) {
        filename += '.json';
    }
    
    // Replace unsafe characters
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    return filename;
}

/**
 * Validate level data structure
 */
function validateLevel(level) {
    const errors = [];
    
    if (!level.version) errors.push('Missing version');
    if (!level.metadata) errors.push('Missing metadata');
    if (!level.world) errors.push('Missing world');
    if (!Array.isArray(level.segments)) errors.push('Segments must be an array');
    if (!level.platforms) errors.push('Missing platforms');
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     Lunar Lander Level Editor Server                       ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Editor:  http://localhost:${PORT}/editor/                    ║
║  Game:    http://localhost:${PORT}/                           ║
║                                                            ║
║  API Endpoints:                                            ║
║  POST /api/export-level  - Export level from editor        ║
║  GET  /api/levels        - List all available levels       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
