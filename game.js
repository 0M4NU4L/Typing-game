// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WORD_SPAWN_DELAY = 3000; // ms
const INITIAL_WORD_SPEED = 1;
const SPEED_INCREMENT = 0.02; // Reduced gradual speed increase per second
const SPEED_INCREMENT_INTERVAL = 1000; // Apply speed increase every second
const MAX_SPEED = 2.5; // Maximum speed cap
const WORD_COUNT_THRESHOLD = 0.5; // Speed threshold for adding extra words

// Game variables
let canvas;
let ctx;
let words = [];
let score = 0;
let lives = 3;
let level = 1;
let gameStarted = false;
let gameOver = false;
let lastSpawnTime = 0;
let lastSpeedIncreaseTime = 0;
let currentSpeed = INITIAL_WORD_SPEED;
let inputField;

// Word list
const WORD_LIST = [
    "python", "programming", "computer", "algorithm", "database",
    "network", "software", "hardware", "internet", "developer",
    "keyboard", "monitor", "system", "memory", "processor",
    "graphics", "function", "variable", "loop", "condition"
];

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    inputField = document.getElementById('input-field');
    
    // Focus on the input field
    inputField.focus();
    
    // Add event listener for input field
    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            checkWord(inputField.value);
            inputField.value = '';
            event.preventDefault();
        }
    });
    
    // Add click event to start game
    canvas.addEventListener('click', function() {
        if (!gameStarted || gameOver) {
            startGame();
        }
    });
    
    // Draw start screen
    drawStartScreen();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start or restart the game
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    lives = 3;
    level = 1;
    words = [];
    currentSpeed = INITIAL_WORD_SPEED;
    lastSpawnTime = Date.now();
    lastSpeedIncreaseTime = Date.now();
    inputField.focus();
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!gameStarted) {
        drawStartScreen();
    } else if (gameOver) {
        drawGameOverScreen();
    } else {
        const currentTime = Date.now();
        
        // Gradually increase speed over time
        if (currentTime - lastSpeedIncreaseTime > SPEED_INCREMENT_INTERVAL) {
            if (currentSpeed < MAX_SPEED) {
                currentSpeed += SPEED_INCREMENT;
                // Cap the speed at MAX_SPEED
                currentSpeed = Math.min(currentSpeed, MAX_SPEED);
            }
            lastSpeedIncreaseTime = currentTime;
        }
        
        // Spawn new words
        if (currentTime - lastSpawnTime > WORD_SPAWN_DELAY) {
            // Calculate how many words to spawn based on current speed
            const extraWords = Math.floor((currentSpeed - INITIAL_WORD_SPEED) / WORD_COUNT_THRESHOLD);
            spawnWord();
            
            // Spawn additional words based on speed
            for (let i = 0; i < extraWords; i++) {
                spawnWord();
            }
            
            lastSpawnTime = currentTime;
        }
        
        // Update and draw words
        updateWords();
        drawWords();
        
        // Draw UI
        drawUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// Spawn a new word
function spawnWord() {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const x = Math.random() * (CANVAS_WIDTH - 100);
    words.push({
        text: word,
        x: x,
        y: 0,
        speed: currentSpeed,
        active: true
    });
}

// Update word positions
function updateWords() {
    for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].active) {
            words[i].y += words[i].speed;
            
            // Check if word has reached bottom
            if (words[i].y > CANVAS_HEIGHT) {
                words[i].active = false;
                lives--;
                
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    }
    
    // Remove inactive words
    words = words.filter(word => word.active);
}

// Draw all active words
function drawWords() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    
    for (const word of words) {
        ctx.fillText(word.text, word.x, word.y);
    }
}

// Check if typed word matches any falling word
function checkWord(typedWord) {
    for (let i = 0; i < words.length; i++) {
        if (words[i].text === typedWord && words[i].active) {
            words[i].active = false;
            score++;
            
            // Level up every 5 words
            if (score % 5 === 0) {
                level++;
                currentSpeed *= 1.1;
                // Cap the speed at MAX_SPEED
                currentSpeed = Math.min(currentSpeed, MAX_SPEED);
            }
            
            return true;
        }
    }
    return false;
}

// Draw UI elements
function drawUI() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 10, 60);
    ctx.fillText(`Level: ${level}`, 10, 90);
    ctx.fillText(`Speed: ${currentSpeed.toFixed(2)}`, 10, 120);
    
    // Calculate and display word count
    const extraWords = Math.floor((currentSpeed - INITIAL_WORD_SPEED) / WORD_COUNT_THRESHOLD);
    ctx.fillText(`Words: ${1 + extraWords} per wave`, 10, 150);
    
    // Draw input box background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
    ctx.fillRect(10, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 20, 40);
    
    // Draw input box border
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 20, 40);
}

// Draw start screen
function drawStartScreen() {
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Typing Speed Game', CANVAS_WIDTH / 2, 200);
    
    ctx.font = '24px Arial';
    ctx.fillText('Type the falling words in the text box', CANVAS_WIDTH / 2, 260);
    ctx.fillText('Press Enter to submit', CANVAS_WIDTH / 2, 300);
    ctx.fillText('Click to start', CANVAS_WIDTH / 2, 400);
    
    ctx.textAlign = 'left';
}

// Draw game over screen
function drawGameOverScreen() {
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', CANVAS_WIDTH / 2, 200);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, 260);
    ctx.fillText('Click to play again', CANVAS_WIDTH / 2, 400);
    
    ctx.textAlign = 'left';
}

// Start the game when the page loads
window.onload = init;