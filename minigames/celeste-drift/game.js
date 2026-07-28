// --- GAME CONSTANTS ---
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 800;
const LANES = [100, 200, 300]; // X centers of the 3 lanes
const LANE_WIDTH = 100;

const COLORS = {
    car: '#00f3ff', // neon blue
    carShield: '#39ff14', // neon green
    carDrift: '#ff00ea', // neon pink
    token: '#ffea00',
    banner: '#ff003c',
    drone: '#ff8c00',
    paint: '#8a2be2',
    powerupTurbo: '#ff0000',
    powerupShield: '#39ff14',
    powerupMagnet: '#0055ff'
};

// --- AUDIO MANAGER (Simple Web Audio API synthesizer) ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = false; // Enabled on first user interaction
    }

    enable() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() { this.playTone(400, 'sine', 0.3, 0.1); }
    playDrift() { this.playTone(150, 'sawtooth', 0.4, 0.05); }
    playToken() { this.playTone(800, 'square', 0.1, 0.1); }
    playPowerup() { this.playTone(1200, 'square', 0.5, 0.1); }
    playCrash() { this.playTone(100, 'sawtooth', 1.0, 0.2); }
    playCombo() { this.playTone(1500, 'sine', 0.5, 0.1); }
}

const audio = new AudioManager();

// --- INPUT HANDLING ---
class InputHandler {
    constructor() {
        this.lane = 1; // 0: Left, 1: Middle, 2: Right
        this.action = 'none'; // 'none', 'jump', 'drift'
        
        this.touchStartX = 0;
        this.touchStartY = 0;

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.switchLane(-1);
            if (e.key === 'ArrowRight') this.switchLane(1);
            if (e.key === 'ArrowUp') this.triggerAction('jump');
            if (e.key === 'ArrowDown') this.triggerAction('drift');
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
            audio.enable(); // Enable audio on touch
        }, {passive: true});

        canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY);
        }, {passive: true});
        
        // click on start screen for audio
        document.body.addEventListener('click', () => audio.enable(), {once:true});
    }

    switchLane(dir) {
        this.lane += dir;
        if (this.lane < 0) this.lane = 0;
        if (this.lane > 2) this.lane = 2;
    }

    triggerAction(act) {
        this.action = act;
        // Action is consumed by Player update loop
    }

    consumeAction() {
        const act = this.action;
        this.action = 'none';
        return act;
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const minSwipeDist = 30;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (Math.abs(diffX) > minSwipeDist) {
                if (diffX > 0) this.switchLane(1);
                else this.switchLane(-1);
            }
        } else {
            // Vertical swipe
            if (Math.abs(diffY) > minSwipeDist) {
                if (diffY < 0) this.triggerAction('jump');
                else this.triggerAction('drift');
            }
        }
    }
}

// --- ENTITIES ---

class Player {
    constructor() {
        this.width = 50;
        this.height = 100;
        this.y = CANVAS_HEIGHT - 150;
        this.lane = 1;
        this.x = LANES[this.lane];
        
        // States
        this.isJumping = false;
        this.jumpTimer = 0;
        this.isDrifting = false;
        this.driftTimer = 0;
        this.isSkidding = false;
        this.skidTimer = 0;
        
        // Powerups
        this.hasShield = false;
        this.shieldTimer = 0;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.isTurbo = false;
        this.turboTimer = 0;
        
        // Glow trail (Combo)
        this.glowTrailActive = false;
    }

