// Connect Game - Configurable Tic-Tac-Toe/Connect Four Hybrid

// Color generation utilities
function generateDistinctColors(count) {
    // Generate colors evenly distributed on the color wheel
    // Use HSL with fixed saturation and lightness for visibility on dark background
    const colors = [];
    const goldenRatioConjugate = 0.618033988749895;
    let hue = Math.random(); // Start at random point on color wheel

    for (let i = 0; i < count; i++) {
        hue += goldenRatioConjugate;
        hue %= 1;
        // Convert to degrees and create HSL color
        // High saturation (70-85%) and medium-high lightness (55-70%) for visibility
        const h = Math.floor(hue * 360);
        const s = 70 + Math.random() * 15; // 70-85%
        const l = 55 + Math.random() * 15; // 55-70%
        colors.push(`hsl(${h}, ${s}%, ${l}%)`);
    }

    return colors;
}

function assignTeamColors(playerConfigs) {
    // Find all unique teams
    const teams = new Set();
    let nonTeamPlayers = 0;

    playerConfigs.forEach(config => {
        if (config.team !== null) {
            teams.add(config.team);
        } else {
            nonTeamPlayers++;
        }
    });

    // Generate colors for teams + individual players
    const totalColors = teams.size + nonTeamPlayers;
    const colors = generateDistinctColors(totalColors);

    // Assign colors to teams
    const teamColors = {};
    const teamArray = Array.from(teams).sort();
    teamArray.forEach((team, index) => {
        teamColors[team] = colors[index];
    });

    // Assign colors to individual players
    const individualColors = colors.slice(teams.size);
    let individualIndex = 0;

    const playerColors = [];
    playerConfigs.forEach(config => {
        if (config.team !== null) {
            playerColors.push(teamColors[config.team]);
        } else {
            playerColors.push(individualColors[individualIndex++]);
        }
    });

    return playerColors;
}

// AI Strategy class
class AIStrategy {
    constructor(name) {
        this.name = name;
    }

    getMove(game, playerIndex) {
        throw new Error('getMove must be implemented');
    }

    // Helper: Get all valid moves
    getValidMoves(game) {
        const moves = [];
        if (game.gravity) {
            // With gravity, only positions touching filled cells or edges in the gravity direction are valid
            let dr = 0, dc = 0;
            switch (game.gravityDirection) {
                case 'down': dr = 1; break;
                case 'up': dr = -1; break;
                case 'right': dc = 1; break;
                case 'left': dc = -1; break;
            }

            for (let row = 0; row < game.height; row++) {
                for (let col = 0; col < game.width; col++) {
                    if (game.board[row][col] !== null) continue;

                    // Check if this empty cell is at the edge in the gravity direction
                    const nextRow = row + dr;
                    const nextCol = col + dc;
                    const isAtEdge = nextRow < 0 || nextRow >= game.height ||
                                    nextCol < 0 || nextCol >= game.width;

                    // Or if it's adjacent to a filled cell in the gravity direction
                    const touchingFilled = !isAtEdge && game.board[nextRow][nextCol] !== null;

                    if (isAtEdge || touchingFilled) {
                        moves.push({ row, col });
                    }
                }
            }
        } else {
            // Without gravity, all empty cells are valid
            for (let row = 0; row < game.height; row++) {
                for (let col = 0; col < game.width; col++) {
                    if (game.board[row][col] === null) {
                        moves.push({ row, col });
                    }
                }
            }
        }
        return moves;
    }

    // Helper: Check if a move creates a win
    checkWinningMove(game, row, col, playerIndex) {
        // Temporarily place the piece
        game.board[row][col] = playerIndex;
        const result = game.checkWin();
        game.board[row][col] = null; // Undo
        return result;
    }

    // Helper: Get opponent indices
    getOpponents(game, playerIndex) {
        const currentPlayer = game.players[playerIndex];
        return game.players
            .map((p, i) => ({ player: p, index: i }))
            .filter(({ player, index }) => {
                // Don't include self
                if (index === playerIndex) return false;

                // If either player has no team, they're opponents
                if (currentPlayer.team === null || player.team === null) return true;

                // If both have teams, they're opponents if on different teams
                return currentPlayer.team !== player.team;
            })
            .map(({ index }) => index);
    }
}

