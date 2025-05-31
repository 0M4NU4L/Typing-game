// Effects system for retro game
class PixelParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 4
    this.vy = Math.random() * -3 - 1
    this.color = color
    this.life = 40
    this.maxLife = 40
    this.size = Math.floor(Math.random() * 3) + 2
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += 0.1 // Gravity
    this.life--
    return this.life > 0
  }

  draw(ctx) {
    if (this.life > 0) {
      ctx.fillStyle = this.color
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size)
    }
  }
}

class RetroTextPopup {
  constructor(text, x, y, color) {
    this.text = text
    this.x = x
    this.y = y
    this.startY = y
    this.color = color
    this.life = 60
    this.maxLife = 60
  }

  update() {
    this.life--
    const pixelsMoved = Math.floor((this.maxLife - this.life) / 3)
    this.y = this.startY - pixelsMoved
    return this.life > 0
  }

  draw(ctx) {
    if (this.life > 0) {
      ctx.font = "12px monospace"
      ctx.textAlign = "center"

      // Draw border effect
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.strokeText(this.text, this.x, this.y)

      // Draw text
      ctx.fillStyle = this.color
      ctx.fillText(this.text, this.x, this.y)
    }
  }
}

class EffectsManager {
  constructor() {
    this.particles = []
    this.textPopups = []
    this.screenShake = 0
    this.shakeOffsetX = 0
    this.shakeOffsetY = 0
  }

  addPixelBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new PixelParticle(x, y, color))
    }
  }

  addTextPopup(text, x, y, color) {
    this.textPopups.push(new RetroTextPopup(text, x, y, color))
  }

  addScreenShake(intensity) {
    this.screenShake = Math.max(this.screenShake, intensity)
  }

  update() {
    // Update particles
    this.particles = this.particles.filter((particle) => particle.update())

    // Update text popups
    this.textPopups = this.textPopups.filter((popup) => popup.update())

    // Update screen shake
    if (this.screenShake > 0) {
      this.shakeOffsetX = this.screenShake > 3 ? (Math.random() - 0.5) * 4 : 0
      this.shakeOffsetY = this.screenShake > 3 ? (Math.random() - 0.5) * 4 : 0
      this.screenShake--
    } else {
      this.shakeOffsetX = 0
      this.shakeOffsetY = 0
    }
  }

  draw(ctx) {
    // Draw particles
    this.particles.forEach((particle) => particle.draw(ctx))

    // Draw text popups
    this.textPopups.forEach((popup) => popup.draw(ctx))
  }

  getScreenShakeOffset() {
    return { x: this.shakeOffsetX, y: this.shakeOffsetY }
  }

  clearEffects() {
    this.particles = []
    this.textPopups = []
    this.screenShake = 0
    this.shakeOffsetX = 0
    this.shakeOffsetY = 0
  }
}