    update(dt, input) {
        // Handle Powerups timers
        if (this.hasShield) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) this.hasShield = false;
        }
        if (this.hasMagnet) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) this.hasMagnet = false;
        }
        if (this.isTurbo) {
            this.turboTimer -= dt;
            if (this.turboTimer <= 0) this.isTurbo = false;
        }
        if (this.isSkidding) {
            this.skidTimer -= dt;
            if (this.skidTimer <= 0) this.isSkidding = false;
        }

        // Action timers
        if (this.isJumping) {
            this.jumpTimer -= dt;
            if (this.jumpTimer <= 0) this.isJumping = false;
        }
        if (this.isDrifting) {
            this.driftTimer -= dt;
            if (this.driftTimer <= 0) this.isDrifting = false;
        }

        // Handle Input if not skidding
        if (!this.isSkidding) {
            // Smooth horizontal movement towards target lane
            const targetX = LANES[input.lane];
            this.lane = input.lane;
            this.x += (targetX - this.x) * 15 * (dt / 1000); // Lerp
            
            const action = input.consumeAction();
            if (action === 'jump' && !this.isJumping && !this.isDrifting) {
                this.isJumping = true;
                this.jumpTimer = 800; // ms
                audio.playJump();
            } else if (action === 'drift' && !this.isDrifting && !this.isJumping) {
                this.isDrifting = true;
                this.driftTimer = 800; // ms
                audio.playDrift();
            }
        } else {
            // Skidding logic - wobble randomly
            this.x += (Math.random() - 0.5) * 15;
            if (this.x < 50) this.x = 50;
            if (this.x > CANVAS_WIDTH - 50) this.x = CANVAS_WIDTH - 50;
            input.consumeAction(); // Consume inputs but ignore them
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw Shadow/Glow
        if (this.glowTrailActive) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = COLORS.carDrift;
        }

        // Draw Player Car
        if (this.isJumping) {
            // Scale up slightly to simulate jump
            const scale = 1 + Math.sin((1 - this.jumpTimer/800) * Math.PI) * 0.3;
            ctx.scale(scale, scale);
        }

        if (this.isSkidding) {
            ctx.rotate(Math.sin(Date.now() / 50) * 0.2); // Wobble
        }

        let carColor = COLORS.car;
        if (this.isDrifting) carColor = COLORS.carDrift;
        
        ctx.fillStyle = carColor;
        
        if (this.isDrifting) {
            ctx.scale(1, 0.5); // Flatten the bomber for drift
        }

        // B2 Bomber shape
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2); // Nose
        ctx.lineTo(this.width * 0.8, this.height/4); // Right wingtip
        ctx.lineTo(this.width * 0.3, this.height/2); // Right trailing edge
        ctx.lineTo(0, this.height/4); // Center tail notch
        ctx.lineTo(-this.width * 0.3, this.height/2); // Left trailing edge
        ctx.lineTo(-this.width * 0.8, this.height/4); // Left wingtip
        ctx.closePath();
        ctx.fill();
        
        // Subtle cockpit details for bomber
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/3);
        ctx.lineTo(5, -this.height/4);
        ctx.lineTo(-5, -this.height/4);
        ctx.closePath();
        ctx.fill();

        // Draw Shield
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(0, 0, this.height/1.5, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.carShield;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.carShield;
            ctx.stroke();
        }

        // Draw Magnet field
        if (this.hasMagnet) {
            ctx.beginPath();
            ctx.arc(0, 0, this.height, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 85, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    getHitbox() {
        let h = this.height;
        let yOffset = -this.height/2;
        if (this.isDrifting) {
            h = this.height/2;
            yOffset = -this.height/4;
        }
        return {
            x: this.x - this.width/2 + 10, // slightly forgiving hitboxes
            y: this.y + yOffset + 10,
            w: this.width - 20,
            h: h - 20
        };
    }
}

class Entity {
    constructor(lane, y, type) {
        this.lane = lane;
        this.x = LANES[lane];
        this.y = y;
        this.type = type; // 'banner', 'drone', 'paint', 'token', 'turbo', 'shield', 'magnet'
        this.width = 40;
        this.height = 40;
        this.passed = false;
        this.markedForDeletion = false;
        
        // Drone specific
        this.droneSpeed = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 100); 
    }

    update(dt, baseSpeed) {
        this.y += baseSpeed * (dt / 1000);
        
        if (this.type === 'drone') {
            this.x += this.droneSpeed * (dt / 1000);
            if (this.x < 50 || this.x > CANVAS_WIDTH - 50) {
                this.droneSpeed *= -1; // bounce off walls
            }
        }
        
        if (this.y > CANVAS_HEIGHT + 100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'banner') {
            // Spans the lane
            ctx.fillStyle = COLORS.banner;
            ctx.shadowColor = COLORS.banner;
            ctx.shadowBlur = 10;
            ctx.fillRect(-LANE_WIDTH/2 + 10, -10, LANE_WIDTH - 20, 20);
        } else if (this.type === 'drone') {
            ctx.fillStyle = COLORS.drone;
            ctx.shadowColor = COLORS.drone;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // rotors
            ctx.fillStyle = '#fff';
            ctx.fillRect(-30, -5, 60, 10);
            ctx.rotate(Date.now() / 100);
            ctx.fillRect(-30, -5, 60, 10);
        } else if (this.type === 'paint') {
            ctx.fillStyle = COLORS.paint;
            ctx.beginPath();
            ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'token') {
            ctx.fillStyle = COLORS.token;
            ctx.shadowColor = COLORS.token;
            ctx.shadowBlur = 20;
            ctx.rotate(Date.now() / 200);
            ctx.fillRect(-15, -15, 30, 30);
        } else if (this.type === 'turbo' || this.type === 'shield' || this.type === 'magnet') {
            ctx.fillStyle = this.type === 'turbo' ? COLORS.powerupTurbo : 
                            this.type === 'shield' ? COLORS.powerupShield : COLORS.powerupMagnet;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 20);
            ctx.lineTo(-20, 0);
            ctx.fill();
            
            // Icon
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let icon = this.type === 'turbo' ? 'T' : this.type === 'shield' ? 'S' : 'M';
            ctx.fillText(icon, 0, 0);
        }

        ctx.restore();
    }

    getHitbox() {
        let w = this.width;
        let h = this.height;
        let ox = -w/2;
        let oy = -h/2;

        if (this.type === 'banner') {
            w = LANE_WIDTH - 20;
            h = 20;
            ox = -w/2;
            oy = -h/2;
        } else if (this.type === 'paint') {
            w = 60;
            h = 30;
            ox = -30;
            oy = -15;
        }

        return {
            x: this.x + ox,
            y: this.y + oy,
            w: w,
            h: h
        };
    }
}

