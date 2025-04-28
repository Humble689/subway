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
            color: '#FF0000',
            hasShield: false,
            speedBoost: false,
            scoreMultiplier: false
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.score = 0;
        this.gameOver = false;
        this.animationId = null;
        
        this.lanePositions = [
            this.canvas.height / 4,
            this.canvas.height / 2,
            (this.canvas.height / 4) * 3
        ];
        
        this.powerUpTypes = {
            SPEED: { color: '#FFA500', duration: 5000, effect: 'speedBoost' },
            SHIELD: { color: '#00FFFF', duration: 3000, effect: 'shield' },
            MULTIPLIER: { color: '#FFFF00', duration: 4000, effect: 'scoreMultiplier' }
        };
        
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
        this.powerUps = [];
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
    
    createPowerUp() {
        const lane = Math.floor(Math.random() * 3);
        const powerUpTypes = Object.keys(this.powerUpTypes);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        this.powerUps.push({
            x: this.canvas.width,
            y: this.lanePositions[lane],
            width: 30,
            height: 30,
            speed: 7,
            type: randomType,
            color: this.powerUpTypes[randomType].color,
            active: false,
            duration: this.powerUpTypes[randomType].duration
        });
    }
    
    update() {
        // Update player position
        this.player.y = this.lanePositions[this.player.lane];
        
        // Create new obstacles and power-ups
        if (Math.random() < 0.02) {
            this.createObstacle();
        }
        if (Math.random() < 0.01) {
            this.createPowerUp();
        }
        
        // Update obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= obstacle.speed;
            return obstacle.x > -obstacle.width;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.x -= powerUp.speed;
            return powerUp.x > -powerUp.width;
        });
        
        // Check collisions with obstacles
        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle) && !this.player.hasShield) {
                this.gameOver = true;
            }
        });
        
        // Check collisions with power-ups
        this.powerUps.forEach((powerUp, index) => {
            if (this.checkCollision(this.player, powerUp)) {
                this.activatePowerUp(powerUp);
                this.powerUps.splice(index, 1);
            }
        });
        
        // Update score
        const scoreIncrement = this.player.scoreMultiplier ? 2 : 1;
        this.score += scoreIncrement;
        document.getElementById('score').textContent = Math.floor(this.score / 10);
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    activatePowerUp(powerUp) {
        const effect = this.powerUpTypes[powerUp.type].effect;
        this.player[effect] = true;
        
        setTimeout(() => {
            this.player[effect] = false;
        }, powerUp.duration);
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw shield if active
        if (this.player.hasShield) {
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.player.x - 5, this.player.y - 5, this.player.width + 10, this.player.height + 10);
        }
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        });
        
        // Draw active power-up indicators
        this.drawPowerUpIndicators();
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawPowerUpIndicators() {
        const indicators = [];
        if (this.player.speedBoost) indicators.push({ text: 'SPEED', color: '#FFA500' });
        if (this.player.hasShield) indicators.push({ text: 'SHIELD', color: '#00FFFF' });
        if (this.player.scoreMultiplier) indicators.push({ text: '2x SCORE', color: '#FFFF00' });
        
        indicators.forEach((indicator, index) => {
            this.ctx.fillStyle = indicator.color;
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(indicator.text, this.canvas.width - 20, 30 + (index * 30));
        });
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