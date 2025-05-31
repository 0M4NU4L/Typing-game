// Game configuration
const CONFIG = {
    WINDOW_WIDTH: 640,
    WINDOW_HEIGHT: 480,
    FPS: 60,
    
    // Colors
    RETRO_BACKGROUND: "rgb(20, 20, 40)",
    RETRO_SURFACE: "rgb(40, 40, 80)",
    RETRO_ACCENT: "rgb(85, 255, 255)",
    RETRO_WHITE: "rgb(255, 255, 255)",
    RETRO_RED: "rgb(255, 85, 85)",
    RETRO_GREEN: "rgb(85, 255, 85)",
    RETRO_BLUE: "rgb(85, 85, 255)",
    RETRO_YELLOW: "rgb(255, 255, 85)",
    RETRO_MAGENTA: "rgb(255, 85, 255)",
    RETRO_CYAN: "rgb(85, 255, 255)",
    
    // Game settings
    WORDS_FOR_LEVEL_UP: 5,
    SPEED_INCREASE_FACTOR: 1.1,
    FONT_SIZE: 24,
    INPUT_FONT_SIZE: 20,
    UI_FONT_SIZE: 16,
    PARTICLE_COUNT: 8,
    TEXT_POPUP_DURATION: 60
};

// Word list
const WORD_LIST = [
    // Short easy words (3-5 letters)
    "cat", "dog", "run", "jump", "code", "game", "play", "win", "fun", "cool",
    "fast", "slow", "big", "small", "red", "blue", "green", "black", "white",
    "good", "bad", "new", "old", "hot", "cold", "yes", "no", "go", "stop",
    
    // Medium words (6-8 letters)
    "python", "coding", "gaming", "retro", "pixel", "arcade", "classic",
    "typing", "speed", "score", "level", "power", "shield", "freeze",
    "clear", "bonus", "combo", "chain", "blast", "burst", "flash",
    "quick", "rapid", "turbo", "boost", "super", "mega", "ultra",
    
    // Programming terms
    "function", "variable", "loop", "array", "string", "integer", "boolean",
    "object", "class", "method", "debug", "compile", "execute", "syntax",
    
    // Longer challenging words (9+ letters)
    "programming", "computer", "keyboard", "monitor", "processor", "memory",
    "graphics", "software", "hardware", "internet", "developer", "framework"
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    "easy": {
        "word_speed": 0.6,
        "lives": 5,
        "spawn_delay": 4000,
        "word_length_max": 5,
        "description": "BEGINNER FRIENDLY"
    },
    "medium": {
        "word_speed": 1.0,
        "lives": 3,
        "spawn_delay": 3000,
        "word_length_max": 8,
        "description": "BALANCED CHALLENGE"
    },
    "hard": {
        "word_speed": 1.5,
        "lives": 2,
        "spawn_delay": 2200,
        "word_length_max": 12,
        "description": "EXPERT MODE"
    }
};

// Classes
class DifficultyManager {
    constructor() {
        this.current_difficulty = "medium";
        this.settings = {...DIFFICULTY_SETTINGS[this.current_difficulty]};
    }
    
    set_difficulty(difficulty) {
        if (difficulty in DIFFICULTY_SETTINGS) {
            this.current_difficulty = difficulty;
            this.settings = {...DIFFICULTY_SETTINGS[difficulty]};
            return true;
        }
        return false;
    }
    
    get_settings() {
        return this.settings;
    }
    
    get_word_speed() {
        return this.settings.word_speed;
    }
    
    get_lives() {
        return this.settings.lives;
    }
    
    get_spawn_delay() {
        return this.settings.spawn_delay;
    }
    
    get_description() {
        return this.settings.description || "";
    }
    
    filter_words_by_difficulty(word_list) {
        const max_length = this.settings.word_length_max;
        const filtered = word_list.filter(word => word.length <= max_length);
        
        if (filtered.length < 10) {
            return word_list.slice(0, 20);
        }
        
        return filtered;
    }
}

class RetroWord {
    constructor(text, speed) {
        this.text = text;
        this.x = Math.floor(Math.random() * (CONFIG.WINDOW_WIDTH - 100 - 30 + 1)) + 30;
        this.y = -20;
        this.speed = speed;
        this.is_active = true;
        
        // Retro color coding based on difficulty
        if (text.length <= 4) {
            this.color = CONFIG.RETRO_GREEN;
            this.difficulty = "easy";
        } else if (text.length <= 7) {
            this.color = CONFIG.RETRO_YELLOW;
            this.difficulty = "medium";
        } else {
            this.color = CONFIG.RETRO_RED;
            this.difficulty = "hard";
        }
    }