// --- GAME MANAGER ---
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set internal canvas resolution
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.input = new InputHandler();
        
        // UI Elements
        this.ui = {
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            hud: document.getElementById('hud'),
            score: document.getElementById('score'),
            speedLvl: document.getElementById('speed-level'),
            comboMult: document.getElementById('combo-multiplier'),
            comboCount: document.getElementById('combo-count'),
            driftZone: document.getElementById('drift-zone-alert'),
            powerupStatus: document.getElementById('powerup-status'),
            finalScore: document.getElementById('final-score'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            leaderboardStart: document.getElementById('leaderboard-list-start'),
            leaderboardEnd: document.getElementById('leaderboard-list-end')
        };

        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.restartBtn.addEventListener('click', () => this.start());

        this.state = 'START'; // START, PLAYING, GAMEOVER
        this.lastTime = 0;
        this.runwayOffset = 0;
        this.baseSpeed = 400; // default for start screen
        
        this.updateLeaderboardUI();
        this.drawStartScreenBg();
    }

    init() {
        this.player = new Player();
        this.input.lane = 1;
        this.entities = [];
        
        this.score = 0;
        this.baseSpeed = 400; // pixels per second
        this.speedLevel = 1;
        this.gameTime = 0; // seconds
        
        this.comboTokens = 0;
        this.comboMultiplier = 1;
        
        this.driftZoneTimer = 0; // ms without crash
        this.inDriftZone = false;
        
        this.spawnTimer = 0;
        
        this.runwayOffset = 0;
    }

    start() {
        this.init();
        this.state = 'PLAYING';
        this.ui.startScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    gameOver() {
        this.state = 'GAMEOVER';
        audio.playCrash();
        this.ui.hud.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.finalScore.innerText = this.score;
        this.saveScore(this.score);
        this.updateLeaderboardUI();
    }

    updateBackground(dt) {
        const speed = (this.player && this.player.isTurbo) ? this.baseSpeed * 2 : this.baseSpeed;
        this.runwayOffset = (this.runwayOffset + speed * (dt / 1000)) % 80;
    }

    drawBackground(ctx) {
        // Dark asphalt runway background
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Runway outer solid edges
        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(50, 0); ctx.lineTo(50, CANVAS_HEIGHT);
        ctx.moveTo(350, 0); ctx.lineTo(350, CANVAS_HEIGHT);
        ctx.stroke();

        // Runway center dashed lines (separating lanes)
        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 4;
        ctx.setLineDash([40, 40]);
        // Moving downwards gives illusion of moving forwards
        ctx.lineDashOffset = -this.runwayOffset; 
        ctx.beginPath();
        ctx.moveTo(150, 0); ctx.lineTo(150, CANVAS_HEIGHT);
        ctx.moveTo(250, 0); ctx.lineTo(250, CANVAS_HEIGHT);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset
    }

    drawStartScreenBg() {
        if(this.state !== 'START') return;
        this.updateBackground(16.66); // ~60fps step
        this.drawBackground(this.ctx);
        requestAnimationFrame(() => this.drawStartScreenBg());
    }

    spawnLogic(dt) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            // Decrease spawn interval as speed increases
            this.spawnTimer = Math.max(500, 1500 - (this.speedLevel * 100));
            
            const lane = Math.floor(Math.random() * 3);
            const rand = Math.random();
            let type = 'token';
            
            if (rand < 0.1) {
                // Powerup (10%)
                const pRand = Math.random();
                if (pRand < 0.33) type = 'turbo';
                else if (pRand < 0.66) type = 'shield';
                else type = 'magnet';
            } else if (rand < 0.6) {
                // Obstacles (50%)
                const oRand = Math.random();
                if (oRand < 0.4) type = 'banner';
                else if (oRand < 0.7) type = 'drone';
                else type = 'paint';
            } else {
                // Token (40%)
                type = 'token';
            }

            this.entities.push(new Entity(lane, -50, type));
        }
    }

    checkCollisions() {
        const pBox = this.player.getHitbox();

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            const eBox = e.getHitbox();

            // Magnet logic
            if (this.player.hasMagnet && e.type === 'token') {
                const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (dist < 200) {
                    // Pull token towards player
                    e.x += (this.player.x - e.x) * 0.1;
                    e.y += (this.player.y - e.y) * 0.1;
                }
            }

            // AABB Collision
            if (pBox.x < eBox.x + eBox.w &&
                pBox.x + pBox.w > eBox.x &&
                pBox.y < eBox.y + eBox.h &&
                pBox.y + pBox.h > eBox.y) {
                
                // Handle Collision
                if (['token', 'turbo', 'shield', 'magnet'].includes(e.type)) {
                    // Collectible
                    this.handleCollect(e.type);
                    e.markedForDeletion = true;
                } else {
                    // Obstacle
                    if (this.player.isTurbo) {
                        // Turbo destroys obstacles
                        e.markedForDeletion = true;
                        this.addScore(25);
                    } else if (e.type === 'drone' && this.player.isJumping) {
                        // Dodged by jumping over drone (hitbox technically overlaps in 2D, but we logic it out)
                        // Actually, if we are jumping, we ignore drone collisions
                    } else if (e.type === 'banner' && this.player.isDrifting) {
                        // Dodged by drifting under banner
                        // Hitbox is smaller when drifting, might still hit if not careful
                    } else {
                        // Hit obstacle
                        if (this.player.hasShield) {
                            // Consume shield, destroy obstacle
                            this.player.hasShield = false;
                            e.markedForDeletion = true;
                            // Visual flash could be added here
                        } else if (e.type === 'paint') {
                            this.player.isSkidding = true;
                            this.player.skidTimer = 2000;
                            this.comboTokens = 0; // reset combo
                            this.updateHUD();
                        } else {
                            // Crash (Banner or Drone without shield/proper move)
                            // Double check logic for jump/drift
                            if (e.type === 'drone' && this.player.isJumping) {
                                // Safe
                            } else if (e.type === 'banner' && this.player.isDrifting) {
                                // Safe
                            } else {
                                this.gameOver();
                                return;
                            }
                        }
                    }
                }
            } else if (e.y > this.player.y + this.player.height && !e.passed) {
                // Successfully passed an obstacle
                e.passed = true;
                if (['banner', 'drone', 'paint'].includes(e.type)) {
                    this.addScore(25);
                }
            }
        }
    }

    handleCollect(type) {
        if (type === 'token') {
            audio.playToken();
            this.addScore(10 * this.comboMultiplier);
            this.comboTokens++;
            
            if (this.comboTokens === 5) {
                this.addScore(50);
                this.player.glowTrailActive = true;
                audio.playCombo();
                this.showPowerupText("COMBO BONUS!");
            }
            if (this.comboTokens === 10) {
                this.comboMultiplier = 2;
                this.showPowerupText("x2 MULTIPLIER!");
            }
            if (this.comboTokens > 10) {
                 this.comboTokens = 10; // Cap visual counter
            }
        } else if (type === 'turbo') {
            audio.playPowerup();
            this.player.isTurbo = true;
            this.player.turboTimer = 3000;
            this.showPowerupText("TURBO BOOST!");
            // Clear obstacles ahead
            this.entities.forEach(e => {
                if (['banner', 'drone', 'paint'].includes(e.type) && e.y < this.player.y) {
                    e.markedForDeletion = true;
                }
            });
        } else if (type === 'shield') {
            audio.playPowerup();
            this.player.hasShield = true;
            this.player.shieldTimer = 5000;
            this.showPowerupText("SHIELD ACTIVE!");
        } else if (type === 'magnet') {
            audio.playPowerup();
            this.player.hasMagnet = true;
            this.player.magnetTimer = 10000;
            this.showPowerupText("MAGNET MODE!");
        }
        this.updateHUD();
    }

    addScore(pts) {
        this.score += pts;
        this.updateHUD();
    }

    showPowerupText(text) {
        this.ui.powerupStatus.innerText = text;
        this.ui.powerupStatus.style.color = '#fff';
        clearTimeout(this.powerupTimeout);
        this.powerupTimeout = setTimeout(() => {
            this.ui.powerupStatus.innerText = '';
        }, 2000);
    }

    updateHUD() {
        this.ui.score.innerText = this.score;
        this.ui.speedLvl.innerText = this.speedLevel;
        this.ui.comboCount.innerText = this.comboTokens;
        this.ui.comboMult.innerText = this.comboMultiplier;
        
        if (this.comboTokens < 10) {
            this.ui.comboMult.style.color = 'var(--neon-pink)';
        } else {
            this.ui.comboMult.style.color = 'var(--neon-green)';
        }
    }

    loop(timestamp) {
        if (this.state !== 'PLAYING') return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Progression logic
        this.gameTime += dt / 1000;
        this.driftZoneTimer += dt;

        if (this.driftZoneTimer >= 60000 && !this.inDriftZone) {
            this.inDriftZone = true;
            this.addScore(100);
            this.ui.driftZone.classList.remove('hidden');
            audio.playCombo();
            setTimeout(() => this.ui.driftZone.classList.add('hidden'), 3000);
            this.driftZoneTimer = 0; // reset
            this.inDriftZone = false;
        }

        // Speed level increase every 30s
        const newLevel = Math.floor(this.gameTime / 30) + 1;
        if (newLevel > this.speedLevel) {
            this.speedLevel = newLevel;
            this.baseSpeed += 50; // increase speed
            this.updateHUD();
        }

        // Update
        const currentSpeed = this.player.isTurbo ? this.baseSpeed * 2 : this.baseSpeed;
        
        this.player.update(dt, this.input);
        
        // Reset combo if skidding or hit
        if (!this.player.glowTrailActive && this.comboTokens < 5) {
            // logic handled in collect/hit
        }
        if (this.player.isSkidding) {
            this.player.glowTrailActive = false;
            this.comboMultiplier = 1;
        }

        this.spawnLogic(dt);

        this.entities.forEach(e => e.update(dt, currentSpeed));
        
        this.checkCollisions();

        // Cleanup entities
        this.entities = this.entities.filter(e => !e.markedForDeletion);

        // Update bg and Draw
        this.updateBackground(dt);
        this.drawBackground(this.ctx);
        this.entities.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);

        if (this.state === 'PLAYING') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // --- LEADERBOARD ---
    getLeaderboard() {
        const lb = localStorage.getItem('celesteDriftLB');
        if (lb) {
            return JSON.parse(lb);
        }
        return [];
    }

    saveScore(score) {
        if (score === 0) return;
        let lb = this.getLeaderboard();
        lb.push({ score: score, date: new Date().toLocaleDateString() });
        lb.sort((a, b) => b.score - a.score);
        lb = lb.slice(0, 5); // Keep top 5
        localStorage.setItem('celesteDriftLB', JSON.stringify(lb));
    }

    updateLeaderboardUI() {
        const lb = this.getLeaderboard();
        let html = '';
        if (lb.length === 0) {
            html = '<li>No scores yet!</li>';
        } else {
            lb.forEach((entry, i) => {
                html += `<li><span>#${i+1}</span> <span>${entry.score} pts</span></li>`;
            });
        }
        this.ui.leaderboardStart.innerHTML = html;
        this.ui.leaderboardEnd.innerHTML = html;
    }
}

// Start app
const game = new Game();
