# Lunar Lander - Level Editor & Scrollable World

A complete level editor and game system for creating and playing custom Lunar Lander levels with scrollable worlds.

## Project Structure

```
landing2/
├── index.html              # Main game launcher with level picker
├── styles.css              # Game styles
├── shared/
│   └── level-format.js     # Shared level format utilities
├── js/
│   ├── game.js            # Main game logic
│   ├── camera.js          # Smooth lag camera
│   ├── terrain.js         # Multi-segment terrain renderer
│   ├── ship.js            # Player ship
│   └── level-loader.js    # Level loading and management
└── editor/
    ├── index.html         # Level editor interface
    ├── editor.css         # Editor styles
    ├── editor.js          # Editor logic
    ├── viewport.js        # Editor viewport system
    └── merger.js          # Terrain merging algorithm
```

## Features

### Level Editor

**Drawing Tools:**
- **Draw Tool (D)**: Free-hand terrain drawing
- **Select Tool (S)**: Select and move segments/points
- **Platform Tool (P)**: Place launch and landing platforms
- **Pan Tool (Space)**: Pan around the world

**Terrain System:**
- Free-hand drawing (no grid snapping)
- Up to 5 terrain segments per level
- Multi-colored terrain segments
- Automatic merging when segments overlap
- Solid terrain (filled below the surface)

**World Settings:**
- Configurable world size (up to 20,000 x 10,000)
- Background color selection
- Gravity adjustment
- Launch and landing platform placement

**Save Options:**
- **Save Draft (Ctrl+S)**: Save work-in-progress level
- **Export (Ctrl+E)**: Export level to game
- Auto-save every 30 seconds
- Undo/Redo support

**Editor Features:**
- Viewport indicator showing game screen area
- Minimap for navigation
- Grid toggle
- Keyboard shortcuts
- Coordinate display

### Game

**Scrollable World:**
- Smooth camera with lag (follows ship)
- Camera clamps to world edges
- Viewport culling for performance
- Multiple parallax layers (background)

**Level Picker:**
- Built-in default levels
- Import custom levels
- Save custom levels to localStorage
- Delete custom levels

**Gameplay:**
- Navigate from START to GOAL platform
- Physics-based ship controls
- Fuel management
- Velocity and altitude tracking
- Win/lose conditions

## Level Format (v2.0)

```json
{
  "version": "2.0",
  "metadata": {
    "name": "Level Name",
    "author": "Creator",
    "created": "2026-02-09T10:30:00Z",
    "gravity": 0.05,
    "fuelMultiplier": 1.0
  },
  "world": {
    "width": 5000,
    "height": 3000,
    "backgroundColor": "#0a0a1a"
  },
  "segments": [
    {
      "id": "segment_1",
      "type": "terrain",
      "color": "#8B4513",
      "points": [
        {"x": 0, "y": 2500},
        {"x": 100, "y": 2480}
      ],
      "closed": false,
      "fillBelow": true
    }
  ],
  "platforms": {
    "launch": {"x": 100, "y": 2500, "width": 120},
    "landing": {"x": 4700, "y": 2200, "width": 150}
  },
  "camera": {
    "startX": 100,
    "startY": 2400
  }
}
```

## Usage

### Playing the Game

1. Open `index.html` in a web browser
2. Select a level from the menu
3. Use controls:
   - **↑ / W**: Main thruster
   - **← / A**: Rotate left
   - **→ / D**: Rotate right
   - **Space**: Pause
   - **ESC**: Return to menu
   - **R**: Restart level

### Creating Levels

1. Click "Level Editor" from the game menu
2. Set world size and properties
3. Use Draw tool to create terrain
4. Place launch and landing platforms
5. Save draft or export to game
6. Import level in game menu

### Keyboard Shortcuts (Editor)

- **D**: Draw tool
- **S**: Select tool
- **P**: Platform tool
- **Space**: Pan tool
- **G**: Toggle grid
- **Ctrl+S**: Save draft
- **Ctrl+E**: Export level
- **Ctrl+Z**: Undo
- **Ctrl+Y / Ctrl+Shift+Z**: Redo
- **Delete**: Delete selected

## Technical Details

**Terrain Merging:**
- Automatically merges overlapping segments
- Uses line intersection and point-in-polygon tests
- Merges touching endpoints (20px threshold)
- Preserves dominant segment color

**Camera System:**
- Lag-based smoothing (0.1 factor)
- Clamps to world bounds with margin
- Viewport culling for performance

**Collision Detection:**
- Point-to-line distance for terrain
- Bounding box culling for optimization
- Terrain normal calculation for sliding

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires ES6+ support and Canvas API.

## Notes

- Exported levels are saved as JSON files
- Draft levels use localStorage auto-save
- Maximum 5 terrain segments per level
- World sizes up to 20,000 x 10,000 pixels supported
- All levels must have launch and landing platforms