// Piece management for 6 Ball Puzzle
// 3 balls in equilateral triangle formation (honeycomb grid)
// Only 2 shapes: △ (point up) and ▽ (point down)
// Rotation = color rotation (colors move around the triangle)
//
// △ (type 0):     ▽ (type 1):
//      0              0 1
//     1 2              2

const Piece = {
    // Colors: red, blue, purple, yellow, green (5 colors)
    COLORS: ['#ff6b6b', '#48dbfb', '#a55eea', '#feca57', '#26de81'],
    COLOR_NAMES: ['red', 'blue', 'purple', 'yellow', 'green'],

    createPiece(centerRow, centerCol) {
        // Randomly choose shape (△ or ▽)
        const shapeType = Math.floor(Math.random() * 2);

        return {
            row: centerRow,
            col: centerCol,
            shapeType: shapeType, // 0 = △, 1 = ▽
            colorRotation: 0, // 0, 1, 2 (which color is at position 0)
            baseColors: [
                Piece.randomColor(),
                Piece.randomColor(),
                Piece.randomColor()
            ],

            // Get rotated colors
            getColors: function() {
                const r = this.colorRotation;
                return [
                    this.baseColors[r % 3],
                    this.baseColors[(r + 1) % 3],
                    this.baseColors[(r + 2) % 3]
                ];
            },

            getCells: function() {
                const r = this.row;
                const c = this.col;
                const isNextOffset = Board.isOffsetRow(r + 1);
                const colors = this.getColors();

                let cells = [];

                if (this.shapeType === 0) {
                    // △ Point up: position 0 on top, 1-2 on bottom
                    cells = [
                        { row: r, col: c, color: colors[0] },
                        { row: r + 1, col: isNextOffset ? c - 1 : c, color: colors[1] },
                        { row: r + 1, col: isNextOffset ? c : c + 1, color: colors[2] }
                    ];
                } else {
                    // ▽ Point down: positions 0-1 on top, 2 on bottom
                    cells = [
                        { row: r, col: c, color: colors[0] },
                        { row: r, col: c + 1, color: colors[1] },
                        { row: r + 1, col: isNextOffset ? c : c + 1, color: colors[2] }
                    ];
                }

                return cells;
            },

            move: function(dRow, dCol) {
                this.row += dRow;
                this.col += dCol;
            },

            rotateCW: function() {
                // Rotate colors clockwise
                this.colorRotation = (this.colorRotation + 1) % 3;
            },

            rotateCCW: function() {
                // Rotate colors counter-clockwise
                this.colorRotation = (this.colorRotation + 2) % 3;
            },

            clone: function() {
                const copy = Piece.createPiece(this.row, this.col);
                copy.shapeType = this.shapeType;
                copy.colorRotation = this.colorRotation;
                copy.baseColors = [...this.baseColors];
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
