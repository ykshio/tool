// Piece management for 6 Ball Puzzle
// 3 balls in equilateral triangle formation (honeycomb grid)
// Two base shapes that rotate 60 degrees each step (6 rotations total)
//
// Type A (point up):    Type B (point down):
//      ○                    ○ ○
//     ○ ○                    ○

const Piece = {
    // Colors: red, blue, purple, yellow, green (5 colors)
    COLORS: ['#ff6b6b', '#48dbfb', '#a55eea', '#feca57', '#26de81'],
    COLOR_NAMES: ['red', 'blue', 'purple', 'yellow', 'green'],

    createPiece(centerRow, centerCol) {
        // Randomly choose starting shape (point up or point down)
        const startRotation = Math.floor(Math.random() * 2) * 3; // 0 or 3

        return {
            row: centerRow,
            col: centerCol,
            rotation: startRotation, // 0-5 (60 degrees each)
            colors: [
                Piece.randomColor(),
                Piece.randomColor(),
                Piece.randomColor()
            ],

            // Get cell positions based on rotation
            // Rotation 0: point up (○ on top)
            // Rotation 1: 60° CW
            // Rotation 2: 120° CW
            // Rotation 3: point down (○ on bottom)
            // Rotation 4: 240° CW
            // Rotation 5: 300° CW
            getCells: function() {
                const r = this.row;
                const c = this.col;
                const isOffset = Board.isOffsetRow(r);
                const isNextOffset = Board.isOffsetRow(r + 1);
                const isPrevOffset = Board.isOffsetRow(r - 1);

                let cells = [];

                switch (this.rotation) {
                    case 0: // Point up: ○ on top, ○○ on bottom
                        //    0
                        //   1 2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r + 1, col: isNextOffset ? c - 1 : c, color: this.colors[1] },
                            { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[2] }
                        ];
                        break;

                    case 1: // 60° CW - leaning right
                        //   0
                        //   1
                        //    2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r + 1, col: isNextOffset ? c - 1 : c, color: this.colors[1] },
                            { row: r + 2, col: c, color: this.colors[2] }
                        ];
                        break;

                    case 2: // 120° CW - leaning left
                        //    0
                        //    1
                        //   2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[1] },
                            { row: r + 2, col: c, color: this.colors[2] }
                        ];
                        break;

                    case 3: // Point down: ○○ on top, ○ on bottom
                        //   0 1
                        //    2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r, col: c + 1, color: this.colors[1] },
                            { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[2] }
                        ];
                        break;

                    case 4: // 240° CW
                        //    0
                        //    1
                        //   2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r + 1, col: isNextOffset ? c : c + 1, color: this.colors[1] },
                            { row: r + 2, col: c, color: this.colors[2] }
                        ];
                        break;

                    case 5: // 300° CW
                        //   0
                        //   1
                        //    2
                        cells = [
                            { row: r, col: c, color: this.colors[0] },
                            { row: r + 1, col: isNextOffset ? c - 1 : c, color: this.colors[1] },
                            { row: r + 2, col: c, color: this.colors[2] }
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
                this.rotation = (this.rotation + 1) % 6;
            },

            rotateCCW: function() {
                this.rotation = (this.rotation + 5) % 6;
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
        const startRow = 0;
        return this.createPiece(startRow, startCol);
    }
};
