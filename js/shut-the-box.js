// Shut the Box Game Logic
class ShutTheBoxGame {
    constructor(numBoxes = 9, numDice = 2, dieFaces = 6, strategy = 'minimize-max') {
        this.numBoxes = numBoxes;
        this.numDice = numDice;
        this.dieFaces = dieFaces;
        this.strategy = strategy;
        this.reset();

        // Overall statistics
        this.totalGames = 0;
        this.totalWins = 0;
        this.scoreHistory = [];
        this.history = {
            gameNumber: [],
            averageScore: []
        };
    }

    reset() {
        // Current game state
        this.boxes = Array.from({ length: this.numBoxes }, (_, i) => i + 1);
        this.openBoxes = new Set(this.boxes);
        this.currentRoll = null;
        this.rollsThisGame = 0;
        this.gameOver = false;
        this.currentScore = 0;
    }

    rollDice() {
        if (this.gameOver) return null;

        // Roll the dice
        let total = 0;
        for (let i = 0; i < this.numDice; i++) {
            total += Math.floor(Math.random() * this.dieFaces) + 1;
        }

        this.currentRoll = total;
        this.rollsThisGame++;

        // Check if any valid moves exist
        const validCombinations = this.findValidCombinations(total);
        if (validCombinations.length === 0) {
            this.endGame();
        }

        return total;
    }

    findValidCombinations(target) {
        const openBoxesArray = Array.from(this.openBoxes);
        const combinations = [];

        // Generate all possible subsets
        const totalSubsets = Math.pow(2, openBoxesArray.length);
        for (let i = 1; i < totalSubsets; i++) {
            const subset = [];
            for (let j = 0; j < openBoxesArray.length; j++) {
                if (i & (1 << j)) {
                    subset.push(openBoxesArray[j]);
                }
            }

            // Check if subset sums to target
            const sum = subset.reduce((a, b) => a + b, 0);
            if (sum === target) {
                combinations.push(subset.sort((a, b) => a - b));
            }
        }

        return combinations;
    }

    makeMove(boxes) {
        if (this.gameOver) return false;

        // Validate the move
        const sum = boxes.reduce((a, b) => a + b, 0);
        if (sum !== this.currentRoll) return false;

        // Check all boxes are open
        for (const box of boxes) {
            if (!this.openBoxes.has(box)) return false;
        }

        // Close the boxes
        for (const box of boxes) {
            this.openBoxes.delete(box);
        }

        // Check for win
        if (this.openBoxes.size === 0) {
            this.endGame();
        }

        return true;
    }

    selectBestMove(combinations) {
        if (combinations.length === 0) return null;
        if (combinations.length === 1) return combinations[0];

        switch (this.strategy) {
            case 'random':
                return combinations[Math.floor(Math.random() * combinations.length)];

            case 'minimize-max':
                // Choose combination that minimizes the maximum remaining box
                return combinations.reduce((best, current) => {
                    const remainingAfterCurrent = Array.from(this.openBoxes).filter(b => !current.includes(b));
                    const remainingAfterBest = Array.from(this.openBoxes).filter(b => !best.includes(b));
                    const maxCurrent = remainingAfterCurrent.length > 0 ? Math.max(...remainingAfterCurrent) : 0;
                    const maxBest = remainingAfterBest.length > 0 ? Math.max(...remainingAfterBest) : 0;
                    return maxCurrent < maxBest ? current : best;
                });

            case 'minimize-sum':
                // Choose combination that minimizes the sum of remaining boxes
                return combinations.reduce((best, current) => {
                    const remainingAfterCurrent = Array.from(this.openBoxes).filter(b => !current.includes(b));
                    const remainingAfterBest = Array.from(this.openBoxes).filter(b => !best.includes(b));
                    const sumCurrent = remainingAfterCurrent.reduce((a, b) => a + b, 0);
                    const sumBest = remainingAfterBest.reduce((a, b) => a + b, 0);
                    return sumCurrent < sumBest ? current : best;
                });

            case 'balanced':
                // Choose combination closest to half the current roll
                const halfRoll = this.currentRoll / 2;
                return combinations.reduce((best, current) => {
                    const avgCurrent = current.reduce((a, b) => a + b, 0) / current.length;
                    const avgBest = best.reduce((a, b) => a + b, 0) / best.length;
                    return Math.abs(avgCurrent - halfRoll) < Math.abs(avgBest - halfRoll) ? current : best;
                });

            case 'greedy-high':
                // Choose combination with highest average value
                return combinations.reduce((best, current) => {
                    const avgCurrent = current.reduce((a, b) => a + b, 0) / current.length;
                    const avgBest = best.reduce((a, b) => a + b, 0) / best.length;
                    return avgCurrent > avgBest ? current : best;
                });

            case 'greedy-low':
                // Choose combination with lowest average value
                return combinations.reduce((best, current) => {
                    const avgCurrent = current.reduce((a, b) => a + b, 0) / current.length;
                    const avgBest = best.reduce((a, b) => a + b, 0) / best.length;
                    return avgCurrent < avgBest ? current : best;
                });

            default:
                return combinations[0];
        }
    }

