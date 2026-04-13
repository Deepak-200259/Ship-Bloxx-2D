import * as constant from './config.js'

/**
 * GameUtils - Static utility class for game helper functions
 */
class GameUtils {
    /**
     * Checks if the game is currently moving down
     * @param {Object} engine - The game engine instance
     * @returns {boolean} True if moving down
     */
    static checkMoveDown = (engine) => engine.checkTimeMovement(constant.moveDownMovement)

    /**
     * Calculates the move down value based on success count
     * @param {Object} engine - The game engine instance
     * @param {Object} store - Optional store object with pixelsPerFrame method
     * @returns {number} The move down value
     */
    static getMoveDownValue(engine, store) {
        const pixelsPerFrame = store ? store.pixelsPerFrame : engine.pixelsPerFrame.bind(engine)
        const successCount = engine.getVariable(constant.successCount)
        const calHeight = engine.getVariable(constant.blockHeight) * 2
        if (successCount <= 4) return pixelsPerFrame(calHeight * 1.25)
        return pixelsPerFrame(calHeight)
    }

    /**
     * Gets the base angle for the hook based on game state
     * @param {Object} engine - The game engine instance
     * @returns {number} The base angle in degrees
     */
    static getAngleBase(engine) {
        const successCount = engine.getVariable(constant.successCount)
        const gameScore = engine.getVariable(constant.gameScore)
        const { hookAngle } = engine.getVariable(constant.gameUserOption)
        if (hookAngle) return hookAngle(successCount, gameScore)
        if (engine.getVariable(constant.hardMode)) return 80
        switch (true) {
            case successCount < 10: return 15
            case successCount < 20: return 30
            default: return 45
        }
    }

    /**
     * Calculates the swing block velocity
     * @param {Object} engine - The game engine instance
     * @param {number} time - Current game time
     * @returns {number} The swing velocity
     */
    static getSwingBlockVelocity(engine, time) {
        const successCount = engine.getVariable(constant.successCount)
        const gameScore = engine.getVariable(constant.gameScore)
        const { hookSpeed } = engine.getVariable(constant.gameUserOption)
        if (hookSpeed) return hookSpeed(successCount, gameScore)
        let hard
        switch (true) {
            case successCount < 1: hard = 0; break
            case successCount < 10: hard = 0.2; break
            case successCount < 20: hard = 0.3; break
            case successCount < 30: hard = 0.4; break
            default: hard = 0.55; break
        }
        if (engine.getVariable(constant.hardMode)) hard = 0.85
        return Math.sin(time * hard / 200)
    }

    /**
     * Calculates the land block velocity (horizontal movement)
     * @param {Object} engine - The game engine instance
     * @param {number} time - Current game time
     * @returns {number} The land block velocity
     */
    static getLandBlockVelocity(engine, time) {
        const successCount = engine.getVariable(constant.successCount)
        const gameScore = engine.getVariable(constant.gameScore)
        const { landBlockSpeed } = engine.getVariable(constant.gameUserOption)
        if (landBlockSpeed) return landBlockSpeed(successCount, gameScore)
        const { width } = engine
        let hard
        switch (true) {
            case successCount < 5: hard = 0; break
            case successCount < 13: hard = 0.001; break
            case successCount < 23: hard = 0.002; break
            default: hard = 0.003; break
        }
        return Math.cos(time / 200) * hard * width
    }

    /**
     * Gets the current hook status
     * @param {Object} engine - The game engine instance
     * @returns {string} The hook status (hookDown, hookUp, or hookNormal)
     */
    static getHookStatus(engine) {
        if (engine.checkTimeMovement(constant.hookDownMovement)) return constant.hookDown
        if (engine.checkTimeMovement(constant.hookUpMovement)) return constant.hookUp
        return constant.hookNormal
    }

