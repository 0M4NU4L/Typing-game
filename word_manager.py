import random
import pygame
from words import WORD_LIST
from config import WINDOW_WIDTH, WINDOW_HEIGHT, FONT_SIZE

class Word:
    def __init__(self, text, speed):
        self.text = text
        self.x = random.randint(0, WINDOW_WIDTH - 100)  # Ensure word stays within screen
        self.y = 0
        self.speed = speed
        self.is_active = True
        # Determine word color based on length (difficulty indicator)
        if len(text) <= 5:
            self.color = (0, 255, 0)  # Green for easy words
        elif len(text) <= 8:
            self.color = (255, 255, 0)  # Yellow for medium words
        else:
            self.color = (255, 165, 0)  # Orange for hard words

    def update(self):
        self.y += self.speed
        return self.y < WINDOW_HEIGHT

    def draw(self, screen, font):
        text_surface = font.render(self.text, True, self.color)
        screen.blit(text_surface, (self.x, self.y))

class WordManager:
    def __init__(self, difficulty_manager):
        self.words = []
        self.font = pygame.font.Font(None, FONT_SIZE)
        self.last_spawn_time = 0
        self.difficulty_manager = difficulty_manager
        self.current_speed = self.difficulty_manager.get_word_speed()
        self.filtered_words = self.difficulty_manager.filter_words_by_difficulty(WORD_LIST)

    def spawn_word(self):
        # Use filtered word list based on current difficulty
        word = random.choice(self.filtered_words)
        self.words.append(Word(word, self.current_speed))

    def update_words(self):
        # Update positions and remove words that are off screen
        self.words = [word for word in self.words if word.update() and word.is_active]

    def draw_words(self, screen):
        for word in self.words:
            word.draw(screen, self.font)
            
        # Draw danger zone at bottom of screen
        danger_height = 30
        danger_rect = pygame.Rect(0, WINDOW_HEIGHT - danger_height, WINDOW_WIDTH, danger_height)
        pygame.draw.rect(screen, (255, 0, 0, 128), danger_rect, 2)

    def check_word(self, typed_word):
        for word in self.words:
            if word.text == typed_word and word.is_active:
                word.is_active = False
                return True, (word.x, word.y)
        return False, None

    def increase_speed(self, factor):
        self.current_speed *= factor

    def reset_speed(self):
        self.current_speed = self.difficulty_manager.get_word_speed()
        self.filtered_words = self.difficulty_manager.filter_words_by_difficulty(WORD_LIST)

    def get_missed_words(self):
        missed = [word for word in self.words if word.y >= WINDOW_HEIGHT and word.is_active]
        for word in missed:
            word.is_active = False
        return len(missed)

    def clear_words(self):
        self.words.clear()