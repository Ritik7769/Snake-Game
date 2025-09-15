class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [{x: 10, y: 10}];
        this.food = {x: 15, y: 15};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gameLoop = null;
        
        this.highScoreElement.textContent = this.highScore;
        
        this.setupEventListeners();
        this.draw();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startBtn').addEventListener('click', this.startGame.bind(this));
        document.getElementById('pauseBtn').addEventListener('click', this.pauseGame.bind(this));
        document.getElementById('resetBtn').addEventListener('click', this.resetGame.bind(this));
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        const key = e.key.toLowerCase();
        
        if ((key === 'arrowleft' || key === 'a') && this.dx !== 1) {
            this.dx = -1;
            this.dy = 0;
        } else if ((key === 'arrowup' || key === 'w') && this.dy !== 1) {
            this.dx = 0;
            this.dy = -1;
        } else if ((key === 'arrowright' || key === 'd') && this.dx !== -1) {
            this.dx = 1;
            this.dy = 0;
        } else if ((key === 'arrowdown' || key === 's') && this.dy !== -1) {
            this.dx = 0;
            this.dy = 1;
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        document.getElementById('startBtn').textContent = 'Playing...';
        
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
        }
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 150);
    }
    
    pauseGame() {
        if (!this.gameRunning) return;
        
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        document.getElementById('startBtn').textContent = 'Resume';
    }
    
    resetGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        this.snake = [{x: 10, y: 10}];
        this.food = {x: 15, y: 15};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        
        this.scoreElement.textContent = this.score;
        document.getElementById('startBtn').textContent = 'Start Game';
        document.getElementById('startBtn').className = '';
        
        this.draw();
    }
    
    update() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
            
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }
    
    generateFood() {
        let validPosition = false;
        
        while (!validPosition) {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            validPosition = true;
            for (let segment of this.snake) {
                if (this.food.x === segment.x && this.food.y === segment.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        document.getElementById('startBtn').textContent = 'Game Over - Restart';
        document.getElementById('startBtn').className = 'game-over';
    }
    
    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.shadowColor = '#4ecdc4';
        this.ctx.shadowBlur = 10;
        
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            this.ctx.fillStyle = i === 0 ? '#2dd4bf' : '#4ecdc4';
            this.ctx.fillRect(
                segment.x * this.gridSize + 2, 
                segment.y * this.gridSize + 2, 
                this.gridSize - 4, 
                this.gridSize - 4
            );
        }
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2, 
            this.food.y * this.gridSize + 2, 
            this.gridSize - 4, 
            this.gridSize - 4
        );
        
        this.ctx.shadowBlur = 0;
    }
}

window.addEventListener('load', () => {
    new SnakeGame();
});
