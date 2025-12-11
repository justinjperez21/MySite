# Game Projects & Visualizations

A collection of interactive games and visualizations with smooth, real-time statistics powered by vanilla JavaScript and Chart.js.

## Features

- **Interactive Games**: Play games manually or watch them in autoplay mode
- **Real-time Statistics**: Smooth 60fps updates with live charts
- **Modular Structure**: Easy to add new projects
- **No Build Required**: Pure HTML/CSS/JavaScript with CDN libraries
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
MySite/
├── index.html              # Landing page
├── coin-flip.html          # Example: Coin flip game
├── css/
│   └── style.css          # Custom styles
├── js/
│   └── coin-flip.js       # Coin flip game logic
└── games/                  # Future game projects
```

## Getting Started

### No Installation Required!

Simply open `index.html` in your web browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a simple HTTP server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Use Node.js http-server
npx http-server
```

**That's it!** No dependencies to install, no build step needed.

## Technologies Used

- **HTML5/CSS3**: Structure and styling
- **Bootstrap 5**: UI components (via CDN)
- **Chart.js 4**: Real-time plotting (via CDN)
- **Vanilla JavaScript**: Game logic and interactivity

## Adding a New Project

### 1. Create the HTML Page

Create a new file `your-game.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Game</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Add navigation (copy from coin-flip.html) -->

    <!-- Your game UI here -->

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="js/your-game.js"></script>
</body>
</html>
```

### 2. Create the Game Logic

Create `js/your-game.js`:

```javascript
class YourGame {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.history = [];
    }

    play() {
        // Your game logic here
        this.score++;
        this.history.push(this.score);
    }
}

// Initialize game
const game = new YourGame();

// Set up event listeners
document.getElementById('play-btn').addEventListener('click', () => {
    game.play();
    updateUI();
});

function updateUI() {
    // Update DOM elements with game state
}
```

### 3. Add to Navigation

Update the navbar in all HTML files to include your new game.

### 4. Performance Tips

For smooth real-time updates:

- **Throttle chart updates**: Update stats every frame, charts every 16-50ms
- **Disable chart animations**: Use `animation: false` in Chart.js options
- **Update mode 'none'**: Use `chart.update('none')` for instant updates
- **Use requestAnimationFrame**: For smooth 60fps animations
- **Limit data points**: Only show last N points for very fast games

## Example Project

Check out **Coin Flip** (`coin-flip.html` and `js/coin-flip.js`) to see:

- Manual and autoplay modes (1-60 flips/second)
- Smooth real-time statistics updates
- Live updating charts with throttling
- Proper event handling and state management

## Why JavaScript Instead of Python?

The project was originally built with Dash (Python), but we migrated to JavaScript because:

- **Better performance**: Native browser rendering, no HTTP round-trips
- **Smooth updates**: 60fps chart updates vs 5fps max with Dash
- **Simpler deployment**: No backend needed, host anywhere
- **Lower latency**: No Python callback queuing issues

For real-time games and visualizations, JavaScript in the browser is the right tool.

## Deployment

Deploy to any static hosting service:

- **GitHub Pages**: Free, easy setup
- **Netlify**: Drag and drop deployment
- **Vercel**: Fast global CDN
- **Cloudflare Pages**: Free tier available

Just upload the files - no server-side code needed!

## Future Ideas

- Monte Carlo simulations
- Cellular automata visualizations
- Card game simulations
- Dice probability demonstrations
- Sorting algorithm visualizations
- Physics simulations