    endGame() {
        this.gameOver = true;
        this.currentScore = this.getRemainingSum();

        // Update statistics
        this.totalGames++;
        this.scoreHistory.push(this.currentScore);
        if (this.currentScore === 0) {
            this.totalWins++;
        }

        // Update history for charts
        this.history.gameNumber.push(this.totalGames);
        const avgScore = this.scoreHistory.reduce((a, b) => a + b, 0) / this.scoreHistory.length;
        this.history.averageScore.push(avgScore);
    }

    getRemainingSum() {
        return Array.from(this.openBoxes).reduce((a, b) => a + b, 0);
    }

    getBoxesShut() {
        return this.numBoxes - this.openBoxes.size;
    }

    getSummary() {
        const avgScore = this.scoreHistory.length > 0
            ? this.scoreHistory.reduce((a, b) => a + b, 0) / this.scoreHistory.length
            : null;
        const bestScore = this.scoreHistory.length > 0
            ? Math.min(...this.scoreHistory)
            : null;
        const winRate = this.totalGames > 0
            ? (this.totalWins / this.totalGames * 100)
            : 0;

        return {
            // Current game
            openBoxes: Array.from(this.openBoxes).sort((a, b) => a - b),
            currentRoll: this.currentRoll,
            rollsThisGame: this.rollsThisGame,
            boxesShut: this.getBoxesShut(),
            currentScore: this.currentScore,
            remainingSum: this.getRemainingSum(),
            gameOver: this.gameOver,

            // Overall stats
            totalGames: this.totalGames,
            totalWins: this.totalWins,
            winRate: winRate,
            avgScore: avgScore,
            bestScore: bestScore,
            scoreHistory: this.scoreHistory
        };
    }

    applySettings(numBoxes, numDice, dieFaces, strategy) {
        this.numBoxes = numBoxes;
        this.numDice = numDice;
        this.dieFaces = dieFaces;
        this.strategy = strategy;

        // Reset current game but keep statistics
        this.reset();
    }

    getMaxPossibleRoll() {
        return this.numDice * this.dieFaces;
    }

    resetStatistics() {
        this.totalGames = 0;
        this.totalWins = 0;
        this.scoreHistory = [];
        this.history = {
            gameNumber: [],
            averageScore: []
        };
    }
}

// Initialize game
const game = new ShutTheBoxGame();
let autoplayInterval = null;
let lastChartUpdate = 0;
const CHART_UPDATE_INTERVAL = 16; // ~60fps
let manualMode = true;

// Initialize Charts
const scoreDistCtx = document.getElementById('score-distribution-chart').getContext('2d');
const avgScoreCtx = document.getElementById('avg-score-chart').getContext('2d');

const scoreDistributionChart = new Chart(scoreDistCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Frequency',
            data: [],
            backgroundColor: '#58a6ff'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Frequency',
                    color: '#8b949e'
                },
                ticks: {
                    color: '#8b949e',
                    precision: 0
                },
                grid: {
                    color: '#30363d'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Score',
                    color: '#8b949e'
                },
                ticks: {
                    color: '#8b949e'
                },
                grid: {
                    color: '#30363d'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#c9d1d9'
                }
            }
        }
    }
});

const avgScoreChart = new Chart(avgScoreCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Average Score',
            data: [],
            borderColor: '#58a6ff',
            backgroundColor: 'rgba(88, 166, 255, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Average Score',
                    color: '#8b949e'
                },
                ticks: {
                    color: '#8b949e'
                },
                grid: {
                    color: '#30363d'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Game Number',
                    color: '#8b949e'
                },
                ticks: {
                    color: '#8b949e'
                },
                grid: {
                    color: '#30363d'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#c9d1d9'
                }
            }
        }
    }
});

