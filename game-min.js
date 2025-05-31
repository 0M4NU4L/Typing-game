// Minimal game implementation for web browser
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const wordInput = document.getElementById('word-input');
    const inputContainer = document.getElementById('input-container');
    
    // Game configuration
    const CONFIG = {
        WIDTH: 640,
        HEIGHT: 480,
        BACKGROUND: "rgb(20, 20, 40)",
        SURFACE: "rgb(40, 40, 80)",
        ACCENT: "rgb(85, 255, 255)",
        WHITE: "rgb(255, 255, 255)",
        RED: "rgb(255, 85, 85)",
        GREEN: "rgb(85, 255, 85)",
        YELLOW: "rgb(255, 255, 85)",
        FONT_SIZE: 24
    };
    
    // Game state
    let gameState = {
        difficulty: "medium",
        score: 0,
        lives: 3,
        words: [],
        wordSpeed: 1.0,
        gameStarted: false,
        gameOver: false,
        selectingDifficulty: true,
        lastSpawnTime: 0
    };
    
    // Word list (shortened)
    const WORDS = [
        "cat", "dog", "run", "jump", "code", "game", "play", "win", "fun", "cool",
        "fast", "slow", "big", "small", "red", "blue", "green", "black", "white",
        "python", "coding", "gaming", "retro", "pixel", "arcade", "classic",
        "typing", "speed", "score", "level", "power", "function", "variable"
    ];
    
    // Draw background
    function drawBackground() {
        ctx.fillStyle = CONFIG.BACKGROUND;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        
        // Grid pattern
        ctx.strokeStyle = "rgb(30, 30, 50)";
        ctx.lineWidth = 1;
        for (let x = 0; x < CONFIG.WIDTH; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CONFIG.HEIGHT; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.WIDTH, y);
            ctx.stroke();
        }
    }
    
    // Draw difficulty menu
    function drawDifficultyMenu() {
        ctx.font = "48px monospace";
        ctx.fillStyle = CONFIG.WHITE;
        ctx.textAlign = "center";
        ctx.fillText("SELECT DIFFICULTY", CONFIG.WIDTH/2, 80);
        
        const difficulties = [
            ["1. EASY", "SLOW WORDS, 5 LIVES", CONFIG.GREEN, 150],
            ["2. MEDIUM", "NORMAL SPEED, 3 LIVES", CONFIG.YELLOW, 200],
            ["3. HARD", "FAST WORDS, 2 LIVES", CONFIG.RED, 250]
        ];
        
        for (const [text, desc, color, y] of difficulties) {
            ctx.font = "32px monospace";
            ctx.fillStyle = color;
            ctx.fillText(text, CONFIG.WIDTH/2, y);
            
            ctx.font = "24px monospace";
            ctx.fillStyle = "rgb(200, 200, 200)";
            ctx.fillText(desc, CONFIG.WIDTH/2, y + 25);
        }
    }
    
    // Draw game UI
    function drawUI() {
        // Score panel
        ctx.fillStyle = CONFIG.SURFACE;
        ctx.fillRect(10, 10, 200, 80);
        ctx.strokeStyle = CONFIG.ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 200, 80);
        
        ctx.font = "16px monospace";
        ctx.fillStyle = CONFIG.WHITE;
        ctx.textAlign = "left";
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
        ctx.fillText(`LIVES: ${gameState.lives}`, 20, 50);
        ctx.fillText(`MODE: ${gameState.difficulty.toUpperCase()}`, 20, 70);
    }
    
    // Spawn a word
    function spawnWord() {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        const x = Math.floor(Math.random() * (CONFIG.WIDTH - 100)) + 50;
        
        gameState.words.push({
            text: word,
            x: x,
            y: -20,
            color: word.length <= 4 ? CONFIG.GREEN : 
                   word.length <= 7 ? CONFIG.YELLOW : CONFIG.RED
        });
    }
    
    // Update words
    function updateWords() {
        const now = Date.now();
        
        // Spawn new word
        if (now - gameState.lastSpawnTime > (gameState.difficulty === "easy" ? 4000 : 
                                            gameState.difficulty === "medium" ? 3000 : 2200)) {
            spawnWord();
            gameState.lastSpawnTime = now;
        }
        
        // Update positions
        for (let i = gameState.words.length - 1; i >= 0; i--) {
            const word = gameState.words[i];
            word.y += gameState.wordSpeed;
            
            // Check if word reached bottom
            if (word.y > CONFIG.HEIGHT - 30) {
                gameState.lives--;
                gameState.words.splice(i, 1);
                
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                }
            }
        }
    }
    
    // Draw words
    function drawWords() {
        ctx.font = `${CONFIG.FONT_SIZE}px monospace`;
        
        for (const word of gameState.words) {
            // Word background
            const width = ctx.measureText(word.text).width + 8;
            ctx.fillStyle = CONFIG.SURFACE;
            ctx.fillRect(word.x - 4, word.y - 4, width, CONFIG.FONT_SIZE + 8);
            ctx.strokeStyle = word.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(word.x - 4, word.y - 4, width, CONFIG.FONT_SIZE + 8);
            
            // Word text
            ctx.fillStyle = word.color;
            ctx.textAlign = "left";
            ctx.fillText(word.text, word.x, word.y + CONFIG.FONT_SIZE - 5);
        }
    }
    
    // Draw game over screen
    function drawGameOver() {
        ctx.font = "40px monospace";
        ctx.fillStyle = CONFIG.RED;
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CONFIG.WIDTH/2, 100);
        
        ctx.font = "24px monospace";
        ctx.fillStyle = CONFIG.WHITE;
        ctx.fillText(`FINAL SCORE: ${gameState.score}`, CONFIG.WIDTH/2, 160);
        
        ctx.font = "16px monospace";
        ctx.fillStyle = CONFIG.ACCENT;
        ctx.fillText("PRESS ANY KEY TO PLAY AGAIN", CONFIG.WIDTH/2, 220);
    }
    
    // Main game loop
    function gameLoop() {
        // Clear canvas
        ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        drawBackground();
        
        if (gameState.selectingDifficulty) {
            drawDifficultyMenu();
        } else if (gameState.gameOver) {
            drawGameOver();
        } else {
            if (gameState.gameStarted) {
                updateWords();
                drawWords();
                drawUI();
            } else {
                // Start screen
                ctx.font = "40px monospace";
                ctx.fillStyle = CONFIG.WHITE;
                ctx.textAlign = "center";
                ctx.fillText("RETRO TYPER", CONFIG.WIDTH/2, 100);
                
                ctx.font = "16px monospace";
                ctx.fillText("PRESS ANY KEY TO START", CONFIG.WIDTH/2, 200);
            }
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        if (gameState.selectingDifficulty) {
            if (e.key === '1') {
                gameState.difficulty = "easy";
                gameState.lives = 5;
                gameState.wordSpeed = 0.6;
                gameState.selectingDifficulty = false;
                gameState.gameStarted = true;
                inputContainer.style.display = 'block';
                wordInput.focus();
            } else if (e.key === '2') {
                gameState.difficulty = "medium";
                gameState.lives = 3;
                gameState.wordSpeed = 1.0;
                gameState.selectingDifficulty = false;
                gameState.gameStarted = true;
                inputContainer.style.display = 'block';
                wordInput.focus();
            } else if (e.key === '3') {
                gameState.difficulty = "hard";
                gameState.lives = 2;
                gameState.wordSpeed = 1.5;
                gameState.selectingDifficulty = false;
                gameState.gameStarted = true;
                inputContainer.style.display = 'block';
                wordInput.focus();
            }
        } else if (gameState.gameOver) {
            // Reset game
            gameState = {
                difficulty: "medium",
                score: 0,
                lives: 3,
                words: [],
                wordSpeed: 1.0,
                gameStarted: false,
                gameOver: false,
                selectingDifficulty: true,
                lastSpawnTime: 0
            };
            inputContainer.style.display = 'none';
        } else if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            gameState.lastSpawnTime = Date.now();
            inputContainer.style.display = 'block';
            wordInput.focus();
        }
    });
    
    // Handle word input
    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && wordInput.value.trim()) {
            const typedWord = wordInput.value.trim().toLowerCase();
            let found = false;
            
            for (let i = 0; i < gameState.words.length; i++) {
                if (gameState.words[i].text.toLowerCase() === typedWord) {
                    gameState.words.splice(i, 1);
                    gameState.score++;
                    found = true;
                    break;
                }
            }
            
            wordInput.value = '';
        }
    });
    
    // Start the game
    gameState.lastSpawnTime = Date.now();
    gameLoop();
});