// Random AI - picks random valid move
class RandomAI extends AIStrategy {
    constructor() {
        super('Random');
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

// Defensive AI - blocks opponent's longest chain
class DefensiveAI extends AIStrategy {
    constructor() {
        super('Defensive');
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);
        const opponents = this.getOpponents(game, playerIndex);

        // Find the move that blocks the longest opponent chain
        let bestMove = null;
        let maxChainBlocked = 0;

        for (const move of moves) {
            // Check what's the longest opponent chain this move would block/interfere with
            for (const oppIndex of opponents) {
                const chainLength = this.getLongestChainNear(game, move.row, move.col, oppIndex);
                if (chainLength > maxChainBlocked) {
                    maxChainBlocked = chainLength;
                    bestMove = move;
                }
            }
        }

        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }

    // Get the longest chain that this position would be adjacent to
    getLongestChainNear(game, row, col, playerIndex) {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal down-right
            { dr: 1, dc: -1 }  // Diagonal down-left
        ];

        let maxChain = 0;

        for (const { dr, dc } of directions) {
            let chainLength = 0;

            // Check in both directions along this line
            for (let dir of [-1, 1]) {
                for (let i = 1; i < game.winLength; i++) {
                    const nr = row + dr * i * dir;
                    const nc = col + dc * i * dir;

                    if (nr < 0 || nr >= game.height || nc < 0 || nc >= game.width) break;

                    const cell = game.board[nr][nc];
                    if (cell === null) break;

                    // Check if same team or same player
                    const sameTeam = game.players[playerIndex].team !== null &&
                                   game.players[cell].team === game.players[playerIndex].team;

                    if (cell === playerIndex || sameTeam) {
                        chainLength++;
                    } else {
                        break;
                    }
                }
            }

            maxChain = Math.max(maxChain, chainLength);
        }

        return maxChain;
    }
}

// Offensive AI - extends longest chain or creates new ones
class OffensiveAI extends AIStrategy {
    constructor() {
        super('Offensive');
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);

        // Find our longest chain and try to extend it
        let bestMove = null;
        let bestScore = -1;

        for (const move of moves) {
            const score = this.evaluateMove(game, move, playerIndex);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }

    evaluateMove(game, move, playerIndex) {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal down-right
            { dr: 1, dc: -1 }  // Diagonal down-left
        ];

        let maxExtension = 0;

        for (const { dr, dc } of directions) {
            // Count existing chain in both directions
            let chainLength = 0;
            let canExtendInDirection = true;

            // Check in both directions
            for (let dir of [-1, 1]) {
                for (let i = 1; i < game.winLength; i++) {
                    const nr = move.row + dr * i * dir;
                    const nc = move.col + dc * i * dir;

                    if (nr < 0 || nr >= game.height || nc < 0 || nc >= game.width) {
                        break;
                    }

                    const cell = game.board[nr][nc];
                    if (cell === null) break;

                    // Check if same team or same player
                    const sameTeam = game.players[playerIndex].team !== null &&
                                   game.players[cell].team === game.players[playerIndex].team;

                    if (cell === playerIndex || sameTeam) {
                        chainLength++;
                    } else {
                        break;
                    }
                }
            }

            // Calculate potential: existing chain + 1 (this move)
            const potential = chainLength + 1;

            // Check if we can win by extending this direction
            if (potential >= game.winLength) {
                return 1000; // Winning move gets highest priority
            }

            // Check if we have room to reach win length in this direction
            let spacesAvailable = 1; // Count this position
            for (let dir of [-1, 1]) {
                for (let i = 1; i < game.winLength; i++) {
                    const nr = move.row + dr * i * dir;
                    const nc = move.col + dc * i * dir;

                    if (nr < 0 || nr >= game.height || nc < 0 || nc >= game.width) break;

                    const cell = game.board[nr][nc];
                    if (cell === null || cell === playerIndex ||
                        (game.players[playerIndex].team !== null &&
                         game.players[cell]?.team === game.players[playerIndex].team)) {
                        spacesAvailable++;
                    } else {
                        break;
                    }
                }
            }

            // If we can reach win length, prefer longer chains
            if (spacesAvailable >= game.winLength) {
                maxExtension = Math.max(maxExtension, chainLength * 10 + spacesAvailable);
            }
        }

        // If no good extension found, return small positive for any move (creates new chain)
        return maxExtension > 0 ? maxExtension : 1;
    }
}

// Smart AI - combines offensive and defensive
class SmartAI extends AIStrategy {
    constructor() {
        super('Smart');
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);
        const opponents = this.getOpponents(game, playerIndex);

