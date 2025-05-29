"""
Power-ups for the typing game
"""
import random
import pygame
from config import WINDOW_WIDTH, WINDOW_HEIGHT

class PowerUp:
    def __init__(self, type_name):
        self.type = type_name
        self.x = random.randint(50, WINDOW_WIDTH - 50)
        self.y = 0
        self.speed = 1.5
        self.is_active = True
        self.size = 30
        self.colors = {
            "freeze": (0, 191, 255),    # Deep Sky Blue
            "clear": (255, 215, 0),     # Gold
            "life": (50, 205, 50),      # Lime Green
            "shield": (138, 43, 226)    # Blue Violet
        }
        self.symbols = {
            "freeze": "❄",
            "clear": "✨",
            "life": "❤",
            "shield": "🛡"
        }
        
    def update(self):
        self.y += self.speed
        return self.y < WINDOW_HEIGHT
        
    def draw(self, screen, font):
        # Draw circle background
        pygame.draw.circle(screen, self.colors[self.type], (self.x, self.y), self.size)
        
        # Draw symbol
        symbol = font.render(self.symbols[self.type], True, (255, 255, 255))
        symbol_rect = symbol.get_rect(center=(self.x, self.y))
        screen.blit(symbol, symbol_rect)
        
    def is_collected(self, word_x, word_y):
        """Check if a typed word is close enough to collect this power-up"""
        distance = ((self.x - word_x) ** 2 + (self.y - word_y) ** 2) ** 0.5
        return distance < self.size * 2  # Collection radius is twice the size

class PowerUpManager:
    def __init__(self):
        self.powerups = []
        self.font = pygame.font.Font(None, 30)
        self.spawn_chance = 0.02  # 2% chance per update
        self.active_effects = {
            "freeze": 0,
            "shield": 0
        }
        
    def update(self):
        # Update existing powerups
        self.powerups = [p for p in self.powerups if p.update() and p.is_active]
        
        # Update active effect timers
        for effect in list(self.active_effects.keys()):
            if self.active_effects[effect] > 0:
                self.active_effects[effect] -= 1
                
    def draw(self, screen):
        for powerup in self.powerups:
            powerup.draw(screen, self.font)
            
        # Draw active effects indicators
        y_pos = 170
        for effect, time in self.active_effects.items():
            if time > 0:
                effect_text = self.font.render(f"{effect.capitalize()}: {time//60+1}s", True, (255, 255, 255))
                screen.blit(effect_text, (10, y_pos))
                y_pos += 30
                
    def try_spawn(self):
        """Try to spawn a new powerup based on chance"""
        if random.random() < self.spawn_chance:
            powerup_type = random.choice(["freeze", "clear", "life", "shield"])
            self.powerups.append(PowerUp(powerup_type))
            
    def check_collection(self, word_x, word_y):
        """Check if any powerup is collected by a correctly typed word"""
        for powerup in self.powerups:
            if powerup.is_active and powerup.is_collected(word_x, word_y):
                powerup.is_active = False
                return powerup.type
        return None
        
    def activate_effect(self, effect_type, duration=300):
        """Activate a powerup effect"""
        if effect_type in self.active_effects:
            self.active_effects[effect_type] = duration
            
    def is_effect_active(self, effect_type):
        """Check if an effect is currently active"""
        return self.active_effects.get(effect_type, 0) > 0
        
    def clear_powerups(self):
        """Clear all powerups from screen"""
        self.powerups.clear()