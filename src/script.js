import { Engine, Instance } from 'cooljs'
import GameUtils from './utils.js'
import * as constant from './config.js'

/**
 * Background Renderer - Handles background image and gradient rendering
 */
class BackgroundRenderer {
  constructor (engine) {
    this.engine = engine
  }
  /**
   * Renders the background image with scrolling effect
   */
  renderImage () {
    const bg = this.engine.getImg('background')
    const bgWidth = bg.width
    const bgHeight = bg.height
    const zoomedHeight = (bgHeight * this.engine.width) / bgWidth
    let offsetHeight = this.engine.getVariable(
      constant.bgImgOffset,
      this.engine.height - zoomedHeight
    )

    if (offsetHeight > this.engine.height) {
      return
    }

    this.engine.getTimeMovement(
      constant.moveDownMovement,
      [
        [
          offsetHeight,
          offsetHeight +
            GameUtils.getMoveDownValue(this.engine, {
              pixelsPerFrame: s => s / 2
            })
        ]
      ],
      value => (offsetHeight = value),
      { name: 'background' }
    )

    this.engine.getTimeMovement(
      constant.bgInitMovement,
      [[offsetHeight, offsetHeight + zoomedHeight / 4]],
      value => (offsetHeight = value)
    )

    this.engine.setVariable(constant.bgImgOffset, offsetHeight)
    this.engine.setVariable(
      constant.lineInitialOffset,
      this.engine.height - zoomedHeight * 0.394
    )

    this.engine.ctx.drawImage(
      bg,
      0,
      offsetHeight,
      this.engine.width,
      zoomedHeight
    )
  }

  /**
   * Calculates linear gradient color RGB values
   */
  getLinearGradientColorRgb (colorArr, colorIndex, proportion) {
    const currentIndex =
      colorIndex + 1 >= colorArr.length ? colorArr.length - 1 : colorIndex
    const colorCurrent = colorArr[currentIndex]
    const nextIndex =
      currentIndex + 1 >= colorArr.length - 1 ? currentIndex : currentIndex + 1
    const colorNext = colorArr[nextIndex]

    const calRgbValue = index => {
      const current = colorCurrent[index]
      const next = colorNext[index]
      return Math.round(current + (next - current) * proportion)
    }

    return `rgb(${calRgbValue(0)}, ${calRgbValue(1)}, ${calRgbValue(2)})`
  }

  /**
   * Renders the background linear gradient
   */
  renderLinearGradient () {
    const grad = this.engine.ctx.createLinearGradient(
      0,
      0,
      0,
      this.engine.height
    )
    const colorArr = [
      [200, 255, 150],
      [105, 230, 240],
      [90, 190, 240],
      [85, 100, 190],
      [55, 20, 35],
      [75, 25, 35],
      [25, 0, 10]
    ]

    const offsetHeight = this.engine.getVariable(
      constant.bgLinearGradientOffset,
      0
    )
    if (GameUtils.checkMoveDown(this.engine)) {
      this.engine.setVariable(
        constant.bgLinearGradientOffset,
        offsetHeight + GameUtils.getMoveDownValue(this.engine) * 1.5
      )
    }

    const colorIndex = parseInt(offsetHeight / this.engine.height, 10)
    const calOffsetHeight = offsetHeight % this.engine.height
    const proportion = calOffsetHeight / this.engine.height
    const colorBase = this.getLinearGradientColorRgb(
      colorArr,
      colorIndex,
      proportion
    )
    const colorTop = this.getLinearGradientColorRgb(
      colorArr,
      colorIndex + 1,
      proportion
    )

    grad.addColorStop(0, colorTop)
    grad.addColorStop(1, colorBase)
    this.engine.ctx.fillStyle = grad
    this.engine.ctx.beginPath()
    this.engine.ctx.rect(0, 0, this.engine.width, this.engine.height)
    this.engine.ctx.fill()

    // Lightning effect
    const lightning = () => {
      this.engine.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      this.engine.ctx.fillRect(0, 0, this.engine.width, this.engine.height)
    }

    this.engine.getTimeMovement(constant.lightningMovement, [], () => {}, {
      before: lightning,
      after: lightning
    })
  }

  /**
   * Main render method
   */
  render () {
    this.renderLinearGradient()
    this.renderImage()
  }
}

/**
 * Line Component - Handles the line/platform where blocks land
 */
class LineComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Action handler for line instance
   */
  action (instance, engine, time) {
    if (!instance.ready) {
      instance.y = engine.getVariable(constant.lineInitialOffset)
      instance.ready = true
      instance.collisionX =
        engine.width - engine.getVariable(constant.blockWidth)
    }

    engine.getTimeMovement(
      constant.moveDownMovement,
      [
        [
          instance.y,
          instance.y +
            GameUtils.getMoveDownValue(engine, { pixelsPerFrame: s => s / 2 })
        ]
      ],
      value => (instance.y = value),
      { name: 'line' }
    )

    const landBlockVelocity = GameUtils.getLandBlockVelocity(engine, time)
    instance.x += landBlockVelocity
    instance.collisionX += landBlockVelocity
  }

  /**
   * Painter for line (debug mode only)
   */
  painter (instance, engine) {
    const { ctx, debug } = engine
    if (!debug) return

    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = 'red'
    ctx.moveTo(instance.x, instance.y)
    ctx.lineTo(instance.collisionX, instance.y)
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }
}

/**
 * Cloud Component - Handles cloud/stones in the background
 */
class CloudComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Randomly selects cloud or stone image
   */
  randomCloudImg (instance) {
    const { count } = instance
    const clouds = ['c1', 'c2', 'c3']
    const stones = ['c4', 'c5', 'c6', 'c7', 'c8']
    const randomImg = array => array[Math.floor(Math.random() * array.length)]
    instance.imgName = count > 6 ? randomImg(stones) : randomImg(clouds)
  }

  /**
   * Action handler for cloud instance
   */
  action (instance, engine) {
    if (!instance.ready) {
      instance.ready = true
      this.randomCloudImg(instance)
      instance.width = engine.getVariable(constant.cloudSize)
      instance.height = engine.getVariable(constant.cloudSize)

      const engineW = engine.width
      const engineH = engine.height
      const positionArr = [
        { x: engineW * 0.1, y: -engineH * 0.66 },
        { x: engineW * 0.65, y: -engineH * 0.33 },
        { x: engineW * 0.1, y: 0 },
        { x: engineW * 0.65, y: engineH * 0.33 }
      ]

      const position = positionArr[instance.index - 1]
      instance.x = engine.utils.random(position.x, position.x * 1.2)
      instance.originX = instance.x
      instance.ax = engine.pixelsPerFrame(
        instance.width *
          engine.utils.random(0.05, 0.08) *
          engine.utils.randomPositiveNegative()
      )
      instance.y = engine.utils.random(position.y, position.y * 1.2)
    }

    instance.x += instance.ax
    if (
      instance.x >= instance.originX + instance.width ||
      instance.x <= instance.originX - instance.width
    ) {
      instance.ax *= -1
    }

    if (GameUtils.checkMoveDown(engine)) {
      instance.y += GameUtils.getMoveDownValue(engine) * 1.2
    }

    if (instance.y >= engine.height) {
      instance.y = -engine.height * 0.66
      instance.count += 4
      this.randomCloudImg(instance)
    }
  }

  /**
   * Painter for cloud instance
   */
  painter (instance, engine) {
    const { ctx } = engine
    const cloud = engine.getImg(instance.imgName)
    ctx.drawImage(
      cloud,
      instance.x,
      instance.y,
      instance.width,
      instance.height
    )
  }
}

/**
 * Hook Component - Handles the hook that swings blocks
 */
class HookComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Action handler for hook instance
   */
  action (instance, engine, time) {
    const ropeHeight = engine.getVariable(constant.ropeHeight)

    if (!instance.ready) {
      instance.x = engine.width / 2
      instance.y = ropeHeight * -1.5
      instance.ready = true
    }

    engine.getTimeMovement(
      constant.hookUpMovement,
      [[instance.y, instance.y - ropeHeight]],
      value => (instance.y = value),
      { after: () => (instance.y = ropeHeight * -1.5) }
    )

    engine.getTimeMovement(
      constant.hookDownMovement,
      [[instance.y, instance.y + ropeHeight]],
      value => (instance.y = value),
      { name: 'hook' }
    )

    const initialAngle = engine.getVariable(constant.initialAngle)
    instance.angle =
      initialAngle * GameUtils.getSwingBlockVelocity(engine, time)
    instance.weightX = instance.x + Math.sin(instance.angle) * ropeHeight
    instance.weightY = instance.y + Math.cos(instance.angle) * ropeHeight
  }

  /**
   * Painter for hook instance
   */
  painter (instance, engine) {
    const { ctx } = engine
    const ropeHeight = engine.getVariable(constant.ropeHeight)
    const ropeWidth = ropeHeight * 0.1
    const hook = engine.getImg('hook')

    ctx.save()
    ctx.translate(instance.x, instance.y)
    ctx.rotate(Math.PI * 2 - instance.angle)
    ctx.translate(-instance.x, -instance.y)
    engine.ctx.drawImage(
      hook,
      instance.x - ropeWidth / 2,
      instance.y,
      ropeWidth,
      ropeHeight + 5
    )
    ctx.restore()
  }
}

