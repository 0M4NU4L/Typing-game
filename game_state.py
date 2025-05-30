import pygame
import time
from config import (
    SPEED_INCREASE_FACTOR,
    WORDS_FOR_LEVEL_UP,
    INPUT_FONT_SIZE,
    UI_FONT_SIZE,
    RETRO_WHITE,
    RETRO_RED,
    RETRO_GREEN,
    RETRO_CYAN,
    RETRO_SURFACE,
    RETRO_ACCENT,
    RETRO_YELLOW,
    WINDOW_WIDTH,
    WINDOW_HEIGHT
)

class GameState:
    def __init__(self, difficulty_manager):
        self.difficulty_manager = difficulty_manager
        self.reset()
        self.input_font = pygame.font.Font(None, INPUT_FONT_SIZE)
        self.ui_font = pygame.font.Font(None, UI_FONT_SIZE)
        self.title_font = pygame.font.Font(None, 40)
        self.start_time = 0
        self.total_chars_typed = 0
        self.correct_words = 0

    def reset(self):
        """Reset all game state variables to their initial values"""
        self.score = 0
        self.lives = self.difficulty_manager.get_lives()
        self.level = 1
        self.words_until_level_up = WORDS_FOR_LEVEL_UP
        self.current_input = ""
        self.game_over = False
        self.game_started = False
        self.start_time = time.time()
        self.total_chars_typed = 0
        self.correct_words = 0

    def update_score(self):
        """Increment score and check for level up"""
        self.score += 1
        self.correct_words += 1
        self.words_until_level_up -= 1
        
        if self.words_until_level_up <= 0:
            return self.level_up()
        return 1.0

    def level_up(self):
        """Increase level and reset words counter"""
        self.level += 1
        self.words_until_level_up = WORDS_FOR_LEVEL_UP
        return SPEED_INCREASE_FACTOR

    def lose_life(self):
        """Decrease lives and check for game over"""
        self.lives -= 1
        if self.lives <= 0:
            self.game_over = True

    def calculate_wpm(self):
        """Calculate words per minute"""
        elapsed_time = max(1, time.time() - self.start_time) / 60
        return int(self.total_chars_typed / 5 / elapsed_time)
        
    def calculate_accuracy(self):
        """Calculate typing accuracy"""
        if self.total_chars_typed > 0:
            return min(100, int((self.correct_words * 5 / max(1, self.total_chars_typed)) * 100))
        return 0
        
    def draw_ui(self, screen):
        """Draw retro-style UI elements"""
        # Create pixelated UI panel
        panel_width = 200
        panel_height = 120
        panel_x = 10
        panel_y = 10
        
        # Draw panel background
        panel_rect = pygame.Rect(panel_x, panel_y, panel_width, panel_height)
        pygame.draw.rect(screen, RETRO_SURFACE, panel_rect)
        pygame.draw.rect(screen, RETRO_ACCENT, panel_rect, 2)
        
        # UI text elements with retro styling
        ui_elements = [
            (f"SCORE: {self.score}", panel_x + 10, panel_y + 10, RETRO_WHITE),
            (f"LIVES: {self.lives}", panel_x + 10, panel_y + 25, RETRO_RED if self.lives <= 1 else RETRO_WHITE),
            (f"LEVEL: {self.level}", panel_x + 10, panel_y + 40, RETRO_CYAN),
            (f"WPM: {self.calculate_wpm()}", panel_x + 10, panel_y + 55, RETRO_GREEN),
            (f"ACC: {self.calculate_accuracy()}%", panel_x + 10, panel_y + 70, RETRO_YELLOW),
            (f"MODE: {self.difficulty_manager.current_difficulty.upper()}", panel_x + 10, panel_y + 85, RETRO_WHITE)
        ]
        
        for text, x, y, color in ui_elements:
            text_surface = self.ui_font.render(text, False, color)
            screen.blit(text_surface, (x, y))
        
        # Retro input box
        input_box_width = 300
        input_box_height = 30
        input_box_x = (WINDOW_WIDTH - input_box_width) // 2
        input_box_y = WINDOW_HEIGHT - 50
        
        # Input box with retro styling
        input_rect = pygame.Rect(input_box_x, input_box_y, input_box_width, input_box_height)
        pygame.draw.rect(screen, RETRO_SURFACE, input_rect)
        pygame.draw.rect(screen, RETRO_ACCENT, input_rect, 2)
        
        # Input text with blinking cursor
        cursor_blink = int(pygame.time.get_ticks() / 500) % 2 == 0
        display_text = self.current_input
        if cursor_blink and len(display_text) < 15:
            display_text += "_"
            
        input_text = self.input_font.render(display_text, False, RETRO_WHITE)
        screen.blit(input_text, (input_box_x + 5, input_box_y + 5))
        
        # Level progress bar (retro style)
        progress_width = 100
        progress_height = 8
        progress_x = WINDOW_WIDTH - progress_width - 20
        progress_y = 20
        
        # Background
        progress_bg = pygame.Rect(progress_x, progress_y, progress_width, progress_height)
        pygame.draw.rect(screen, RETRO_SURFACE, progress_bg)
        pygame.draw.rect(screen, RETRO_WHITE, progress_bg, 1)
        
        # Progress fill
        progress = (WORDS_FOR_LEVEL_UP - self.words_until_level_up) / WORDS_FOR_LEVEL_UP
        fill_width = int(progress_width * progress)
        if fill_width > 0:
            fill_rect = pygame.Rect(progress_x, progress_y, fill_width, progress_height)
            pygame.draw.rect(screen, RETRO_CYAN, fill_rect)
        
        # Progress text
        progress_text = self.ui_font.render(f"PROGRESS: {WORDS_FOR_LEVEL_UP - self.words_until_level_up}/{WORDS_FOR_LEVEL_UP}", False, RETRO_WHITE)
        screen.blit(progress_text, (progress_x, progress_y + 12))

    def draw_menu(self, screen, is_game_over=False):
        """Draw retro-style start screen or game over screen"""
        center_x = WINDOW_WIDTH // 2
        
        if is_game_over:
            # Game Over Screen
            title = self.title_font.render("GAME OVER", False, RETRO_RED)
            title_rect = title.get_rect(center=(center_x, 100))
            screen.blit(title, title_rect)
            
            # Retro border around title
            border_rect = pygame.Rect(title_rect.x - 10, title_rect.y - 5, title_rect.width + 20, title_rect.height + 10)
            pygame.draw.rect(screen, RETRO_RED, border_rect, 2)
            
            # Stats with retro formatting
            stats = [
                (f"FINAL SCORE: {self.score}", 160),
                (f"TYPING SPEED: {self.calculate_wpm()} WPM", 190),
                (f"ACCURACY: {self.calculate_accuracy()}%", 220),
                (f"LEVEL REACHED: {self.level}", 250)
            ]
            
            for text, y in stats:
                stat_surface = self.input_font.render(text, False, RETRO_WHITE)
                stat_rect = stat_surface.get_rect(center=(center_x, y))
                screen.blit(stat_surface, stat_rect)
            
            prompt = self.ui_font.render("PRESS ANY KEY TO PLAY AGAIN", False, RETRO_CYAN)
            prompt_rect = prompt.get_rect(center=(center_x, 320))
            screen.blit(prompt, prompt_rect)
            
        else:
            # Start Screen
            title = self.title_font.render("RETRO TYPER", False, RETRO_WHITE)
            title_rect = title.get_rect(center=(center_x, 80))
            screen.blit(title, title_rect)
            
            # Retro border around title
            border_rect = pygame.Rect(title_rect.x - 10, title_rect.y - 5, title_rect.width + 20, title_rect.height + 10)
            pygame.draw.rect(screen, RETRO_CYAN, border_rect, 2)
            
            instructions = [
                "TYPE THE FALLING WORDS",
                "PRESS ENTER TO SUBMIT",
                "COLLECT POWER-UPS!",
                "",
                "PRESS ANY KEY TO START"
            ]
            
            for i, instruction in enumerate(instructions):
                if instruction:
                    color = RETRO_CYAN if i == len(instructions) - 1 else RETRO_WHITE
                    inst_surface = self.ui_font.render(instruction, False, color)
                    inst_rect = inst_surface.get_rect(center=(center_x, 140 + i * 25))
                    screen.blit(inst_surface, inst_rect)
            
            # Example input box
            example_width = 200
            example_height = 25
            example_x = (WINDOW_WIDTH - example_width) // 2
            example_y = 280
            
            example_rect = pygame.Rect(example_x, example_y, example_width, example_height)
            pygame.draw.rect(screen, RETRO_SURFACE, example_rect)
            pygame.draw.rect(screen, RETRO_CYAN, example_rect, 2)
            
            example_text = self.input_font.render("example", False, RETRO_WHITE)
            screen.blit(example_text, (example_x + 5, example_y + 3))
