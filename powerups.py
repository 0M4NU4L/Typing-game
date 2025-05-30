import random
import pygame
from config import (
    WINDOW_WIDTH, 
    WINDOW_HEIGHT,
    RETRO_CYAN,
    RETRO_YELLOW,
    RETRO_GREEN,
    RETRO_MAGENTA,
    RETRO_SURFACE,
    RETRO_WHITE
)

class RetroPowerUp:
    def __init__(self, type_name):
        self.type = type_name
        self.x = random.randint(50, WINDOW_WIDTH - 50)
        self.y = -30
        self.speed = 0.8
        self.is_active = True
        self.size = 16
        
        # Retro colors and simple geometric symbols
        self.colors = {
            "freeze": RETRO_CYAN,
            "clear": RETRO_YELLOW,
            "life": RETRO_GREEN,
            "shield": RETRO_MAGENTA
        }
        
        # Simple geometric shapes instead of emojis
        self.shapes = {
            "freeze": "diamond",
            "clear": "star",
            "life": "heart",
            "shield": "square"
        }
        
    def update(self):
        self.y += self.speed
        return self.y < WINDOW_HEIGHT + 30
        
    def draw(self, screen, font):
        if not self.is_active:
            return
            
        color = self.colors[self.type]
        shape = self.shapes[self.type]
        
        # Draw different retro shapes
        if shape == "diamond":
            # Diamond shape for freeze
            points = [
                (self.x, self.y - self.size),
                (self.x + self.size, self.y),
                (self.x, self.y + self.size),
                (self.x - self.size, self.y)
            ]
            pygame.draw.polygon(screen, color, points)
            pygame.draw.polygon(screen, RETRO_WHITE, points, 2)
            
        elif shape == "star":
            # Star shape for clear (simplified as plus)
            pygame.draw.rect(screen, color, (self.x - self.size, self.y - 3, self.size * 2, 6))
            pygame.draw.rect(screen, color, (self.x - 3, self.y - self.size, 6, self.size * 2))
            pygame.draw.rect(screen, RETRO_WHITE, (self.x - self.size, self.y - 3, self.size * 2, 6), 1)
            pygame.draw.rect(screen, RETRO_WHITE, (self.x - 3, self.y - self.size, 6, self.size * 2), 1)
            
        elif shape == "heart":
            # Heart shape for life (simplified as circle)
            pygame.draw.circle(screen, color, (int(self.x), int(self.y)), self.size)
            pygame.draw.circle(screen, RETRO_WHITE, (int(self.x), int(self.y)), self.size, 2)
            
        elif shape == "square":
            # Square shape for shield
            rect = pygame.Rect(self.x - self.size, self.y - self.size, self.size * 2, self.size * 2)
            pygame.draw.rect(screen, color, rect)
            pygame.draw.rect(screen, RETRO_WHITE, rect, 2)
        
    def is_collected(self, word_x, word_y):
        """Check if a typed word is close enough to collect this power-up"""
        distance = ((self.x - word_x) ** 2 + (self.y - word_y) ** 2) ** 0.5
        return distance < self.size * 2

class PowerUpManager:
    def __init__(self):
        self.powerups = []
        self.font = pygame.font.Font(None, 20)
        self.ui_font = pygame.font.Font(None, 16)
        self.spawn_chance = 0.01  # 1% chance per update
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
        # Draw powerups
        for powerup in self.powerups:
            powerup.draw(screen, self.font)
            
        # Draw retro active effects panel
        if any(time > 0 for time in self.active_effects.values()):
            panel_width = 150
            panel_height = 60
            panel_x = WINDOW_WIDTH - panel_width - 10
            panel_y = 150
            
            # Create effects panel
            panel_rect = pygame.Rect(panel_x, panel_y, panel_width, panel_height)
            pygame.draw.rect(screen, RETRO_SURFACE, panel_rect)
            pygame.draw.rect(screen, RETRO_WHITE, panel_rect, 1)
            
            # Draw active effects
            y_offset = 10
            for effect, time in self.active_effects.items():
                if time > 0:
                    seconds = time // 60 + 1
                    effect_text = f"{effect.upper()}: {seconds}S"
                    
                    color = RETRO_CYAN if effect == "freeze" else RETRO_MAGENTA
                    
                    text_surface = self.ui_font.render(effect_text, False, color)
                    screen.blit(text_surface, (panel_x + 5, panel_y + y_offset))
                    
                    # Simple progress bar
                    max_time = 300 if effect == "freeze" else 600
                    progress = time / max_time
                    bar_width = 100
                    bar_height = 4
                    bar_x = panel_x + 5
                    bar_y = panel_y + y_offset + 15
                    
                    # Background
                    pygame.draw.rect(screen, (50, 50, 50), (bar_x, bar_y, bar_width, bar_height))
                    # Progress
                    pygame.draw.rect(screen, color, (bar_x, bar_y, int(bar_width * progress), bar_height))
                    
                    y_offset += 25
                    
    def try_spawn(self):
        """Try to spawn a new powerup based on chance"""
        if random.random() < self.spawn_chance and len(self.powerups) < 2:
            powerup_type = random.choice(["freeze", "clear", "life", "shield"])
            self.powerups.append(RetroPowerUp(powerup_type))
            
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
        self.active_effects = {key: 0 for key in self.active_effects}