/**
 * Tutorial Component - Handles tutorial display
 */
class TutorialComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Action handler for tutorial instance
   */
  action (instance, engine, time) {
    const { width, height } = engine
    const { name } = instance

    if (!instance.ready) {
      instance.ready = true
      const tutorialWidth = width * 0.2
      instance.updateWidth(tutorialWidth)
      instance.height = tutorialWidth * 0.46
      instance.x = engine.calWidth - instance.calWidth
      instance.y = height * 0.45

      if (name !== 'tutorial') {
        instance.y += instance.height * 1.2
      }
    }

    if (name !== 'tutorial') {
      instance.y += Math.cos(time / 200) * instance.height * 0.01
    }
  }

  /**
   * Painter for tutorial instance
   */
  painter (instance, engine) {
    if (engine.checkTimeMovement(constant.tutorialMovement)) return
    if (GameUtils.getHookStatus(engine) !== constant.hookNormal) return

    const { ctx } = engine
    const { name } = instance
    const t = engine.getImg(name)
    ctx.drawImage(t, instance.x, instance.y, instance.width, instance.height)
  }
}

/**
 * Collision Detector - Handles collision detection between blocks and line
 */
class CollisionDetector {
  /**
   * Checks collision between block and line
   * Returns: 0=goon, 1=drop, 2=rotate left, 3=rotate right, 4=ok, 5=perfect
   */
  static checkCollision (block, line) {
    if (block.y + block.height >= line.y) {
      if (
        block.x < line.x - block.calWidth ||
        block.x > line.collisionX + block.calWidth
      ) {
        return 1 // Drop
      }
      if (block.x < line.x) {
        return 2 // Rotate left
      }
      if (block.x > line.collisionX) {
        return 3 // Rotate right
      }
      if (
        block.x > line.x + block.calWidth * 0.8 &&
        block.x < line.x + block.calWidth * 1.2
      ) {
        return 5 // Perfect
      }
      return 4 // OK
    }
    return 0 // Go on
  }

  /**
   * Checks if block is out of bounds
   */
  static checkBlockOut (instance, engine) {
    if (instance.status === constant.rotateLeft) {
      if (instance.y - instance.width >= engine.height) {
        instance.visible = false
        instance.status = constant.out
        GameUtils.addFailedCount(engine)
      }
    } else if (instance.y >= engine.height) {
      instance.visible = false
      instance.status = constant.out
      GameUtils.addFailedCount(engine)
    }
  }
}

/**
 * Block Component - Handles block behavior and rendering
 */
class BlockComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Calculates swing motion for block
   */
  swing (instance, engine, time) {
    const ropeHeight = engine.getVariable(constant.ropeHeight)
    if (instance.status !== constant.swing) return

    const initialAngle = engine.getVariable(constant.initialAngle)
    instance.angle =
      initialAngle * GameUtils.getSwingBlockVelocity(engine, time)
    instance.weightX = instance.x + Math.sin(instance.angle) * ropeHeight
    instance.weightY = instance.y + Math.cos(instance.angle) * ropeHeight
  }

  /**
   * Draws swinging block
   */
  drawSwingBlock (instance, engine) {
    const bl = engine.getImg('blockRope')
    engine.ctx.drawImage(
      bl,
      instance.weightX - instance.calWidth,
      instance.weightY,
      instance.width,
      instance.height * 1.3
    )
    const leftX = instance.weightX - instance.calWidth
    engine.debugLineY(leftX)
  }

  /**
   * Draws regular block
   */
  drawBlock (instance, engine) {
    const { perfect } = instance
    const bl = engine.getImg(perfect ? 'block-perfect' : 'block')
    engine.ctx.drawImage(
      bl,
      instance.x,
      instance.y,
      instance.width,
      instance.height
    )
  }

  /**
   * Draws rotated block
   */
  drawRotatedBlock (instance, engine) {
    const { ctx } = engine
    ctx.save()
    ctx.translate(instance.x, instance.y)
    ctx.rotate(instance.rotate)
    ctx.translate(-instance.x, -instance.y)
    this.drawBlock(instance, engine)
    ctx.restore()
  }

  /**
   * Action handler for block instance
   */
  action (instance, engine, time) {
    const ropeHeight = engine.getVariable(constant.ropeHeight)

    if (!instance.visible) return

    if (!instance.ready) {
      instance.ready = true
      instance.status = constant.swing
      instance.updateWidth(engine.getVariable(constant.blockWidth))
      instance.updateHeight(engine.getVariable(constant.blockHeight))
      instance.x = engine.width / 2
      instance.y = ropeHeight * -1.5
    }

    const line = engine.getInstance('line')

    switch (instance.status) {
      case constant.swing:
        engine.getTimeMovement(
          constant.hookDownMovement,
          [[instance.y, instance.y + ropeHeight]],
          value => (instance.y = value),
          { name: 'block' }
        )
        this.swing(instance, engine, time)
        break

      case constant.beforeDrop:
        instance.x = instance.weightX - instance.calWidth
        instance.y = instance.weightY + 0.3 * instance.height
        instance.rotate = 0
        instance.ay = engine.pixelsPerFrame(0.0003 * engine.height)
        instance.startDropTime = time
        instance.status = constant.drop
        break

      case constant.drop:
        const deltaTime = time - instance.startDropTime
        instance.startDropTime = time
        instance.vy += instance.ay * deltaTime
        instance.y +=
          instance.vy * deltaTime + 0.5 * instance.ay * deltaTime ** 2

        const collision = CollisionDetector.checkCollision(instance, line)
        const blockY = line.y - instance.height

        const calRotate = ins => {
          ins.originOutwardAngle = Math.atan(ins.height / ins.outwardOffset)
          ins.originHypotenuse = Math.sqrt(
            ins.height ** 2 + ins.outwardOffset ** 2
          )
          engine.playAudio('rotate')
        }

        switch (collision) {
          case 1:
            CollisionDetector.checkBlockOut(instance, engine)
            break
          case 2:
            instance.status = constant.rotateLeft
            instance.y = blockY
            instance.outwardOffset = line.x + instance.calWidth - instance.x
            calRotate(instance)
            break
          case 3:
            instance.status = constant.rotateRight
            instance.y = blockY
            instance.outwardOffset =
              line.collisionX + instance.calWidth - instance.x
            calRotate(instance)
            break
          case 4:
          case 5:
            instance.status = constant.land
            const lastSuccessCount = engine.getVariable(constant.successCount)
            GameUtils.addSuccessCount(engine)
            engine.setTimeMovement(constant.moveDownMovement, 500)

            if (lastSuccessCount === 10 || lastSuccessCount === 15) {
              engine.setTimeMovement(constant.lightningMovement, 150)
            }

            instance.y = blockY
            line.y = blockY
            line.x = instance.x - instance.calWidth
            line.collisionX = line.x + instance.width

            const cheatWidth = instance.width * 0.3
            if (
              instance.x > engine.width - cheatWidth * 2 ||
              instance.x < -cheatWidth
            ) {
              engine.setVariable(constant.hardMode, true)
            }

            if (collision === 5) {
              instance.perfect = true
              GameUtils.addScore(engine, true)
              engine.playAudio('drop-perfect')
            } else {
              GameUtils.addScore(engine)
              engine.playAudio('drop')
            }
            break
          default:
            break
        }
        break

      case constant.land:
        engine.getTimeMovement(
          constant.moveDownMovement,
          [
            [
              instance.y,
              instance.y +
                GameUtils.getMoveDownValue(engine, {
                  pixelsPerFrame: s => s / 2
                })
            ]
          ],
          value => {
            if (!instance.visible) return
            instance.y = value
            if (instance.y > engine.height) {
              instance.visible = false
            }
          },
          { name: instance.name }
        )
        instance.x += GameUtils.getLandBlockVelocity(engine, time)
        break

      case constant.rotateLeft:
      case constant.rotateRight:
        const isRight = instance.status === constant.rotateRight
        const rotateSpeed = engine.pixelsPerFrame(Math.PI * 4)
        const isShouldFall = isRight
          ? instance.rotate > 1.3
          : instance.rotate < -1.3
        const leftFix = isRight ? 1 : -1

        if (isShouldFall) {
          instance.rotate += (rotateSpeed / 8) * leftFix
          instance.y += engine.pixelsPerFrame(engine.height * 0.7)
          instance.x += engine.pixelsPerFrame(engine.width * 0.3) * leftFix
        } else {
          let rotateRatio =
            (instance.calWidth - instance.outwardOffset) / instance.calWidth
          rotateRatio = rotateRatio > 0.5 ? rotateRatio : 0.5
          instance.rotate += rotateSpeed * rotateRatio * leftFix

          const angle = instance.originOutwardAngle + instance.rotate
          const rotateAxisX = isRight
            ? line.collisionX + instance.calWidth
            : line.x + instance.calWidth
          const rotateAxisY = line.y
          instance.x = rotateAxisX - Math.cos(angle) * instance.originHypotenuse
          instance.y = rotateAxisY - Math.sin(angle) * instance.originHypotenuse
        }

        CollisionDetector.checkBlockOut(instance, engine)
        break

      default:
        break
    }
  }

  /**
   * Painter for block instance
   */
  painter (instance, engine) {
    const { status } = instance
    switch (status) {
      case constant.swing:
        this.drawSwingBlock(instance, engine)
        break
      case constant.drop:
      case constant.land:
        this.drawBlock(instance, engine)
        break
      case constant.rotateLeft:
      case constant.rotateRight:
        this.drawRotatedBlock(instance, engine)
        break
      default:
        break
    }
  }
}

