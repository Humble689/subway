class Game {
    
    constructor() {
        // Check if canvas exists
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2D context!');
            return;
        }
        
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Check if localStorage is available
        let savedCoins = 0;
        try {
            savedCoins = parseInt(localStorage.getItem('playerCoins')) || 0;
        } catch (e) {
            console.warn('LocalStorage not available, using default coins value');
        }
        this.savedCoins = savedCoins;
        
        this.characters = {
            DEFAULT: {
                name: 'Default',
                price: 0,
                headColor: '#f1c40f',
                bodyColor: '#3498db',
                pantsColor: '#2c3e50',
                unlocked: true
            },
            NINJA: {
                name: 'Ninja',
                price: 500,
                headColor: '#2c3e50',
                bodyColor: '#2c3e50',
                pantsColor: '#2c3e50',
                unlocked: localStorage.getItem('unlocked_NINJA') === 'true'
            },
            ROBOT: {
                name: 'Robot',
                price: 1000,
                headColor: '#95a5a6',
                bodyColor: '#7f8c8d',
                pantsColor: '#34495e',
                unlocked: localStorage.getItem('unlocked_ROBOT') === 'true'
            },
            SUPERHERO: {
                name: 'Superhero',
                price: 1500,
                headColor: '#e74c3c',
                bodyColor: '#e74c3c',
                pantsColor: '#2c3e50',
                unlocked: localStorage.getItem('unlocked_SUPERHERO') === 'true'
            }
        };
        
        this.player = {
            x: 100,
            y: this.canvas.height / 2,
            width: 40,
            height: 60,
            speed: 5,
            baseSpeed: 5,
            lane: 1,
            character: localStorage.getItem('selectedCharacter') || 'DEFAULT',
            hasShield: false,
            speedBoost: false,
            scoreMultiplier: false,
            frame: 0,
            frameCount: 0,
            isJumping: false,
            isSliding: false,
            jumpVelocity: 0,
            gravity: 0.5,
            jumpHeight: 15,
            slideDuration: 1000,
            slideTimer: null,
            coins: this.savedCoins
        };
        
        // Add police officer (chaser)
        this.police = {
            x: -200,
            y: this.canvas.height / 2,
            width: 50,
            height: 70,
            speed: 4,
            lane: 1,
            distance: 0 // Distance behind player
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.coins = [];
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
                label: 'SPEED',
                price: 100
            },
            SHIELD: { 
                symbol: '🛡️',
                color: '#00FFFF',
                duration: 3000,
                effect: 'hasShield',
                label: 'SHIELD',
                price: 150
            },
            MULTIPLIER: { 
                symbol: '✖️',
                color: '#FFFF00',
                duration: 4000,
                effect: 'scoreMultiplier',
                label: '2x SCORE',
                price: 200
            }
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Check if buttons exist
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        const shopButton = document.getElementById('shopButton');
        
        if (!startButton || !pauseButton || !shopButton) {
            console.error('Required buttons not found!');
            return;
        }
        
        document.addEventListener('keydown', (e) => {
            if (this.isPaused || this.gameOver) return;
            
            if (e.key === 'ArrowUp' && !this.player.isJumping && !this.player.isSliding) {
                this.jump();
            } else if (e.key === 'ArrowDown' && !this.player.isJumping && !this.player.isSliding) {
                this.slide();
            } else if (e.key === 'ArrowLeft' && this.player.lane > 0) {
                this.player.lane--;
            } else if (e.key === 'ArrowRight' && this.player.lane < 2) {
                this.player.lane++;
            }
        });
        
        startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        pauseButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        shopButton.addEventListener('click', () => {
            this.toggleShop();
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
    
    toggleShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            this.closeShop();
        } else {
            this.openShop();
        }
    }
    
    startGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear any existing timers
        if (this.speedBoostTimer) clearTimeout(this.speedBoostTimer);
        if (this.hasShieldTimer) clearTimeout(this.hasShieldTimer);
        if (this.scoreMultiplierTimer) clearTimeout(this.scoreMultiplierTimer);
        if (this.player.slideTimer) clearTimeout(this.player.slideTimer);
        
        // Load saved coins from localStorage
        const savedCoins = parseInt(localStorage.getItem('playerCoins')) || 0;
        
        // Reset player state but keep saved coins
        this.player = {
            ...this.player,
            lane: 1,
            hasShield: false,
            speedBoost: false,
            scoreMultiplier: false,
            isJumping: false,
            isSliding: false,
            jumpVelocity: 0,
            coins: savedCoins  // Use the saved coins instead of resetting to 0
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.coins = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.police.distance = 0;
        this.police.lane = 1;
        
        document.getElementById('score').textContent = '0';
        document.getElementById('pauseButton').textContent = 'Pause';
        
        this.gameLoop();
    }
    
    createObstacle() {
        const lane = Math.floor(Math.random() * 3);
        const types = ['jump', 'slide'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.canvas.width,
            y: this.lanePositions[lane],
            width: 30,
            height: type === 'jump' ? 40 : 20, // Tall for jump, short for slide
            speed: 7,
            color: type === 'jump' ? '#FF0000' : '#00FF00', // Red for jump, green for slide
            type: type
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
    
    createCoin() {
        const lane = Math.floor(Math.random() * 3);
        const coin = {
            x: this.canvas.width,
            y: this.lanePositions[lane],
            width: 20,
            height: 20,
            speed: 7,
            value: 1,
            collected: false
        };
        this.coins.push(coin);
        console.log('New coin created at lane:', lane, 'Position:', coin.x, coin.y);
    }
    
    update() {
        if (this.gameOver || this.isPaused) return;
        
        // Update player position
        this.player.y = this.lanePositions[this.player.lane];
        
        // Handle jumping
        if (this.player.isJumping) {
            this.player.jumpVelocity += this.player.gravity;
            this.player.y += this.player.jumpVelocity;
            
            if (this.player.y >= this.lanePositions[this.player.lane]) {
                this.player.y = this.lanePositions[this.player.lane];
                this.player.isJumping = false;
                this.player.jumpVelocity = 0;
            }
        }
        
        // Apply speed boost effect with increased multiplier
        if (this.player.speedBoost) {
            this.player.speed = this.player.baseSpeed * 3; // Increased to 3x speed
        } else {
            this.player.speed = this.player.baseSpeed;
        }
        
        // Update police position
        this.police.distance += this.player.speed - this.police.speed;
        this.police.x = this.player.x - 200 - this.police.distance;
        this.police.y = this.lanePositions[this.police.lane];
        
        // Police occasionally changes lanes
        if (Math.random() < 0.01) {
            this.police.lane = Math.floor(Math.random() * 3);
        }
        
        // Create new obstacles and power-ups
        if (Math.random() < 0.02) {
            this.createObstacle();
        }
        if (Math.random() < 0.01) {
            this.createPowerUp();
        }
        if (Math.random() < 0.05) {
            this.createCoin();
        }
        
        // Update obstacles with speed boost effect
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= obstacle.speed * (this.player.speedBoost ? 1.5 : 1);
            return obstacle.x > -obstacle.width;
        });
        
        // Update power-ups with speed boost effect
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.x -= powerUp.speed * (this.player.speedBoost ? 1.5 : 1);
            return powerUp.x > -powerUp.width;
        });
        
        // Update coins with speed boost effect
        this.coins = this.coins.filter(coin => {
            coin.x -= coin.speed * (this.player.speedBoost ? 1.5 : 1);
            return coin.x > -coin.width;
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
        
        // Check coin collection
        this.checkCoinCollection();
        
        // Update score
        const scoreIncrement = this.player.scoreMultiplier ? 2 : 1;
        this.score += scoreIncrement;
        document.getElementById('score').textContent = Math.floor(this.score / 10);
        document.getElementById('coin-counter').textContent = this.player.coins;
        
        // Check if police caught up
        if (this.police.distance <= 0) {
            this.gameOver = true;
        }
    }
    
    checkCollision(player, obstacle) {
        // Adjust collision box based on player state
        const collisionBox = {
            x: player.x - (player.isSliding ? 0 : 5),
            y: player.y,
            width: player.width + (player.isSliding ? 0 : 10),
            height: player.isSliding ? 10 : player.height
        };
        
        if (this.player.hasShield) {
            return false;
        }
        
        // Check if player is in correct state for obstacle type
        if (obstacle.type === 'jump' && !player.isJumping) {
            return collisionBox.x < obstacle.x + obstacle.width &&
                   collisionBox.x + collisionBox.width > obstacle.x &&
                   collisionBox.y < obstacle.y + obstacle.height &&
                   collisionBox.y + collisionBox.height > obstacle.y;
        } else if (obstacle.type === 'slide' && !player.isSliding) {
            return collisionBox.x < obstacle.x + obstacle.width &&
                   collisionBox.x + collisionBox.width > obstacle.x &&
                   collisionBox.y < obstacle.y + obstacle.height &&
                   collisionBox.y + collisionBox.height > obstacle.y;
        }
        
        return false;
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
        
        // Draw police officer
        this.drawPolice();
        
        // Draw coins
        this.coins.forEach(coin => {
            if (!coin.collected) {
                // Draw coin with glow effect
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
                
                // Draw coin body
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw $ symbol
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('$', coin.x + coin.width/2, coin.y + coin.height/2);
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
            }
        });
        
        // Draw obstacles with type indicators
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Draw type indicator
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                obstacle.type === 'jump' ? '↑' : '↓',
                obstacle.x + obstacle.width/2,
                obstacle.y + obstacle.height/2
            );
        });
        
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
    
    drawPolice() {
        const { x, y, width, height } = this.police;
        
        // Draw body
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(x, y, width, height);
        
        // Draw head
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x + width/2, y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hat
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(x + width/2 - 10, y - 25, 20, 15);
    }
    
    drawCharacter() {
        const { x, y, width, height } = this.player;
        const character = this.characters[this.player.character];
        
        // Update animation frame
        this.player.frameCount++;
        if (this.player.frameCount >= 10) {
            this.player.frame = (this.player.frame + 1) % 2;
            this.player.frameCount = 0;
        }
        
        // Draw speed trail if speed boost is active
        if (this.player.speedBoost) {
            this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)'; // Increased opacity
            this.ctx.lineWidth = 3; // Increased line width
            for (let i = 0; i < 5; i++) { // Increased number of trail lines
                this.ctx.beginPath();
                this.ctx.moveTo(x - 20 - (i * 15), y + height/2);
                this.ctx.lineTo(x - 40 - (i * 15), y + height/2 - 15);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x - 20 - (i * 15), y + height/2);
                this.ctx.lineTo(x - 40 - (i * 15), y + height/2 + 15);
                this.ctx.stroke();
            }
            
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.4)'; // Increased glow opacity
            this.ctx.beginPath();
            this.ctx.arc(x + width/2, y + height/2, width + 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw body (adjusted for sliding)
        this.ctx.fillStyle = character.bodyColor;
        if (this.player.isSliding) {
            this.ctx.fillRect(x, y + height - 10, width, 10);
        } else {
            this.ctx.fillRect(x, y + 10, width, height - 20);
        }
        
        // Draw head (only if not sliding)
        if (!this.player.isSliding) {
            this.ctx.fillStyle = character.headColor;
            this.ctx.beginPath();
            this.ctx.arc(x + width/2, y, width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw eyes
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(x + width/3, y - 5, 3, 0, Math.PI * 2);
            this.ctx.arc(x + 2*width/3, y - 5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw arms and legs (adjusted for sliding)
        if (this.player.isSliding) {
            this.ctx.fillStyle = character.bodyColor;
            this.ctx.fillRect(x - 5, y + height - 15, width + 10, 5);
        } else {
            this.ctx.fillStyle = character.bodyColor;
            const armY = this.player.frame === 0 ? y + 15 : y + 25;
            this.ctx.fillRect(x - 5, armY, 5, 15);
            this.ctx.fillRect(x + width, armY, 5, 15);
            
            this.ctx.fillStyle = character.pantsColor;
            const legY = this.player.frame === 0 ? y + height - 15 : y + height - 25;
            this.ctx.fillRect(x + 5, legY, 10, 15);
            this.ctx.fillRect(x + width - 15, legY, 10, 15);
        }
        
        // Draw speed boost indicator if active
        if (this.player.speedBoost) {
            this.ctx.fillStyle = '#FFA500';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡', x + width/2, y - 20);
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
        if (!this.gameOver && !this.isPaused) {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    jump() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.isJumping = true;
            this.player.jumpVelocity = -this.player.jumpHeight;
            
            // Clear any existing slide
            if (this.player.slideTimer) {
                clearTimeout(this.player.slideTimer);
                this.player.isSliding = false;
                this.player.height = 60;
            }
        }
    }
    
    slide() {
        if (!this.player.isSliding && !this.player.isJumping) {
            this.player.isSliding = true;
            this.player.height = 30;
            
            if (this.player.slideTimer) {
                clearTimeout(this.player.slideTimer);
            }
            
            this.player.slideTimer = setTimeout(() => {
                this.player.isSliding = false;
                this.player.height = 60;
            }, this.player.slideDuration);
        }
    }
    
    checkCoinCollection() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (!coin.collected) {
                const playerCenterX = this.player.x + this.player.width/2;
                const playerCenterY = this.player.y + this.player.height/2;
                const coinCenterX = coin.x + coin.width/2;
                const coinCenterY = coin.y + coin.height/2;
                
                const distance = Math.sqrt(
                    Math.pow(playerCenterX - coinCenterX, 2) +
                    Math.pow(playerCenterY - coinCenterY, 2)
                );
                
                if (distance < (this.player.width/2 + coin.width/2)) {
                    coin.collected = true;
                    this.player.coins += coin.value;
                    // Save coins to localStorage with error handling
                    try {
                        localStorage.setItem('playerCoins', this.player.coins);
                    } catch (e) {
                        console.warn('Failed to save coins to localStorage');
                    }
                    this.showCoinCollection(coin);
                    console.log('Coin collected! Total coins:', this.player.coins);
                    
                    // Update the shop display if it's open
                    if (document.getElementById('shop')) {
                        this.updateShop();
                    }
                }
            }
        }
        this.coins = this.coins.filter(coin => !coin.collected);
    }
    
    showCoinCollection(coin) {
        const feedback = {
            text: `+${coin.value}`,
            x: coin.x,
            y: coin.y,
            color: '#FFD700',
            alpha: 1,
            duration: 1000
        };
        
        const startTime = Date.now();
        const animateFeedback = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / feedback.duration;
            
            if (progress < 1) {
                feedback.y -= 2;
                feedback.alpha = 1 - progress;
                
                this.ctx.fillStyle = `rgba(255, 215, 0, ${feedback.alpha})`;
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(feedback.text, feedback.x + coin.width/2, feedback.y);
                
                requestAnimationFrame(animateFeedback);
            }
        };
        
        animateFeedback();
    }
    
    openShop() {
        const shop = document.createElement('div');
        shop.id = 'shop';
        shop.innerHTML = `
            <div class="shop-content">
                <h2>Shop</h2>
                
                <div class="shop-section">
                    <h3>Characters</h3>
                    <div class="shop-items">
                        ${Object.entries(this.characters).map(([key, char]) => `
                            <div class="shop-item">
                                <h4>${char.name}</h4>
                                <div class="character-preview" style="
                                    background-color: ${char.bodyColor};
                                    width: 40px;
                                    height: 60px;
                                    margin: 10px auto;
                                    position: relative;
                                ">
                                    <div style="
                                        background-color: ${char.headColor};
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        position: absolute;
                                        top: -10px;
                                        left: 10px;
                                    "></div>
                                    <div style="
                                        background-color: ${char.pantsColor};
                                        width: 40px;
                                        height: 20px;
                                        position: absolute;
                                        bottom: 0;
                                    "></div>
                                </div>
                                ${!char.unlocked ? `
                                    <p>Price: ${char.price} coins</p>
                                    <button onclick="game.buyCharacter('${key}')" ${this.player.coins < char.price ? 'disabled' : ''}>
                                        Buy
                                    </button>
                                ` : `
                                    <button onclick="game.selectCharacter('${key}')" ${this.player.character === key ? 'disabled' : ''}>
                                        ${this.player.character === key ? 'Selected' : 'Select'}
                                    </button>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="shop-section">
                    <h3>Power-up Upgrades</h3>
                    <div class="shop-items">
                        <div class="shop-item">
                            <h4>Speed Boost</h4>
                            <p>Current Duration: ${this.powerUpTypes.SPEED.duration/1000}s</p>
                            <p>Price: ${this.powerUpTypes.SPEED.price} coins</p>
                            <button onclick="game.buyUpgrade('SPEED')" ${this.player.coins < this.powerUpTypes.SPEED.price ? 'disabled' : ''}>Buy</button>
                        </div>
                        <div class="shop-item">
                            <h4>Shield</h4>
                            <p>Current Duration: ${this.powerUpTypes.SHIELD.duration/1000}s</p>
                            <p>Price: ${this.powerUpTypes.SHIELD.price} coins</p>
                            <button onclick="game.buyUpgrade('SHIELD')" ${this.player.coins < this.powerUpTypes.SHIELD.price ? 'disabled' : ''}>Buy</button>
                        </div>
                        <div class="shop-item">
                            <h4>Score Multiplier</h4>
                            <p>Current Duration: ${this.powerUpTypes.MULTIPLIER.duration/1000}s</p>
                            <p>Price: ${this.powerUpTypes.MULTIPLIER.price} coins</p>
                            <button onclick="game.buyUpgrade('MULTIPLIER')" ${this.player.coins < this.powerUpTypes.MULTIPLIER.price ? 'disabled' : ''}>Buy</button>
                        </div>
                    </div>
                </div>
                
                <div class="shop-footer">
                    <p>Your Coins: ${this.player.coins}</p>
                    <button onclick="game.closeShop()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(shop);
    }
    
    buyCharacter(characterKey) {
        const character = this.characters[characterKey];
        if (this.player.coins >= character.price) {
            this.player.coins -= character.price;
            character.unlocked = true;
            // Save unlocked status to localStorage with error handling
            try {
                localStorage.setItem(`unlocked_${characterKey}`, 'true');
                localStorage.setItem('playerCoins', this.player.coins);
            } catch (e) {
                console.warn('Failed to save character unlock status to localStorage');
            }
            this.selectCharacter(characterKey);
            this.showPurchaseFeedback(`Unlocked ${character.name}!`);
            this.updateShop();
        }
    }
    
    selectCharacter(characterKey) {
        this.player.character = characterKey;
        // Save selected character to localStorage with error handling
        try {
            localStorage.setItem('selectedCharacter', characterKey);
        } catch (e) {
            console.warn('Failed to save selected character to localStorage');
        }
        this.showPurchaseFeedback(`Selected ${this.characters[characterKey].name}`);
        this.updateShop();
    }
    
    buyUpgrade(type) {
        const powerUp = this.powerUpTypes[type];
        if (this.player.coins >= powerUp.price) {
            this.player.coins -= powerUp.price;
            powerUp.duration *= 1.5;
            powerUp.price = Math.floor(powerUp.price * 1.5);
            
            // Show purchase feedback
            this.showPurchaseFeedback(type);
            
            // Update shop display
            this.updateShop();
        }
    }
    
    showPurchaseFeedback(type) {
        const feedback = document.createElement('div');
        feedback.className = 'purchase-feedback';
        feedback.textContent = `Upgraded ${type} power-up!`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
    
    closeShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            shop.remove();
        }
    }
    
    updateShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            this.closeShop();
            this.openShop();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    try {
        window.game = new Game();
    } catch (e) {
        console.error('Failed to initialize game:', e);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Failed to initialize game. Please check the console for details.';
        document.body.appendChild(errorDiv);
    }
}); 
