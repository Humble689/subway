class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: 100,
            y: this.canvas.height / 2,
            width: 50,
            height: 50,
            speed: 5,
            lane: 1, // 0: top, 1: middle, 2: bottom
            color: '#FF0000'
        };
        
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.animationId = null;
        
        this.lanePositions = [
            this.canvas.height / 4,
            this.canvas.height / 2,
            (this.canvas.height / 4) * 3
        ];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && this.player.lane > 0) {
                this.player.lane--;
            } else if (e.key === 'ArrowDown' && this.player.lane < 2) {
                this.player.lane++;
            }
        });
        
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    startGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.player.lane = 1;
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        document.getElementById('score').textContent = '0';
        
        this.gameLoop();
    }
    
    createObstacle() {
        const lane = Math.floor(Math.random() * 3);
        this.obstacles.push({
            x: this.canvas.width,
            y: this.lanePositions[lane],
            width: 30,
            height: 30,
            speed: 7,
            color: '#00FF00'
        });
    }
    
    update() {
        // Update player position
        this.player.y = this.lanePositions[this.player.lane];
        
        // Create new obstacles
        if (Math.random() < 0.02) {
            this.createObstacle();
        }
        
        // Update obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= obstacle.speed;
            return obstacle.x > -obstacle.width;
        });
        
        // Check collisions
        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver = true;
            }
        });
        
        // Update score
        this.score++;
        document.getElementById('score').textContent = Math.floor(this.score / 10);
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
}); 