/**
 * Flight Component - Handles flying objects in the background
 */
class FlightComponent {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * Gets action configuration for flight based on type
   */
  getActionConfig (engine, type) {
    const { width, height, utils } = engine
    const { random } = utils
    const size = engine.getVariable(constant.cloudSize)

    const actionTypes = {
      bottomToTop: {
        x: width * random(0.3, 0.7),
        y: height,
        vx: 0,
        vy: engine.pixelsPerFrame(height) * 0.7 * -1
      },
      leftToRight: {
        x: size * -1,
        y: height * random(0.3, 0.6),
        vx: engine.pixelsPerFrame(width) * 0.4,
        vy: engine.pixelsPerFrame(height) * 0.1 * -1
      },
      rightToLeft: {
        x: width,
        y: height * random(0.2, 0.5),
        vx: engine.pixelsPerFrame(width) * 0.4 * -1,
        vy: engine.pixelsPerFrame(height) * 0.1
      },
      rightTopToLeft: {
        x: width,
        y: 0,
        vx: engine.pixelsPerFrame(width) * 0.6 * -1,
        vy: engine.pixelsPerFrame(height) * 0.5
      }
    }

    return actionTypes[type]
  }

  /**
   * Action handler for flight instance
   */
  action (instance, engine) {
    const { visible, ready, type } = instance
    if (!visible) return

    const size = engine.getVariable(constant.cloudSize)

    if (!ready) {
      const action = this.getActionConfig(engine, type)
      instance.ready = true
      instance.width = size
      instance.height = size
      instance.x = action.x
      instance.y = action.y
      instance.vx = action.vx
      instance.vy = action.vy
    }

    instance.x += instance.vx
    instance.y += instance.vy

    if (
      instance.y + size < 0 ||
      instance.y > engine.height ||
      instance.x + size < 0 ||
      instance.x > engine.width
    ) {
      instance.visible = false
    }
  }

  /**
   * Painter for flight instance
   */
  painter (instance, engine) {
    const { ctx } = engine
    const flight = engine.getImg(instance.imgName)
    ctx.drawImage(
      flight,
      instance.x,
      instance.y,
      instance.width,
      instance.height
    )
  }

  /**
   * Adds a flight instance to the game
   */
  addFlight (engine, number, type) {
    const flightCount = engine.getVariable(constant.flightCount)
    if (flightCount === number) return

    const flight = new Instance({
      name: `flight_${number}`,
      action: (inst, eng) => this.action(inst, eng),
      painter: (inst, eng) => this.painter(inst, eng)
    })
    flight.imgName = `f${number}`
    flight.type = type
    engine.addInstance(flight, constant.flightLayer)
    engine.setVariable(constant.flightCount, number)
  }
}

/**
 * Animation Controller - Handles start and end animations
 */
class AnimationController {
  constructor (engine) {
    this.engine = engine
  }