    /**
     * Handles touch/click events for dropping blocks
     * @param {Object} engine - The game engine instance
     */
    static touchEventHandler(engine) {
        if (!engine.getVariable(constant.gameStartNow)) return
        if (engine.debug && engine.paused) return
        if (GameUtils.getHookStatus(engine) !== constant.hookNormal) return
        engine.removeInstance('tutorial')
        engine.removeInstance('tutorial-arrow')
        const b = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
        if (b && b.status === constant.swing) {
            engine.setTimeMovement(constant.hookUpMovement, 500)
            b.status = constant.beforeDrop
        }
    }

    /**
     * Increments the success count and handles related logic
     * @param {Object} engine - The game engine instance
     */
    static addSuccessCount(engine) {
        const { setGameSuccess } = engine.getVariable(constant.gameUserOption)
        const lastSuccessCount = engine.getVariable(constant.successCount)
        const success = lastSuccessCount + 1
        engine.setVariable(constant.successCount, success)
        if (engine.getVariable(constant.hardMode)) engine.setVariable(constant.ropeHeight, engine.height * engine.utils.random(0.35, 0.55))
        if (setGameSuccess) setGameSuccess(success)
    }

    /**
     * Increments the failed count and handles game over logic
     * @param {Object} engine - The game engine instance
     */
    static addFailedCount(engine) {
        const { setGameFailed } = engine.getVariable(constant.gameUserOption)
        const lastFailedCount = engine.getVariable(constant.failedCount)
        const failed = lastFailedCount + 1
        engine.setVariable(constant.failedCount, failed)
        engine.setVariable(constant.perfectCount, 0)
        if (setGameFailed) setGameFailed(failed)
        if (failed >= 3) {
            engine.pauseAudio('bgm')
            engine.playAudio('game-over')
            engine.setVariable(constant.gameStartNow, false)
        }
    }

    /**
     * Adds score to the game
     * @param {Object} engine - The game engine instance
     * @param {boolean} isPerfect - Whether the block placement was perfect
     */
    static addScore(engine, isPerfect) {
        const { setGameScore, successScore, perfectScore } = engine.getVariable(constant.gameUserOption)
        const lastPerfectCount = engine.getVariable(constant.perfectCount, 0)
        const lastGameScore = engine.getVariable(constant.gameScore)
        const perfect = isPerfect ? lastPerfectCount + 1 : 0
        const score = lastGameScore + (successScore || 25) + ((perfectScore || 25) * perfect)
        engine.setVariable(constant.gameScore, score)
        engine.setVariable(constant.perfectCount, perfect)
        if (setGameScore) setGameScore(score)
    }

    /**
     * Draws yellow gradient text string on the canvas
     * @param {Object} engine - The game engine instance
     * @param {Object} option - Text drawing options
     * @param {string} option.string - The text to draw
     * @param {number} option.size - Font size
     * @param {number} option.x - X position
     * @param {number} option.y - Y position
     * @param {string} option.textAlign - Text alignment
     * @param {string} option.fontName - Font name (default: 'wenxue')
     * @param {string} option.fontWeight - Font weight (default: 'normal')
     */
    static drawYellowString(engine, option) {
        const { string, size, x, y, textAlign, fontName = 'Bungee', fontWeight = 'normal' } = option
        const { ctx } = engine
        const fontSize = size
        const lineSize = fontSize * 0.1
        ctx.save()
        ctx.beginPath()
        const gradient = ctx.createLinearGradient(0, 0, 0, y)
        gradient.addColorStop(0, '#FAD961')
        gradient.addColorStop(1, '#F76B1C')
        ctx.fillStyle = gradient
        ctx.lineWidth = lineSize
        ctx.strokeStyle = '#FFF'
        ctx.textAlign = textAlign || 'center'
        ctx.font = `${fontWeight} ${fontSize}px ${fontName}`
        ctx.strokeText(string, x, y)
        ctx.fillText(string, x, y)
        ctx.restore()
    }
}

// Export the class and maintain backward compatibility with individual function exports
export default GameUtils
