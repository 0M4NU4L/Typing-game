import random
import pygame
from words import WORD_LIST
from config import (
    WINDOW_WIDTH, 
    WINDOW_HEIGHT, 
    FONT_SIZE, 
    RETRO_WHITE,
    RETRO_GREEN,
    RETRO_YELLOW,
    RETRO_RED,
    RETRO_SURFACE,
    RETRO_CYAN
)

class RetroWord:
    def __init__(self, text, speed):
        self.text = text
        self.x = random.randint(30, WINDOW_WIDTH - 100)
        self.y = -20
        self.speed = speed
        self.is_active = True
        
        # Retro color coding based on difficulty
        if len(text) <= 4:
            self.color = RETRO_GREEN
            self.difficulty = "easy"
        elif len(text) <= 7:
            self.color = RETRO_YELLOW
            self.difficulty = "medium"
        else:
            self.color = RETRO_RED
            self.difficulty = "hard"

    def update(self):
        self.y += self.speed
        return self.y < WINDOW_HEIGHT + 20

    def draw(self, screen, font):
        if not self.is_active:
            return
            
        # Create retro word box
        text_surface = font.render(self.text, False, self.color)
        text_rect = text_surface.get_rect()
        
        # Background box with padding
        bg_padding = 4
        bg_width = text_rect.width + bg_padding * 2
        bg_height = text_rect.height + bg_padding * 2
        
        bg_x = self.x - bg_padding
        bg_y = self.y - bg_padding
        
        # Draw background
        bg_rect = pygame.Rect(bg_x, bg_y, bg_width, bg_height)
        pygame.draw.rect(screen, RETRO_SURFACE, bg_rect)
        pygame.draw.rect(screen, self.color, bg_rect, 1)
        
        # Draw text
        screen.blit(text_surface, (self.x, self.y))

class WordManager:
    def __init__(self, difficulty_manager):
        self.words = []
        self.font = pygame.font.Font(None, FONT_SIZE)
        self.difficulty_manager = difficulty_manager
        self.current_speed = self.difficulty_manager.get_word_speed()
        self.filtered_words = self.difficulty_manager.filter_words_by_difficulty(WORD_LIST)

    def spawn_word(self):
        """Spawn a new retro word"""
        word_text = random.choice(self.filtered_words)
        new_word = RetroWord(word_text, self.current_speed)
        
        # Ensure words don't spawn too close to each other
        min_distance = 80
        max_attempts = 8
        attempts = 0
        
        while attempts < max_attempts:
            too_close = False
            for existing_word in self.words:
                if existing_word.is_active and existing_word.y < 60:
                    distance = abs(new_word.x - existing_word.x)
                    if distance < min_distance:
                        too_close = True
                        break
            
            if not too_close:
                break
                
            new_word.x = random.randint(30, WINDOW_WIDTH - 100)
            attempts += 1
        
        self.words.append(new_word)

    def update_words(self):
        """Update word positions and remove inactive words"""
        self.words = [word for word in self.words if word.update() and word.is_active]

    def draw_words(self, screen):
        """Draw all active words with retro styling"""
        for word in self.words:
            if word.is_active:
                word.draw(screen, self.font)

    def check_word(self, typed_word):
        """Check if typed word matches any falling word"""
        for word in self.words:
            if word.text.lower() == typed_word.lower() and word.is_active:
                word.is_active = False
                return True, (word.x + len(word.text) * 6, word.y)
        return False, None

    def increase_speed(self, factor):
        """Increase word falling speed"""
        self.current_speed *= factor
        # Cap maximum speed for playability
        self.current_speed = min(self.current_speed, 3.0)

    def reset_speed(self):
        """Reset speed to initial value"""
        self.current_speed = self.difficulty_manager.get_word_speed()
        self.filtered_words = self.difficulty_manager.filter_words_by_difficulty(WORD_LIST)

    def get_missed_words(self):
        """Get count of words that reached the bottom"""
        missed = [word for word in self.words if word.y >= WINDOW_HEIGHT - 30 and word.is_active]
        for word in missed:
            word.is_active = False
        return len(missed)

    def clear_words(self):
        """Clear all words from screen"""
        self.words.clear()
