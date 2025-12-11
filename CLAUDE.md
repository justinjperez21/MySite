# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of interactive game projects and visualizations built with vanilla JavaScript, Bootstrap 5, and Chart.js. The project emphasizes smooth 60fps real-time updates and no build process - everything runs directly in the browser using CDN-loaded libraries.

## Running the Site

The site is pure static HTML/CSS/JavaScript with no dependencies to install:

```bash
# Option 1: Simple Python HTTP server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 2: Just open index.html directly in a browser
# (Some features may not work due to CORS restrictions)
```

## Architecture

### File Structure
- **Root HTML files**: Each game/project gets its own HTML file (e.g., `coin-flip.html`)
- **`js/`**: Game logic files, one per project (e.g., `coin-flip.js`)
- **`css/`**: Shared styling in `style.css` (dark theme with GitHub-inspired colors)
- **`index.html`**: Landing page with project cards and navigation

### Key Architectural Patterns

**Game Class Pattern**: Each game is implemented as a class with:
- `constructor()`: Initialize game state
- `reset()`: Reset all state to initial values
- Core game logic methods (e.g., `flip()`)
- `getSummary()`: Return current statistics for UI updates

**Event-Driven Updates**:
- User interactions trigger game logic
- Game logic updates internal state
- UI update functions read state and update DOM
- Charts are updated separately with throttling

**Performance-Critical Chart Updates**:
- Chart updates are throttled to ~60fps (16ms intervals) using timestamps
- Charts use `animation: false` in options
- Updates use `chart.update('none')` for instant rendering without animation
- Line charts use `pointRadius: 0` to avoid rendering individual points
- This architecture prevents performance degradation even at high game speeds (60 flips/second)

### Adding New Projects

When creating a new game/visualization:

1. **Create HTML file** in root (e.g., `your-game.html`)
   - Copy navigation structure from `coin-flip.html`
   - Include Bootstrap CSS/JS and Chart.js via CDN
   - Link to `css/style.css` for consistent theming
   - Include your game's JS file at the end

2. **Create JS file** in `js/` directory (e.g., `js/your-game.js`)
   - Follow the class-based pattern (see `js/coin-flip.js`)
   - Implement throttled chart updates if using real-time plotting
   - Use `requestAnimationFrame()` for smooth animations if needed

3. **Update navigation** in all HTML files to include the new project

4. **Add project card** to `index.html` to showcase the new game

### Chart.js Integration

For smooth real-time charts:
```javascript
const CHART_UPDATE_INTERVAL = 16; // ~60fps
let lastChartUpdate = 0;

function updateCharts() {
    const now = Date.now();
    if (now - lastChartUpdate < CHART_UPDATE_INTERVAL) {
        return; // Skip if called too frequently
    }
    lastChartUpdate = now;

    // Update chart data
    chart.update('none'); // Use 'none' mode for instant update
}
```

Chart configuration should include:
- `animation: false` in options
- `pointRadius: 0` for line charts (avoids rendering thousands of points)
- Dark theme colors matching `css/style.css`

## Technology Stack

- **Bootstrap 5.3.0**: UI framework (via CDN)
- **Chart.js 4.4.0**: Real-time plotting (via CDN)
- **Vanilla JavaScript**: All game logic (ES6 classes)
- **No build tools**: Everything runs directly in the browser

## Design Philosophy

This project was migrated from Python/Dash specifically to achieve smooth real-time updates. Key decisions:

- **No backend**: All logic runs client-side for instant responsiveness
- **No build step**: Direct browser execution for simple development
- **Performance first**: Chart throttling and optimization for 60fps updates
- **Dark theme**: Consistent GitHub-inspired color scheme across all projects