    update() {
        this.y += this.speed;
        return this.y < CONFIG.WINDOW_HEIGHT + 20;
    }

    draw(ctx) {
        if (!this.is_active) {
            return;
        }
            
        // Create retro word box
        ctx.font = `${CONFIG.FONT_SIZE}px monospace`;
        const text_width = ctx.measureText(this.text).width;
        const text_height = CONFIG.FONT_SIZE;
        
        // Background box with padding
        const bg_padding = 4;
        const bg_width = text_width + bg_padding * 2;
        const bg_height = text_height + bg_padding * 2;
        
        const bg_x = this.x - bg_padding;
        const bg_y = this.y - bg_padding;
        
        // Draw background
        ctx.fillStyle = CONFIG.RETRO_SURFACE;
        ctx.fillRect(bg_x, bg_y, bg_width, bg_height);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bg_x, bg_y, bg_width, bg_height);
        
        // Draw text
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y + CONFIG.FONT_SIZE - 5);
    }
}

class WordManager {
    constructor(difficulty_manager) {
        this.words = [];
        this.difficulty_manager = difficulty_manager;
        this.current_speed = this.difficulty_manager.get_word_speed();
        this.filtered_words = this.difficulty_manager.filter_words_by_difficulty(WORD_LIST);
    }

    spawn_word() {
        // Spawn a new retro word
        const word_text = this.filtered_words[Math.floor(Math.random() * this.filtered_words.length)];
        const new_word = new RetroWord(word_text, this.current_speed);
        
        // Ensure words don't spawn too close to each other
        const min_distance = 80;
        const max_attempts = 8;
        let attempts = 0;
        
        while (attempts < max_attempts) {
            let too_close = false;
            for (const existing_word of this.words) {
                if (existing_word.is_active && existing_word.y < 60) {
                    const distance = Math.abs(new_word.x - existing_word.x);
                    if (distance < min_distance) {
                        too_close = true;
                        break;
                    }
                }
            }
            
            if (!too_close) {
                break;
            }
                
            new_word.x = Math.floor(Math.random() * (CONFIG.WINDOW_WIDTH - 100 - 30 + 1)) + 30;
            attempts += 1;
        }
        
        this.words.push(new_word);
    }

    update_words() {
        // Update word positions and remove inactive words
        this.words = this.words.filter(word => word.update() && word.is_active);
    }

    draw_words(ctx) {
        // Draw all active words with retro styling
        for (const word of this.words) {
            if (word.is_active) {
                word.draw(ctx);
            }
        }
    }

    check_word(typed_word) {
        // Check if typed word matches any falling word
        for (const word of this.words) {
            if (word.text.toLowerCase() === typed_word.toLowerCase() && word.is_active) {
                word.is_active = false;
                return [true, [word.x + word.text.length * 6, word.y]];
            }
        }
        return [false, null];
    }

    increase_speed(factor) {
        // Increase word falling speed
        this.current_speed *= factor;
        // Cap maximum speed for playability
        this.current_speed = Math.min(this.current_speed, 3.0);
    }

    reset_speed() {
        // Reset speed to initial value
        this.current_speed = this.difficulty_manager.get_word_speed();
        this.filtered_words = this.difficulty_manager.filter_words_by_difficulty(WORD_LIST);
    }

    get_missed_words() {
        // Get count of words that reached the bottom
        const missed = this.words.filter(word => word.y >= CONFIG.WINDOW_HEIGHT - 30 && word.is_active);
        for (const word of missed) {
            word.is_active = false;
        }
        return missed.length;
    }

    clear_words() {
        // Clear all words from screen
        this.words = [];
    }
}

class GameState {
    constructor(difficulty_manager) {
        this.difficulty_manager = difficulty_manager;
        this.reset();
        this.start_time = 0;
        this.total_chars_typed = 0;
        this.correct_words = 0;
    }

    reset() {
        // Reset all game state variables to their initial values
        this.score = 0;
        this.lives = this.difficulty_manager.get_lives();
        this.level = 1;
        this.words_until_level_up = CONFIG.WORDS_FOR_LEVEL_UP;
        this.current_input = "";
        this.game_over = false;
        this.game_started = false;
        this.start_time = Date.now() / 1000;
        this.total_chars_typed = 0;
        this.correct_words = 0;
    }

    update_score() {
        // Increment score and check for level up
        this.score += 1;
        this.correct_words += 1;
        this.words_until_level_up -= 1;
        
        if (this.words_until_level_up <= 0) {
            return this.level_up();
        }
        return 1.0;
    }

    level_up() {
        // Increase level and reset words counter
        this.level += 1;
        this.words_until_level_up = CONFIG.WORDS_FOR_LEVEL_UP;
        return CONFIG.SPEED_INCREASE_FACTOR;
    }

