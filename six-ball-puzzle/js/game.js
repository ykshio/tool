// Game logic for 6 Ball Puzzle
const Game = {
    state: 'title', // title, playing, paused, clearing, gameover
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,

    // Timing
    dropInterval: 1000,
    lastDropTime: 0,
    clearDuration: 300,
    clearStartTime: 0,
    clearProgress: 0,
    matchesToClear: [],

    // DOM elements
    scoreEl: null,
    levelEl: null,
    linesEl: null,
    overlayEl: null,
    overlayTitleEl: null,
    overlayMessageEl: null,
    finalScoreEl: null,

    init() {
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.linesEl = document.getElementById('lines');
        this.overlayEl = document.getElementById('overlay');
        this.overlayTitleEl = document.getElementById('overlay-title');
        this.overlayMessageEl = document.getElementById('overlay-message');
        this.finalScoreEl = document.getElementById('final-score');

        Board.init();
        Renderer.init();
        Input.init();

        this.setupInputHandlers();
        this.showTitle();
    },

    setupInputHandlers() {
        Input.on('left', () => this.movePiece(0, -1));
        Input.on('right', () => this.movePiece(0, 1));
        Input.on('softDrop', () => this.softDrop());
        Input.on('hardDrop', () => this.hardDrop());
        Input.on('rotateCW', () => this.rotatePiece(1));
        Input.on('rotateCCW', () => this.rotatePiece(-1));
        Input.on('pause', () => this.togglePause());
        Input.on('start', () => this.handleStart());
    },

    showTitle() {
        this.state = 'title';
        this.overlayEl.classList.remove('hidden');
        this.overlayTitleEl.textContent = '6 BALL PUZZLE';
        this.overlayMessageEl.textContent = 'Press SPACE to Start';
        this.finalScoreEl.classList.add('hidden');
    },

    handleStart() {
        if (this.state === 'title' || this.state === 'gameover') {
            this.startGame();
        }
    },

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.dropInterval = 1000;

        Board.reset();
        this.spawnPiece();
        this.nextPiece = Piece.spawn();

        this.overlayEl.classList.add('hidden');
        this.updateUI();

        this.lastDropTime = performance.now();
    },

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = Piece.spawn();
        }
        this.nextPiece = Piece.spawn();

        // Check if spawn position is valid
        if (!Board.canPlace(this.currentPiece)) {
            this.gameOver();
        }
    },

    movePiece(dRow, dCol) {
        if (this.state !== 'playing' || !this.currentPiece) return;

        const newPiece = this.currentPiece.clone();
        newPiece.move(dRow, dCol);

        if (Board.canPlace(newPiece)) {
            this.currentPiece = newPiece;
        }
    },

    rotatePiece(direction) {
        if (this.state !== 'playing' || !this.currentPiece) return;

        const newPiece = this.currentPiece.clone();
        if (direction > 0) {
            newPiece.rotateCW();
        } else {
            newPiece.rotateCCW();
        }

        // Try rotation with wall kicks
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            const testPiece = newPiece.clone();
            testPiece.move(0, kick);
            if (Board.canPlace(testPiece)) {
                this.currentPiece = testPiece;
                return;
            }
        }
    },

    softDrop() {
        if (this.state !== 'playing' || !this.currentPiece) return;

        const newPiece = this.currentPiece.clone();
        newPiece.move(1, 0);

        if (Board.canPlace(newPiece)) {
            this.currentPiece = newPiece;
            this.score += 1;
            this.updateUI();
        } else {
            this.lockPiece();
        }
    },

    hardDrop() {
        if (this.state !== 'playing' || !this.currentPiece) return;

        let dropDistance = 0;
        while (true) {
            const newPiece = this.currentPiece.clone();
            newPiece.move(1, 0);
            if (Board.canPlace(newPiece)) {
                this.currentPiece = newPiece;
                dropDistance++;
            } else {
                break;
            }
        }

        this.score += dropDistance * 2;
        this.updateUI();
        this.lockPiece();
    },

    lockPiece() {
        Board.placePiece(this.currentPiece);
        this.currentPiece = null;
        this.checkMatches();
    },

    checkMatches() {
        const matches = Board.findMatches();

        if (matches.length > 0) {
            this.state = 'clearing';
            this.clearStartTime = performance.now();
            this.clearProgress = 0;
            this.combo++;

            // Check for waza and expand to all same-colored balls
            let expandedMatches = [];
            let wazaColors = new Set();
            let maxMultiplier = 1;

            for (const group of matches) {
                const waza = Board.detectWaza(group);
                if (waza) {
                    // Waza detected! Get the color and mark for full clear
                    const color = group[0].color;
                    wazaColors.add(color);
                    if (waza.multiplier > maxMultiplier) {
                        maxMultiplier = waza.multiplier;
                    }
                } else {
                    // Normal match, just add the group
                    expandedMatches.push(group);
                }
            }

            // For each waza color, get ALL balls of that color
            for (const color of wazaColors) {
                const allOfColor = Board.getAllCellsOfColor(color);
                if (allOfColor.length > 0) {
                    expandedMatches.push(allOfColor);
                }
            }

            this.matchesToClear = expandedMatches;

            // Calculate score
            let totalCleared = 0;
            const countedCells = new Set();
            for (const group of expandedMatches) {
                for (const cell of group) {
                    const key = `${cell.row},${cell.col}`;
                    if (!countedCells.has(key)) {
                        countedCells.add(key);
                        totalCleared++;
                    }
                }
            }

            const baseScore = totalCleared * 100;
            const comboMultiplier = 1 + (this.combo - 1) * 0.5;
            this.score += Math.floor(baseScore * maxMultiplier * comboMultiplier);
            this.lines += totalCleared;

            // Level up every 30 lines
            const newLevel = Math.floor(this.lines / 30) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateUI();
        } else {
            this.combo = 0;
            this.afterClear();
        }
    },

    afterClear() {
        // Check for game over
        if (Board.isGameOver()) {
            this.gameOver();
            return;
        }

        // Spawn next piece
        this.spawnPiece();
        this.state = 'playing';
        this.lastDropTime = performance.now();
    },

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.overlayEl.classList.remove('hidden');
            this.overlayTitleEl.textContent = 'PAUSED';
            this.overlayMessageEl.textContent = 'Press P or ESC to Resume';
            this.finalScoreEl.classList.add('hidden');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.overlayEl.classList.add('hidden');
            this.lastDropTime = performance.now();
        }
    },

    gameOver() {
        this.state = 'gameover';
        this.overlayEl.classList.remove('hidden');
        this.overlayTitleEl.textContent = 'GAME OVER';
        this.overlayMessageEl.textContent = 'Press SPACE to Retry';
        this.finalScoreEl.textContent = `Final Score: ${this.score}`;
        this.finalScoreEl.classList.remove('hidden');
    },

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.linesEl.textContent = this.lines;
    },

    update(timestamp) {
        if (this.state === 'playing') {
            // Auto drop
            if (timestamp - this.lastDropTime >= this.dropInterval) {
                this.lastDropTime = timestamp;

                const newPiece = this.currentPiece.clone();
                newPiece.move(1, 0);

                if (Board.canPlace(newPiece)) {
                    this.currentPiece = newPiece;
                } else {
                    this.lockPiece();
                }
            }
        } else if (this.state === 'clearing') {
            const elapsed = timestamp - this.clearStartTime;
            this.clearProgress = Math.min(1, elapsed / this.clearDuration);

            if (this.clearProgress >= 1) {
                Board.clearMatches(this.matchesToClear);
                Board.applyGravity();
                this.matchesToClear = [];

                // Check for chain reactions
                this.checkMatches();
            }
        }

        Renderer.render(this);
    }
};
