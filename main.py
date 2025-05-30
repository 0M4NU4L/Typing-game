import pygame
import sys
import os
from config import (
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    FPS,
    RETRO_BACKGROUND,
    RETRO_ACCENT,
    WORD_SPAWN_DELAY
)
from word_manager import WordManager
from game_state import GameState
from difficulty import DifficultyManager
from powerups import PowerUpManager
from effects import EffectsManager

class TypingSpeedGame:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("RETRO TYPER")
        self.clock = pygame.time.Clock()
        
        # Initialize managers
        self.difficulty_manager = DifficultyManager()
        self.powerup_manager = PowerUpManager()
        self.word_manager = WordManager(self.difficulty_manager)
        self.game_state = GameState(self.difficulty_manager)
        self.effects_manager = EffectsManager()
        
        self.last_spawn_time = 0
        self.selecting_difficulty = True
        
        # Initialize sound system with better error handling
        self.sounds = self._initialize_sounds()
        
        # Create retro background
        self.background = self._create_retro_background()

    def _initialize_sounds(self):
        """Initialize sound effects with proper error handling"""
        sounds = {}
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            sound_files = {
                "type": "sounds/type.wav",
                "correct": "sounds/correct.wav", 
                "wrong": "sounds/wrong.wav",
                "powerup": "sounds/powerup.wav",
                "levelup": "sounds/levelup.wav"
            }
            
            for name, file_path in sound_files.items():
                try:
                    if os.path.exists(file_path):
                        sounds[name] = pygame.mixer.Sound(file_path)
                        sounds[name].set_volume(0.3)
                    else:
                        sounds[name] = None
                except pygame.error:
                    sounds[name] = None
                    
        except pygame.error:
            sounds = {key: None for key in ["type", "correct", "wrong", "powerup", "levelup"]}
            
        return sounds

    def _create_retro_background(self):
        """Create a retro pixelated background with scanlines"""
        background = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
        background.fill(RETRO_BACKGROUND)
        
        # Add retro grid pattern
        grid_size = 20
        grid_color = (RETRO_BACKGROUND[0] + 10, RETRO_BACKGROUND[1] + 10, RETRO_BACKGROUND[2] + 10)
        
        for x in range(0, WINDOW_WIDTH, grid_size):
            pygame.draw.line(background, grid_color, (x, 0), (x, WINDOW_HEIGHT))
        for y in range(0, WINDOW_HEIGHT, grid_size):
            pygame.draw.line(background, grid_color, (0, y), (WINDOW_WIDTH, y))
        
        # Add scanlines for CRT effect
        for y in range(0, WINDOW_HEIGHT, 4):
            scanline_color = (RETRO_BACKGROUND[0] - 5, RETRO_BACKGROUND[1] - 5, RETRO_BACKGROUND[2] - 5)
            pygame.draw.line(background, scanline_color, (0, y), (WINDOW_WIDTH, y))
            
        return background

    def _play_sound(self, sound_name):
        """Safely play a sound effect"""
        if self.sounds.get(sound_name):
            try:
                self.sounds[sound_name].play()
            except pygame.error:
                pass

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
                        self.effects_manager.add_text_popup("EASY MODE!", WINDOW_WIDTH//2, WINDOW_HEIGHT//2, (0, 255, 0))
                    elif event.key == pygame.K_2:
                        self.difficulty_manager.set_difficulty("medium")
                        self.selecting_difficulty = False
                        self.game_state.game_started = True
                        self.effects_manager.add_text_popup("MEDIUM MODE!", WINDOW_WIDTH//2, WINDOW_HEIGHT//2, (255, 255, 0))
                    elif event.key == pygame.K_3:
                        self.difficulty_manager.set_difficulty("hard")
                        self.selecting_difficulty = False
                        self.game_state.game_started = True
                        self.effects_manager.add_text_popup("HARD MODE!", WINDOW_WIDTH//2, WINDOW_HEIGHT//2, (255, 0, 0))
                    return True
                
                if not self.game_state.game_started:
                    self.game_state.game_started = True
                    return True
                
                if self.game_state.game_over:
                    self.reset_game()
                    return True

                if event.key == pygame.K_RETURN and self.game_state.current_input.strip():
                    word_match, word_pos = self.word_manager.check_word(self.game_state.current_input.strip())
                    if word_match:
                        self._play_sound("correct")
                        
                        # Add success effect
                        if word_pos:
                            self.effects_manager.add_pixel_burst(word_pos[0], word_pos[1], (0, 255, 0))
                            self.effects_manager.add_text_popup("+1", word_pos[0], word_pos[1], (0, 255, 0))
                        
                        # Update score and check for level up
                        speed_factor = self.game_state.update_score()
                        if speed_factor > 1.0:
                            self._play_sound("levelup")
                            self.effects_manager.add_text_popup(f"LEVEL {self.game_state.level}!", WINDOW_WIDTH//2, WINDOW_HEIGHT//3, RETRO_ACCENT)
                            
                        self.game_state.total_chars_typed += len(self.game_state.current_input)
                        self.word_manager.increase_speed(speed_factor)
                        
                        # Check for powerup collection
                        if word_pos:
                            collected = self.powerup_manager.check_collection(word_pos[0], word_pos[1])
                            if collected:
                                self._play_sound("powerup")
                                self.effects_manager.add_pixel_burst(word_pos[0], word_pos[1], (255, 255, 0))
                                
                                if collected == "freeze":
                                    self.powerup_manager.activate_effect("freeze", 300)
                                    self.effects_manager.add_text_popup("FREEZE!", word_pos[0], word_pos[1], (0, 255, 255))
                                elif collected == "clear":
                                    self.word_manager.clear_words()
                                    self.effects_manager.add_text_popup("CLEAR!", word_pos[0], word_pos[1], (255, 255, 0))
                                elif collected == "life":
                                    self.game_state.lives += 1
                                    self.effects_manager.add_text_popup("+LIFE!", word_pos[0], word_pos[1], (0, 255, 0))
                                elif collected == "shield":
                                    self.powerup_manager.activate_effect("shield", 600)
                                    self.effects_manager.add_text_popup("SHIELD!", word_pos[0], word_pos[1], (255, 0, 255))
                    else:
                        self._play_sound("wrong")
                        # Add error effect
                        self.effects_manager.add_screen_shake(5)
                        self.effects_manager.add_text_popup("MISS!", WINDOW_WIDTH//2, WINDOW_HEIGHT//2, (255, 0, 0))
                        
                    self.game_state.current_input = ""
                    
                elif event.key == pygame.K_BACKSPACE:
                    self.game_state.current_input = self.game_state.current_input[:-1]
                    
                elif event.unicode.isprintable() and len(self.game_state.current_input) < 15:
                    self.game_state.current_input += event.unicode
                    self.game_state.total_chars_typed += 1
                    self._play_sound("type")
                    
        return True

    def update(self):
        if self.selecting_difficulty or not self.game_state.game_started or self.game_state.game_over:
            self.effects_manager.update()
            return

        # Update all managers
        self.powerup_manager.update()
        self.powerup_manager.try_spawn()
        self.effects_manager.update()
        
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
                self.effects_manager.add_screen_shake(8)
                self.effects_manager.add_text_popup("-LIFE!", WINDOW_WIDTH//2, WINDOW_HEIGHT//4, (255, 0, 0))

    def draw(self):
        # Apply screen shake offset
        shake_offset = self.effects_manager.get_screen_shake_offset()
        
        # Draw background
        self.screen.blit(self.background, shake_offset)

        if self.selecting_difficulty:
            self.draw_difficulty_menu()
        elif not self.game_state.game_started:
            self.game_state.draw_menu(self.screen)
        elif self.game_state.game_over:
            self.game_state.draw_menu(self.screen, is_game_over=True)
        else:
            # Draw game elements with shake offset
            temp_surface = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
            
            self.word_manager.draw_words(temp_surface)
            self.powerup_manager.draw(temp_surface)
            self.game_state.draw_ui(temp_surface)
            
            # Draw freeze effect overlay if active
            if self.powerup_manager.is_effect_active("freeze"):
                freeze_surface = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
                freeze_surface.fill((0, 255, 255, 40))
                temp_surface.blit(freeze_surface, (0, 0))
            
            # Draw shield effect indicator if active
            if self.powerup_manager.is_effect_active("shield"):
                shield_height = 6
                for i in range(3):
                    y_pos = WINDOW_HEIGHT - shield_height - (i * 2)
                    shield_rect = pygame.Rect(0, y_pos, WINDOW_WIDTH, 2)
                    pygame.draw.rect(temp_surface, (255, 0, 255), shield_rect)
            
            self.screen.blit(temp_surface, shake_offset)
        
        # Draw effects on top
        self.effects_manager.draw(self.screen)
        
        pygame.display.flip()
        
    def draw_difficulty_menu(self):
        """Draw retro difficulty selection menu"""
        # Create pixel font
        pixel_font_large = pygame.font.Font(None, 48)
        pixel_font_medium = pygame.font.Font(None, 32)
        pixel_font_small = pygame.font.Font(None, 24)
        
        # Title
        title_text = "SELECT DIFFICULTY"
        title_surface = pixel_font_large.render(title_text, False, (255, 255, 255))
        title_rect = title_surface.get_rect(center=(WINDOW_WIDTH//2, 80))
        self.screen.blit(title_surface, title_rect)
        
        # Retro border around title
        border_rect = pygame.Rect(title_rect.x - 10, title_rect.y - 5, title_rect.width + 20, title_rect.height + 10)
        pygame.draw.rect(self.screen, RETRO_ACCENT, border_rect, 2)
        
        # Difficulty options
        difficulties = [
            ("1. EASY", "SLOW WORDS, 5 LIVES", (0, 255, 0), 150),
            ("2. MEDIUM", "NORMAL SPEED, 3 LIVES", (255, 255, 0), 200),
            ("3. HARD", "FAST WORDS, 2 LIVES", (255, 100, 100), 250)
        ]
        
        for text, desc, color, y_pos in difficulties:
            # Main option text
            option_surface = pixel_font_medium.render(text, False, color)
            option_rect = option_surface.get_rect(center=(WINDOW_WIDTH//2, y_pos))
            self.screen.blit(option_surface, option_rect)
            
            # Description text
            desc_surface = pixel_font_small.render(desc, False, (200, 200, 200))
            desc_rect = desc_surface.get_rect(center=(WINDOW_WIDTH//2, y_pos + 25))
            self.screen.blit(desc_surface, desc_rect)
            
            # Retro selection box
            box_rect = pygame.Rect(option_rect.x - 15, option_rect.y - 5, option_rect.width + 30, 35)
            pygame.draw.rect(self.screen, color, box_rect, 1)

    def reset_game(self):
        self.selecting_difficulty = True
        self.game_state.reset()
        self.word_manager.clear_words()
        self.word_manager.reset_speed()
        self.powerup_manager.clear_powerups()
        self.effects_manager.clear_effects()
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
