// Board management for 6 Ball Puzzle
const Board = {
    COLS: 10,
    ROWS: 12,
    SPAWN_ROWS: 3,
    TOTAL_ROWS: 15, // 12 + 3 spawn area

    grid: null,

    init() {
        this.grid = [];
        for (let row = 0; row < this.TOTAL_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                this.grid[row][col] = null;
            }
        }
    },

    reset() {
        this.init();
    },

    isValidPosition(row, col) {
        return row >= 0 && row < this.TOTAL_ROWS && col >= 0 && col < this.COLS;
    },

    isEmpty(row, col) {
        if (!this.isValidPosition(row, col)) return false;
        return this.grid[row][col] === null;
    },

    setCell(row, col, color) {
        if (this.isValidPosition(row, col)) {
            this.grid[row][col] = color;
        }
    },

    getCell(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.grid[row][col];
    },

    // Place piece on board
    placePiece(piece) {
        const cells = piece.getCells();
        for (const cell of cells) {
            this.setCell(cell.row, cell.col, cell.color);
        }
    },

    // Check if piece can be placed at position
    canPlace(piece) {
        const cells = piece.getCells();
        for (const cell of cells) {
            if (!this.isEmpty(cell.row, cell.col)) {
                return false;
            }
            if (cell.col < 0 || cell.col >= this.COLS) {
                return false;
            }
        }
        return true;
    },

    // Find all connected groups of 6+ same color
    findMatches() {
        const visited = [];
        for (let row = 0; row < this.TOTAL_ROWS; row++) {
            visited[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                visited[row][col] = false;
            }
        }

        const matches = [];

        for (let row = 0; row < this.TOTAL_ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (!visited[row][col] && this.grid[row][col] !== null) {
                    const group = this.floodFill(row, col, this.grid[row][col], visited);
                    if (group.length >= 6) {
                        matches.push(group);
                    }
                }
            }
        }

        return matches;
    },

    // Flood fill to find connected cells of same color
    floodFill(startRow, startCol, color, visited) {
        const group = [];
        const stack = [{ row: startRow, col: startCol }];

        while (stack.length > 0) {
            const { row, col } = stack.pop();

            if (!this.isValidPosition(row, col)) continue;
            if (visited[row][col]) continue;
            if (this.grid[row][col] !== color) continue;

            visited[row][col] = true;
            group.push({ row, col, color });

            // Check 4 directions
            stack.push({ row: row - 1, col });
            stack.push({ row: row + 1, col });
            stack.push({ row, col: col - 1 });
            stack.push({ row, col: col + 1 });
        }

        return group;
    },

    // Remove matched cells
    clearMatches(matches) {
        let clearedCount = 0;
        for (const group of matches) {
            for (const cell of group) {
                this.grid[cell.row][cell.col] = null;
                clearedCount++;
            }
        }
        return clearedCount;
    },

    // Apply gravity - drop floating balls
    applyGravity() {
        let moved = false;

        for (let col = 0; col < this.COLS; col++) {
            // Start from bottom, move balls down
            let writeRow = this.TOTAL_ROWS - 1;

            for (let row = this.TOTAL_ROWS - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== writeRow) {
                        this.grid[writeRow][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        moved = true;
                    }
                    writeRow--;
                }
            }
        }

        return moved;
    },

    // Check if game is over (balls in spawn area after placing)
    isGameOver() {
        for (let row = 0; row < this.SPAWN_ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] !== null) {
                    return true;
                }
            }
        }
        return false;
    },

    // Detect special patterns (わざ)
    detectWaza(group) {
        if (group.length < 6) return null;

        // Check for Hexagon (六角形)
        if (this.isHexagon(group)) {
            return { type: 'hexagon', multiplier: 5 };
        }

        // Check for Pyramid (三角形)
        if (this.isPyramid(group)) {
            return { type: 'pyramid', multiplier: 3 };
        }

        // Check for Straight (直線)
        if (this.isStraight(group)) {
            return { type: 'straight', multiplier: 1.5 };
        }

        return null;
    },

    isHexagon(group) {
        if (group.length !== 6) return false;

        // Hexagon pattern: ring of 6 cells
        // Check if all cells form a closed loop
        const cells = group.map(c => `${c.row},${c.col}`);
        const cellSet = new Set(cells);

        // Each cell should have exactly 2 neighbors in the group
        for (const cell of group) {
            let neighbors = 0;
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
                const key = `${cell.row + dr},${cell.col + dc}`;
                if (cellSet.has(key)) neighbors++;
            }
            if (neighbors !== 2) return false;
        }

        return true;
    },

    isPyramid(group) {
        if (group.length !== 6) return false;

        // Pyramid: 1-2-3 or 3-2-1 triangle shape
        const rows = {};
        for (const cell of group) {
            if (!rows[cell.row]) rows[cell.row] = [];
            rows[cell.row].push(cell.col);
        }

        const rowCounts = Object.values(rows).map(cols => cols.length).sort((a, b) => a - b);
        return rowCounts.length === 3 &&
               rowCounts[0] === 1 &&
               rowCounts[1] === 2 &&
               rowCounts[2] === 3;
    },

    isStraight(group) {
        if (group.length < 6) return false;

        // Check horizontal line
        const rows = {};
        for (const cell of group) {
            if (!rows[cell.row]) rows[cell.row] = 0;
            rows[cell.row]++;
        }
        for (const count of Object.values(rows)) {
            if (count >= 6) return true;
        }

        // Check diagonal lines
        // Diagonal 1: row - col = constant
        const diag1 = {};
        for (const cell of group) {
            const key = cell.row - cell.col;
            if (!diag1[key]) diag1[key] = 0;
            diag1[key]++;
        }
        for (const count of Object.values(diag1)) {
            if (count >= 6) return true;
        }

        // Diagonal 2: row + col = constant
        const diag2 = {};
        for (const cell of group) {
            const key = cell.row + cell.col;
            if (!diag2[key]) diag2[key] = 0;
            diag2[key]++;
        }
        for (const count of Object.values(diag2)) {
            if (count >= 6) return true;
        }

        return false;
    },

    // Get all cells of a specific color on the board
    getAllCellsOfColor(color) {
        const cells = [];
        for (let row = 0; row < this.TOTAL_ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col] === color) {
                    cells.push({ row, col, color });
                }
            }
        }
        return cells;
    }
};
