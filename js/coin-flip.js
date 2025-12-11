// Coin Flip Game Logic
class CoinFlipGame {
    constructor() {
        this.reset();
    }

    reset() {
        this.totalFlips = 0;
        this.headsCount = 0;
        this.tailsCount = 0;
        this.currentStreak = 0;
        this.currentStreakType = null;
        this.maxStreak = 0;
        this.history = {
            flipNumber: [],
            headsPercentage: [],
            result: []
        };
    }

    flip() {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        this.totalFlips++;
        if (result === 'Heads') {
            this.headsCount++;
        } else {
            this.tailsCount++;
        }

        // Update streaks
        if (result === this.currentStreakType) {
            this.currentStreak++;
        } else {
            this.currentStreak = 1;
            this.currentStreakType = result;
        }
        this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

        // Record history
        this.history.flipNumber.push(this.totalFlips);
        this.history.headsPercentage.push(
            this.totalFlips > 0 ? (this.headsCount / this.totalFlips * 100) : 0
        );
        this.history.result.push(result);

        return result;
    }

    getSummary() {
        const headsPercentage = this.totalFlips > 0 ? (this.headsCount / this.totalFlips * 100) : 0;
        const tailsPercentage = this.totalFlips > 0 ? (this.tailsCount / this.totalFlips * 100) : 0;

        return {
            totalFlips: this.totalFlips,
            headsCount: this.headsCount,
            tailsCount: this.tailsCount,
            headsPercentage: headsPercentage,
            tailsPercentage: tailsPercentage,
            currentStreak: this.currentStreak,
            currentStreakType: this.currentStreakType,
            maxStreak: this.maxStreak
        };
    }
}

// Initialize game
const game = new CoinFlipGame();
let autoplayInterval = null;
let lastChartUpdate = 0;
const CHART_UPDATE_INTERVAL = 16; // ~60fps

// Initialize Charts
const percentageCtx = document.getElementById('percentage-chart').getContext('2d');
const distributionCtx = document.getElementById('distribution-chart').getContext('2d');

const percentageChart = new Chart(percentageCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Heads %',
            data: [],
            borderColor: '#1f77b4',
            backgroundColor: 'rgba(31, 119, 180, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false, // Disable animation for performance
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Heads Percentage'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Flip Number'
                }
            }
        },
        plugins: {
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: 50,
                        yMax: 50,
                        borderColor: 'red',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            content: 'Expected (50%)',
                            enabled: true
                        }
                    }
                }
            }
        }
    }
});

const distributionChart = new Chart(distributionCtx, {
    type: 'bar',
    data: {
        labels: ['Heads', 'Tails'],
        datasets: [{
            label: 'Count',
            data: [0, 0],
            backgroundColor: ['#FFD700', '#C0C0C0']
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
                    text: 'Count'
                }
            }
        }
    }
});

// Update UI
function updateUI() {
    const summary = game.getSummary();

    // Update coin display
    const coinDisplay = document.getElementById('coin-display');
    if (summary.totalFlips === 0) {
        coinDisplay.textContent = '🪙';
    } else if (summary.currentStreakType === 'Heads') {
        coinDisplay.textContent = '🟡';
    } else {
        coinDisplay.textContent = '⚪';
    }

    // Update stats
    document.getElementById('total-flips').textContent = summary.totalFlips;
    document.getElementById('heads-count').textContent =
        `${summary.headsCount} (${summary.headsPercentage.toFixed(1)}%)`;
    document.getElementById('tails-count').textContent =
        `${summary.tailsCount} (${summary.tailsPercentage.toFixed(1)}%)`;
    document.getElementById('streak').textContent =
        `${summary.currentStreak} (${summary.currentStreakType || 'N/A'})`;
}

// Update charts (throttled for performance)
function updateCharts() {
    const now = Date.now();
    if (now - lastChartUpdate < CHART_UPDATE_INTERVAL) {
        return; // Skip update if too soon
    }
    lastChartUpdate = now;

    const summary = game.getSummary();

    // Update percentage chart
    percentageChart.data.labels = game.history.flipNumber;
    percentageChart.data.datasets[0].data = game.history.headsPercentage;
    percentageChart.update('none'); // 'none' mode = no animation, instant update

    // Update distribution chart
    distributionChart.data.datasets[0].data = [summary.headsCount, summary.tailsCount];
    distributionChart.update('none');
}

// Flip coin
function flipCoin() {
    game.flip();
    updateUI();
    updateCharts();
}

// Reset game
function resetGame() {
    game.reset();
    updateUI();
    updateCharts();
}

// Autoplay logic
function startAutoplay() {
    const speed = parseInt(document.getElementById('speed-slider').value);
    const interval = 1000 / speed; // Convert flips/sec to milliseconds

    if (autoplayInterval) {
        clearInterval(autoplayInterval);
    }

    autoplayInterval = setInterval(() => {
        flipCoin();
    }, interval);

    document.getElementById('autoplay-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
}

function stopAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }

    document.getElementById('autoplay-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
}

// Event Listeners
document.getElementById('flip-btn').addEventListener('click', flipCoin);
document.getElementById('reset-btn').addEventListener('click', () => {
    stopAutoplay();
    resetGame();
});
document.getElementById('autoplay-btn').addEventListener('click', startAutoplay);
document.getElementById('stop-btn').addEventListener('click', stopAutoplay);

document.getElementById('speed-slider').addEventListener('input', (e) => {
    document.getElementById('speed-value').textContent = e.target.value;

    // Restart autoplay with new speed if it's running
    if (autoplayInterval) {
        stopAutoplay();
        startAutoplay();
    }
});

// Initialize UI
updateUI();
updateCharts();
document.getElementById('stop-btn').disabled = true;
