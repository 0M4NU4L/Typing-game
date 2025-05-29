import pygame
import sys
from config import (
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    FPS,
    BLACK,
    WORD_SPAWN_DELAY
)
from word_manager import WordManager
from game_state import GameState
from difficulty import DifficultyManager
from powerups import PowerUpManager

class TypingSpeedGame:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Typing Speed Game")
        self.clock = pygame.time.Clock()
        
        self.difficulty_manager = DifficultyManager()
        self.powerup_manager = PowerUpManager()
        self.word_manager = WordManager(self.difficulty_manager)
        self.game_state = GameState(self.difficulty_manager)
        self.last_spawn_time = 0
        self.selecting_difficulty = True
        
        # Try to load sound effects
        try:
            pygame.mixer.init()
            self.sounds = {
                "type": pygame.mixer.Sound("sounds/type.wav") if pygame.mixer.get_init() else None,
                "correct": pygame.mixer.Sound("sounds/correct.wav") if pygame.mixer.get_init() else None,
                "wrong": pygame.mixer.Sound("sounds/wrong.wav") if pygame.mixer.get_init() else None,
                "powerup": pygame.mixer.Sound("sounds/powerup.wav") if pygame.mixer.get_init() else None
            }
        except:
            self.sounds = {key: None for key in ["type", "correct", "wrong", "powerup"]}

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if self.selecting_difficulty:
                    if event.key == pygame.K_1:
                        self.difficulty_manager.set_difficulty("easy")
                        self.selecting_difficulty = False
                        self.game_state.game_started = True
                    elif event.key == pygame.K_2:
                        self.difficulty_manager.set_difficulty("medium")
                        self.selecting_difficulty = False
                        self.game_state.game_started = True
                    elif event.key == pygame.K_3:
                        self.difficulty_manager.set_difficulty("hard")
                        self.selecting_difficulty = False
                        self.game_state.game_started = True
                    return True
                
                if not self.game_state.game_started:
                    self.game_state.game_started = True
                    return True
                
                if self.game_state.game_over:
                    self.reset_game()
                    return True

                if event.key == pygame.K_RETURN and self.game_state.current_input:
                    word_match, word_pos = self.word_manager.check_word(self.game_state.current_input)
                    if word_match:
                        # Play correct sound
                        if self.sounds["correct"]:
                            self.sounds["correct"].play()
                            
                        # Update score
                        speed_factor = self.game_state.update_score()
                        self.game_state.total_chars_typed += len(self.game_state.current_input)
                        self.word_manager.increase_speed(speed_factor)
                        
                        # Check for powerup collection
                        if word_pos:
                            collected = self.powerup_manager.check_collection(word_pos[0], word_pos[1])
                            if collected:
                                if self.sounds["powerup"]:
                                    self.sounds["powerup"].play()
                                    
                                if collected == "freeze":
                                    self.powerup_manager.activate_effect("freeze", 300)
                                elif collected == "clear":
                                    self.word_manager.clear_words()
                                elif collected == "life":
                                    self.game_state.lives += 1
                                elif collected == "shield":
                                    self.powerup_manager.activate_effect("shield", 600)
                    else:
                        # Play wrong sound
                        if self.sounds["wrong"]:
                            self.sounds["wrong"].play()
                            
                    self.game_state.current_input = ""
                elif event.key == pygame.K_BACKSPACE:
                    self.game_state.current_input = self.game_state.current_input[:-1]
                elif event.unicode.isprintable():
                    self.game_state.current_input += event.unicode
                    self.game_state.total_chars_typed += 1
                    # Play typing sound
                    if self.sounds["type"]:
                        self.sounds["type"].play()
        return True

    def update(self):
        if self.selecting_difficulty or not self.game_state.game_started or self.game_state.game_over:
            return

        # Update powerups
        self.powerup_manager.update()
        self.powerup_manager.try_spawn()
        
        # Only spawn and update words if freeze effect is not active
        if not self.powerup_manager.is_effect_active("freeze"):
            current_time = pygame.time.get_ticks()
            spawn_delay = self.difficulty_manager.get_spawn_delay()
            if current_time - self.last_spawn_time > spawn_delay:
                self.word_manager.spawn_word()
                self.last_spawn_time = current_time

            self.word_manager.update_words()
            
        # Check for missed words
        missed_words = self.word_manager.get_missed_words()
        if missed_words > 0 and not self.powerup_manager.is_effect_active("shield"):
            for _ in range(missed_words):
                self.game_state.lose_life()

    def draw(self):
        self.screen.fill(BLACK)

        if self.selecting_difficulty:
            self.draw_difficulty_menu()
        elif not self.game_state.game_started:
            self.game_state.draw_menu(self.screen)
        elif self.game_state.game_over:
            self.game_state.draw_menu(self.screen, is_game_over=True)
        else:
            # Draw game elements
            self.word_manager.draw_words(self.screen)
            self.powerup_manager.draw(self.screen)
            self.game_state.draw_ui(self.screen)
            
            # Draw freeze effect overlay if active
            if self.powerup_manager.is_effect_active("freeze"):
                freeze_surface = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
                freeze_surface.fill((0, 191, 255, 30))  # Light blue transparent overlay
                self.screen.blit(freeze_surface, (0, 0))
            
            # Draw shield effect indicator if active
            if self.powerup_manager.is_effect_active("shield"):
                shield_height = 5
                shield_rect = pygame.Rect(0, WINDOW_HEIGHT - shield_height, WINDOW_WIDTH, shield_height)
                pygame.draw.rect(self.screen, (138, 43, 226), shield_rect)  # Purple shield line

        pygame.display.flip()
        
    def draw_difficulty_menu(self):
        """Draw the difficulty selection menu"""
        title_font = pygame.font.Font(None, 64)
        option_font = pygame.font.Font(None, 36)
        
        title = title_font.render("Select Difficulty", True, (255, 255, 255))
        easy = option_font.render("1. Easy", True, (0, 255, 0))
        medium = option_font.render("2. Medium", True, (255, 255, 0))
        hard = option_font.render("3. Hard", True, (255, 0, 0))
        
        center_x = self.screen.get_width() // 2
        self.screen.blit(title, title.get_rect(center=(center_x, 150)))
        self.screen.blit(easy, easy.get_rect(center=(center_x, 250)))
        self.screen.blit(medium, medium.get_rect(center=(center_x, 300)))
        self.screen.blit(hard, hard.get_rect(center=(center_x, 350)))

    def reset_game(self):
        self.selecting_difficulty = True
        self.game_state.reset()
        self.word_manager.clear_words()
        self.word_manager.reset_speed()
        self.powerup_manager.clear_powerups()
        self.last_spawn_time = pygame.time.get_ticks()

    def run(self):
        running = True
        while running:
            running = self.handle_input()
            self.update()
            self.draw()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = TypingSpeedGame()
    game.run()