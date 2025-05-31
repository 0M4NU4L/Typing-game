// Powerup system for retro game
class RetroPowerUp {
  constructor(type) {
    this.type = type
    this.x = Math.random() * (640 - 100) + 50
    this.y = -30
    this.speed = 0.8
    this.isActive = true
    this.size = 16

    // Retro colors and shapes
    this.colors = {
      freeze: "#55ffff",
      clear: "#ffff55",
      life: "#55ff55",
      shield: "#ff55ff",
    }

    this.shapes = {
      freeze: "diamond",
      clear: "star",
      life: "heart",
      shield: "square",
    }
  }

  update() {
    this.y += this.speed
    return this.y < 510
  }

  draw(ctx) {
    if (!this.isActive) return

    const color = this.colors[this.type]
    const shape = this.shapes[this.type]

    ctx.fillStyle = color
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2

    switch (shape) {
      case "diamond":
        // Diamond shape for freeze
        ctx.beginPath()
        ctx.moveTo(this.x, this.y - this.size)
        ctx.lineTo(this.x + this.size, this.y)
        ctx.lineTo(this.x, this.y + this.size)
        ctx.lineTo(this.x - this.size, this.y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break

      case "star":
        // Star shape for clear (simplified as plus)
        ctx.fillRect(this.x - this.size, this.y - 3, this.size * 2, 6)
        ctx.fillRect(this.x - 3, this.y - this.size, 6, this.size * 2)
        ctx.strokeRect(this.x - this.size, this.y - 3, this.size * 2, 6)
        ctx.strokeRect(this.x - 3, this.y - this.size, 6, this.size * 2)
        break

      case "heart":
        // Heart shape for life (simplified as circle)
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break

      case "square":
        // Square shape for shield
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
        ctx.strokeRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
        break
    }
  }

  isCollected(wordX, wordY) {
    const distance = Math.sqrt((this.x - wordX) ** 2 + (this.y - wordY) ** 2)
    return distance < this.size * 2
  }
}

class PowerUpManager {
  constructor() {
    this.powerups = []
    this.spawnChance = 0.01 // 1% chance per update
    this.activeEffects = {
      freeze: 0,
      shield: 0,
    }
  }

  update() {
    // Update existing powerups
    this.powerups = this.powerups.filter((powerup) => powerup.update() && powerup.isActive)

    // Update active effect timers
    for (const effect in this.activeEffects) {
      if (this.activeEffects[effect] > 0) {
        this.activeEffects[effect]--
      }
    }
  }

  draw(ctx) {
    // Draw powerups
    this.powerups.forEach((powerup) => powerup.draw(ctx))

    // Draw active effects panel
    if (Object.values(this.activeEffects).some((time) => time > 0)) {
      const panelWidth = 150
      const panelHeight = 60
      const panelX = 640 - panelWidth - 10
      const panelY = 150

      // Panel background
      ctx.fillStyle = "#282850"
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

      // Draw active effects
      let yOffset = 10
      for (const [effect, time] of Object.entries(this.activeEffects)) {
        if (time > 0) {
          const seconds = Math.floor(time / 60) + 1
          const effectText = `${effect.toUpperCase()}: ${seconds}S`

          const color = effect === "freeze" ? "#55ffff" : "#ff55ff"

          ctx.font = "8px monospace"
          ctx.fillStyle = color
          ctx.textAlign = "left"
          ctx.fillText(effectText, panelX + 5, panelY + yOffset + 8)

          // Progress bar
          const maxTime = effect === "freeze" ? 300 : 600
          const progress = time / maxTime
          const barWidth = 100
          const barHeight = 4
          const barX = panelX + 5
          const barY = panelY + yOffset + 15

          // Background
          ctx.fillStyle = "#323232"
          ctx.fillRect(barX, barY, barWidth, barHeight)

          // Progress
          ctx.fillStyle = color
          ctx.fillRect(barX, barY, barWidth * progress, barHeight)

          yOffset += 25
        }
      }
    }
  }

  trySpawn() {
    if (Math.random() < this.spawnChance && this.powerups.length < 2) {
      const types = ["freeze", "clear", "life", "shield"]
      const type = types[Math.floor(Math.random() * types.length)]
      this.powerups.push(new RetroPowerUp(type))
    }
  }

  checkCollection(wordX, wordY) {
    for (const powerup of this.powerups) {
      if (powerup.isActive && powerup.isCollected(wordX, wordY)) {
        powerup.isActive = false
        return powerup.type
      }
    }
    return null
  }

  activateEffect(effectType, duration = 300) {
    if (effectType in this.activeEffects) {
      this.activeEffects[effectType] = duration
    }
  }

  isEffectActive(effectType) {
    return this.activeEffects[effectType] > 0
  }

  clearPowerups() {
    this.powerups = []
    for (const effect in this.activeEffects) {
      this.activeEffects[effect] = 0
    }
  }
}