  /**
   * End animation - renders UI elements (score, hearts)
   */
  endAnimate () {
    const gameStartNow = this.engine.getVariable(constant.gameStartNow)
    if (!gameStartNow) return

    const failedCount = this.engine.getVariable(constant.failedCount)

    // Draw hearts (lives) on the right side
    const { ctx } = this.engine
    const heart = this.engine.getImg('heart')
    const heartWidth = heart.width
    const heartHeight = heart.height
    const zoomedHeartWidth = this.engine.width * 0.08
    const zoomedHeartHeight = (heartHeight * zoomedHeartWidth) / heartWidth
    const rowY = this.engine.width * 0.04
    const rightMargin = this.engine.width * 0.02
    const heartsStartX = this.engine.width - rightMargin - 3 * zoomedHeartWidth
    const heartY = rowY + zoomedHeartHeight * 0.5 - zoomedHeartHeight * 0.5

    for (let i = 1; i <= 3; i += 1) {
      ctx.save()
      if (i <= failedCount) {
        ctx.globalAlpha = 0.2
      }
      ctx.drawImage(
        heart,
        heartsStartX + (i - 1) * zoomedHeartWidth,
        heartY,
        zoomedHeartWidth,
        zoomedHeartHeight
      )
      ctx.restore()
    }
  }

  /**
   * Start animation - handles block creation and flight spawning
   */
  startAnimate () {
    const gameStartNow = this.engine.getVariable(constant.gameStartNow)
    if (!gameStartNow) return

    const lastBlock = this.engine.getInstance(
      `block_${this.engine.getVariable(constant.blockCount)}`
    )

    if (
      !lastBlock ||
      [constant.land, constant.out].indexOf(lastBlock.status) > -1
    ) {
      if (
        GameUtils.checkMoveDown(this.engine) &&
        GameUtils.getMoveDownValue(this.engine)
      )
        return
      if (this.engine.checkTimeMovement(constant.hookUpMovement)) return

      const angleBase = GameUtils.getAngleBase(this.engine)
      const initialAngle =
        (Math.PI *
          this.engine.utils.random(angleBase, angleBase + 5) *
          this.engine.utils.randomPositiveNegative()) /
        180

      this.engine.setVariable(
        constant.blockCount,
        this.engine.getVariable(constant.blockCount) + 1
      )
      this.engine.setVariable(constant.initialAngle, initialAngle)
      this.engine.setTimeMovement(constant.hookDownMovement, 500)

      const blockComponent = new BlockComponent(this.engine)
      const block = new Instance({
        name: `block_${this.engine.getVariable(constant.blockCount)}`,
        action: (inst, eng, time) => blockComponent.action(inst, eng, time),
        painter: (inst, eng) => blockComponent.painter(inst, eng)
      })

      this.engine.addInstance(block)
    }

    // Spawn flights based on success count
    const successCount = Number(
      this.engine.getVariable(constant.successCount, 0)
    )
    const flightComponent = new FlightComponent(this.engine)

    switch (successCount) {
      case 2:
        flightComponent.addFlight(this.engine, 1, 'leftToRight')
        break
      case 6:
        flightComponent.addFlight(this.engine, 2, 'rightToLeft')
        break
      case 8:
        flightComponent.addFlight(this.engine, 3, 'leftToRight')
        break
      case 14:
        flightComponent.addFlight(this.engine, 4, 'bottomToTop')
        break
      case 18:
        flightComponent.addFlight(this.engine, 5, 'bottomToTop')
        break
      case 22:
        flightComponent.addFlight(this.engine, 6, 'bottomToTop')
        break
      case 25:
        flightComponent.addFlight(this.engine, 7, 'rightTopToLeft')
        break
      default:
        break
    }
  }
}

/**
 * Main TowerGame Class - Orchestrates all game components
 */
class TowerGame {
  constructor (option = {}) {
    const { width, height, canvasId, soundOn } = option
    this.engine = new Engine({
      canvasId,
      highResolution: true,
      width,
      height,
      soundOn
    })
    this.option = option

    // Initialize components
    this.backgroundRenderer = new BackgroundRenderer(this.engine)
    this.lineComponent = new LineComponent(this.engine)
    this.hookComponent = new HookComponent(this.engine)
    this.cloudComponent = new CloudComponent(this.engine)
    this.tutorialComponent = new TutorialComponent(this.engine)
    this.blockComponent = new BlockComponent(this.engine)
    this.flightComponent = new FlightComponent(this.engine)
    this.animationController = new AnimationController(this.engine)

    this.initializeAssets()
    this.initializeVariables()
    this.initializeInstances()
    this.initializeListeners()
  }

