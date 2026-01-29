// Piece management for 6 Ball Puzzle
// 3 balls in equilateral triangle formation (honeycomb grid)
// Only 2 shapes: △ (point up) and ▽ (point down)
//
// △ (rotation 0):     ▽ (rotation 1):
//      ○                  ○ ○
//     ○ ○                  ○

const Piece = {
    // Colors: red, blue, purple, yellow, green (5 colors)
    COLORS: ['#ff6b6b', '#48dbfb', '#a55eea', '#feca57', '#26de81'],
    COLOR_NAMES: ['red', 'blue', 'purple', 'yellow', 'green'],

    createPiece(centerRow, centerCol) {
        // Randomly choose starting shape (△ or ▽)
        const startRotation = Math.floor(Math.random() * 2);

        return {
            row: centerRow,
            col: centerCol,
            rotation: startRotation, // 0 = △, 1 = ▽
            colors: [
                Piece.randomColor(),
                Piece.randomColor(),
                Piece.randomColor()
            ],

            getCells: function() {
                const r = this.row;
                const c = this.col;
                const isNextOffset = Board.isOffsetRow(r + 1);

                let cells = [];

                if (this.rotation === 0) {
                    // △ Point up: ○ on top, ○○ on bottom
                    //    0
                    //   1 2
                    cells = [
                        { row: r, col: c, color: this.colors[0] },
                        { row: r + 1, col: isNextOffset ? c - 1 : c, color: this.colors[1] },
                        { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[2] }
                    ];
                } else {
                    // ▽ Point down: ○○ on top, ○ on bottom
                    //   0 1
                    //    2
                    cells = [
                        { row: r, col: c, color: this.colors[0] },
                        { row: r, col: c + 1, color: this.colors[1] },
                        { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[2] }
                    ];
                }

                return cells;
            },

            move: function(dRow, dCol) {
                this.row += dRow;
                this.col += dCol;
            },

            rotateCW: function() {
                this.rotation = (this.rotation + 1) % 2;
            },

            rotateCCW: function() {
                this.rotation = (this.rotation + 1) % 2; // Same as CW for 2 states
            },

            clone: function() {
                const copy = Piece.createPiece(this.row, this.col);
                copy.rotation = this.rotation;
                copy.colors = [...this.colors];
                return copy;
            }
        };
    },

    randomColor() {
        return this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
    },

    getColorIndex(color) {
        return this.COLORS.indexOf(color);
    },

    spawn() {
        const startCol = Math.floor(Board.COLS / 2);
        const startRow = 0;
        return this.createPiece(startRow, startCol);
    }
};