// Update UI
function updateUI() {
    const summary = game.getSummary();

    // Update boxes display
    const boxesContainer = document.getElementById('boxes-container');
    boxesContainer.innerHTML = '';
    for (let i = 1; i <= game.numBoxes; i++) {
        const box = document.createElement('button');
        box.className = 'btn btn-lg';
        box.textContent = i;
        if (summary.openBoxes.includes(i)) {
            box.classList.add('btn-outline-primary');
        } else {
            box.classList.add('btn-secondary');
            box.disabled = true;
        }
        boxesContainer.appendChild(box);
    }

    // Update dice display
    const diceDisplay = document.getElementById('dice-display');
    diceDisplay.textContent = summary.currentRoll !== null ? summary.currentRoll : '-';

    // Update current game stats
    document.getElementById('current-rolls').textContent = summary.rollsThisGame;
    document.getElementById('boxes-shut').textContent = summary.boxesShut;
    document.getElementById('current-score').textContent = summary.currentScore;
    document.getElementById('remaining-sum').textContent = summary.remainingSum;

    // Update overall stats
    document.getElementById('total-games').textContent = summary.totalGames;
    document.getElementById('total-wins').textContent =
        `${summary.totalWins} (${summary.winRate.toFixed(1)}%)`;
    document.getElementById('avg-score').textContent =
        summary.avgScore !== null ? summary.avgScore.toFixed(2) : '-';
    document.getElementById('best-score').textContent =
        summary.bestScore !== null ? summary.bestScore : '-';

    // Update game status
    const gameStatus = document.getElementById('game-status');
    const moveSelection = document.getElementById('move-selection');

    if (summary.gameOver) {
        gameStatus.className = summary.currentScore === 0 ? 'alert alert-success' : 'alert alert-warning';
        gameStatus.textContent = summary.currentScore === 0
            ? `You won! All boxes shut in ${summary.rollsThisGame} rolls!`
            : `Game over! Final score: ${summary.currentScore}`;
        moveSelection.style.display = 'none';
    } else if (summary.currentRoll !== null && manualMode) {
        const combinations = game.findValidCombinations(summary.currentRoll);
        if (combinations.length === 0) {
            gameStatus.className = 'alert alert-danger';
            gameStatus.textContent = 'No valid moves! Game over.';
            moveSelection.style.display = 'none';
        } else {
            gameStatus.className = 'alert alert-info';
            gameStatus.textContent = `Roll: ${summary.currentRoll} - Select boxes to shut`;
            moveSelection.style.display = 'block';
            document.getElementById('target-sum').textContent = summary.currentRoll;

            // Display combination options
            const combContainer = document.getElementById('combinations-container');
            combContainer.innerHTML = '';
            combinations.forEach(combo => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary';
                btn.textContent = combo.join(' + ');
                btn.addEventListener('click', () => {
                    game.makeMove(combo);
                    updateUI();
                    updateCharts();

                    // Auto-roll if game not over
                    if (!game.gameOver && manualMode) {
                        setTimeout(() => rollDice(), 200);
                    }
                });
                combContainer.appendChild(btn);
            });
        }
    } else {
        gameStatus.className = 'alert alert-info';
        gameStatus.textContent = summary.totalGames === 0
            ? 'Click "Roll Dice" to start a new game'
            : 'Click "Roll Dice" to continue';
        moveSelection.style.display = 'none';
    }
}

// Update charts (throttled for performance)
function updateCharts() {
    const now = Date.now();
    if (now - lastChartUpdate < CHART_UPDATE_INTERVAL) {
        return;
    }
    lastChartUpdate = now;

    const summary = game.getSummary();

    // Update score distribution
    if (summary.scoreHistory.length > 0) {
        const scoreCounts = {};
        summary.scoreHistory.forEach(score => {
            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
        });

        const scores = Object.keys(scoreCounts).map(Number).sort((a, b) => a - b);
        const counts = scores.map(score => scoreCounts[score]);

        scoreDistributionChart.data.labels = scores;
        scoreDistributionChart.data.datasets[0].data = counts;
        scoreDistributionChart.update('none');
    } else {
        // Clear chart when no data
        scoreDistributionChart.data.labels = [];
        scoreDistributionChart.data.datasets[0].data = [];
        scoreDistributionChart.update('none');
    }

    // Update average score over time
    avgScoreChart.data.labels = game.history.gameNumber;
    avgScoreChart.data.datasets[0].data = game.history.averageScore;
    avgScoreChart.update('none');
}