        // 1. Check if we can win
        for (const move of moves) {
            if (this.checkWinningMove(game, move.row, move.col, playerIndex)) {
                return move;
            }
        }

        // 2. Check if we need to block opponent
        for (const move of moves) {
            for (const oppIndex of opponents) {
                if (this.checkWinningMove(game, move.row, move.col, oppIndex)) {
                    return move;
                }
            }
        }

        // 3. Try to build towards a win (heuristic: pick center or adjacent to existing pieces)
        const scoredMoves = moves.map(move => ({
            move,
            score: this.scoreMove(game, move, playerIndex)
        }));
        scoredMoves.sort((a, b) => b.score - a.score);

        return scoredMoves[0].move;
    }

    scoreMove(game, move, playerIndex) {
        let score = 0;
        const { row, col } = move;

        // Prefer center
        const centerCol = Math.floor(game.width / 2);
        const centerRow = Math.floor(game.height / 2);
        score += 10 - Math.abs(col - centerCol) - Math.abs(row - centerRow);

        // Prefer moves adjacent to own pieces
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < game.height && nc >= 0 && nc < game.width) {
                if (game.board[nr][nc] === playerIndex) {
                    score += 5;
                }
            }
        }

        return score;
    }
}

// Offensive Smart AI - offensive unless needs to block a loss
class OffensiveSmartAI extends OffensiveAI {
    constructor() {
        super();
        this.name = 'Offensive Smart';
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);
        const opponents = this.getOpponents(game, playerIndex);

        // 1. Check if we can win
        for (const move of moves) {
            if (this.checkWinningMove(game, move.row, move.col, playerIndex)) {
                return move;
            }
        }

        // 2. Check if we need to block opponent from winning
        for (const move of moves) {
            for (const oppIndex of opponents) {
                if (this.checkWinningMove(game, move.row, move.col, oppIndex)) {
                    return move; // Block the loss
                }
            }
        }

        // 3. Otherwise, use offensive strategy (extend longest chain)
        return super.getMove(game, playerIndex);
    }
}

// Defensive Smart AI - defensive unless can win
class DefensiveSmartAI extends DefensiveAI {
    constructor() {
        super();
        this.name = 'Defensive Smart';
    }

    getMove(game, playerIndex) {
        const moves = this.getValidMoves(game);

        // 1. Check if we can win immediately
        for (const move of moves) {
            if (this.checkWinningMove(game, move.row, move.col, playerIndex)) {
                return move; // Take the win
            }
        }

        // 2. Otherwise, use defensive strategy (block longest opponent chain)
        return super.getMove(game, playerIndex);
    }
}

// AI Strategies registry
const AI_STRATEGIES = {
    'random': new RandomAI(),
    'defensive': new DefensiveAI(),
    'offensive': new OffensiveAI(),
    'smart': new SmartAI(),
    'offensive-smart': new OffensiveSmartAI(),
    'defensive-smart': new DefensiveSmartAI()
};

// Player class
class Player {
    constructor(index, color, type = 'human', aiStrategy = 'random', team = null) {
        this.index = index;
        this.color = color;
        this.type = type; // 'human' or 'ai'
        this.aiStrategy = aiStrategy;
        this.team = team; // null or team number
    }

    getName() {
        if (this.team !== null) {
            return `Team ${this.team + 1} - Player ${this.index.toString(16).toUpperCase()}`;
        }
        return `Player ${this.index.toString(16).toUpperCase()}`;
    }

    getSymbol() {
        return this.index.toString(16).toUpperCase();
    }
}

// Main Game class
class ConnectGame {
    constructor(width, height, winLength, gravity, players, gravityRotation = null, teamCollaboration = true) {
        this.width = width;
        this.height = height;
        this.winLength = winLength;
        this.gravity = gravity;
        this.players = players;
        this.gravityRotation = gravityRotation; // {turns: N, mode: 'clockwise'/'counterclockwise'/'random'}
        this.teamCollaboration = teamCollaboration; // Whether teammates' pieces count toward wins
        this.reset();
    }