  /**
   * Initialize game assets (images and audio)
   */
  initializeAssets () {
    const imagePath = path => `./assets/images/${path}`
    const soundPath = path => `./assets/sounds/${path}`

    // Add images
    this.engine.addImg('background', imagePath('background-1.png'))
    this.engine.addImg('hook', imagePath('hook.png'))
    this.engine.addImg('blockRope', imagePath('block-rope.png'))
    this.engine.addImg('block', imagePath('block.png'))
    this.engine.addImg('block-perfect', imagePath('block-perfect.png'))

    for (let i = 1; i <= 8; i += 1) {
      this.engine.addImg(`c${i}`, imagePath(`c${i}.png`))
    }

    this.engine.addLayer(constant.flightLayer)

    for (let i = 1; i <= 7; i += 1) {
      this.engine.addImg(`f${i}`, imagePath(`f${i}.png`))
    }

    this.engine.swapLayer(0, 1)

    this.engine.addImg('tutorial', imagePath('tutorial.png'))
    this.engine.addImg('tutorial-arrow', imagePath('tutorial-arrow.png'))
    this.engine.addImg('heart', imagePath('heart.png'))

    // Add audio
    this.engine.addAudio('drop-perfect', soundPath('drop-perfect.mp3'))
    this.engine.addAudio('drop', soundPath('drop.mp3'))
    this.engine.addAudio('game-over', soundPath('game-over.mp3'))
    this.engine.addAudio('rotate', soundPath('rotate.mp3'))
    this.engine.addAudio('bgm', soundPath('bgm.mp3'))
  }

  /**
   * Initialize game variables
   */
  initializeVariables () {
    this.engine.setVariable(constant.blockWidth, this.engine.width * 0.3)
    this.engine.setVariable(
      constant.blockHeight,
      this.engine.getVariable(constant.blockWidth) * 0.5
    )
    this.engine.setVariable(constant.cloudSize, this.engine.width * 0.3)
    this.engine.setVariable(constant.ropeHeight, this.engine.height * 0.4)
    this.engine.setVariable(constant.blockCount, 0)
    this.engine.setVariable(constant.successCount, 0)
    this.engine.setVariable(constant.failedCount, 0)
    this.engine.setVariable(constant.gameScore, 0)
    this.engine.setVariable(constant.hardMode, false)
    this.engine.setVariable(constant.gameUserOption, this.option)
  }

  /**
   * Initialize game instances (clouds, line, hook)
   */
  initializeInstances () {
    // Add clouds
    for (let i = 1; i <= 4; i += 1) {
      const cloud = new Instance({
        name: `cloud_${i}`,
        action: (inst, eng) => this.cloudComponent.action(inst, eng),
        painter: (inst, eng) => this.cloudComponent.painter(inst, eng)
      })
      cloud.index = i
      cloud.count = 5 - i
      this.engine.addInstance(cloud)
    }

    // Add line
    const line = new Instance({
      name: 'line',
      action: (inst, eng, time) => this.lineComponent.action(inst, eng, time),
      painter: (inst, eng) => this.lineComponent.painter(inst, eng)
    })
    this.engine.addInstance(line)

    // Add hook
    const hook = new Instance({
      name: 'hook',
      action: (inst, eng, time) => this.hookComponent.action(inst, eng, time),
      painter: (inst, eng) => this.hookComponent.painter(inst, eng)
    })
    this.engine.addInstance(hook)
  }

  /**
   * Initialize event listeners and game methods
   */
  initializeListeners () {
    // Set animation handlers
    this.engine.startAnimate = () => this.animationController.startAnimate()
    this.engine.endAnimate = () => this.animationController.endAnimate()
    this.engine.paintUnderInstance = () => this.backgroundRenderer.render()

    // Keyboard listener
    this.engine.addKeyDownListener('enter', () => {
      if (this.engine.debug) this.engine.togglePaused()
    })

    // Touch listener
    this.engine.touchStartListener = () =>
      GameUtils.touchEventHandler(this.engine)

    // Audio methods
    this.engine.playBgm = () => {
      try {
        this.engine.playAudio('bgm', true)
      } catch (e) {
        console.warn('Could not play BGM:', e)
      }
    }
    this.engine.pauseBgm = () => this.engine.pauseAudio('bgm')
    // Start game method
    this.engine.start = () => {
      const tutorial = new Instance({
        name: 'tutorial',
        action: (inst, eng, time) =>
          this.tutorialComponent.action(inst, eng, time),
        painter: (inst, eng) => this.tutorialComponent.painter(inst, eng)
      })
      this.engine.addInstance(tutorial)

      const tutorialArrow = new Instance({
        name: 'tutorial-arrow',
        action: (inst, eng, time) =>
          this.tutorialComponent.action(inst, eng, time),
        painter: (inst, eng) => this.tutorialComponent.painter(inst, eng)
      })
      this.engine.addInstance(tutorialArrow)

      this.engine.setTimeMovement(constant.bgInitMovement, 500)
      this.engine.setTimeMovement(constant.tutorialMovement, 500)
      this.engine.setVariable(constant.gameStartNow, true)
    }
  }

