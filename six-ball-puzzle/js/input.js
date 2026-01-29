// Input handling for 6 Ball Puzzle
const Input = {
    keys: {},
    callbacks: {},

    init() {
        this.keys = {};
        this.callbacks = {
            left: null,
            right: null,
            softDrop: null,
            hardDrop: null,
            rotateCW: null,
            rotateCCW: null,
            pause: null,
            start: null
        };

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },

    handleKeyDown(e) {
        if (this.keys[e.code]) return; // Prevent key repeat

        this.keys[e.code] = true;

        // Prevent default for game keys
        const gameKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'KeyA', 'KeyD', 'KeyW', 'KeyS',
            'Space', 'ShiftLeft', 'ShiftRight',
            'KeyP', 'Escape'
        ];

        if (gameKeys.includes(e.code)) {
            e.preventDefault();
        }

        // Map keys to actions
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.trigger('left');
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.trigger('right');
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.trigger('softDrop');
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.trigger('hardDrop');
                break;
            case 'Space':
                this.trigger('rotateCW');
                this.trigger('start');
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.trigger('rotateCCW');
                break;
            case 'KeyP':
            case 'Escape':
                this.trigger('pause');
                break;
        }
    },

    handleKeyUp(e) {
        this.keys[e.code] = false;
    },

    on(action, callback) {
        this.callbacks[action] = callback;
    },

    trigger(action) {
        if (this.callbacks[action]) {
            this.callbacks[action]();
        }
    },

    isPressed(code) {
        return this.keys[code] === true;
    }
};
