"""
Difficulty settings for the typing game
"""

# Difficulty presets
DIFFICULTY_SETTINGS = {
    "easy": {
        "word_speed": 0.7,
        "lives": 5,
        "spawn_delay": 4000,
        "word_length_max": 6
    },
    "medium": {
        "word_speed": 1.0,
        "lives": 3,
        "spawn_delay": 3000,
        "word_length_max": 10
    },
    "hard": {
        "word_speed": 1.5,
        "lives": 2,
        "spawn_delay": 2000,
        "word_length_max": 15
    }
}

class DifficultyManager:
    def __init__(self):
        self.current_difficulty = "medium"
        self.settings = DIFFICULTY_SETTINGS[self.current_difficulty].copy()
    
    def set_difficulty(self, difficulty):
        """Set the game difficulty to easy, medium, or hard"""
        if difficulty in DIFFICULTY_SETTINGS:
            self.current_difficulty = difficulty
            self.settings = DIFFICULTY_SETTINGS[difficulty].copy()
            return True
        return False
    
    def get_settings(self):
        """Get the current difficulty settings"""
        return self.settings
    
    def get_word_speed(self):
        """Get the current word speed"""
        return self.settings["word_speed"]
    
    def get_lives(self):
        """Get the number of lives for the current difficulty"""
        return self.settings["lives"]
    
    def get_spawn_delay(self):
        """Get the word spawn delay for the current difficulty"""
        return self.settings["spawn_delay"]
    
    def filter_words_by_difficulty(self, word_list):
        """Filter words based on the current difficulty"""
        max_length = self.settings["word_length_max"]
        return [word for word in word_list if len(word) <= max_length]