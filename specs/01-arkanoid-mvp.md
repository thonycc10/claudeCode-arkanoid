# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Draft
> **Depends on:** ninguna
> **Date:** 2026-11-11
> **Objective:** Crear un Arkanoid jugable de un nivel en HTML + CSS + JS sin dependencias, con pala, bola, bloques, puntaje, vidas, sonidos y pantallas de inicio/pausa/fin.

## Scope

**In:**

- `index.html`, `style.css` y `src/game.js` nuevos en la raíz del proyecto.
- Canvas 480x640 centrado en la página.
- Un único nivel: 12 columnas x 6 filas de bloques (72 bloques), una fila por color.
- Pala controlada con teclado (← / → y A / D).
- Bola con velocidad constante; el ángulo de rebote en la pala depende del punto de impacto.
- Colisiones bola-paredes, bola-pala y bola-bloques.
- Bloques de 1 golpe, 10 puntos cada uno, con animación de explosión (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`).
- 3 vidas, puntaje visible (HUD en el canvas).
- Estados: `start`, `ready`, `playing`, `paused`, `gameover`, `win`.
- SFX: `assets/sounds/ball-bounce.mp3` (paredes y pala) y `assets/sounds/break-sound.mp3` (bloque roto).
- Reinicio de partida desde las pantallas de fin.

**Out of scope (for future specs):**

- Múltiples niveles o layouts distintos.
- Power-ups (pala grande, multibola, láser, etc.).
- Bloques resistentes (`gray`) o indestructibles.
- Control con mouse o touch.
- High score / cualquier persistencia (localStorage).
- Aceleración de la bola.
- Menús, ajustes, volumen/mute.
- Diseño responsive / móvil.

## Data model

Estructuras nuevas, todas en memoria dentro de `src/game.js`. Origen en la esquina superior izquierda, unidades en píxeles, velocidades en px/segundo (se usa delta time).

```js
const CANVAS_W = 480;
const CANVAS_H = 640;

const BLOCK_COLS = 12;
const BLOCK_ROWS = 6;
const BLOCK_W = 40;   // 12 * 40 = 480 (sprite 32x16 escalado a 1.25x)
const BLOCK_H = 20;
const BLOCK_TOP = 80; // margen superior para el HUD
const BLOCK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']; // fila 0..5
const BLOCK_POINTS = 10;

const INITIAL_LIVES = 3;

const state = {
  mode: 'start',      // 'start' | 'ready' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: INITIAL_LIVES,
  paddle: { x, y, w: 80, h: 14, speed: 420 },
  ball: { x, y, r: 6, vx, vy, speed: 320 },
  blocks: [/* { x, y, w, h, color, alive } */],
  explosions: [/* { x, y, color, elapsed } */],
  keys: { left: false, right: false },
};
```

Reglas del modelo:

- La bola en modo `ready` está pegada al centro de la pala.
- Ángulo de rebote en pala: `offset = (ball.x - paddleCenter) / (paddle.w / 2)` en [-1, 1]; ángulo máximo 60° respecto a la vertical; `speed` constante.
- `explosions` guarda animaciones activas; se eliminan al superar `EXPLOSION_DURATION`.
- Sprites vía `drawSprite` / `drawFrame` de `assets/spritesheet.js`; el sprite de la pala (162x14) se dibuja a 80x14 y el de la bola (16x16) a 12x12.

## Implementation plan

1. Crear `index.html` (canvas 480x640, carga `assets/spritesheet.js` y luego `src/game.js`) y `style.css` (fondo oscuro, canvas centrado). `src/game.js` con `loadSpritesheet` y bucle `requestAnimationFrame` que pinta el fondo. Prueba: abrir `index.html` y ver el canvas sin errores en consola.
2. Dibujar la pala y moverla con ← / → y A / D, limitada a los bordes. Prueba: la pala se mueve sin salirse del canvas.
3. Añadir la bola en estado `ready` pegada a la pala; Espacio la lanza (`playing`) con ángulo inicial hacia arriba. Rebote en paredes y techo. Prueba: la bola rebota en los tres bordes.
4. Rebote en pala con ángulo según punto de impacto y velocidad constante. Prueba: golpear en el borde izquierdo/derecho de la pala desvía la bola en esa dirección.
5. Generar y dibujar los 72 bloques (`BLOCK_COLORS` por fila). Prueba: se ven 6 filas de colores distintos.
6. Colisión bola-bloque: el bloque se rompe, la bola rebota (eje de menor penetración), suma 10 puntos. Prueba: el puntaje sube de 10 en 10.
7. Explosión al romper un bloque (animación de 4 frames en 150 ms) y SFX (`break-sound.mp3` al romper, `ball-bounce.mp3` en pared/pala). Prueba: se oye y se ve cada evento.
8. Vidas: si la bola cae por debajo de la pala se pierde una vida y se vuelve a `ready`; con 0 vidas, `gameover`. HUD con puntaje y vidas. Prueba: perder 3 veces lleva a `gameover`.
9. Pantallas y estados: `start` (Espacio para empezar), pausa con P / Esc (`playing` ↔ `paused`), `gameover` y `win` (sin bloques vivos) con Espacio para reiniciar. Prueba: recorrer todas las transiciones.

## Acceptance criteria

- [ ] Abrir `index.html` directamente (file://) carga el juego sin errores en consola.
- [ ] Al cargar se muestra la pantalla `start`; Espacio inicia la partida en estado `ready`.
- [ ] En `ready` la bola está sobre la pala y se mueve con ella; Espacio la lanza.
- [ ] ← / → y A / D mueven la pala y esta nunca sale del canvas.
- [ ] La bola rebota en pared izquierda, derecha y techo.
- [ ] Golpear la pala en el extremo izquierdo envía la bola hacia la izquierda y en el extremo derecho hacia la derecha; en el centro, casi vertical.
- [ ] La velocidad de la bola es constante durante toda la partida.
- [ ] Se muestran 72 bloques en 6 filas de 12, un color por fila.
- [ ] Al romper un bloque desaparece, se reproduce su explosión y el puntaje aumenta exactamente 10.
- [ ] `break-sound.mp3` suena al romper un bloque y `ball-bounce.mp3` al rebotar en paredes o pala.
- [ ] Si la bola cae bajo la pala, las vidas bajan en 1 y el juego vuelve a `ready`.
- [ ] Con 0 vidas aparece la pantalla `gameover` con el puntaje final; Espacio reinicia con 3 vidas, 0 puntos y 72 bloques.
- [ ] Al romper los 72 bloques aparece la pantalla `win`; Espacio reinicia la partida.
- [ ] P o Esc pausa el juego (bola y pala congeladas) y vuelve a pulsarlo lo reanuda.
- [ ] El HUD muestra puntaje y vidas en todo momento durante la partida.
- [ ] No se usa ninguna dependencia ni build; solo `index.html`, `style.css`, `src/game.js` y los assets existentes.

## Decisions

- **Sí:** núcleo mínimo (un nivel, sin power-ups). Es lo que hace jugable al MVP sin abrir otros dominios.
- **Sí:** canvas 480x640 con bloques 40x20 (sprite 1.25x). Llena el ancho exacto con 12 columnas, sin huecos.
- **Sí:** teclado únicamente. Menor superficie; mouse/touch quedan para otra spec.
- **Sí:** ángulo de rebote según punto de impacto con velocidad constante. Da control al jugador y es el comportamiento clásico.
- **Sí:** estado `ready` con lanzamiento por Espacio tras perder una vida. Evita perder vidas sin reacción.
- **Sí:** un único archivo `src/game.js` con script clásico (sin módulos). Funciona con file:// y respeta `assets/spritesheet.js` global.
- **Sí:** SFX y explosiones, sin persistencia. Los assets ya existen; guardar datos añade complejidad sin valor para el MVP.
- **Sí:** velocidades iniciales (bola 320 px/s, pala 420 px/s, 60° máx.) como valores de partida, ajustables en las constantes sin cambiar la spec.
- **No:** bloques `gray` o con `hp`. Todos son de 1 golpe.
- **No:** varios archivos `src/*.js`. Prematuro para ~300 líneas; se divide en otra spec si crece.
- **No:** aceleración de la bola.

## Risks

| Risk | Mitigation |
| --- | --- |
| Bola "atraviesa" bloques/pala a velocidad alta con delta time grande | Limitar `dt` (p. ej. máx. 1/30 s) y/o subdividir el movimiento en pasos pequeños. |
| Navegadores bloquean audio antes de interacción del usuario | El primer sonido ocurre tras pulsar Espacio; capturar errores de `play()` sin romper el juego. |
| Sonidos solapados se cortan al reutilizar un único `Audio` | Clonar el elemento (`cloneNode`) o reiniciar `currentTime` antes de cada `play()`. |
| Sprite de pala 162x14 reescalado se ve deformado | Aceptado en MVP; ajustar `paddle.w` si se ve mal. |
| Rebote en esquina de bloque elige el eje equivocado | Resolver por eje de menor penetración y un solo bloque por frame. |

## What is **not** in this spec

- Múltiples niveles.
- Power-ups.
- Bloques resistentes o indestructibles.
- Mouse o touch.
- High score o persistencia.
- Aceleración de la bola.
- Versión móvil / responsive.

Cada uno, si se hace, va en su propia spec.
