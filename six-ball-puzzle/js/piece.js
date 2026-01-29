// Piece management for 6 Ball Puzzle
// 3 balls in equilateral triangle formation (honeycomb grid)
//    ○      <- top (row 0)
//   ○ ○     <- bottom left & right (row 1)

const Piece = {
    // Colors: red, blue, purple, yellow, green (5 colors)
    COLORS: ['#ff6b6b', '#48dbfb', '#a55eea', '#feca57', '#26de81'],
    COLOR_NAMES: ['red', 'blue', 'purple', 'yellow', 'green'],

    // Triangle formations for honeycomb grid
    // The piece rotates around its center
    // Rotation 0: point up (default)
    //    0
    //   1 2
    // Rotation 1: point right
    //   0 1
    //    2
    // Rotation 2: point down
    //   1 2
    //    0
    // Rotation 3: point left
    //    0
    //   1 2  (but mirrored)

    createPiece(centerRow, centerCol) {
        return {
            row: centerRow,
            col: centerCol,
            rotation: 0,
            colors: [
                Piece.randomColor(),
                Piece.randomColor(),
                Piece.randomColor()
            ],

            // Get cell positions based on current rotation and honeycomb offset
            getCells: function() {
                const isOffset = Board.isOffsetRow(this.row);
                const isBottomOffset = Board.isOffsetRow(this.row + 1);
                let cells = [];

                switch (this.rotation) {
                    case 0: // Point up:  ○ on top, ○ ○ on bottom
                        cells = [
                            { row: this.row, col: this.col, color: this.colors[0] },
                            { row: this.row + 1, col: isBottomOffset ? this.col - 1 : this.col - 1, color: this.colors[1] },
                            { row: this.row + 1, col: isBottomOffset ? this.col : this.col, color: this.colors[2] }
                        ];
                        break;
                    case 1: // Point right
                        cells = [
                            { row: this.row, col: this.col - 1, color: this.colors[0] },
                            { row: this.row, col: this.col, color: this.colors[1] },
                            { row: this.row + 1, col: isBottomOffset ? this.col - 1 : this.col - 1, color: this.colors[2] }
                        ];
                        break;
                    case 2: // Point down: ○ ○ on top, ○ on bottom
                        cells = [
                            { row: this.row + 1, col: isBottomOffset ? this.col : this.col - 1, color: this.colors[0] },
                            { row: this.row, col: this.col - 1, color: this.colors[1] },
                            { row: this.row, col: this.col, color: this.colors[2] }
                        ];
                        break;
                    case 3: // Point left
                        cells = [
                            { row: this.row, col: this.col, color: this.colors[0] },
                            { row: this.row + 1, col: isBottomOffset ? this.col : this.col, color: this.colors[1] },
                            { row: this.row, col: this.col - 1, color: this.colors[2] }
                        ];
                        break;
                }

                return cells;
            },

            move: function(dRow, dCol) {
                this.row += dRow;
                this.col += dCol;
            },

            rotateCW: function() {
                this.rotation = (this.rotation + 1) % 4;
            },

            rotateCCW: function() {
                this.rotation = (this.rotation + 3) % 4;
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

    // Create a new piece at spawn position
    spawn() {
        const startCol = Math.floor(Board.COLS / 2);
        const startRow = 1;
        return this.createPiece(startRow, startCol);
    }
};
