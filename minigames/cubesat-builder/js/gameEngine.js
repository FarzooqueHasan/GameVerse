// ISRO Cleanroom Game Engine & Renderer

class GameEngine {
    constructor(canvas, uiCallbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiCallbacks;

        this.map = new CleanroomMap();
        this.tileSize = 48;

        // Player Scientist State
        this.player = {
            x: 4 * 48,
            y: 4 * 48,
            radius: 18,
            speed: 210, // Pixels per sec
            vx: 0,
            vy: 0,
            dir: 'down', // 'up', 'down', 'left', 'right'
            carriedItem: null
        };

        // Inputs
        this.keys = {};
        this.touchMove = { active: false, dx: 0, dy: 0 };
        this.actionRequested = false;

        // Game State
        this.gameState = 'READY'; // READY, PLAYING, PAUSED, OVER
        this.score = 0;
        this.satellitesBuilt = 0;
        this.timeRemaining = 240; // 4 minutes timer matching NASA game
        this.activeOrders = [];
        this.orderSpawnTimer = 0;
        this.particles = [];

        // Animation timing
        this.lastTime = 0;
        this.animFrameId = null;

        this.bindInputs();
    }

    bindInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.handleAction();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    startLevel(facilityId = 'ursc') {
        this.map = new CleanroomMap();
        this.player.x = 4 * this.tileSize;
        this.player.y = 4 * this.tileSize;
        this.player.carriedItem = null;

        this.score = 0;
        this.satellitesBuilt = 0;
        this.timeRemaining = 240;
        this.activeOrders = [];
        this.particles = [];
        this.gameState = 'PLAYING';

        // Spawn initial 2 orders
        this.spawnOrder();
        this.spawnOrder();

        this.lastTime = performance.now();
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.loop = this.loop.bind(this);
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    spawnOrder() {
        if (this.activeOrders.length >= 3) return;

        // Select blueprint randomly from ISRO_BLUEPRINTS
        const blueprint = ISRO_BLUEPRINTS[Math.floor(Math.random() * ISRO_BLUEPRINTS.length)];
        const newOrder = {
            id: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            blueprint: blueprint,
            timeRemaining: blueprint.timeLimit,
            maxTime: blueprint.timeLimit
        };

        this.activeOrders.push(newOrder);
        if (this.ui.onOrdersChanged) this.ui.onOrdersChanged(this.activeOrders);
    }

    loop(timestamp) {
        if (this.gameState !== 'PLAYING') return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        this.animFrameId = requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Update Game Timer
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }

        // Update Order Timers
        for (let i = this.activeOrders.length - 1; i >= 0; i--) {
            const order = this.activeOrders[i];
            order.timeRemaining -= dt;
            if (order.timeRemaining <= 0) {
                // Order Expired
                this.activeOrders.splice(i, 1);
                this.score = Math.max(0, this.score - 100);
                audio.playFail();
                this.addFloatingText(this.player.x, this.player.y, '-100 EXPIRED!', '#EF4444');
                if (this.ui.onOrdersChanged) this.ui.onOrdersChanged(this.activeOrders);
            }
        }

        // Spawn new order periodically
        this.orderSpawnTimer += dt;
        if (this.orderSpawnTimer >= 15 && this.activeOrders.length < 3) {
            this.orderSpawnTimer = 0;
            this.spawnOrder();
        }

        // Player Movement Logic
        let dx = 0;
        let dy = 0;

        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        if (this.touchMove.active) {
            dx = this.touchMove.dx;
            dy = this.touchMove.dy;
        }

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.dir = dx > 0 ? 'right' : 'left';
            } else {
                this.player.dir = dy > 0 ? 'down' : 'up';
            }

            const nextX = this.player.x + dx * this.player.speed * dt;
            const nextY = this.player.y + dy * this.player.speed * dt;

