import pygame
import time
from config import (
    SPEED_INCREASE_FACTOR,
    WORDS_FOR_LEVEL_UP,
    INPUT_FONT_SIZE,
    WHITE,
    RED,
    GREEN
)

class GameState:
    def __init__(self, difficulty_manager):
        self.difficulty_manager = difficulty_manager
        self.reset()
        self.font = pygame.font.Font(None, INPUT_FONT_SIZE)
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
        elapsed_time = max(1, time.time() - self.start_time) / 60  # Convert to minutes
        # Standard calculation: 5 characters = 1 word
        return int(self.total_chars_typed / 5 / elapsed_time)
        
    def draw_ui(self, screen):
        """Draw all UI elements including score, lives, and current input"""
        # Draw score
        score_text = self.font.render(f"Score: {self.score}", True, WHITE)
        screen.blit(score_text, (10, 10))

        # Draw lives
        lives_text = self.font.render(f"Lives: {self.lives}", True, RED)
        screen.blit(lives_text, (10, 40))

        # Draw level
        level_text = self.font.render(f"Level: {self.level}", True, WHITE)
        screen.blit(level_text, (10, 70))
        
        # Draw WPM (Words Per Minute)
        wpm_text = self.font.render(f"WPM: {self.calculate_wpm()}", True, WHITE)
        screen.blit(wpm_text, (10, 100))
        
        # Draw difficulty
        diff_text = self.font.render(f"Difficulty: {self.difficulty_manager.current_difficulty.capitalize()}", True, WHITE)
        screen.blit(diff_text, (10, 130))

        # Draw text input area with label
        label_font = pygame.font.Font(None, 24)
        label_text = label_font.render("Type here:", True, WHITE)
        screen.blit(label_text, (10, screen.get_height() - 80))
        
        # Draw the input box
        input_box_width = 400
        input_box_height = 40
        input_box_x = (screen.get_width() - input_box_width) // 2
        input_box_y = screen.get_height() - 60
        
        # Draw the input box background and border
        pygame.draw.rect(screen, (50, 50, 50), (input_box_x, input_box_y, input_box_width, input_box_height))
        pygame.draw.rect(screen, GREEN, (input_box_x, input_box_y, input_box_width, input_box_height), 2)
        
        # Draw current input with cursor indicator
        cursor_blink = int(pygame.time.get_ticks() / 500) % 2 == 0  # Blink every 500ms
        display_text = self.current_input
        if cursor_blink:
            display_text += "|"
            
        input_text = self.font.render(display_text, True, GREEN)
        screen.blit(input_text, (input_box_x + 10, input_box_y + 10))

    def draw_menu(self, screen, is_game_over=False):
        """Draw either start screen or game over screen"""
        title_font = pygame.font.Font(None, 64)
        info_font = pygame.font.Font(None, 32)

        if is_game_over:
            # Game Over Screen
            title = title_font.render("Game Over!", True, RED)
            score = info_font.render(f"Final Score: {self.score}", True, WHITE)
            wpm = info_font.render(f"Typing Speed: {self.calculate_wpm()} WPM", True, WHITE)
            accuracy = 0
            if self.total_chars_typed > 0:
                # Simple accuracy calculation based on correct words vs total characters typed
                accuracy = min(100, int((self.correct_words * 5 / max(1, self.total_chars_typed)) * 100))
            acc_text = info_font.render(f"Accuracy: {accuracy}%", True, WHITE)
            prompt = info_font.render("Press any key to play again", True, WHITE)
            
            # Center all text elements
            center_x = screen.get_width() // 2
            screen.blit(title, title.get_rect(center=(center_x, 150)))
            screen.blit(score, score.get_rect(center=(center_x, 250)))
            screen.blit(wpm, wpm.get_rect(center=(center_x, 300)))
            screen.blit(acc_text, acc_text.get_rect(center=(center_x, 350)))
            screen.blit(prompt, prompt.get_rect(center=(center_x, 450)))
        else:
            # Start Screen
            title = title_font.render("Typing Speed Game", True, WHITE)
            score = info_font.render("Type the falling words in the text box", True, WHITE)
            instruction = info_font.render("Press Enter to submit your answer", True, WHITE)
            prompt = info_font.render("Press any key to start", True, WHITE)
            
            # Center all text elements
            center_x = screen.get_width() // 2
            screen.blit(title, title.get_rect(center=(center_x, 180)))
            screen.blit(score, score.get_rect(center=(center_x, 260)))
            screen.blit(instruction, instruction.get_rect(center=(center_x, 300)))
            screen.blit(prompt, prompt.get_rect(center=(center_x, 400)))
            
            # Draw example text box
            example_box_width = 300
            example_box_height = 40
            example_box_x = (screen.get_width() - example_box_width) // 2
            example_box_y = 340
            
            pygame.draw.rect(screen, (50, 50, 50), (example_box_x, example_box_y, example_box_width, example_box_height))
            pygame.draw.rect(screen, GREEN, (example_box_x, example_box_y, example_box_width, example_box_height), 2)
            
            example_text = info_font.render("example", True, GREEN)
            screen.blit(example_text, (example_box_x + 10, example_box_y + 10))