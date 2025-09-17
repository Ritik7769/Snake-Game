/* Responsive Snake Game
   - canvas resizes to fit container
   - fixed tile count (20) for consistent gameplay across sizes
   - devicePixelRatio handled for crisp rendering
   - keyboard + touch controls
*/

class SnakeGame {
  constructor() {
    // DOM
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('highScore');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.touchControls = document.getElementById('touchControls');

    // config
    this.tileCount = 20;            // grid: 20x20 tiles
    this.gridSize = 20;            // will be recalculated by resize()
    this.snake = [{x:10,y:10}];
    this.food = {x:15,y:15};
    this.dx = 0; this.dy = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    this.gameRunning = false;
    this.gameLoop = null;
    this.stepMs = 140; // speed

    // init
    this.highScoreEl.textContent = this.highScore;
    this.bindEvents();
    this.resizeCanvas();
    this.draw(); // initial draw
  }

  bindEvents(){
    window.addEventListener('resize', () => this.onResizeDebounced());
    // keyboard
    document.addEventListener('keydown', (e) => this.handleKey(e));
    // buttons
    this.startBtn.addEventListener('click', () => this.toggleStart());
    this.pauseBtn.addEventListener('click', () => this.pauseGame());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    // touch controls
    document.querySelectorAll('#touchControls [data-dir]').forEach(btn=>{
      btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); this.setDirectionFromData(btn.dataset.dir); });
      btn.addEventListener('mousedown', ()=> this.setDirectionFromData(btn.dataset.dir));
    });
    // visibility: pause when hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameRunning) this.pauseGame();
    });
  }

  // debounced resize to avoid thrash
  onResizeDebounced(){
    clearTimeout(this._rsT);
    this._rsT = setTimeout(()=> this.resizeCanvas(), 120);
  }

  resizeCanvas(){
    // compute gridSize so canvas is square and fits container width
    const wrap = this.canvas.parentElement;
    const available = Math.min(wrap.clientWidth, window.innerHeight * 0.6);
    // ensure at least 10px per tile
    const gs = Math.max(8, Math.floor(available / this.tileCount));
    this.gridSize = gs;
    // set logical size (CSS size controlled by width)
    const cssSize = this.gridSize * this.tileCount;
    // handle devicePixelRatio for crisp canvas
    const ratio = window.devicePixelRatio || 1;
    this.canvas.style.width = cssSize + 'px';
    this.canvas.style.height = cssSize + 'px';
    this.canvas.width = cssSize * ratio;
    this.canvas.height = cssSize * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // recalc tileCount may remain the same; keep snake positions valid
    this.draw();
    // show touch controls on small screens
    if (window.innerWidth <= 600) {
      this.touchControls.setAttribute('aria-hidden','false');
      this.touchControls.style.display = 'flex';
    } else {
      this.touchControls.setAttribute('aria-hidden','true');
      this.touchControls.style.display = 'none';
    }
  }

  handleKey(e){
    if (!this.gameRunning && (e.key.toLowerCase() === 'arrowright' || e.key.toLowerCase() === 'd' ||
        e.key.toLowerCase() === 'arrowleft' || e.key.toLowerCase() === 'a' ||
        e.key.toLowerCase() === 'arrowup' || e.key.toLowerCase() === 'w' ||
        e.key.toLowerCase() === 'arrowdown' || e.key.toLowerCase() === 's')) {
      // if game not running, pressing direction should start movement (but not start game loop)
      this.startMovementFromKey(e.key.toLowerCase());
      return;
    }
    if (!this.gameRunning) return;

    const key = e.key.toLowerCase();
    if ((key === 'arrowleft' || key === 'a') && this.dx !== 1) { this.dx = -1; this.dy = 0; }
    else if ((key === 'arrowup' || key === 'w') && this.dy !== 1) { this.dx = 0; this.dy = -1; }
    else if ((key === 'arrowright' || key === 'd') && this.dx !== -1) { this.dx = 1; this.dy = 0; }
    else if ((key === 'arrowdown' || key === 's') && this.dy !== -1) { this.dx = 0; this.dy = 1; }
  }

  startMovementFromKey(key){
    if ((key === 'arrowleft' || key === 'a')) { this.dx = -1; this.dy = 0; }
    else if ((key === 'arrowup' || key === 'w')) { this.dx = 0; this.dy = -1; }
    else if ((key === 'arrowright' || key === 'd')) { this.dx = 1; this.dy = 0; }
    else if ((key === 'arrowdown' || key === 's')) { this.dx = 0; this.dy = 1; }
  }

  setDirectionFromData(dir){
    if (!this.gameRunning) this.startGame();
    if (dir === 'up' && this.dy !== 1){ this.dx = 0; this.dy = -1; }
    if (dir === 'down' && this.dy !== -1){ this.dx = 0; this.dy = 1; }
    if (dir === 'left' && this.dx !== 1){ this.dx = -1; this.dy = 0; }
    if (dir === 'right' && this.dx !== -1){ this.dx = 1; this.dy = 0; }
  }

  toggleStart(){
    if (this.gameRunning) return;
    this.startGame();
  }

  startGame(){
    if (this.gameRunning) return;
    this.gameRunning = true;
    this.startBtn.textContent = 'Playing...';
    if (this.dx === 0 && this.dy === 0) { this.dx = 1; this.dy = 0; } // default right
    this.gameLoop = setInterval(()=>{ this.update(); this.draw(); }, this.stepMs);
  }

  pauseGame(){
    if (!this.gameRunning) return;
    this.gameRunning = false;
    clearInterval(this.gameLoop);
    this.startBtn.textContent = 'Resume';
  }

  resetGame(){
    this.gameRunning = false;
    clearInterval(this.gameLoop);
    this.snake = [{x: Math.floor(this.tileCount/2), y: Math.floor(this.tileCount/2)}];
    this.food = this.randomFoodPosition();
    this.dx = 0; this.dy = 0;
    this.score = 0;
    this.scoreEl.textContent = this.score;
    this.startBtn.textContent = 'Start';
    this.startBtn.className = '';
    this.draw();
  }

  randomFoodPosition(){
    let pos;
    let valid = false;
    while(!valid){
      pos = { x: Math.floor(Math.random() * this.tileCount), y: Math.floor(Math.random() * this.tileCount) };
      valid = !this.snake.some(s => s.x === pos.x && s.y === pos.y);
    }
    return pos;
  }

  update(){
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    // wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // self collision
    for (let seg of this.snake) {
      if (head.x === seg.x && head.y === seg.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // eat food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.scoreEl.textContent = this.score;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.highScoreEl.textContent = this.highScore;
        localStorage.setItem('snakeHighScore', this.highScore);
      }
      this.food = this.randomFoodPosition();
    } else {
      this.snake.pop();
    }
  }

  gameOver(){
    this.gameRunning = false;
    clearInterval(this.gameLoop);
    this.startBtn.textContent = 'Game Over - Restart';
    this.startBtn.classList.add('game-over');
  }

  draw(){
    const ctx = this.ctx;
    const gs = this.gridSize;
    const size = gs * this.tileCount;

    // background gradient
    const g = ctx.createLinearGradient(0,0,size,size);
    g.addColorStop(0,'#1a1a2e');
    g.addColorStop(1,'#16213e');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);

    // draw snake
    ctx.shadowBlur = 8;
    for (let i = 0; i < this.snake.length; i++){
      const s = this.snake[i];
      ctx.fillStyle = i===0 ? '#2dd4bf' : '#4ecdc4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(s.x * gs + 2, s.y * gs + 2, gs - 4, gs - 4);
    }

    // draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.fillRect(this.food.x * gs + 2, this.food.y * gs + 2, gs - 4, gs - 4);
    ctx.shadowBlur = 0;
  }
}

// initialize on load
window.addEventListener('load', () => {
  const game = new SnakeGame();

  // expose quick controls on global for debugging
  window.snakeGame = game;
});
