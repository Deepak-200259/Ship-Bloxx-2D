# City Bloxx 2D

A 2D **block-stacking arcade** game where blocks **swing on a rope** from the top of the screen and must be dropped onto a **moving platform** below. Each block swings pendulum-style; **tap or release** to drop it. Land blocks on the platform to build a tower—**perfect center alignment** earns bonus points and a distinct sound. Miss or let blocks fall off the edges and you lose lives (hearts). The platform shrinks and moves as you stack; clouds and stones scroll in the background. **BGM**, drop sounds, and **lightning** effects add atmosphere.

Built with **cooljs** (Engine, Instance), **Zepto**, and **config.js** for game constants. Canvas 2D rendering; assets in `public/assets/`.

## Gameplay instructions

### Goal

Drop blocks onto the moving platform to stack them. Land in the center for a **perfect** bonus. Avoid dropping blocks off the sides. Maximize score and survive as long as you can.

### Controls

- **Tap or click** – Release the swinging block. Timing determines where it lands.
- **No horizontal control** – Blocks swing on a rope from a hook; you only choose when to drop.

### Win / lose

- **No explicit win** – Play until game over. Success count tracks consecutive landings; lightning triggers at certain milestones (e.g. 10, 15).
- **Game over** – When failed drops exceed the limit (lives/hearts). Restart from the main menu or game-over modal.

### Progression

- Platform moves and may shrink over time. After each successful land, the platform shifts; the next block spawns.
- Block swing angle and speed scale with success count. Optional **hard mode** can activate when blocks land near screen edges.
- **Perfect** landing = center alignment; bonus points and special sound.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm

## Setup

```bash
npm install
```

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start dev server (default: http://localhost:3000) |
| `npm run build`   | Build for production into `dist/`                |
| `npm run preview` | Serve the `dist/` build locally                 |

## Project structure

```
city_bloxx_2d/
├── index.html       # Entry HTML, loading screen, landing (start), game-over modal, canvas
├── src/
│   ├── config.js    # Game constants: gameStartNow, gameUserOption, block/rope/line, movements, states
│   ├── script.js    # cooljs Engine: BackgroundRenderer, LineComponent, swinging block, collision, score, hearts, lightning
│   ├── utils.js     # GameUtils: checkMoveDown, getMoveDownValue, getAngleBase, getSwingBlockVelocity, getLandBlockVelocity
│   └── style.css    # Loading, landing, modal, canvas layout
├── public/
│   └── assets/
│       ├── images/  # background, block, block-perfect, block-rope, rope, hook, heart, score, clouds (c1–c8), stones (f1–f7), main-*, tutorial*
│       └── sounds/  # bgm, drop, drop-perfect, game-over, rotate (mp3/ogg)
│       └── scripts/ # zepto-1.1.6.min.js
├── package.json
└── vite.config.js
```

- **config.js** – Exports string constants for game state (gameStartNow, gameUserOption, hardMode, successCount, failedCount, perfectCount, gameScore), hook/line/block (blockWidth, blockHeight, ropeHeight, initialAngle), movements (swing, drop, land, moveDownMovement, lightningMovement, etc.).
- **script.js** – cooljs `Engine` and `Instance`: BackgroundRenderer (scrolling bg image, linear gradient, lightning), LineComponent (moving platform), swinging block on rope (drop on tap), collision (land vs out), perfect vs regular landing, score, hearts (lives), tutorial, main menu and game-over modal. Preloads images and audio from `public/assets/`.
- **utils.js** – GameUtils: move-down value by success count, hook angle base, swing block velocity, land block velocity; used by script for difficulty scaling and gameUserOption callbacks.

## Build output

Running `npm run build`:

1. Vite bundles JS and CSS from `src/`, copies `public/` (assets, scripts, images, sounds) to `dist/`.
2. Output is in `dist/` and can be served statically (e.g. S3, GitHub Pages). Ensure asset paths (e.g. `./assets/images/`, `./assets/sounds/`) resolve correctly.

## Customization

- **config.js** – Add or adjust constants for block size, rope height, movement keys, scoring. `gameUserOption` in script can expose hooks for successScore, perfectScore, setGameScore, hookAngle, hookSpeed, landBlockSpeed.
- **script.js** – Tune block/line behavior, collision thresholds, heart count, lightning milestones. Replace or add assets via `engine.addImg` / `engine.addAudio` and paths in `imagePath` / `soundPath`.
- **public/assets/** – Replace images (block, block-perfect, rope, hook, heart, score, background, clouds, main-*, tutorial*) and sounds (bgm, drop, drop-perfect, game-over, rotate) to reskin the game.
