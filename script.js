// Snake — Deluxe (no external assets)
// Features: difficulty, level-ups, high score, mobile controls, WebAudio sounds, fancy UI.

const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');
const btnHelp = document.getElementById('btnHelp');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');
const difficultySel = document.getElementById('difficulty');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');
const toast = document.getElementById('toast');
const dpad = document.getElementById('dpad');

const grid = 20;                   // px per tile
const tiles = Math.floor(cvs.width / grid); // 21 tiles (420/20)
let snake, dir, fruit, score, level, baseSpeed, loopId, paused, lastTick;
let high = +localStorage.getItem('snakeHigh') || 0;
highEl.textContent = high;

function resetGame(keepDifficulty=false) {
  snake = [{x:10, y:10}];
  dir = {x: 0, y: 0};
  fruit = randFruit();
  score = 0;
  level = 1;
  baseSpeed = parseInt(difficultySel.value, 10);
  paused = false;
  lastTick = 0;
  updateHUD();
  if (!keepDifficulty) difficultySel.value = difficultySel.value;
  clearLoop();
}

function randFruit() {
  // Avoid spawning fruit on snake
  let f;
  do {
    f = { x: Math.floor(Math.random()*tiles), y: Math.floor(Math.random()*tiles) };
  } while (snake.some(s => s.x === f.x && s.y === f.y));
  return f;
}

function setDir(nx, ny) {
  // Prevent 180 turns
  if (snake.length > 1 && snake[0].x + nx === snake[1].x && snake[0].y + ny === snake[1].y) return;
  dir = {x: nx, y: ny};
}

document.addEventListener('keydown', (e)=> {
  if (e.key === 'ArrowLeft')  setDir(-1, 0);
  if (e.key === 'ArrowRight') setDir( 1, 0);
  if (e.key === 'ArrowUp')    setDir( 0,-1);
  if (e.key === 'ArrowDown')  setDir( 0, 1);
  if (e.key === ' ') paused ? resume() : pause();
});

dpad.addEventListener('click', (e)=>{
  const b = e.target.closest('button'); if(!b) return;
  const d = b.dataset.dir;
  if (d === 'up') setDir(0,-1);
  if (d === 'down') setDir(0,1);
  if (d === 'left') setDir(-1,0);
  if (d === 'right') setDir(1,0);
});

// Swipe controls
let touchStartX=0, touchStartY=0;
cvs.addEventListener('touchstart', (e)=> {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive:true});
cvs.addEventListener('touchend', (e)=> {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) setDir(1,0); else setDir(-1,0);
  } else {
    if (dy > 0) setDir(0,1); else setDir(0,-1);
  }
});

// UI buttons
btnStart.addEventListener('click', ()=> { resetGame(true); start(); });
btnPause.addEventListener('click', ()=> { paused ? resume() : pause(); });
btnReset.addEventListener('click', ()=> { resetGame(); draw(); });
btnHelp.addEventListener('click', ()=> helpModal.showModal());
closeHelp.addEventListener('click', ()=> helpModal.close());

// WebAudio tones (no external MP3s)
let audioCtx;
function tone(freq=440, dur=0.08, type='square', vol=0.03) {
  try {
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); }, dur*1000);
  } catch (e) { /* ignore */ }
}
function sfxEat(){ tone(640, .06, 'sine', .05); tone(880, .06, 'square', .04); }
function sfxOver(){ tone(130, .18, 'sawtooth', .05); }

function tick(now) {
  const speed = Math.max(40, baseSpeed - (level-1)*10); // increases with level
  if (!lastTick) lastTick = now;
  if (now - lastTick >= speed) {
    step();
    lastTick = now;
  }
  draw();
  loopId = requestAnimationFrame(tick);
  speedEl.textContent = speed;
}

function start() {
  if (loopId) cancelAnimationFrame(loopId);
  lastTick = 0;
  loopId = requestAnimationFrame(tick);
}

function pause() {
  if (loopId) cancelAnimationFrame(loopId);
  loopId = null;
  paused = true;
  showToast('⏸ Paused');
}

function resume() {
  if (!loopId) {
    paused = false;
    showToast('▶ Resumed');
    start();
  }
}

function clearLoop() { if (loopId) cancelAnimationFrame(loopId); loopId = null; }

function step() {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (dir.x === 0 && dir.y === 0) return; // not moving yet
  // Collisions: walls
  if (head.x < 0 || head.y < 0 || head.x >= tiles || head.y >= tiles) {
    gameOver(); return;
  }
  // Collisions: self
  if (snake.some((s,i)=> i>0 && s.x===head.x && s.y===head.y)) {
    gameOver(); return;
  }

  snake.unshift(head);

  // Fruit
  if (head.x === fruit.x && head.y === fruit.y) {
    score += 10;
    fruit = randFruit();
    sfxEat();
    if (score % 50 === 0) levelUp();
  } else {
    snake.pop();
  }
  updateHUD();
}

function levelUp() {
  level++;
  showToast(`⏫ Level ${level}! Faster!`);
}

function gameOver() {
  sfxOver();
  showToast(`💀 Game Over — Score ${score}`);
  if (score > high) {
    high = score;
    localStorage.setItem('snakeHigh', high);
  }
  updateHUD();
  clearLoop();
}

function updateHUD() {
  scoreEl.textContent = score;
  highEl.textContent = high;
  levelEl.textContent = level;
}

function draw() {
  // background grid
  ctx.clearRect(0,0,cvs.width,cvs.height);
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  for (let i=0;i<tiles;i++){
    for(let j=0;j<tiles;j++){
      if((i+j)%2===0){
        ctx.fillRect(i*grid, j*grid, grid, grid);
      }
    }
  }
  // snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i===0 ? '#22d3ee' : '#6366f1';
    ctx.fillRect(snake[i].x*grid+1, snake[i].y*grid+1, grid-2, grid-2);
  }
  // fruit
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(fruit.x*grid + grid/2, fruit.y*grid + grid/2, grid*0.35, 0, Math.PI*2);
  ctx.fill();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove('show'), 1500);
}

// Initialize
resetGame();
draw();
helpModal.showModal();