  /**
   * Load game assets
   */
  load (onComplete, onProgress) {
    return this.engine.load(onComplete, onProgress)
  }

  /**
   * Initialize game
   */
  init () {
    return this.engine.init()
  }

  /**
   * Get the engine instance (for compatibility)
   */
  getEngine () {
    return this.engine
  }
}

// Export for use in index.html
// Returns the engine instance (like the original) so all methods are accessible
window.TowerGame = (option = {}) => {
  const towerGame = new TowerGame(option)
  return towerGame.engine
}

// Game initialization code
;(function () {
  // Prevent double-tap zoom
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    function (event) {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    false
  )

  // Prevent context menu on long press
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault()
  })

  // Wait for zepto to be available
  function initGame () {
    if (typeof window.$ === 'undefined') {
      setTimeout(initGame, 50)
      return
    }

    var domReady,
      loadFinish,
      canvasReady,
      loadError,
      gameStart,
      game,
      score,
      successCount

    // init window height and width
    var gameWidth = window.innerWidth
    var gameHeight = window.innerHeight
    var ratio = 1.5
    if (gameHeight / gameWidth < ratio) {
      gameWidth = Math.ceil(gameHeight / ratio)
    }
    $('.content').css({ height: gameHeight + 'px', width: gameWidth + 'px' })

    // loading animation
    function hideLoading () {
      if (domReady && canvasReady) {
        $('#canvas').show()
        loadFinish = true
        setTimeout(function () {
          $('.loading').hide()
          $('.landing').show()
        }, 1000)
      }
    }

    function updateLoading (status) {
      var success = status.success
      var total = status.total
      var failed = status.failed
      if (failed > 0 && !loadError) {
        loadError = true
        alert('Network error... Please try again.')
        return
      }
      var percent = parseInt((success / total) * 100)
      if (percent === 100 && !canvasReady) {
        canvasReady = true
        hideLoading()
      }
      percent = percent > 98 ? 98 : percent
      percent = percent + '%'
      $('.loading .title').text(percent)
      $('.loading .percent').css({
        width: percent
      })
    }

    function overShowOver () {
      $('#gameOverScore').text(score)
      $('#gameOverPopup').removeClass('hide')
    }

    // game customization options
    const option = {
      width: gameWidth,
      height: gameHeight,
      canvasId: 'canvas',
      soundOn: true,
      setGameScore: function (s) {
        score = s
        var el = document.getElementById('currentScore')
        if (el) el.textContent = s
      },
      setGameSuccess: function (s) {
        successCount = s
      },
      setGameFailed: function (f) {
        if (f >= 3) overShowOver()
      }
    }

    // game init with option
    function gameReady () {
      if (typeof window.TowerGame === 'undefined') {
        // Wait for the module to load
        setTimeout(gameReady, 50)
        return
      }
      game = window.TowerGame(option)
      game.load(function () {
        game.init()
      }, updateLoading)
    }
    gameReady()
    function indexHide () {
      $('.landing .action-1').addClass('slideTop')
      $('.landing .action-2').addClass('slideBottom')
      setTimeout(() => $('.landing').hide(), 950)
    }

    // click event
    $('#start').on('click', function () {
      if (gameStart) return
      gameStart = true
      // Play BGM after user interaction (click)
      try {
        game.playBgm()
      } catch (e) {
        console.warn('Could not play BGM:', e)
      }
      indexHide()
      setTimeout(function () {
        game.start()
        var canvasLeft = (window.innerWidth - gameWidth) / 2
        var canvasTop = (window.innerHeight - gameHeight) / 2
        $('#scoreDisplay')
          .css({
            left: canvasLeft + 10 + 'px',
            top: canvasTop + 10 + 'px'
          })
          .removeClass('hide')
        $('#currentScore').text(0)
      }, 400)
    })
    $('.js-reload').on('click', () => window.location.reload())
    // listener
    window.addEventListener(
      'load',
      () => {
        domReady = true
        hideLoading()
      },
      false
    )
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initGame)
  else initGame()
})()
