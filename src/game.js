const CANVAS_W = 480;
const CANVAS_H = 640;

const PADDLE_W = 80;
const PADDLE_H = 14;
const PADDLE_SPEED = 420;
const PADDLE_BOTTOM_MARGIN = 40;

const BALL_R = 6;
const BALL_SPEED = 320;
const BALL_MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; // máx. respecto a la vertical
const BALL_LAUNCH_ANGLE = 20 * Math.PI / 180; // respecto a la vertical, hacia la derecha

const BLOCK_COLS = 12;
const BLOCK_ROWS = 6;
const BLOCK_W = 40; // 12 * 40 = 480 (sprite 32x16 a 1.25x)
const BLOCK_H = 20;
const BLOCK_TOP = 80; // margen superior para el HUD
const BLOCK_COLORS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ]; // fila 0..5

const BLOCK_POINTS = 10;
const INITIAL_LIVES = 3;

const SFX_BOUNCE = new Audio( 'assets/sounds/ball-bounce.mp3' );
const SFX_BREAK = new Audio( 'assets/sounds/break-sound.mp3' );

function playSfx( audio ) {
  const a = audio.cloneNode();
  const p = a.play();
  if ( p && p.catch ) p.catch( () => {} );
}

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const state = {
  score: 0,
  lives: INITIAL_LIVES,
  mode: 'start', // 'start' | 'ready' | 'playing' | 'paused' | 'gameover' | 'win'
  ball: { x: 0, y: 0, r: BALL_R, vx: 0, vy: 0, speed: BALL_SPEED },
  blocks: [],
  explosions: [], // { x, y, w, h, color, elapsed } en ms
  paddle: {
    x: ( CANVAS_W - PADDLE_W ) / 2,
    y: CANVAS_H - PADDLE_BOTTOM_MARGIN,
    w: PADDLE_W,
    h: PADDLE_H,
    speed: PADDLE_SPEED,
  },
  keys: { left: false, right: false },
};

let lastTime = 0;

const KEY_MAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

function createBlocks() {
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: col * BLOCK_W,
        y: BLOCK_TOP + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: BLOCK_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return blocks;
}

state.blocks = createBlocks();

function resetBall() {
  const p = state.paddle;
  const b = state.ball;
  b.x = p.x + p.w / 2;
  b.y = p.y - b.r;
  b.vx = 0;
  b.vy = 0;
}

function launchBall() {
  const b = state.ball;
  b.vx = b.speed * Math.sin( BALL_LAUNCH_ANGLE );
  b.vy = -b.speed * Math.cos( BALL_LAUNCH_ANGLE );
  state.mode = 'playing';
}

function resetGame() {
  state.score = 0;
  state.lives = INITIAL_LIVES;
  state.blocks = createBlocks();
  state.explosions = [];
  state.paddle.x = ( CANVAS_W - PADDLE_W ) / 2;
  state.mode = 'ready';
  resetBall();
}

window.addEventListener( 'keydown', ( e ) => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( e.repeat ) return;
    if ( state.mode === 'ready' ) launchBall();
    else if ( state.mode === 'start' || state.mode === 'gameover' || state.mode === 'win' ) resetGame();
    return;
  }
  if ( e.code === 'KeyP' || e.code === 'Escape' ) {
    e.preventDefault();
    if ( e.repeat ) return;
    if ( state.mode === 'playing' ) state.mode = 'paused';
    else if ( state.mode === 'paused' ) state.mode = 'playing';
    return;
  }
  const k = KEY_MAP[ e.code ];
  if ( k ) {
    state.keys[ k ] = true;
    e.preventDefault();
  }
} );

window.addEventListener( 'keyup', ( e ) => {
  const k = KEY_MAP[ e.code ];
  if ( k ) state.keys[ k ] = false;
} );