    reset() {
        this.board = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        this.currentPlayerIndex = 0;
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.turnCount = 0;
        this.gravityDirection = 'down'; // down, right, up, left
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    rotateGravityIfNeeded() {
        if (!this.gravityRotation || this.gravityRotation.mode === 'none') return;

        this.turnCount++;
        if (this.turnCount % this.gravityRotation.turns === 0) {
            const directions = ['down', 'right', 'up', 'left'];

            if (this.gravityRotation.mode === 'random') {
                this.gravityDirection = directions[Math.floor(Math.random() * directions.length)];
            } else if (this.gravityRotation.mode === 'clockwise') {
                const currentIndex = directions.indexOf(this.gravityDirection);
                this.gravityDirection = directions[(currentIndex + 1) % 4];
            } else if (this.gravityRotation.mode === 'counterclockwise') {
                const currentIndex = directions.indexOf(this.gravityDirection);
                this.gravityDirection = directions[(currentIndex + 3) % 4];
            }

            // Apply gravity in new direction
            this.applyGravity();
        }
    }

    applyGravity() {
        if (!this.gravity) return;

        let changed = true;

        while (changed) {
            changed = false;

            // Process in order based on gravity direction to avoid conflicts
            const positions = [];
            for (let row = 0; row < this.height; row++) {
                for (let col = 0; col < this.width; col++) {
                    if (this.board[row][col] !== null) {
                        positions.push([row, col]);
                    }
                }
            }

            // Sort positions so we process pieces in gravity direction order
            switch (this.gravityDirection) {
                case 'down':
                    positions.sort((a, b) => b[0] - a[0]); // Bottom to top
                    break;
                case 'up':
                    positions.sort((a, b) => a[0] - b[0]); // Top to bottom
                    break;
                case 'right':
                    positions.sort((a, b) => b[1] - a[1]); // Right to left
                    break;
                case 'left':
                    positions.sort((a, b) => a[1] - b[1]); // Left to right
                    break;
            }

            for (const [row, col] of positions) {
                if (this.board[row][col] === null) continue;

                const [newRow, newCol] = this.getGravityTarget(row, col);
                if (newRow !== row || newCol !== col) {
                    this.board[newRow][newCol] = this.board[row][col];
                    this.board[row][col] = null;
                    changed = true;
                }
            }
        }
    }

    getGravityTarget(row, col) {
        if (!this.gravity) return [row, col];

        let dr = 0, dc = 0;
        switch (this.gravityDirection) {
            case 'down': dr = 1; break;
            case 'up': dr = -1; break;
            case 'right': dc = 1; break;
            case 'left': dc = -1; break;
        }

        let newRow = row, newCol = col;
        while (true) {
            const nextRow = newRow + dr;
            const nextCol = newCol + dc;

            if (nextRow < 0 || nextRow >= this.height ||
                nextCol < 0 || nextCol >= this.width ||
                this.board[nextRow][nextCol] !== null) {
                break;
            }

            newRow = nextRow;
            newCol = nextCol;
        }

        return [newRow, newCol];
    }

    isValidMove(row, col) {
        if (this.gameOver) return false;
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return false;

        if (this.gravity) {
            // With gravity, check if this is the target position after gravity
            const [targetRow, targetCol] = this.getGravityTarget(row, col);
            if (targetRow !== row || targetCol !== col) {
                return false; // Not the final gravity position
            }
        }

        return this.board[row][col] === null;
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) {
            return false;
        }

        this.board[row][col] = this.currentPlayerIndex;

        // Check for win
        const winResult = this.checkWin();
        if (winResult) {
            this.gameOver = true;
            this.winner = winResult.winner;
            this.winningCells = winResult.cells;
            return true;
        }

        // Check for draw
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.winner = null; // Draw
            return true;
        }

        // Next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        // Check if we need to rotate gravity
        this.rotateGravityIfNeeded();

