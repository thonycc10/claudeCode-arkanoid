# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game: plain HTML + CSS + JavaScript, zero dependencies (per README, in Spanish). Game itself **not implemented yet** — only assets exist. No build, lint, or test tooling; no `index.html` yet. Once it exists, run by opening it in a browser (or any static server).

## Assets (`assets/`)

- `spritesheet-breakout.png` — single sprite atlas.
- `spritesheet.js` — plain global script (no modules): `SPRITES` (paddle, ball, `blocks` by color), `EXPLOSION_FRAMES` (4 frames per color) + `EXPLOSION_DURATION` (150ms), and helpers `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)` (blocks use `'block_<color>'`), `drawFrame(ctx, frame, x, y, w, h)`. Must be loaded via `<script>` before game code; call `loadSpritesheet` before drawing (draw helpers silently no-op until loaded). Image path is hardcoded relative to the HTML page: `assets/spritesheet-breakout.png`.
- Block sprites are 32x16 px; `gray` explosion frames reuse `red`'s.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — SFX.

## Tooling

- `.agents/skills/` (`caveman`, `spec`, `spec-impl`), pinned in `skills-lock.json`. Spec-driven workflow: `/spec` writes specs to `specs/`, `/spec-impl` implements them. Prefer specs before building large features.