            // Collision check against map solid tiles
            if (!this.checkCollision(nextX, this.player.y)) {
                this.player.x = nextX;
            }
            if (!this.checkCollision(this.player.x, nextY)) {
                this.player.y = nextY;
            }
        }

        // Continuous Interaction (for Soldering Station)
        if (this.keys[' '] || this.keys['e']) {
            this.handleContinuousAction(dt);
        }

        // Update TVAC Stations
        for (let r = 0; r < this.map.rows; r++) {
            for (let c = 0; c < this.map.cols; c++) {
                const cell = this.map.grid[r][c];
                if (cell.type === 'TVAC' && cell.station.status === 'RUNNING') {
                    cell.station.timer += dt;
                    if (Math.random() < 0.3) {
                        this.addParticle((c + 0.5) * this.tileSize, (r + 0.5) * this.tileSize, 'steam');
                    }
                    if (cell.station.timer >= cell.station.duration) {
                        cell.station.status = 'DONE';
                        if (cell.item && cell.item.type === 'cubesat') {
                            cell.item.tvacPassed = true;
                        }
                        audio.playSuccess();
                        this.addFloatingText((c + 0.5) * this.tileSize, (r + 0.5) * this.tileSize, 'TVAC PASSED ✅', '#10B981');
                    }
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.ui.onHudUpdate) {
            this.ui.onHudUpdate({
                score: this.score,
                satellitesBuilt: this.satellitesBuilt,
                timeRemaining: Math.ceil(this.timeRemaining)
            });
        }
    }

    checkCollision(px, py) {
        const r = this.player.radius - 2;
        const corners = [
            { x: px - r, y: py - r },
            { x: px + r, y: py - r },
            { x: px - r, y: py + r },
            { x: px + r, y: py + r }
        ];

        for (const pt of corners) {
            const c = Math.floor(pt.x / this.tileSize);
            const rTile = Math.floor(pt.y / this.tileSize);
            if (this.map.isSolid(c, rTile)) return true;
        }
        return false;
    }

    getFacingCell() {
        let fc = Math.floor(this.player.x / this.tileSize);
        let fr = Math.floor(this.player.y / this.tileSize);

        switch (this.player.dir) {
            case 'up': fr -= 1; break;
            case 'down': fr += 1; break;
            case 'left': fc -= 1; break;
            case 'right': fc += 1; break;
        }

        return { col: fc, row: fr, cell: this.map.getCell(fc, fr) };
    }

    handleAction() {
        const facing = this.getFacingCell();
        if (!facing.cell) return;

        const cell = facing.cell;
        const stationType = cell.type;

        // 1. CRATE STATION
        if (stationType === 'CRATE') {
            if (!this.player.carriedItem) {
                const compKey = cell.station.component;
                if (compKey === 'chassis') {
                    // Create new CubeSat Chassis
                    this.player.carriedItem = {
                        type: 'cubesat',
                        chassis: 'chassis',
                        components: [],
                        wired: false,
                        tvacPassed: false
                    };
                } else {
                    // Create raw component
                    this.player.carriedItem = {
                        type: 'component',
                        id: compKey,
                        data: ISRO_COMPONENTS[compKey]
                    };
                }
                audio.playPick();
            }
        }

        // 2. BENCH STATION
        else if (stationType === 'BENCH') {
            // Case A: Hand has component, Bench has CubeSat -> Install component!
            if (this.player.carriedItem && this.player.carriedItem.type === 'component' && cell.item && cell.item.type === 'cubesat') {
                const compId = this.player.carriedItem.id;
                if (!cell.item.components.includes(compId)) {
                    cell.item.components.push(compId);
                    this.player.carriedItem = null;
                    audio.playAssemble();
                    this.addParticle((facing.col + 0.5) * this.tileSize, (facing.row + 0.5) * this.tileSize, 'spark');
                } else {
                    audio.playFail();
                    this.addFloatingText(this.player.x, this.player.y, 'Already installed!', '#EF4444');
                }
            }
            // Case B: Hand has CubeSat, Bench has component -> Install component!
            else if (this.player.carriedItem && this.player.carriedItem.type === 'cubesat' && cell.item && cell.item.type === 'component') {
                const compId = cell.item.id;
                if (!this.player.carriedItem.components.includes(compId)) {
                    this.player.carriedItem.components.push(compId);
                    cell.item = null;
                    audio.playAssemble();
                    this.addParticle((facing.col + 0.5) * this.tileSize, (facing.row + 0.5) * this.tileSize, 'spark');
                } else {
                    audio.playFail();
                }
            }
            // Case C: Bench is empty -> Drop carried item onto bench
            else if (this.player.carriedItem && !cell.item) {
                cell.item = this.player.carriedItem;
                this.player.carriedItem = null;
                audio.playDrop();
            }
            // Case D: Hand is empty & Bench has item -> Pick up item from bench
            else if (!this.player.carriedItem && cell.item) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                audio.playPick();
            }
        }

        // 3. SOLDER STATION
        else if (stationType === 'SOLDER') {
            if (this.player.carriedItem && !cell.item) {
                if (this.player.carriedItem.type === 'cubesat') {
                    cell.item = this.player.carriedItem;
                    this.player.carriedItem = null;
                    audio.playDrop();
                } else {
                    this.addFloatingText(this.player.x, this.player.y, 'Only CubeSats need wiring!', '#F59E0B');
                }
            } else if (!this.player.carriedItem && cell.item) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                audio.playPick();
            }
        }

        // 4. TVAC CHAMBER
        else if (stationType === 'TVAC') {
            const st = cell.station;
            if (st.status === 'IDLE' && !cell.item && this.player.carriedItem) {
                if (this.player.carriedItem.type === 'cubesat' && this.player.carriedItem.wired) {
                    cell.item = this.player.carriedItem;
                    this.player.carriedItem = null;
                    st.status = 'RUNNING';
                    st.timer = 0;
                    audio.playTVAC();
                } else {
                    this.addFloatingText(this.player.x, this.player.y, 'Must be WIRED first!', '#EF4444');
                    audio.playFail();
                }
            } else if (st.status === 'DONE' && cell.item && !this.player.carriedItem) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                st.status = 'IDLE';
                st.timer = 0;
                audio.playPick();
            }
        }

        // 5. DELIVERY CONVEYOR BELT
        else if (stationType === 'DELIVERY') {
            if (this.player.carriedItem && this.player.carriedItem.type === 'cubesat') {
                this.processDelivery(this.player.carriedItem);
                this.player.carriedItem = null;
            } else {
                this.addFloatingText(this.player.x, this.player.y, 'Deliver completed CubeSat!', '#F59E0B');
            }
        }

        // 6. TRASH RECYCLE
        else if (stationType === 'TRASH') {
            if (this.player.carriedItem) {
                this.player.carriedItem = null;
                audio.playDrop();
                this.addFloatingText(this.player.x, this.player.y, 'RECYCLED ♻️', '#64748B');
            }
        }
    }

    handleContinuousAction(dt) {
        const facing = this.getFacingCell();
        if (!facing.cell) return;

        const cell = facing.cell;
        if (cell.type === 'SOLDER' && cell.item && cell.item.type === 'cubesat' && !cell.item.wired) {
            cell.station.progress += dt * 50; // Takes 2 seconds
            audio.playTVAC();
            this.addParticle((facing.col + 0.5) * this.tileSize, (facing.row + 0.5) * this.tileSize, 'spark');

            if (cell.station.progress >= cell.station.maxProgress) {
                cell.station.progress = 0;
                cell.item.wired = true;
                audio.playSuccess();
                this.addFloatingText((facing.col + 0.5) * this.tileSize, (facing.row + 0.5) * this.tileSize, 'WIRED & SOLDERED ⚡', '#F59E0B');
            }
        }
    }

    processDelivery(cubesat) {
        // Check if cubesat is fully assembled, wired, and TVAC tested
        if (!cubesat.wired) {
            audio.playFail();
            this.addFloatingText(this.player.x, this.player.y, 'REJECTED: NOT WIRED!', '#EF4444');
            return;
        }
        if (!cubesat.tvacPassed) {
            audio.playFail();
            this.addFloatingText(this.player.x, this.player.y, 'REJECTED: NOT TVAC TESTED!', '#EF4444');
            return;
        }

        // Match against active orders
        let matchedIndex = -1;
        for (let i = 0; i < this.activeOrders.length; i++) {
            const reqs = this.activeOrders[i].blueprint.required.filter(r => r !== 'chassis');
            const hasAllReqs = reqs.every(r => cubesat.components.includes(r));
            if (hasAllReqs && cubesat.components.length === reqs.length) {
                matchedIndex = i;
                break;
            }
        }

        if (matchedIndex !== -1) {
            const order = this.activeOrders[matchedIndex];
            const reward = order.blueprint.reward + Math.floor(order.timeRemaining * 5);

            this.score += reward;
            this.satellitesBuilt += 1;
            this.timeRemaining += 15; // Time bonus for fast delivery!

            this.activeOrders.splice(matchedIndex, 1);
            audio.playLaunchRoar();

            // Trigger rocket launch overlay
            if (this.ui.onLaunchCelebration) {
                this.ui.onLaunchCelebration(order.blueprint, reward);
            }

            this.spawnOrder();
            if (this.ui.onOrdersChanged) this.ui.onOrdersChanged(this.activeOrders);
        } else {
            audio.playFail();
            this.score = Math.max(0, this.score - 50);
            this.addFloatingText(this.player.x, this.player.y, 'REJECTED: WRONG BLUEPRINT PARTS!', '#EF4444');
        }
    }

    addFloatingText(x, y, text, color) {
        this.particles.push({
            type: 'text',
            x: x,
            y: y,
            vx: 0,
            vy: -40,
            text: text,
            color: color,
            life: 1.2
        });
    }

    addParticle(x, y, particleType) {
        this.particles.push({
            type: particleType,
            x: x + (Math.random() * 16 - 8),
            y: y + (Math.random() * 16 - 8),
            vx: (Math.random() * 60 - 30),
            vy: (Math.random() * 60 - 30),
            life: 0.5 + Math.random() * 0.3
        });
    }

    endGame() {
        this.gameState = 'OVER';
        audio.playSuccess();
        if (this.ui.onGameOver) {
            this.ui.onGameOver(this.score, this.satellitesBuilt);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Render Cleanroom Grid Tiles
        for (let r = 0; r < this.map.rows; r++) {
            for (let c = 0; c < this.map.cols; c++) {
                const cell = this.map.grid[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                // Tile Background
                if (cell.type === 'FLOOR') {
                    this.ctx.fillStyle = (r + c) % 2 === 0 ? '#1E293B' : '#0F172A';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                    this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                } else {
                    // Station Table Styling
                    this.ctx.fillStyle = '#334155';
                    this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
                    this.ctx.strokeStyle = '#64748B';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

                    // Specific Station Accents
                    if (cell.type === 'CRATE') {
                        this.ctx.fillStyle = '#0284C7';
                        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

                        // Icon/Label
                        const compKey = cell.station.component;
                        const comp = ISRO_COMPONENTS[compKey];
                        this.ctx.font = '18px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(comp.icon, x + 24, y + 28);
                    } else if (cell.type === 'SOLDER') {
                        this.ctx.fillStyle = '#D97706';
                        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
                        this.ctx.font = '16px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('⚡ Wiring', x + 24, y + 28);

                        // Progress Bar if actively soldering
                        if (cell.station.progress > 0) {
                            this.ctx.fillStyle = '#10B981';
                            this.ctx.fillRect(x + 4, y + 40, (this.tileSize - 8) * (cell.station.progress / cell.station.maxProgress), 4);
                        }
                    } else if (cell.type === 'TVAC') {
                        const st = cell.station;
                        this.ctx.fillStyle = st.status === 'RUNNING' ? '#7C3AED' : st.status === 'DONE' ? '#059669' : '#475569';
                        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
                        this.ctx.font = '12px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.fillText(st.status === 'RUNNING' ? '♨️ Test' : st.status === 'DONE' ? '✅ Ready' : '❄️ TVAC', x + 24, y + 24);
                    } else if (cell.type === 'DELIVERY') {
                        this.ctx.fillStyle = '#059669';
                        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
                        this.ctx.font = '18px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('🚀 Launch', x + 24, y + 28);
                    } else if (cell.type === 'TRASH') {
                        this.ctx.fillStyle = '#DC2626';
                        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
                        this.ctx.font = '18px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('♻️ Trash', x + 24, y + 28);
                    }

                    // Render Item sitting on bench/station
                    if (cell.item) {
                        this.renderItem(cell.item, x + 24, y + 24);
                    }
                }
            }
        }

        // Render ISRO Floor Logo in center
        this.ctx.font = 'bold 16px Inter, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 153, 51, 0.15)'; // ISRO Saffron
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ISRO CLEANROOM FACILITY • SDSC SHAR', 8 * this.tileSize, 2 * this.tileSize);

        // 2. Render Player Scientist Avatar
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        // Suit Body
        this.ctx.fillStyle = '#F8FAFC'; // Cleanroom Bunny Suit White
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#0EA5E9'; // ISRO Blue Trim
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Helmet Visor Direction Indicator
        this.ctx.fillStyle = '#0284C7';
        this.ctx.beginPath();
        let vx = 0, vy = 0;
        if (this.player.dir === 'up') vy = -10;
        if (this.player.dir === 'down') vy = 10;
        if (this.player.dir === 'left') vx = -10;
        if (this.player.dir === 'right') vx = 10;

        this.ctx.arc(vx, vy, 7, 0, Math.PI * 2);
        this.ctx.fill();

        // Render Carried Item preview floating above scientist head
        if (this.player.carriedItem) {
            this.renderItem(this.player.carriedItem, 0, -28);
        }

        this.ctx.restore();

        // 3. Render Particles & Floating Text
        for (const p of this.particles) {
            if (p.type === 'text') {
                this.ctx.font = 'bold 13px sans-serif';
                this.ctx.fillStyle = p.color;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'spark') {
                this.ctx.fillStyle = '#FBBF24';
                this.ctx.fillRect(p.x, p.y, 3, 3);
            } else if (p.type === 'steam') {
                this.ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    renderItem(item, x, y) {
        this.ctx.save();
        if (item.type === 'component') {
            this.ctx.font = '22px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.data.icon, x, y);
        } else if (item.type === 'cubesat') {
            // Render CubeSat Frame Base
            this.ctx.fillStyle = '#94A3B8';
            this.ctx.fillRect(x - 14, y - 14, 28, 28);
            this.ctx.strokeStyle = '#334155';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 14, y - 14, 28, 28);

            // Render Attached Components count
            this.ctx.font = '10px sans-serif';
            this.ctx.fillStyle = '#0F172A';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`[${item.components.length}]`, x, y + 2);

            // Status badges
            if (item.wired) {
                this.ctx.fillStyle = '#F59E0B';
                this.ctx.fillText('⚡', x - 10, y - 10);
            }
            if (item.tvacPassed) {
                this.ctx.fillStyle = '#10B981';
                this.ctx.fillText('✅', x + 10, y - 10);
            }
        }
        this.ctx.restore();
    }
}
