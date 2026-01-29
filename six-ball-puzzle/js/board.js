// Board management for 6 Ball Puzzle
// Honeycomb (hexagonal) grid layout
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

    // Check if row is offset (odd rows are offset by half)
    isOffsetRow(row) {
        return row % 2 === 1;
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

    // Place individual balls (not as a piece, balls fall independently)
    placeBalls(balls) {
        for (const ball of balls) {
            // Each ball falls independently to its resting position
            let row = ball.row;
            const col = ball.col;

            // Fall until hitting bottom or another ball
            while (row < this.TOTAL_ROWS - 1 && this.isEmpty(row + 1, col)) {
                row++;
            }

            this.setCell(row, col, ball.color);
        }
    },

    // Check if piece position is valid (for movement/rotation)
    canPlace(cells) {
        for (const cell of cells) {
            if (cell.col < 0 || cell.col >= this.COLS) {
                return false;
            }
            if (cell.row >= this.TOTAL_ROWS) {
                return false;
            }
            if (!this.isEmpty(cell.row, cell.col)) {
                return false;
            }
        }
        return true;
    },

    // Check if piece would collide if moved down
    wouldCollide(cells) {
        for (const cell of cells) {
            const nextRow = cell.row + 1;
            if (nextRow >= this.TOTAL_ROWS) {
                return true;
            }
            if (!this.isEmpty(nextRow, cell.col)) {
                return true;
            }
        }
        return false;
    },

    // Get neighbors in honeycomb grid
    getNeighbors(row, col) {
        const neighbors = [];
        const isOffset = this.isOffsetRow(row);

        // Honeycomb neighbors:
        // For non-offset rows (even):
        //   (-1, -1), (-1, 0)  - top-left, top-right
        //   (0, -1), (0, 1)    - left, right
        //   (1, -1), (1, 0)    - bottom-left, bottom-right
        // For offset rows (odd):
        //   (-1, 0), (-1, 1)   - top-left, top-right
        //   (0, -1), (0, 1)    - left, right
        //   (1, 0), (1, 1)     - bottom-left, bottom-right

        if (isOffset) {
            neighbors.push({ row: row - 1, col: col });     // top-left
            neighbors.push({ row: row - 1, col: col + 1 }); // top-right
            neighbors.push({ row: row, col: col - 1 });     // left
            neighbors.push({ row: row, col: col + 1 });     // right
            neighbors.push({ row: row + 1, col: col });     // bottom-left
            neighbors.push({ row: row + 1, col: col + 1 }); // bottom-right
        } else {
            neighbors.push({ row: row - 1, col: col - 1 }); // top-left
            neighbors.push({ row: row - 1, col: col });     // top-right
            neighbors.push({ row: row, col: col - 1 });     // left
            neighbors.push({ row: row, col: col + 1 });     // right
            neighbors.push({ row: row + 1, col: col - 1 }); // bottom-left
            neighbors.push({ row: row + 1, col: col });     // bottom-right
        }

        return neighbors.filter(n => this.isValidPosition(n.row, n.col));
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

    // Flood fill using honeycomb neighbors
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

            // Check honeycomb neighbors
            const neighbors = this.getNeighbors(row, col);
            for (const n of neighbors) {
                stack.push(n);
            }
        }

        return group;
    },

    // Remove matched cells
    clearMatches(matches) {
        let clearedCount = 0;
        const cleared = new Set();

        for (const group of matches) {
            for (const cell of group) {
                const key = `${cell.row},${cell.col}`;
                if (!cleared.has(key)) {
                    this.grid[cell.row][cell.col] = null;
                    cleared.add(key);
                    clearedCount++;
                }
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

        // Check for Hexagon (六角形) - ring of 6
        if (this.isHexagon(group)) {
            return { type: 'hexagon', multiplier: 5 };
        }

        // Check for Pyramid (三角形)
        if (this.isPyramid(group)) {
            return { type: 'pyramid', multiplier: 3 };
        }

        // Check for Straight (直線) - 6 in a row (horizontal or diagonal)
        if (this.isStraight(group)) {
            return { type: 'straight', multiplier: 1.5 };
        }

        return null;
    },

    isHexagon(group) {
        if (group.length !== 6) return false;

        // Each cell should have exactly 2 neighbors in the group
        const cellSet = new Set(group.map(c => `${c.row},${c.col}`));

        for (const cell of group) {
            const neighbors = this.getNeighbors(cell.row, cell.col);
            let count = 0;
            for (const n of neighbors) {
                if (cellSet.has(`${n.row},${n.col}`)) count++;
            }
            if (count !== 2) return false;
        }

        return true;
    },

    isPyramid(group) {
        if (group.length !== 6) return false;

        // Pyramid: 1-2-3 triangle shape
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

        // For honeycomb, check diagonal lines
        // Diagonal direction 1 (top-left to bottom-right for even rows)
        const diag1 = {};
        for (const cell of group) {
            const key = cell.row * 2 + cell.col;
            if (!diag1[key]) diag1[key] = 0;
            diag1[key]++;
        }

        // Diagonal direction 2
        const diag2 = {};
        for (const cell of group) {
            const key = cell.row * 2 - cell.col;
            if (!diag2[key]) diag2[key] = 0;
            diag2[key]++;
        }

        for (const count of Object.values(diag1)) {
            if (count >= 6) return true;
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
