import pygame
import random
import math
from config import WINDOW_WIDTH, WINDOW_HEIGHT, PARTICLE_COUNT, SHAKE_DURATION, TEXT_POPUP_DURATION, RETRO_WHITE

class PixelParticle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.vx = random.uniform(-2, 2)
        self.vy = random.uniform(-3, -1)
        self.color = color
        self.life = 40
        self.max_life = 40
        self.size = random.choice([2, 3, 4])  # Pixel sizes
        
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.1  # Gravity
        self.life -= 1
        return self.life > 0
        
    def draw(self, screen):
        if self.life > 0:
            # Draw pixelated particle
            pixel_rect = pygame.Rect(int(self.x), int(self.y), self.size, self.size)
            pygame.draw.rect(screen, self.color, pixel_rect)

class RetroTextPopup:
    def __init__(self, text, x, y, color):
        self.text = text
        self.x = x
        self.y = y
        self.start_y = y
        self.color = color
        self.life = TEXT_POPUP_DURATION
        self.max_life = TEXT_POPUP_DURATION
        self.font = pygame.font.Font(None, 24)
        
    def update(self):
        self.life -= 1
        # Float upward in pixel steps
        pixels_moved = (TEXT_POPUP_DURATION - self.life) // 3
        self.y = self.start_y - pixels_moved
        return self.life > 0
        
    def draw(self, screen):
        if self.life > 0:
            text_surface = self.font.render(self.text, False, self.color)
            text_rect = text_surface.get_rect(center=(self.x, self.y))
            
            # Add retro border effect
            border_rect = pygame.Rect(text_rect.x - 2, text_rect.y - 2, text_rect.width + 4, text_rect.height + 4)
            pygame.draw.rect(screen, RETRO_WHITE, border_rect, 1)
            
            screen.blit(text_surface, text_rect)

class EffectsManager:
    def __init__(self):
        self.particles = []
        self.text_popups = []
        self.screen_shake = 0
        self.shake_offset_x = 0
        self.shake_offset_y = 0
        
    def add_pixel_burst(self, x, y, color, count=PARTICLE_COUNT):
        """Add a burst of pixel particles at the specified location"""
        for _ in range(count):
            self.particles.append(PixelParticle(x, y, color))
            
    def add_text_popup(self, text, x, y, color):
        """Add a retro floating text popup"""
        self.text_popups.append(RetroTextPopup(text, x, y, color))
        
    def add_screen_shake(self, intensity):
        """Add screen shake effect"""
        self.screen_shake = max(self.screen_shake, intensity)
        
    def update(self):
        # Update particles
        self.particles = [p for p in self.particles if p.update()]
        
        # Update text popups
        self.text_popups = [t for t in self.text_popups if t.update()]
        
        # Update screen shake in pixel increments
        if self.screen_shake > 0:
            self.shake_offset_x = random.choice([-2, -1, 0, 1, 2]) if self.screen_shake > 3 else 0
            self.shake_offset_y = random.choice([-2, -1, 0, 1, 2]) if self.screen_shake > 3 else 0
            self.screen_shake -= 1
        else:
            self.shake_offset_x = 0
            self.shake_offset_y = 0
            
    def draw(self, screen):
        # Draw particles
        for particle in self.particles:
            particle.draw(screen)
            
        # Draw text popups
        for popup in self.text_popups:
            popup.draw(screen)
            
    def get_screen_shake_offset(self):
        """Get the current screen shake offset"""
        return (self.shake_offset_x, self.shake_offset_y)
        
    def clear_effects(self):
        """Clear all effects"""
        self.particles.clear()
        self.text_popups.clear()
        self.screen_shake = 0
        self.shake_offset_x = 0
        self.shake_offset_y = 0
