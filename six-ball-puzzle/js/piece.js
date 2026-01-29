// Piece management for 6 Ball Puzzle
// 3 balls in triangle formation

const Piece = {
    // Colors: red, blue, purple, yellow, green (5 colors)
    COLORS: ['#ff6b6b', '#48dbfb', '#a55eea', '#feca57', '#26de81'],
    COLOR_NAMES: ['red', 'blue', 'purple', 'yellow', 'green'],

    // Triangle formations (relative positions)
    // Formation 0: pointing down (default)
    //   0
    //  1 2
    FORMATIONS: [
        // Rotation 0: pointing down
        [
            { row: 0, col: 0 },  // top
            { row: 1, col: -1 }, // bottom-left
            { row: 1, col: 0 }   // bottom-right
        ],
        // Rotation 1: pointing right
        [
            { row: 0, col: 0 },  // left
            { row: 0, col: 1 },  // right-top
            { row: 1, col: 1 }   // right-bottom
        ],
        // Rotation 2: pointing up
        [
            { row: 0, col: 0 },  // top-left
            { row: 0, col: 1 },  // top-right
            { row: 1, col: 0 }   // bottom
        ],
        // Rotation 3: pointing left
        [
            { row: 0, col: 0 },  // left-top
            { row: 1, col: 0 },  // left-bottom
            { row: 0, col: 1 }   // right
        ]
    ],

    createPiece(centerRow, centerCol) {
        return {
            row: centerRow,
            col: centerCol,
            rotation: 0,
            colors: [
                this.randomColor(),
                this.randomColor(),
                this.randomColor()
            ],

            getCells: function() {
                const formation = Piece.FORMATIONS[this.rotation];
                return formation.map((offset, i) => ({
                    row: this.row + offset.row,
                    col: this.col + offset.col,
                    color: this.colors[i]
                }));
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
        // Spawn at top center
        const startCol = Math.floor(Board.COLS / 2);
        const startRow = 1; // In spawn area
        return this.createPiece(startRow, startCol);
    }
};
