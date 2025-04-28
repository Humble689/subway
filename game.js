class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: 100,
            y: this.canvas.height / 2,
            width: 40,
            height: 60,
            speed: 5,
            baseSpeed: 5,
            lane: 1,
            color: '#FF0000',
            hasShield: false,
            speedBoost: false,
            scoreMultiplier: false,
            frame: 0,
            frameCount: 0
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.animationId = null;
        
        this.lanePositions = [
            this.canvas.height / 4,
            this.canvas.height / 2,
            (this.canvas.height / 4) * 3
        ];
        
        this.powerUpTypes = {
            SPEED: { 
                symbol: '⚡',
                color: '#FFA500',
                duration: 5000,
                effect: 'speedBoost',
                label: 'SPEED'
            },
            SHIELD: { 
                symbol: '🛡️',
                color: '#00FFFF',
                duration: 3000,
                effect: 'hasShield',
                label: 'SHIELD'
            },
            MULTIPLIER: { 
                symbol: '✖️',
                color: '#FFFF00',
                duration: 4000,
                effect: 'scoreMultiplier',
                label: '2x SCORE'
            }
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.isPaused || this.gameOver) return;
            
            if (e.key === 'ArrowUp' && this.player.lane > 0) {
                this.player.lane--;
            } else if (e.key === 'ArrowDown' && this.player.lane < 2) {
                this.player.lane++;
            }
        });
        
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (!this.isPaused && !this.gameOver) {
            this.gameLoop();
        }
    }
    
    startGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear any existing power-up timers
        if (this.speedBoostTimer) clearTimeout(this.speedBoostTimer);
        if (this.hasShieldTimer) clearTimeout(this.hasShieldTimer);
        if (this.scoreMultiplierTimer) clearTimeout(this.scoreMultiplierTimer);
        
        // Reset player state
        this.player.lane = 1;
        this.player.hasShield = false;
        this.player.speedBoost = false;
        this.player.scoreMultiplier = false;
        
        this.obstacles = [];
        this.powerUps = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        document.getElementById('score').textContent = '0';
        document.getElementById('pauseButton').textContent = 'Pause';
        
        console.log('Game started, player state:', this.player);
        
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
        const powerUpType = this.powerUpTypes[randomType];
        
        console.log('Creating power-up:', randomType);
        
        this.powerUps.push({
            x: this.canvas.width,
            y: this.lanePositions[lane],
            width: 40,
            height: 40,
            speed: 7,
            type: randomType,
            symbol: powerUpType.symbol,
            color: powerUpType.color,
            label: powerUpType.label,
            active: false,
            duration: powerUpType.duration
        });
    }
    
    update() {
        // Update player position
        this.player.y = this.lanePositions[this.player.lane];
        
        // Apply speed boost effect
        if (this.player.speedBoost) {
            this.player.speed = this.player.baseSpeed * 1.5; // 50% speed increase
        } else {
            this.player.speed = this.player.baseSpeed;
        }
        
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
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkPowerUpCollision(this.player, powerUp)) {
                this.activatePowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
        
        // Update score
        const scoreIncrement = this.player.scoreMultiplier ? 2 : 1;
        this.score += scoreIncrement;
        document.getElementById('score').textContent = Math.floor(this.score / 10);
    }
    
    checkCollision(player, obstacle) {
        // Adjust collision box to match character size
        const collisionBox = {
            x: player.x - 5, // Include arms
            y: player.y,
            width: player.width + 10, // Include arms
            height: player.height
        };
        
        if (this.player.hasShield) {
            console.log('Shield is active!');
            return false;
        }
        
        const collision = collisionBox.x < obstacle.x + obstacle.width &&
               collisionBox.x + collisionBox.width > obstacle.x &&
               collisionBox.y < obstacle.y + obstacle.height &&
               collisionBox.y + collisionBox.height > obstacle.y;
        
        if (collision) {
            console.log('Collision detected!');
        }
        
        return collision;
    }
    
    checkPowerUpCollision(player, powerUp) {
        const playerCenterX = player.x + player.width/2;
        const playerCenterY = player.y + player.height/2;
        const powerUpCenterX = powerUp.x + powerUp.width/2;
        const powerUpCenterY = powerUp.y + powerUp.height/2;
        
        const distance = Math.sqrt(
            Math.pow(playerCenterX - powerUpCenterX, 2) +
            Math.pow(playerCenterY - powerUpCenterY, 2)
        );
        
        return distance < (player.width/2 + powerUp.width/2);
    }
    
    activatePowerUp(powerUp) {
        console.log('Activating power-up:', powerUp.type);
        const effect = this.powerUpTypes[powerUp.type].effect;
        
        // Cancel any existing timer for this effect
        if (this[`${effect}Timer`]) {
            clearTimeout(this[`${effect}Timer`]);
            console.log('Cleared existing timer for:', effect);
        }
        
        // Activate the effect
        this.player[effect] = true;
        console.log('Effect activated:', effect, 'New state:', this.player[effect]);
        
        // Show feedback
        this.showPowerUpFeedback(powerUp);
        
        // Set timer to deactivate the effect
        this[`${effect}Timer`] = setTimeout(() => {
            this.player[effect] = false;
            console.log('Effect deactivated:', effect, 'New state:', this.player[effect]);
            this.showPowerUpExpired(powerUp);
        }, powerUp.duration);
    }
    
    showPowerUpFeedback(powerUp) {
        // Create a temporary text element to show power-up collection
        const feedback = {
            text: `+${powerUp.label}`,
            x: this.player.x,
            y: this.player.y - 20,
            color: powerUp.color,
            alpha: 1,
            duration: 1000 // 1 second
        };
        
        // Animate the feedback text
        const startTime = Date.now();
        const animateFeedback = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / feedback.duration;
            
            if (progress < 1) {
                feedback.y -= 2; // Move up
                feedback.alpha = 1 - progress; // Fade out
                
                this.ctx.fillStyle = `rgba(${this.hexToRgb(feedback.color)}, ${feedback.alpha})`;
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(feedback.text, feedback.x + this.player.width/2, feedback.y);
                
                requestAnimationFrame(animateFeedback);
            }
        };
        
        animateFeedback();
    }
    
    showPowerUpExpired(powerUp) {
        // Create a temporary text element to show power-up expiration
        const feedback = {
            text: `${powerUp.label} expired`,
            x: this.player.x,
            y: this.player.y - 20,
            color: powerUp.color,
            alpha: 1,
            duration: 1000 // 1 second
        };
        
        // Animate the feedback text
        const startTime = Date.now();
        const animateFeedback = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / feedback.duration;
            
            if (progress < 1) {
                feedback.y -= 2; // Move up
                feedback.alpha = 1 - progress; // Fade out
                
                this.ctx.fillStyle = `rgba(${this.hexToRgb(feedback.color)}, ${feedback.alpha})`;
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(feedback.text, feedback.x + this.player.width/2, feedback.y);
                
                requestAnimationFrame(animateFeedback);
            }
        };
        
        animateFeedback();
    }
    
    hexToRgb(hex) {
        // Convert hex color to RGB
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '0, 0, 0';
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player character
        this.drawCharacter();
        
        // Draw shield if active
        if (this.player.hasShield) {
            // Draw shield background
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2,
                this.player.width + 10,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.fill();
            
            // Draw shield border
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2,
                this.player.width + 10,
                0,
                Math.PI * 2
            );
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Draw shield symbol
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🛡️', this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        }
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            // Draw background circle
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fill();
            
            // Draw symbol
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.symbol, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
            
            // Draw label below
            this.ctx.font = '12px Arial';
            this.ctx.fillText(powerUp.label, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height + 15);
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
        
        // Draw pause message
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawCharacter() {
        const { x, y, width, height } = this.player;
        
        // Update animation frame
        this.player.frameCount++;
        if (this.player.frameCount >= 10) {
            this.player.frame = (this.player.frame + 1) % 2;
            this.player.frameCount = 0;
        }
        
        // Draw body
        this.ctx.fillStyle = '#3498db'; // Blue shirt
        this.ctx.fillRect(x, y + 10, width, height - 20);
        
        // Draw head
        this.ctx.fillStyle = '#f1c40f'; // Yellow head
        this.ctx.beginPath();
        this.ctx.arc(x + width/2, y, width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eyes
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + width/3, y - 5, 3, 0, Math.PI * 2);
        this.ctx.arc(x + 2*width/3, y - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw arms
        this.ctx.fillStyle = '#3498db';
        const armY = this.player.frame === 0 ? y + 15 : y + 25;
        // Left arm
        this.ctx.fillRect(x - 5, armY, 5, 15);
        // Right arm
        this.ctx.fillRect(x + width, armY, 5, 15);
        
        // Draw legs
        this.ctx.fillStyle = '#2c3e50'; // Dark pants
        const legY = this.player.frame === 0 ? y + height - 15 : y + height - 25;
        // Left leg
        this.ctx.fillRect(x + 5, legY, 10, 15);
        // Right leg
        this.ctx.fillRect(x + width - 15, legY, 10, 15);
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
        if (!this.gameOver && !this.isPaused) {
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