function update( dt ) {
  if ( state.mode === 'paused' || state.mode === 'start' ) return;

  const p = state.paddle;
  const dir = ( state.keys.right ? 1 : 0 ) - ( state.keys.left ? 1 : 0 );
  p.x += dir * p.speed * dt;
  p.x = Math.max( 0, Math.min( CANVAS_W - p.w, p.x ) );

  for ( const ex of state.explosions ) ex.elapsed += dt * 1000;
  state.explosions = state.explosions.filter( ( ex ) => ex.elapsed < EXPLOSION_DURATION );

  const b = state.ball;
  if ( state.mode === 'ready' ) {
    resetBall();
    return;
  }
  if ( state.mode !== 'playing' ) return;

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if ( b.x - b.r < 0 ) {
    b.x = b.r;
    b.vx = Math.abs( b.vx );
    playSfx( SFX_BOUNCE );
  } else if ( b.x + b.r > CANVAS_W ) {
    b.x = CANVAS_W - b.r;
    b.vx = -Math.abs( b.vx );
    playSfx( SFX_BOUNCE );
  }
  if ( b.y - b.r < 0 ) {
    b.y = b.r;
    b.vy = Math.abs( b.vy );
    playSfx( SFX_BOUNCE );
  }

  // Rebote en la pala: solo si la bola baja y toca la cara superior.
  if (
    b.vy > 0 &&
    b.x + b.r > p.x && b.x - b.r < p.x + p.w &&
    b.y + b.r >= p.y && b.y - b.r < p.y + p.h
  ) {
    const offset = Math.max( -1, Math.min( 1, ( b.x - ( p.x + p.w / 2 ) ) / ( p.w / 2 ) ) );
    const angle = offset * BALL_MAX_BOUNCE_ANGLE;
    b.vx = b.speed * Math.sin( angle );
    b.vy = -b.speed * Math.cos( angle );
    b.y = p.y - b.r;
    playSfx( SFX_BOUNCE );
  }

  // Colisión con bloques: un solo bloque por frame, eje de menor penetración.
  for ( const blk of state.blocks ) {
    if ( !blk.alive ) continue;
    const nx = Math.max( blk.x, Math.min( b.x, blk.x + blk.w ) );
    const ny = Math.max( blk.y, Math.min( b.y, blk.y + blk.h ) );
    const dx = b.x - nx;
    const dy = b.y - ny;
    if ( dx * dx + dy * dy >= b.r * b.r ) continue;

    const overlapX = Math.min( b.x + b.r - blk.x, blk.x + blk.w - ( b.x - b.r ) );
    const overlapY = Math.min( b.y + b.r - blk.y, blk.y + blk.h - ( b.y - b.r ) );
    const blkCx = blk.x + blk.w / 2;
    const blkCy = blk.y + blk.h / 2;
    if ( overlapX < overlapY ) {
      b.vx = b.x < blkCx ? -Math.abs( b.vx ) : Math.abs( b.vx );
      b.x += b.x < blkCx ? -overlapX : overlapX;
    } else {
      b.vy = b.y < blkCy ? -Math.abs( b.vy ) : Math.abs( b.vy );
      b.y += b.y < blkCy ? -overlapY : overlapY;
    }

    blk.alive = false;
    state.score += BLOCK_POINTS;
    state.explosions.push( { x: blk.x, y: blk.y, w: blk.w, h: blk.h, color: blk.color, elapsed: 0 } );
    playSfx( SFX_BREAK );
    if ( state.blocks.every( ( x ) => !x.alive ) ) {
      state.mode = 'win';
      return;
    }
    break;
  }

  // Bola perdida: -1 vida; con 0 vidas, gameover.
  if ( b.y - b.r > CANVAS_H ) {
    state.lives -= 1;
    if ( state.lives <= 0 ) {
      state.mode = 'gameover';
    } else {
      state.mode = 'ready';
      resetBall();
    }
  }
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );

  for ( const blk of state.blocks ) {
    if ( blk.alive ) drawSprite( ctx, 'block_' + blk.color, blk.x, blk.y, blk.w, blk.h );
  }

  for ( const ex of state.explosions ) {
    const frames = EXPLOSION_FRAMES[ ex.color ];
    const i = Math.min( frames.length - 1, Math.floor( ex.elapsed / EXPLOSION_DURATION * frames.length ) );
    drawFrame( ctx, frames[ i ], ex.x, ex.y, ex.w, ex.h );
  }

  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText( 'Score: ' + state.score, 10, 24 );
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas: ' + state.lives, CANVAS_W - 10, 24 );
  ctx.textAlign = 'left';

  if ( state.mode === 'ready' || state.mode === 'playing' || state.mode === 'paused' ) {
    const b = state.ball;
    drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, b.r * 2, b.r * 2 );
  }

  switch ( state.mode ) {
    case 'start':
      drawOverlay( 'ARKANOID', 'Espacio para jugar' );
      break;
    case 'paused':
      drawOverlay( 'PAUSA', 'P / Esc para continuar' );
      break;
    case 'gameover':
      drawOverlay( 'GAME OVER', 'Puntaje: ' + state.score + ' - Espacio para reiniciar' );
      break;
    case 'win':
      drawOverlay( '¡VICTORIA!', 'Puntaje: ' + state.score + ' - Espacio para reiniciar' );
      break;
  }
}

function drawOverlay( title, subtitle ) {
  ctx.fillStyle = 'rgba( 0, 0, 0, 0.7 )';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '36px monospace';
  ctx.fillText( title, CANVAS_W / 2, CANVAS_H / 2 - 10 );
  ctx.font = '16px monospace';
  ctx.fillText( subtitle, CANVAS_W / 2, CANVAS_H / 2 + 24 );
  ctx.textAlign = 'left';
}

function loop( time ) {
  const dt = Math.min( ( time - lastTime ) / 1000, 1 / 30 );
  lastTime = time;
  update( dt );
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( ( t ) => {
    lastTime = t;
    requestAnimationFrame( loop );
  } );
} );