    lose_life() {
        // Decrease lives and check for game over
        this.lives -= 1;
        if (this.lives <= 0) {
            this.game_over = true;
        }
    }

    calculate_wpm() {
        // Calculate words per minute
        const elapsed_time = Math.max(1, (Date.now() / 1000 - this.start_time) / 60);
        return Math.floor(this.total_chars_typed / 5 / elapsed_time);
    }
        
    calculate_accuracy() {
        // Calculate typing accuracy
        if (this.total_chars_typed > 0) {
            return Math.min(100, Math.floor((this.correct_words * 5 / Math.max(1, this.total_chars_typed)) * 100));
        }
        return 0;
    }
        
    draw_ui(ctx) {
        // Draw retro-style UI elements
        // Create pixelated UI panel
        const panel_width = 200;
        const panel_height = 120;
        const panel_x = 10;
        const panel_y = 10;
        
        // Draw panel background
        ctx.fillStyle = CONFIG.RETRO_SURFACE;
        ctx.fillRect(panel_x, panel_y, panel_width, panel_height);
        ctx.strokeStyle = CONFIG.RETRO_ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(panel_x, panel_y, panel_width, panel_height);
        
        // UI text elements with retro styling
        ctx.font = `${CONFIG.UI_FONT_SIZE}px monospace`;
        
        const ui_elements = [
            [`SCORE: ${this.score}`, panel_x + 10, panel_y + 10, CONFIG.RETRO_WHITE],
            [`LIVES: ${this.lives}`, panel_x + 10, panel_y + 25, this.lives <= 1 ? CONFIG.RETRO_RED : CONFIG.RETRO_WHITE],
            [`LEVEL: ${this.level}`, panel_x + 10, panel_y + 40, CONFIG.RETRO_CYAN],
            [`WPM: ${this.calculate_wpm()}`, panel_x + 10, panel_y + 55, CONFIG.RETRO_GREEN],
            [`ACC: ${this.calculate_accuracy()}%`, panel_x + 10, panel_y + 70, CONFIG.RETRO_YELLOW],
            [`MODE: ${this.difficulty_manager.current_difficulty.toUpperCase()}`, panel_x + 10, panel_y + 85, CONFIG.RETRO_WHITE]
        ];
        
        for (const [text, x, y, color] of ui_elements) {
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        }
        
        // Level progress bar (retro style)
        const progress_width = 100;
        const progress_height = 8;
        const progress_x = CONFIG.WINDOW_WIDTH - progress_width - 20;
        const progress_y = 20;
        
        // Background
        ctx.fillStyle = CONFIG.RETRO_SURFACE;
        ctx.fillRect(progress_x, progress_y, progress_width, progress_height);
        ctx.strokeStyle = CONFIG.RETRO_WHITE;
        ctx.lineWidth = 1;
        ctx.strokeRect(progress_x, progress_y, progress_width, progress_height);
        
        // Progress fill
        const progress = (CONFIG.WORDS_FOR_LEVEL_UP - this.words_until_level_up) / CONFIG.WORDS_FOR_LEVEL_UP;
        const fill_width = Math.floor(progress_width * progress);
        if (fill_width > 0) {
            ctx.fillStyle = CONFIG.RETRO_CYAN;
            ctx.fillRect(progress_x, progress_y, fill_width, progress_height);
        }
        
        // Progress text
        ctx.fillStyle = CONFIG.RETRO_WHITE;
        ctx.fillText(`PROGRESS: ${CONFIG.WORDS_FOR_LEVEL_UP - this.words_until_level_up}/${CONFIG.WORDS_FOR_LEVEL_UP}`, progress_x, progress_y + 12);
    }

