// Renderer for 6 Ball Puzzle
const Renderer = {
    canvas: null,
    ctx: null,
    nextCanvas: null,
    nextCtx: null,
    cellSize: 36,
    ballRadius: 15,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Set canvas sizes
        this.canvas.width = Board.COLS * this.cellSize;
        this.canvas.height = Board.ROWS * this.cellSize;

        this.nextCanvas.width = 3 * this.cellSize;
        this.nextCanvas.height = 3 * this.cellSize;
    },

    clear() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawGrid() {
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let col = 0; col <= Board.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let row = 0; row <= Board.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }
    },

    drawBall(ctx, x, y, color, radius = this.ballRadius) {
        // Main ball
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
        // Draw placed balls (offset by spawn rows)
        for (let row = Board.SPAWN_ROWS; row < Board.TOTAL_ROWS; row++) {
            for (let col = 0; col < Board.COLS; col++) {
                const color = Board.getCell(row, col);
                if (color) {
                    const displayRow = row - Board.SPAWN_ROWS;
                    const x = col * this.cellSize + this.cellSize / 2;
                    const y = displayRow * this.cellSize + this.cellSize / 2;
                    this.drawBall(this.ctx, x, y, color);
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
                const displayRow = cell.row - Board.SPAWN_ROWS;
                const x = cell.col * this.cellSize + this.cellSize / 2;
                const y = displayRow * this.cellSize + this.cellSize / 2;
                this.drawBall(this.ctx, x, y, cell.color);
            }
        }
    },

    drawGhost(piece) {
        if (!piece) return;

        // Find where piece would land
        const ghost = piece.clone();
        while (Board.canPlace(ghost)) {
            ghost.move(1, 0);
        }
        ghost.move(-1, 0);

        // Draw ghost
        const cells = ghost.getCells();
        for (const cell of cells) {
            if (cell.row >= Board.SPAWN_ROWS) {
                const displayRow = cell.row - Board.SPAWN_ROWS;
                const x = cell.col * this.cellSize + this.cellSize / 2;
                const y = displayRow * this.cellSize + this.cellSize / 2;

                this.ctx.beginPath();
                this.ctx.arc(x, y, this.ballRadius, 0, Math.PI * 2);
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

        // Center the piece preview
        const offsetX = this.cellSize * 1.5;
        const offsetY = this.cellSize;

        const cells = piece.getCells();
        const minCol = Math.min(...cells.map(c => c.col - piece.col));

        for (const cell of cells) {
            const x = (cell.col - piece.col - minCol) * this.cellSize + offsetX;
            const y = (cell.row - piece.row) * this.cellSize + offsetY;
            this.drawBall(this.nextCtx, x, y, cell.color, this.ballRadius * 0.8);
        }
    },

    drawClearingEffect(matches, progress) {
        for (const group of matches) {
            for (const cell of group) {
                if (cell.row >= Board.SPAWN_ROWS) {
                    const displayRow = cell.row - Board.SPAWN_ROWS;
                    const x = cell.col * this.cellSize + this.cellSize / 2;
                    const y = displayRow * this.cellSize + this.cellSize / 2;

                    const scale = 1 + progress * 0.5;
                    const alpha = 1 - progress;

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, this.ballRadius * scale, 0, Math.PI * 2);
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
            this.drawGhost(game.currentPiece);
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
