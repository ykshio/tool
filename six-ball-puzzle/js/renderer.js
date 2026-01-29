// Renderer for 6 Ball Puzzle
// Honeycomb grid rendering
const Renderer = {
    canvas: null,
    ctx: null,
    nextCanvas: null,
    nextCtx: null,
    cellSize: 36,
    ballRadius: 16,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Set canvas sizes (add extra width for honeycomb offset)
        this.canvas.width = Board.COLS * this.cellSize + this.cellSize / 2;
        this.canvas.height = Board.ROWS * this.cellSize;

        this.nextCanvas.width = 3 * this.cellSize;
        this.nextCanvas.height = 3 * this.cellSize;
    },

    // Get pixel position for a cell in honeycomb grid
    getCellPosition(row, col) {
        const isOffset = Board.isOffsetRow(row);
        const x = col * this.cellSize + this.cellSize / 2 + (isOffset ? this.cellSize / 2 : 0);
        const y = row * this.cellSize + this.cellSize / 2;
        return { x, y };
    },

    clear() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawGrid() {
        this.ctx.globalAlpha = 0.15;

        // Draw honeycomb grid dots
        for (let row = 0; row < Board.ROWS; row++) {
            for (let col = 0; col < Board.COLS; col++) {
                const displayRow = row + Board.SPAWN_ROWS;
                const { x, y } = this.getCellPosition(displayRow, col);
                const displayY = y - Board.SPAWN_ROWS * this.cellSize;

                this.ctx.beginPath();
                this.ctx.arc(x, displayY, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = '#444';
                this.ctx.fill();
            }
        }

        this.ctx.globalAlpha = 1;
    },

    drawBall(ctx, x, y, color, radius = this.ballRadius) {
        // Main ball with gradient
        const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.1,
            x, y, radius
        );

        gradient.addColorStop(0, this.lightenColor(color, 60));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    },

    drawBoard() {
        // Draw placed balls (offset by spawn rows for display)
        for (let row = Board.SPAWN_ROWS; row < Board.TOTAL_ROWS; row++) {
            for (let col = 0; col < Board.COLS; col++) {
                const color = Board.getCell(row, col);
                if (color) {
                    const { x, y } = this.getCellPosition(row, col);
                    const displayY = y - Board.SPAWN_ROWS * this.cellSize;
                    this.drawBall(this.ctx, x, displayY, color);
                }
            }
        }
    },

    drawPiece(piece) {
        if (!piece) return;

        const cells = piece.getCells();
        for (const cell of cells) {
            // Only draw if in visible area
            if (cell.row >= Board.SPAWN_ROWS) {
                const { x, y } = this.getCellPosition(cell.row, cell.col);
                const displayY = y - Board.SPAWN_ROWS * this.cellSize;
                this.drawBall(this.ctx, x, displayY, cell.color);
            }
        }
    },

    drawGhost(piece) {
        if (!piece) return;

        // Find where each ball would land independently
        const cells = piece.getCells();

        for (const cell of cells) {
            // Each ball falls independently
            let landingRow = cell.row;
            while (landingRow < Board.TOTAL_ROWS - 1 && Board.isEmpty(landingRow + 1, cell.col)) {
                landingRow++;
            }

            if (landingRow >= Board.SPAWN_ROWS) {
                const { x, y } = this.getCellPosition(landingRow, cell.col);
                const displayY = y - Board.SPAWN_ROWS * this.cellSize;

                this.ctx.beginPath();
                this.ctx.arc(x, displayY, this.ballRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = cell.color;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.3;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }
    },

    drawNextPiece(piece) {
        if (!piece) return;

        this.nextCtx.fillStyle = '#0a0a1a';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const centerX = this.nextCanvas.width / 2;
        const centerY = this.nextCanvas.height / 2;
        const spacing = this.cellSize * 0.7;
        const radius = this.ballRadius * 0.7;

        let positions;

        if (piece.rotation === 0) {
            // △ Point up
            positions = [
                { x: centerX, y: centerY - spacing * 0.5 },
                { x: centerX - spacing * 0.5, y: centerY + spacing * 0.4 },
                { x: centerX + spacing * 0.5, y: centerY + spacing * 0.4 }
            ];
        } else {
            // ▽ Point down
            positions = [
                { x: centerX - spacing * 0.5, y: centerY - spacing * 0.4 },
                { x: centerX + spacing * 0.5, y: centerY - spacing * 0.4 },
                { x: centerX, y: centerY + spacing * 0.5 }
            ];
        }

        for (let i = 0; i < 3; i++) {
            this.drawBall(this.nextCtx, positions[i].x, positions[i].y, piece.colors[i], radius);
        }
    },

    drawClearingEffect(matches, progress) {
        for (const group of matches) {
            for (const cell of group) {
                if (cell.row >= Board.SPAWN_ROWS) {
                    const { x, y } = this.getCellPosition(cell.row, cell.col);
                    const displayY = y - Board.SPAWN_ROWS * this.cellSize;

                    const scale = 1 + progress * 0.5;
                    const alpha = 1 - progress;

                    this.ctx.beginPath();
                    this.ctx.arc(x, displayY, this.ballRadius * scale, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    this.ctx.fill();
                }
            }
        }
    },

    render(game) {
        this.clear();
        this.drawGrid();
        this.drawBoard();

        if (game.state === 'playing') {
            this.drawPiece(game.currentPiece);
        } else if (game.state === 'clearing') {
            this.drawClearingEffect(game.matchesToClear, game.clearProgress);
        }

        this.drawNextPiece(game.nextPiece);
    },

    // Color utilities
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
};