    draw_menu(ctx, is_game_over = false) {
        // Draw retro-style start screen or game over screen
        const center_x = CONFIG.WINDOW_WIDTH / 2;
        
        ctx.font = "40px monospace";
        ctx.textAlign = "center";
        
        if (is_game_over) {
            // Game Over Screen
            ctx.fillStyle = CONFIG.RETRO_RED;
            ctx.fillText("GAME OVER", center_x, 100);
            
            // Retro border around title
            const title_width = ctx.measureText("GAME OVER").width;
            const border_x = center_x - title_width / 2 - 10;
            const border_y = 100 - 35;
            const border_width = title_width + 20;
            const border_height = 45;
            
            ctx.strokeStyle = CONFIG.RETRO_RED;
            ctx.lineWidth = 2;
            ctx.strokeRect(border_x, border_y, border_width, border_height);
            
            // Stats with retro formatting
            ctx.font = `${CONFIG.INPUT_FONT_SIZE}px monospace`;
            const stats = [
                [`FINAL SCORE: ${this.score}`, 160],
                [`TYPING SPEED: ${this.calculate_wpm()} WPM`, 190],
                [`ACCURACY: ${this.calculate_accuracy()}%`, 220],
                [`LEVEL REACHED: ${this.level}`, 250]
            ];
            
            ctx.fillStyle = CONFIG.RETRO_WHITE;
            for (const [text, y] of stats) {
                ctx.fillText(text, center_x, y);
            }
            
            ctx.font = `${CONFIG.UI_FONT_SIZE}px monospace`;
            ctx.fillStyle = CONFIG.RETRO_CYAN;
            ctx.fillText("PRESS ANY KEY TO PLAY AGAIN", center_x, 320);
            
        } else {
            // Start Screen
            ctx.fillStyle = CONFIG.RETRO_WHITE;
            ctx.fillText("RETRO TYPER", center_x, 80);
            
            // Retro border around title
            const title_width = ctx.measureText("RETRO TYPER").width;
            const border_x = center_x - title_width / 2 - 10;
            const border_y = 80 - 35;
            const border_width = title_width + 20;
            const border_height = 45;
            
            ctx.strokeStyle = CONFIG.RETRO_CYAN;
            ctx.lineWidth = 2;
            ctx.strokeRect(border_x, border_y, border_width, border_height);
            
            const instructions = [
                "TYPE THE FALLING WORDS",
                "PRESS ENTER TO SUBMIT",
                "COLLECT POWER-UPS!",
                "",
                "PRESS ANY KEY TO START"
            ];
            
            ctx.font = `${CONFIG.UI_FONT_SIZE}px monospace`;
            for (let i = 0; i < instructions.length; i++) {
                if (instructions[i]) {
                    ctx.fillStyle = i === instructions.length - 1 ? CONFIG.RETRO_CYAN : CONFIG.RETRO_WHITE;
                    ctx.fillText(instructions[i], center_x, 140 + i * 25);
                }
            }
            
            // Example input box
            const example_width = 200;
            const example_height = 25;
            const example_x = (CONFIG.WINDOW_WIDTH - example_width) / 2;
            const example_y = 280;
            
            ctx.fillStyle = CONFIG.RETRO_SURFACE;
            ctx.fillRect(example_x, example_y, example_width, example_height);
            ctx.strokeStyle = CONFIG.RETRO_CYAN;
            ctx.lineWidth = 2;
            ctx.strokeRect(example_x, example_y, example_width, example_height);
            
            ctx.font = `${CONFIG.INPUT_FONT_SIZE}px monospace`;
            ctx.fillStyle = CONFIG.RETRO_WHITE;
            ctx.textAlign = "left";
            ctx.fillText("example", example_x + 5, example_y + 18);
            ctx.textAlign = "center";
        }
    }

    draw_difficulty_menu(ctx) {
        // Draw retro difficulty selection menu
        const center_x = CONFIG.WINDOW_WIDTH / 2;
        
        // Title
        ctx.font = "48px monospace";
        ctx.fillStyle = CONFIG.RETRO_WHITE;
        ctx.textAlign = "center";
        ctx.fillText("SELECT DIFFICULTY", center_x, 80);
        
        // Retro border around title
        const title_width = ctx.measureText("SELECT DIFFICULTY").width;
        const border_rect = {
            x: center_x - title_width / 2 - 10,
            y: 80 - 35,
            width: title_width + 20,
            height: 45
        };
        ctx.strokeStyle = CONFIG.RETRO_ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(border_rect.x, border_rect.y, border_rect.width, border_rect.height);
        
        // Difficulty options
        const difficulties = [
            ["1. EASY", "SLOW WORDS, 5 LIVES", CONFIG.RETRO_GREEN, 150],
            ["2. MEDIUM", "NORMAL SPEED, 3 LIVES", CONFIG.RETRO_YELLOW, 200],
            ["3. HARD", "FAST WORDS, 2 LIVES", CONFIG.RETRO_RED, 250]
        ];
        
        for (const [text, desc, color, y_pos] of difficulties) {
            // Main option text
            ctx.font = "32px monospace";
            ctx.fillStyle = color;
            ctx.fillText(text, center_x, y_pos);
            
            // Description text
            ctx.font = "24px monospace";
            ctx.fillStyle = "rgb(200, 200, 200)";
            ctx.fillText(desc, center_x, y_pos + 25);
            
            // Retro selection box
            const option_width = ctx.measureText(text).width;
            const box_rect = {
                x: center_x - option_width / 2 - 15,
                y: y_pos - 25,
                width: option_width + 30,
                height: 35
            };
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(box_rect.x, box_rect.y, box_rect.width, box_rect.height);
        }
    }
}