// Roll dice
function rollDice() {
    if (game.gameOver) {
        newGame();
        return;
    }

    game.rollDice();
    updateUI();
    updateCharts();
}

// New game
function newGame() {
    game.reset();
    updateUI();
    updateCharts();
}

// Reset statistics
function resetStatistics() {
    game.resetStatistics();
    game.reset();
    updateUI();
    updateCharts();
}

// Apply settings
function applySettings() {
    const numBoxes = parseInt(document.getElementById('num-boxes').value);
    const numDice = parseInt(document.getElementById('num-dice').value);
    const dieFaces = parseInt(document.getElementById('die-faces').value);
    const strategy = document.getElementById('strategy').value;

    game.applySettings(numBoxes, numDice, dieFaces, strategy);
    updateMaxRollDisplay();
    updateUI();
    updateCharts();
}

// Update max roll display
function updateMaxRollDisplay() {
    const numDice = parseInt(document.getElementById('num-dice').value);
    const dieFaces = parseInt(document.getElementById('die-faces').value);
    const maxRoll = numDice * dieFaces;
    document.getElementById('max-roll').textContent = maxRoll;
}

// Update strategy description
function updateStrategyDescription() {
    const strategy = document.getElementById('strategy').value;
    const descriptionElement = document.getElementById('strategy-description');

    const descriptions = {
        'random': 'Randomly picks any valid combination. Use as a baseline to compare other strategies.',
        'minimize-max': 'Tries to shut the highest numbered boxes first to reduce maximum remaining box.',
        'minimize-sum': 'Always picks the move that leaves the smallest total of all remaining boxes.',
        'balanced': 'Prefers combinations with average or middle-range values rather than extremes.',
        'greedy-high': 'Aggressively targets high numbers by maximizing the average value of boxes shut.',
        'greedy-low': 'Aggressively targets low numbers by minimizing the average value of boxes shut.'
    };

    descriptionElement.textContent = descriptions[strategy] || '';
}

// Autoplay logic
function playOneGame() {
    game.reset();

    while (!game.gameOver) {
        game.rollDice();
        if (game.gameOver) break;

        const combinations = game.findValidCombinations(game.currentRoll);
        if (combinations.length === 0) {
            game.endGame();
            break;
        }

        const bestMove = game.selectBestMove(combinations);
        if (bestMove) {
            game.makeMove(bestMove);
        }
    }

    updateUI();
    updateCharts();
}

function startAutoplay() {
    manualMode = false;
    const speed = parseInt(document.getElementById('autoplay-speed').value);
    const interval = 1000 / speed;

    if (autoplayInterval) {
        clearInterval(autoplayInterval);
    }

    autoplayInterval = setInterval(() => {
        playOneGame();
    }, interval);

    document.getElementById('autoplay-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    document.getElementById('roll-btn').disabled = true;
    document.getElementById('new-game-btn').disabled = true;
}

function stopAutoplay() {
    manualMode = true;

    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }

    document.getElementById('autoplay-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('new-game-btn').disabled = false;
}

// Event Listeners
document.getElementById('roll-btn').addEventListener('click', rollDice);
document.getElementById('new-game-btn').addEventListener('click', newGame);
document.getElementById('reset-stats-btn').addEventListener('click', resetStatistics);
document.getElementById('apply-settings-btn').addEventListener('click', applySettings);
document.getElementById('autoplay-btn').addEventListener('click', startAutoplay);
document.getElementById('stop-btn').addEventListener('click', stopAutoplay);

document.getElementById('autoplay-speed').addEventListener('input', (e) => {
    document.getElementById('speed-value').textContent = e.target.value;

    // Restart autoplay with new speed if it's running
    if (autoplayInterval) {
        stopAutoplay();
        startAutoplay();
    }
});

// Update max roll when dice settings change
document.getElementById('num-dice').addEventListener('input', updateMaxRollDisplay);
document.getElementById('die-faces').addEventListener('input', updateMaxRollDisplay);

// Update strategy description when strategy changes
document.getElementById('strategy').addEventListener('change', updateStrategyDescription);

// Initialize UI
updateUI();
updateCharts();
updateMaxRollDisplay();
updateStrategyDescription();
document.getElementById('stop-btn').disabled = true;
