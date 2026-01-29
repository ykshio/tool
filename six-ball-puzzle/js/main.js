// Main entry point for 6 Ball Puzzle

// Game loop
function gameLoop(timestamp) {
    Game.update(timestamp);
    requestAnimationFrame(gameLoop);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    requestAnimationFrame(gameLoop);
});