        return true;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== null));
    }

    checkWin() {
        // Check all directions: horizontal, vertical, diagonal (both ways)
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal down-right
            { dr: 1, dc: -1 }  // Diagonal down-left
        ];

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const playerIndex = this.board[row][col];
                if (playerIndex === null) continue;

                for (const { dr, dc } of directions) {
                    const cells = [{ row, col }];

                    // Check in the direction
                    for (let i = 1; i < this.winLength; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;

                        if (newRow < 0 || newRow >= this.height ||
                            newCol < 0 || newCol >= this.width) {
                            break;
                        }

                        const cellPlayer = this.board[newRow][newCol];
                        if (cellPlayer === null) break;

                        // Check if this cell counts toward the win
                        let countsTowardWin = false;

                        if (cellPlayer === playerIndex) {
                            countsTowardWin = true; // Same player always counts
                        } else if (this.teamCollaboration) {
                            // With collaboration, check if same team
                            const sameTeam = this.players[playerIndex].team !== null &&
                                           this.players[cellPlayer].team === this.players[playerIndex].team;
                            countsTowardWin = sameTeam;
                        }

                        if (countsTowardWin) {
                            cells.push({ row: newRow, col: newCol });
                        } else {
                            break;
                        }
                    }

                    if (cells.length >= this.winLength) {
                        // Determine winner (could be a team)
                        const winningTeam = this.players[playerIndex].team;
                        return {
                            winner: winningTeam !== null ? `Team ${winningTeam + 1}` : this.players[playerIndex].getName(),
                            cells: cells,
                            playerIndex: playerIndex
                        };
                    }
                }
            }
        }

        return null;
    }

    getAIMove() {
        const player = this.getCurrentPlayer();
        if (player.type !== 'ai') return null;

        const strategy = AI_STRATEGIES[player.aiStrategy];
        return strategy.getMove(this, this.currentPlayerIndex);
    }
}

// UI Controller
class GameUI {
    constructor() {
        this.game = null;
        this.boardElement = document.getElementById('game-board');
        this.setupEventListeners();
        this.initializePlayerConfigs();
        this.updateConfigUI();
    }

