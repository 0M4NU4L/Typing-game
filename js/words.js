// Word list for the retro typing game
const WORD_LIST = [
  // Short easy words (3-5 letters)
  "cat",
  "dog",
  "run",
  "jump",
  "code",
  "game",
  "play",
  "win",
  "fun",
  "cool",
  "fast",
  "slow",
  "big",
  "small",
  "red",
  "blue",
  "green",
  "black",
  "white",
  "good",
  "bad",
  "new",
  "old",
  "hot",
  "cold",
  "yes",
  "no",
  "go",
  "stop",

  // Medium words (6-8 letters)
  "python",
  "coding",
  "gaming",
  "retro",
  "pixel",
  "arcade",
  "classic",
  "typing",
  "speed",
  "score",
  "level",
  "power",
  "shield",
  "freeze",
  "clear",
  "bonus",
  "combo",
  "chain",
  "blast",
  "burst",
  "flash",
  "quick",
  "rapid",
  "turbo",
  "boost",
  "super",
  "mega",
  "ultra",

  // Programming terms
  "function",
  "variable",
  "loop",
  "array",
  "string",
  "integer",
  "boolean",
  "object",
  "class",
  "method",
  "debug",
  "compile",
  "execute",
  "syntax",
  "algorithm",
  "database",
  "network",
  "server",
  "client",
  "browser",

  // Longer challenging words (9+ letters)
  "programming",
  "computer",
  "keyboard",
  "monitor",
  "processor",
  "memory",
  "graphics",
  "software",
  "hardware",
  "internet",
  "developer",
  "framework",
  "interface",
  "structure",
  "directory",
  "exception",
  "condition",
]

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    wordSpeed: 0.6,
    lives: 5,
    spawnDelay: 4000,
    wordLengthMax: 5,
    description: "BEGINNER FRIENDLY",
  },
  medium: {
    wordSpeed: 1.0,
    lives: 3,
    spawnDelay: 3000,
    wordLengthMax: 8,
    description: "BALANCED CHALLENGE",
  },
  hard: {
    wordSpeed: 1.5,
    lives: 2,
    spawnDelay: 2200,
    wordLengthMax: 12,
    description: "EXPERT MODE",
  },
}

class WordManager {
  constructor(difficulty = "medium") {
    this.words = []
    this.difficulty = difficulty
    this.settings = DIFFICULTY_SETTINGS[difficulty]
    this.currentSpeed = this.settings.wordSpeed
    this.filteredWords = this.filterWordsByDifficulty()
    this.lastSpawnTime = 0
  }

  filterWordsByDifficulty() {
    const maxLength = this.settings.wordLengthMax
    const filtered = WORD_LIST.filter((word) => word.length <= maxLength)
    return filtered.length >= 10 ? filtered : WORD_LIST.slice(0, 20)
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty
    this.settings = DIFFICULTY_SETTINGS[difficulty]
    this.currentSpeed = this.settings.wordSpeed
    this.filteredWords = this.filterWordsByDifficulty()
  }

  spawnWord() {
    const wordText = this.filteredWords[Math.floor(Math.random() * this.filteredWords.length)]
    const newWord = new RetroWord(wordText, this.currentSpeed)

    // Ensure words don't spawn too close to each other
    const minDistance = 80
    let attempts = 0
    const maxAttempts = 8

    while (attempts < maxAttempts) {
      let tooClose = false
      for (const existingWord of this.words) {
        if (existingWord.isActive && existingWord.y < 60) {
          const distance = Math.abs(newWord.x - existingWord.x)
          if (distance < minDistance) {
            tooClose = true
            break
          }
        }
      }

      if (!tooClose) break

      newWord.x = Math.random() * (640 - 100) + 30
      attempts++
    }

    this.words.push(newWord)
  }

  update() {
    // Update word positions and remove inactive words
    this.words = this.words.filter((word) => word.update() && word.isActive)
  }

  draw(ctx) {
    this.words.forEach((word) => {
      if (word.isActive) {
        word.draw(ctx)
      }
    })
  }

  checkWord(typedWord) {
    for (const word of this.words) {
      if (word.text.toLowerCase() === typedWord.toLowerCase() && word.isActive) {
        word.isActive = false
        return { match: true, position: { x: word.x + word.text.length * 6, y: word.y } }
      }
    }
    return { match: false, position: null }
  }

  increaseSpeed(factor) {
    this.currentSpeed *= factor
    this.currentSpeed = Math.min(this.currentSpeed, 3.0)
  }

  resetSpeed() {
    this.currentSpeed = this.settings.wordSpeed
  }

  getMissedWords() {
    const missed = this.words.filter((word) => word.y >= 450 && word.isActive)
    missed.forEach((word) => (word.isActive = false))
    return missed.length
  }

  clearWords() {
    this.words = []
  }
}

class RetroWord {
  constructor(text, speed) {
    this.text = text
    this.x = Math.random() * (640 - 100) + 30
    this.y = -20
    this.speed = speed
    this.isActive = true

    // Retro color coding based on difficulty
    if (text.length <= 4) {
      this.color = "#55ff55" // Green
      this.difficulty = "easy"
    } else if (text.length <= 7) {
      this.color = "#ffff55" // Yellow
      this.difficulty = "medium"
    } else {
      this.color = "#ff5555" // Red
      this.difficulty = "hard"
    }
  }

  update() {
    this.y += this.speed
    return this.y < 500
  }

  draw(ctx) {
    if (!this.isActive) return

    // Set font for retro look
    ctx.font = "16px monospace"
    ctx.textAlign = "left"

    // Measure text for background
    const textMetrics = ctx.measureText(this.text)
    const textWidth = textMetrics.width
    const textHeight = 16

    // Background box with padding
    const padding = 4
    const bgX = this.x - padding
    const bgY = this.y - textHeight - padding
    const bgWidth = textWidth + padding * 2
    const bgHeight = textHeight + padding * 2

    // Draw background
    ctx.fillStyle = "#282850"
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight)

    // Draw border
    ctx.strokeStyle = this.color
    ctx.lineWidth = 1
    ctx.strokeRect(bgX, bgY, bgWidth, bgHeight)

    // Draw text
    ctx.fillStyle = this.color
    ctx.fillText(this.text, this.x, this.y)
  }
}
