// Main game logic for Retro Typer
class RetroTyperGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.input = document.getElementById("gameInput")

    // Game state
    this.gameState = "difficulty" // difficulty, playing, gameOver
    this.difficulty = "medium"
    this.score = 0
    this.lives = 3
    this.level = 1
    this.wordsUntilLevelUp = 5
    this.currentInput = ""
    this.startTime = Date.now()
    this.totalCharsTyped = 0
    this.correctWords = 0

    // Game managers
    this.wordManager = new WordManager(this.difficulty)
    this.effectsManager = new EffectsManager()
    this.powerupManager = new PowerUpManager()

    // Timing
    this.lastSpawnTime = 0
    this.lastUpdateTime = 0

    // Audio
    this.sounds = {
      type: document.getElementById("typeSound"),
      correct: document.getElementById("correctSound"),
      wrong: document.getElementById("wrongSound"),
    }

    this.setupEventListeners()
    this.createRetroBackground()
    this.gameLoop()
  }

  setupEventListeners() {
    // Keyboard input
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))

    // Input field
    this.input.addEventListener("input", (e) => this.handleInput(e))
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        this.submitWord()
      }
    })

    // Focus management
    document.addEventListener("click", () => {
      if (this.gameState === "playing") {
        this.input.focus()
      }
    })
  }

  createRetroBackground() {
    // Create background with grid pattern
    this.backgroundCanvas = document.createElement("canvas")
    this.backgroundCanvas.width = 640
    this.backgroundCanvas.height = 480
    const bgCtx = this.backgroundCanvas.getContext("2d")

    // Fill background
    bgCtx.fillStyle = "#141428"
    bgCtx.fillRect(0, 0, 640, 480)

    // Add grid pattern
    bgCtx.strokeStyle = "#1a1a32"
    bgCtx.lineWidth = 1

    for (let x = 0; x < 640; x += 20) {
      bgCtx.beginPath()
      bgCtx.moveTo(x, 0)
      bgCtx.lineTo(x, 480)
      bgCtx.stroke()
    }

    for (let y = 0; y < 480; y += 20) {
      bgCtx.beginPath()
      bgCtx.moveTo(0, y)
      bgCtx.lineTo(640, y)
      bgCtx.stroke()
    }

    // Add scanlines
    for (let y = 0; y < 480; y += 4) {
      bgCtx.strokeStyle = "#0f0f1f"
      bgCtx.beginPath()
      bgCtx.moveTo(0, y)
      bgCtx.lineTo(640, y)
      bgCtx.stroke()
    }
  }

  handleKeyDown(e) {
    if (this.gameState === "difficulty") {
      if (e.key === "1") {
        this.setDifficulty("easy")
      } else if (e.key === "2") {
        this.setDifficulty("medium")
      } else if (e.key === "3") {
        this.setDifficulty("hard")
      }
    } else if (this.gameState === "gameOver") {
      this.resetGame()
    }
  }

  handleInput(e) {
    if (this.gameState === "playing") {
      this.currentInput = e.target.value
      this.totalCharsTyped++
      this.playSound("type")
    }
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty
    this.wordManager.setDifficulty(difficulty)
    this.lives = DIFFICULTY_SETTINGS[difficulty].lives
    this.gameState = "playing"
    this.startTime = Date.now()
    this.input.focus()

    this.effectsManager.addTextPopup(
      `${difficulty.toUpperCase()} MODE!`,
      320,
      240,
      difficulty === "easy" ? "#55ff55" : difficulty === "medium" ? "#ffff55" : "#ff5555",
    )
  }

  submitWord() {
    if (!this.currentInput.trim()) return

    const result = this.wordManager.checkWord(this.currentInput.trim())

    if (result.match) {
      this.playSound("correct")

      // Add success effect
      if (result.position) {
        this.effectsManager.addPixelBurst(result.position.x, result.position.y, "#55ff55")
        this.effectsManager.addTextPopup("+1", result.position.x, result.position.y, "#55ff55")
      }

      // Update score
      const speedFactor = this.updateScore()
      if (speedFactor > 1.0) {
        this.effectsManager.addTextPopup(`LEVEL ${this.level}!`, 320, 160, "#55ffff")
      }

      this.correctWords++
      this.wordManager.increaseSpeed(speedFactor)

      // Check for powerup collection
      if (result.position) {
        const collected = this.powerupManager.checkCollection(result.position.x, result.position.y)
        if (collected) {
          this.effectsManager.addPixelBurst(result.position.x, result.position.y, "#ffff55")

          switch (collected) {
            case "freeze":
              this.powerupManager.activateEffect("freeze", 300)
              this.effectsManager.addTextPopup("FREEZE!", result.position.x, result.position.y, "#55ffff")
              break
            case "clear":
              this.wordManager.clearWords()
              this.effectsManager.addTextPopup("CLEAR!", result.position.x, result.position.y, "#ffff55")
              break
            case "life":
              this.lives++
              this.effectsManager.addTextPopup("+LIFE!", result.position.x, result.position.y, "#55ff55")
              break
            case "shield":
              this.powerupManager.activateEffect("shield", 600)
              this.effectsManager.addTextPopup("SHIELD!", result.position.x, result.position.y, "#ff55ff")
              break
          }
        }
      }
    } else {
      this.playSound("wrong")
      this.effectsManager.addScreenShake(5)
      this.effectsManager.addTextPopup("MISS!", 320, 240, "#ff5555")
    }

    this.currentInput = ""
    this.input.value = ""
  }

  updateScore() {
    this.score++
    this.wordsUntilLevelUp--

    if (this.wordsUntilLevelUp <= 0) {
      this.level++
      this.wordsUntilLevelUp = 5
      return 1.1 // Speed increase factor
    }
    return 1.0
  }

  calculateWPM() {
    const elapsedMinutes = Math.max(1, (Date.now() - this.startTime) / 60000)
    return Math.floor(this.totalCharsTyped / 5 / elapsedMinutes)
  }

  calculateAccuracy() {
    if (this.totalCharsTyped > 0) {
      return Math.min(100, Math.floor(((this.correctWords * 5) / Math.max(1, this.totalCharsTyped)) * 100))
    }
    return 0
  }

  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0
      this.sounds[soundName].play().catch(() => {}) // Ignore audio errors
    }
  }

  update() {
    const currentTime = Date.now()

    if (this.gameState === "playing") {
      // Update managers
      this.powerupManager.update()
      this.powerupManager.trySpawn()
      this.effectsManager.update()

      // Spawn and update words (unless frozen)
      if (!this.powerupManager.isEffectActive("freeze")) {
        const spawnDelay = this.wordManager.settings.spawnDelay
        if (currentTime - this.lastSpawnTime > spawnDelay) {
          this.wordManager.spawnWord()
          this.lastSpawnTime = currentTime
        }

        this.wordManager.update()
      }

      // Check for missed words
      const missedWords = this.wordManager.getMissedWords()
      if (missedWords > 0 && !this.powerupManager.isEffectActive("shield")) {
        for (let i = 0; i < missedWords; i++) {
          this.lives--
          this.effectsManager.addScreenShake(8)
          this.effectsManager.addTextPopup("-LIFE!", 320, 120, "#ff5555")

          if (this.lives <= 0) {
            this.gameState = "gameOver"
            break
          }
        }
      }
    } else {
      this.effectsManager.update()
    }
  }

  draw() {
    // Apply screen shake
    const shakeOffset = this.effectsManager.getScreenShakeOffset()
    this.ctx.save()
    this.ctx.translate(shakeOffset.x, shakeOffset.y)

    // Draw background
    this.ctx.drawImage(this.backgroundCanvas, 0, 0)

    if (this.gameState === "difficulty") {
      this.drawDifficultyMenu()
    } else if (this.gameState === "playing") {
      this.drawGame()
    } else if (this.gameState === "gameOver") {
      this.drawGameOver()
    }

    // Draw effects on top
    this.effectsManager.draw(this.ctx)

    this.ctx.restore()
  }

  drawDifficultyMenu() {
    // Title
    this.ctx.font = "24px monospace"
    this.ctx.textAlign = "center"
    this.ctx.fillStyle = "#ffffff"
    this.ctx.fillText("SELECT DIFFICULTY", 320, 80)

    // Border around title
    this.ctx.strokeStyle = "#55ffff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(160, 55, 320, 35)

    // Difficulty options
    const difficulties = [
      { key: "1. EASY", desc: "SLOW WORDS, 5 LIVES", color: "#55ff55", y: 150 },
      { key: "2. MEDIUM", desc: "NORMAL SPEED, 3 LIVES", color: "#ffff55", y: 200 },
      { key: "3. HARD", desc: "FAST WORDS, 2 LIVES", color: "#ff5555", y: 250 },
    ]

    difficulties.forEach((diff) => {
      // Main option
      this.ctx.font = "16px monospace"
      this.ctx.fillStyle = diff.color
      this.ctx.fillText(diff.key, 320, diff.y)

      // Description
      this.ctx.font = "12px monospace"
      this.ctx.fillStyle = "#cccccc"
      this.ctx.fillText(diff.desc, 320, diff.y + 20)

      // Selection box
      this.ctx.strokeStyle = diff.color
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(200, diff.y - 20, 240, 35)
    })
  }

  drawGame() {
    // Draw game elements
    this.wordManager.draw(this.ctx)
    this.powerupManager.draw(this.ctx)
    this.drawUI()

    // Draw freeze effect
    if (this.powerupManager.isEffectActive("freeze")) {
      this.ctx.fillStyle = "rgba(85, 255, 255, 0.1)"
      this.ctx.fillRect(0, 0, 640, 480)
    }

    // Draw shield effect
    if (this.powerupManager.isEffectActive("shield")) {
      for (let i = 0; i < 3; i++) {
        const y = 474 - i * 2
        this.ctx.fillStyle = "#ff55ff"
        this.ctx.fillRect(0, y, 640, 2)
      }
    }
  }

  drawUI() {
    // UI Panel
    this.ctx.fillStyle = "#282850"
    this.ctx.fillRect(10, 10, 200, 120)
    this.ctx.strokeStyle = "#55ffff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(10, 10, 200, 120)

    // UI Text
    this.ctx.font = "12px monospace"
    this.ctx.textAlign = "left"

    const uiElements = [
      [`SCORE: ${this.score}`, 20, 30, "#ffffff"],
      [`LIVES: ${this.lives}`, 20, 45, this.lives <= 1 ? "#ff5555" : "#ffffff"],
      [`LEVEL: ${this.level}`, 20, 60, "#55ffff"],
      [`WPM: ${this.calculateWPM()}`, 20, 75, "#55ff55"],
      [`ACC: ${this.calculateAccuracy()}%`, 20, 90, "#ffff55"],
      [`MODE: ${this.difficulty.toUpperCase()}`, 20, 105, "#ffffff"],
    ]

    uiElements.forEach(([text, x, y, color]) => {
      this.ctx.fillStyle = color
      this.ctx.fillText(text, x, y)
    })

    // Progress bar
    const progressWidth = 100
    const progressHeight = 8
    const progressX = 530
    const progressY = 20

    // Background
    this.ctx.fillStyle = "#282850"
    this.ctx.fillRect(progressX, progressY, progressWidth, progressHeight)
    this.ctx.strokeStyle = "#ffffff"
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(progressX, progressY, progressWidth, progressHeight)

    // Progress fill
    const progress = (5 - this.wordsUntilLevelUp) / 5
    const fillWidth = progressWidth * progress
    if (fillWidth > 0) {
      this.ctx.fillStyle = "#55ffff"
      this.ctx.fillRect(progressX, progressY, fillWidth, progressHeight)
    }

    // Progress text
    this.ctx.font = "10px monospace"
    this.ctx.fillStyle = "#ffffff"
    this.ctx.textAlign = "left"
    this.ctx.fillText(`PROGRESS: ${5 - this.wordsUntilLevelUp}/5`, progressX, progressY + 20)
  }

  drawGameOver() {
    // Title
    this.ctx.font = "32px monospace"
    this.ctx.textAlign = "center"
    this.ctx.fillStyle = "#ff5555"
    this.ctx.fillText("GAME OVER", 320, 100)

    // Border
    this.ctx.strokeStyle = "#ff5555"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(160, 70, 320, 40)

    // Stats
    this.ctx.font = "16px monospace"
    this.ctx.fillStyle = "#ffffff"

    const stats = [
      `FINAL SCORE: ${this.score}`,
      `TYPING SPEED: ${this.calculateWPM()} WPM`,
      `ACCURACY: ${this.calculateAccuracy()}%`,
      `LEVEL REACHED: ${this.level}`,
    ]

    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 320, 160 + index * 30)
    })

    // Prompt
    this.ctx.font = "12px monospace"
    this.ctx.fillStyle = "#55ffff"
    this.ctx.fillText("PRESS ANY KEY TO PLAY AGAIN", 320, 320)
  }

  resetGame() {
    this.gameState = "difficulty"
    this.score = 0
    this.lives = 3
    this.level = 1
    this.wordsUntilLevelUp = 5
    this.currentInput = ""
    this.startTime = Date.now()
    this.totalCharsTyped = 0
    this.correctWords = 0

    this.wordManager.clearWords()
    this.wordManager.resetSpeed()
    this.powerupManager.clearPowerups()
    this.effectsManager.clearEffects()

    this.input.value = ""
    this.lastSpawnTime = Date.now()
  }

  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

// Start the game when page loads
window.addEventListener("load", () => {
  new RetroTyperGame()
})