    setupEventListeners() {
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('add-player-btn').addEventListener('click', () => this.addPlayer());
        document.getElementById('remove-player-btn').addEventListener('click', () => this.removePlayer());

        // Update value displays
        document.getElementById('board-width').addEventListener('input', (e) => {
            document.getElementById('width-value').textContent = e.target.value;
        });
        document.getElementById('board-height').addEventListener('input', (e) => {
            document.getElementById('height-value').textContent = e.target.value;
        });
        document.getElementById('win-length').addEventListener('input', (e) => {
            document.getElementById('win-value').textContent = e.target.value;
        });

        // Toggle gravity rotation section
        document.getElementById('gravity-toggle').addEventListener('change', (e) => {
            const rotationSection = document.getElementById('gravity-rotation-section');
            rotationSection.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    initializePlayerConfigs() {
        this.playerConfigs = [
            { type: 'human', aiStrategy: 'random', team: null },
            { type: 'ai', aiStrategy: 'smart', team: null }
        ];
        this.renderPlayerConfigs();
        this.updateRemoveButton();
    }

    addPlayer() {
        this.playerConfigs.push({
            type: 'human',
            aiStrategy: 'random',
            team: null
        });
        this.renderPlayerConfigs();
        this.updateRemoveButton();
    }

    removePlayer() {
        if (this.playerConfigs.length <= 2) {
            return; // Do nothing
        }
        this.playerConfigs.pop();
        this.renderPlayerConfigs();
        this.updateRemoveButton();
    }

    updateRemoveButton() {
        const btn = document.getElementById('remove-player-btn');
        if (this.playerConfigs.length <= 2) {
            btn.disabled = true;
            btn.title = 'Minimum 2 players required';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.disabled = false;
            btn.title = '';
            btn.style.cursor = 'pointer';
        }
    }

    renderPlayerConfigs() {
        const container = document.getElementById('players-container');
        container.innerHTML = '';

        // Generate colors for current config
        const colors = assignTeamColors(this.playerConfigs);

        this.playerConfigs.forEach((config, index) => {
            const div = document.createElement('div');
            div.className = 'player-config';
            div.innerHTML = `
                <div class="row align-items-center mb-2">
                    <div class="col-auto">
                        <span class="player-indicator" style="background-color: ${colors[index]}">
                            <span style="color: #0d1117; font-weight: bold; font-size: 12px;">${index.toString(16).toUpperCase()}</span>
                        </span>
                    </div>
                    <div class="col">
                        <strong>Player ${index.toString(16).toUpperCase()}</strong>
                        ${config.team !== null ? ` (Team ${config.team + 1})` : ''}
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <label class="form-label small">Type</label>
                        <select class="form-select form-select-sm"
                                data-index="${index}"
                                data-field="type">
                            <option value="human" ${config.type === 'human' ? 'selected' : ''}>Human</option>
                            <option value="ai" ${config.type === 'ai' ? 'selected' : ''}>AI</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label small">Team</label>
                        <select class="form-select form-select-sm"
                                data-index="${index}"
                                data-field="team">
                            <option value="">None</option>
                            <option value="0" ${config.team === 0 ? 'selected' : ''}>Team 1</option>
                            <option value="1" ${config.team === 1 ? 'selected' : ''}>Team 2</option>
                            <option value="2" ${config.team === 2 ? 'selected' : ''}>Team 3</option>
                            <option value="3" ${config.team === 3 ? 'selected' : ''}>Team 4</option>
                            <option value="4" ${config.team === 4 ? 'selected' : ''}>Team 5</option>
                            <option value="5" ${config.team === 5 ? 'selected' : ''}>Team 6</option>
                        </select>
                    </div>
                </div>
                <div class="row" id="ai-strategy-${index}" style="display: ${config.type === 'ai' ? 'block' : 'none'}">
                    <div class="col-12">
                        <label class="form-label small">AI Strategy</label>
                        <select class="form-select form-select-sm"
                                data-index="${index}"
                                data-field="aiStrategy">
                            <option value="random" ${config.aiStrategy === 'random' ? 'selected' : ''}>Random</option>
                            <option value="defensive" ${config.aiStrategy === 'defensive' ? 'selected' : ''}>Defensive</option>
                            <option value="offensive" ${config.aiStrategy === 'offensive' ? 'selected' : ''}>Offensive</option>
                            <option value="defensive-smart" ${config.aiStrategy === 'defensive-smart' ? 'selected' : ''}>Defensive Smart</option>
                            <option value="offensive-smart" ${config.aiStrategy === 'offensive-smart' ? 'selected' : ''}>Offensive Smart</option>
                            <option value="smart" ${config.aiStrategy === 'smart' ? 'selected' : ''}>Smart (Balanced)</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        // Add event listeners for config changes
        container.querySelectorAll('select').forEach(element => {
            element.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                let value = e.target.value;

                if (field === 'team') {
                    value = value === '' ? null : parseInt(value);
                }

                this.playerConfigs[index][field] = value;

                // Show/hide AI strategy based on type
                if (field === 'type') {
                    const strategyDiv = document.getElementById(`ai-strategy-${index}`);
                    strategyDiv.style.display = value === 'ai' ? 'block' : 'none';
                }

                // Re-render to update colors when team changes
                if (field === 'team') {
                    this.renderPlayerConfigs();
                }
            });
        });
    }

    updateConfigUI() {
        // Updates are handled by input event listeners
    }

    startGame() {
        const width = parseInt(document.getElementById('board-width').value);
        const height = parseInt(document.getElementById('board-height').value);
        const winLength = parseInt(document.getElementById('win-length').value);
        const gravity = document.getElementById('gravity-toggle').checked;

        // Get gravity rotation settings
        let gravityRotation = null;
        if (gravity) {
            const mode = document.getElementById('gravity-rotation-mode').value;
            const turns = parseInt(document.getElementById('gravity-rotation-turns').value);
            if (mode !== 'none' && turns > 0) {
                gravityRotation = { mode, turns };
            }
        }

        // Generate colors for players
        const colors = assignTeamColors(this.playerConfigs);

        // Get team collaboration setting
        const teamCollaboration = document.getElementById('team-collaboration-toggle').checked;

        // Create players
        const players = this.playerConfigs.map((config, index) => {
            return new Player(
                index,
                colors[index],
                config.type,
                config.aiStrategy,
                config.team
            );
        });

        // Create game
        this.game = new ConnectGame(width, height, winLength, gravity, players, gravityRotation, teamCollaboration);
        this.renderBoard();
        this.updateStatus();

        // If first player is AI, make their move
        this.processAITurn();
    }

    resetGame() {
        if (this.game) {
            this.game.reset();
            this.renderBoard();
            this.updateStatus();
            this.processAITurn();
        }
    }

    renderBoard() {
        if (!this.game) {
            this.boardElement.innerHTML = '<p class="text-muted">Configure and start a game</p>';
            return;
        }

        const gridStyle = `
            display: grid;
            grid-template-columns: repeat(${this.game.width}, minmax(40px, 60px));
            gap: 2px;
        `;

        this.boardElement.innerHTML = '';
        this.boardElement.style.cssText = gridStyle;

        for (let row = 0; row < this.game.height; row++) {
            for (let col = 0; col < this.game.width; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const playerIndex = this.game.board[row][col];
                if (playerIndex !== null) {
                    const player = this.game.players[playerIndex];
                    cell.textContent = player.getSymbol();
                    cell.style.backgroundColor = player.color;
                    cell.style.color = '#0d1117';
                    cell.style.fontWeight = 'bold';
                    cell.classList.add('filled');
                }

                // Check if this is a winning cell
                if (this.game.winningCells.some(wc => wc.row === row && wc.col === col)) {
                    cell.classList.add('winning-cell');
                }

                cell.addEventListener('click', () => this.handleCellClick(row, col));
                this.boardElement.appendChild(cell);
            }
        }

        // Add gravity indicator if gravity is enabled
        this.updateGravityIndicator();
    }

    updateGravityIndicator() {
        // Remove existing indicator
        const existingIndicator = document.querySelector('.gravity-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (!this.game || !this.game.gravity) return;

        const boardContainer = this.boardElement.parentElement;
        const indicator = document.createElement('div');
        indicator.className = 'gravity-indicator';

        const directionMap = {
            'down': { arrow: '↓', position: 'gravity-indicator-bottom' },
            'up': { arrow: '↑', position: 'gravity-indicator-top' },
            'left': { arrow: '←', position: 'gravity-indicator-left' },
            'right': { arrow: '→', position: 'gravity-indicator-right' }
        };

        const direction = directionMap[this.game.gravityDirection];
        indicator.textContent = direction.arrow;
        indicator.classList.add(direction.position);

        boardContainer.appendChild(indicator);
    }

    handleCellClick(row, col) {
        if (!this.game || this.game.gameOver) return;

        const currentPlayer = this.game.getCurrentPlayer();
        if (currentPlayer.type === 'ai') return; // Don't allow clicks during AI turn

        // If gravity is enabled, find the correct target position
        let targetRow = row, targetCol = col;
        if (this.game.gravity) {
            [targetRow, targetCol] = this.game.getGravityTarget(row, col);
        }

        if (this.game.makeMove(targetRow, targetCol)) {
            this.renderBoard();
            this.updateStatus();

            if (!this.game.gameOver) {
                // Process AI turns if next player is AI
                this.processAITurn();
            }
        }
    }

    processAITurn() {
        if (!this.game || this.game.gameOver) return;

        const currentPlayer = this.game.getCurrentPlayer();
        if (currentPlayer.type !== 'ai') return;

        // Show AI thinking indicator
        document.getElementById('ai-thinking').style.display = 'block';

        // Add slight delay for better UX
        setTimeout(() => {
            const move = this.game.getAIMove();
            if (move) {
                this.game.makeMove(move.row, move.col);
                this.renderBoard();
                this.updateStatus();
                document.getElementById('ai-thinking').style.display = 'none';

                // If next player is also AI, continue
                if (!this.game.gameOver) {
                    this.processAITurn();
                }
            }
        }, 300);
    }

    updateStatus() {
        if (!this.game) {
            document.getElementById('game-state').textContent = 'Not Started';
            document.getElementById('gravity-direction-display').style.display = 'none';
            return;
        }

        // Update current player
        const currentPlayer = this.game.getCurrentPlayer();
        const playerIndicator = document.getElementById('current-player');
        playerIndicator.innerHTML = `
            <span class="player-indicator" style="background-color: ${currentPlayer.color}">
                <span style="color: #0d1117; font-weight: bold; font-size: 12px;">${currentPlayer.getSymbol()}</span>
            </span>
            <span class="ms-2">${currentPlayer.getName()} ${currentPlayer.type === 'ai' ? '(AI - ' + currentPlayer.aiStrategy + ')' : ''}</span>
        `;

        // Update game state
        const stateElement = document.getElementById('game-state');
        if (this.game.gameOver) {
            if (this.game.winner) {
                stateElement.innerHTML = `<span class="text-success">Winner: ${this.game.winner}!</span>`;
            } else {
                stateElement.innerHTML = `<span class="text-warning">Draw!</span>`;
            }
        } else {
            stateElement.textContent = 'In Progress';
        }

        // Update gravity direction if rotating
        if (this.game.gravity && this.game.gravityRotation && this.game.gravityRotation.mode !== 'none') {
            document.getElementById('gravity-direction-display').style.display = 'block';
            const directionMap = {
                'down': '↓ Down',
                'up': '↑ Up',
                'left': '← Left',
                'right': '→ Right'
            };
            document.getElementById('gravity-direction').textContent = directionMap[this.game.gravityDirection];
        } else {
            document.getElementById('gravity-direction-display').style.display = 'none';
        }
    }
}

// Initialize game UI
const gameUI = new GameUI();
