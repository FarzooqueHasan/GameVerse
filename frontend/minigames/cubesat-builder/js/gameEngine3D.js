// ISRO 3D Game Engine & Physics Controller (Hover Animations, Trails & input_file_0.png Layout)

class GameEngine3D {
    constructor(containerEl, uiCallbacks) {
        this.container = containerEl;
        this.ui = uiCallbacks;

        // 1. Scene Setup
        this.scene3d = new CleanroomScene3D(this.container);
        this.models = this.scene3d.models;

        this.mapCols = 15;
        this.mapRows = 11;

        // Grid Data & Colliders Array
        this.grid = Array(this.mapRows).fill(null).map(() => Array(this.mapCols).fill(null).map(() => ({
            type: 'FLOOR',
            station: null,
            item: null,
            mesh: null
        })));
        this.colliders = []; // Solid Bounding Boxes for physics

        // Build Architecture Wall Colliders so player can NEVER walk through walls
        this.initWallColliders();

        // 2. Player Scientist Setup
        this.scientist = this.models.createScientist();
        this.scene3d.scene.add(this.scientist.mesh);

        this.player = {
            x: 0,
            z: 1.0,
            radius: 0.38, // Collision radius
            speed: 5.2,
            vx: 0,
            vz: 0,
            rotation: 0,
            targetRotation: 0,
            dir: 'down',
            carriedItem: null,
            carriedMesh: null,
            walkTimer: 0
        };
        this.scientist.mesh.position.set(this.player.x, 0, this.player.z);

        // Station References
        this.tvacStations = [];
        this.conveyorBelts = [];
        this.testStations = [];
        this.weighingStations = [];

        // Animation Timers
        this.hoverTimer = 0;
        this.trailTimer = 0;

        // Build Furniture Layout matching Reference Screenshot exactly
        this.initReferenceLayout();

        // Key Inputs
        this.keys = {};
        this.touchMove = { active: false, dx: 0, dy: 0 };
        this.bindInputs();

        // Game State
        this.gameState = 'READY';
        this.scoreEarth = 0;
        this.scoreDeepSpace = 0;
        this.satellitesBuilt = 0;
        this.timeRemaining = 240;
        this.activeOrders = [];
        this.orderSpawnTimer = 0;

        // Look-At Highlight State
        this.highlightedMeshes = [];
        this.activeEmissiveMats = [];
        this.currentHighlightedCell = null;
        this.currentHighlightedItem = null;
        this.lookAtReticle = this.models.createLookAtReticle ? this.models.createLookAtReticle() : null;
        if (this.lookAtReticle) {
            this.lookAtReticle.visible = false;
            this.scene3d.scene.add(this.lookAtReticle);
        }

        this.lastTime = 0;
        this.animFrameId = null;

        // Start the always-on animation/render loop immediately
        this.loop = this.loop.bind(this);
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    gridToWorld(col, row) {
        return {
            x: (col - 7) * 0.88,
            z: (row - 5) * 0.88
        };
    }

    worldToGrid(x, z) {
        return {
            col: Math.round(x / 0.88 + 7),
            row: Math.round(z / 0.88 + 5)
        };
    }

    initWallColliders() {
        // North Wall (Back)
        this.colliders.push({ minX: -8, maxX: 8, minZ: -7, maxZ: -4.5 });
        // South Wall (Front boundary)
        this.colliders.push({ minX: -8, maxX: 8, minZ: 4.6, maxZ: 8 });
        // West Wall (Left)
        this.colliders.push({ minX: -8, maxX: -6.3, minZ: -8, maxZ: 8 });
        // East Wall (Right)
        this.colliders.push({ minX: 6.3, maxX: 8, minZ: -8, maxZ: 8 });
    }

    setStation(col, row, type, props = {}) {
        if (col < 0 || col >= this.mapCols || row < 0 || row >= this.mapRows) return;
        const pos = this.gridToWorld(col, row);
        const cell = this.grid[row][col];
        cell.type = type;
        cell.station = props;
        cell.col = col;
        cell.row = row;

        // Bounding Box Collider for Solid Collision Physics
        let width = 0.84;
        let depth = 0.84;

        if (type === 'TVAC') {
            width = 1.0;
            depth = 1.35; // Extend depth to cover full cylinder + legs
        } else if (type === 'DELIVERY') {
            width = 0.9;
            depth = 1.65; // Extend depth for full conveyor length
        }

        this.colliders.push({
            minX: pos.x - width / 2,
            maxX: pos.x + width / 2,
            minZ: pos.z - depth / 2,
            maxZ: pos.z + depth / 2
        });

        // Spawn 3D Mesh
        let stationMesh = null;
        if (type === 'CRATE') {
            stationMesh = this.models.createWorkbench(0.85, 0.85, 0.65, { whiteTop: true });
            stationMesh.position.set(pos.x, 0, pos.z);

            // Add color decal tile on pedestal matching reference image
            const compData = ISRO_COMPONENTS[props.component];
            if (compData) {
                const decal = this.models.createSupplyDecal(parseInt(compData.color.replace('#', '0x')));
                decal.position.set(0, 0.655, 0);
                stationMesh.add(decal);

                // Floating name badge above the crate - matches HUD icon
                const badgeLabel = `${compData.icon} ${compData.short}`;
                const crateBadge = this.models.createStatusBadge(badgeLabel, '#0F172A', compData.color);
                crateBadge.position.set(0, 1.4, 0);
                crateBadge.scale.set(1.1, 0.28, 1);
                stationMesh.add(crateBadge);
            }

            const compMesh = this.models.createComponent(props.component);
            compMesh.position.set(0, 0.72, 0);
            stationMesh.add(compMesh);
            cell.crateCompMesh = compMesh;

            if (props.component === 'chassis') {
                const marker = this.models.createOrderMarker('1');
                marker.position.set(0, 1.5, 0);
                stationMesh.add(marker);
            }

        } else if (type === 'BENCH') {
            stationMesh = this.models.createWorkbench(0.85, 0.85, 0.65, {
                withMat: props.withMat,
                withTool: props.withTool
            });
            stationMesh.position.set(pos.x, 0, pos.z);
        } else if (type === 'TEST_STATION' || type === 'SOLDER') {
            stationMesh = this.models.createWorkbench(0.85, 0.85, 0.65);
            stationMesh.position.set(pos.x, 0, pos.z);

            const compTerm = this.models.createComputerTerminal();
            compTerm.position.set(0, 0.65, -0.15);
            stationMesh.add(compTerm);
            props.compTerm = compTerm;
            this.testStations.push({ cell: cell, props: props });
        } else if (type === 'TVAC') {
            const tvac = this.models.createTVACChamber();
            stationMesh = tvac.mesh;
            stationMesh.position.set(pos.x, 0, pos.z);
            props.hatchGroup = tvac.hatchGroup;
            props.ledMesh = tvac.ledMesh;
            this.tvacStations.push({ cell: cell, props: props });
        } else if (type === 'DELIVERY') {
            const convObj = this.models.createConveyorBelt();
            stationMesh = convObj.mesh;
            stationMesh.position.set(pos.x, 0, pos.z);
            this.conveyorBelts.push(convObj);
        } else if (type === 'TRASH') {
            stationMesh = this.models.createRecycleTable();
            stationMesh.position.set(pos.x, 0, pos.z);
        } else if (type === 'WEIGHING') {
            stationMesh = this.models.createWeighingTable();
            stationMesh.position.set(pos.x, 0, pos.z);
            props.status = 'IDLE';
            props.timer = 0;
            props.duration = 2.0;
            this.weighingStations.push({ cell: cell, props: props });
        }

        if (stationMesh) {
            this.scene3d.scene.add(stationMesh);
            cell.mesh = stationMesh;
        }
    }

    // Reconstruct Layout Matching Reference Screenshot Exactly (input_file_0.png)
    initReferenceLayout() {
        // 1. Bottom Left Supply Pedestals / Trays (Front row)
        const crates = ['thruster', 'magnetometer', 'adcs', 'obc', 'battery', 'antenna', 'imager'];
        crates.forEach((comp, idx) => {
            this.setStation(idx + 1, 10, 'CRATE', { component: comp, label: comp });
        });
        this.setStation(8, 10, 'CRATE', { component: 'solar', label: 'solar' });
        this.setStation(9, 10, 'CRATE', { component: 'sar', label: 'sar' });

        // 2. Left Wall Computer Counters (L-Shape Counter along left & top wall) - PART TESTING STATIONS
        this.setStation(0, 3, 'TEST_STATION', { name: 'Computer Terminal A', status: 'IDLE', timer: 0, duration: 2.5 });
        this.setStation(0, 4, 'TEST_STATION', { name: 'Computer Terminal B', status: 'IDLE', timer: 0, duration: 2.5 });
        this.setStation(0, 5, 'TEST_STATION', { name: 'Computer Terminal C', status: 'IDLE', timer: 0, duration: 2.5 });
        this.setStation(0, 6, 'TEST_STATION', { name: 'Computer Terminal D', status: 'IDLE', timer: 0, duration: 2.5 });

        this.setStation(1, 1, 'TEST_STATION', { name: 'Computer Terminal E', status: 'IDLE', timer: 0, duration: 2.5 });
        this.setStation(2, 1, 'TEST_STATION', { name: 'Computer Terminal F', status: 'IDLE', timer: 0, duration: 2.5 });
        this.setStation(3, 1, 'TEST_STATION', { name: 'Computer Terminal G', status: 'IDLE', timer: 0, duration: 2.5 });

        // Add Yellow Soldering / Wiring Decals on floor in front of computers
        this.scene3d.scene.add(this.models.createFloorDecal('solder', this.gridToWorld(1, 3).x, this.gridToWorld(1, 3).z));
        this.scene3d.scene.add(this.models.createFloorDecal('solder', this.gridToWorld(1, 5).x, this.gridToWorld(1, 5).z));
        this.scene3d.scene.add(this.models.createFloorDecal('solder', this.gridToWorld(2, 2).x, this.gridToWorld(2, 2).z));

        // 3. Middle & Right Benches (With cutting mats & tools)
        this.setStation(4, 5, 'BENCH', { name: 'Prep Bench 1', withMat: true });
        this.setStation(5, 5, 'BENCH', { name: 'Prep Bench 2', withMat: true, withTool: true });

        // Central Main Assembly Table (Where astronaut stands with floating "1")
        this.setStation(7, 6, 'CRATE', { component: 'chassis', label: 'chassis' });

        // L-Shaped Assembly Benches (Upper Right Middle)
        this.setStation(9, 3, 'BENCH', { name: 'Assembly Bench 1', withMat: true, withTool: true });
        this.setStation(10, 3, 'BENCH', { name: 'Assembly Bench 2', withMat: true });
        this.setStation(11, 3, 'BENCH', { name: 'Assembly Bench 3', withMat: true, withTool: true });
        this.setStation(11, 4, 'BENCH', { name: 'Assembly Bench 4', withMat: true });
        this.setStation(11, 5, 'BENCH', { name: 'Assembly Bench 5', withMat: true, withTool: true });

        // Add Yellow Tool Decals near prep tables
        this.scene3d.scene.add(this.models.createFloorDecal('tool', this.gridToWorld(9, 4).x, this.gridToWorld(9, 4).z));
        this.scene3d.scene.add(this.models.createFloorDecal('tool', this.gridToWorld(10, 5).x, this.gridToWorld(10, 5).z));

        // 4. Bottom Right Dual TVAC Vacuum Testing Chambers with Floor Hazard Decals
        this.setStation(10, 9, 'TVAC', { name: 'TVAC Chamber 1', status: 'IDLE', timer: 0, duration: 3.5 });
        this.setStation(12, 9, 'TVAC', { name: 'TVAC Chamber 2', status: 'IDLE', timer: 0, duration: 3.5 });

        // Radiation Hazard Decals on Floor in front of TVAC doors
        this.scene3d.scene.add(this.models.createFloorDecal('radiation', this.gridToWorld(10, 7.8).x, this.gridToWorld(10, 7.8).z));
        this.scene3d.scene.add(this.models.createFloorDecal('radiation', this.gridToWorld(12, 7.8).x, this.gridToWorld(12, 7.8).z));

        // 5. Right Wall Conveyor Belt with Weighing Scale & Recycle Table (input_file_1.png match)
        this.setStation(14, 4, 'DELIVERY', { name: 'Launch Conveyor A' });
        this.setStation(14, 5, 'DELIVERY', { name: 'Launch Conveyor B' });
        this.setStation(13, 3, 'WEIGHING', { name: 'Weighing Scale' });
        this.setStation(13, 6, 'TRASH', { name: 'Recycle Table' });

        // Add yellow tool decal near weighing scale
        this.scene3d.scene.add(this.models.createFloorDecal('tool', this.gridToWorld(12, 4).x, this.gridToWorld(12, 4).z));
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

    startLevel() {
        this.scoreEarth = 0;
        this.scoreDeepSpace = 0;
        this.satellitesBuilt = 0;
        this.timeRemaining = 240;
        this.activeOrders = [];
        this.gameState = 'PLAYING';

        this.spawnOrder();
        this.spawnOrder();
    }

    spawnOrder() {
        if (this.activeOrders.length >= 3) return;
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
        // Always keep rendering — even during TUTORIAL, COUNTDOWN, PAUSED states
        const dt = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.scene3d.updateParticles(dt);
        this.scene3d.render();

        this.animFrameId = requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Always update animation timers & hover effects (visible during tutorial/countdown too)
        this.hoverTimer += dt;
        this.trailTimer += dt;

        // Hover & Bobbing Animations for resting components
        for (let r = 0; r < this.mapRows; r++) {
            for (let c = 0; c < this.mapCols; c++) {
                const cell = this.grid[r][c];
                if (cell.itemMesh) {
                    cell.itemMesh.position.y = 0.72 + Math.sin(this.hoverTimer * 3 + c + r) * 0.03;
                    cell.itemMesh.rotation.y += dt * 0.8;
                }
            }
        }

        // Look-At Highlight (always active so scene feels alive)
        this.updateLookAtHighlight(dt);

        // Gate game logic behind PLAYING state
        if (this.gameState !== 'PLAYING') return;

        // Game Timer
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }

        // Order Timers
        for (let i = this.activeOrders.length - 1; i >= 0; i--) {
            const order = this.activeOrders[i];
            order.timeRemaining -= dt;
            if (order.timeRemaining <= 0) {
                this.activeOrders.splice(i, 1);
                audio.playFail();
                if (this.ui.onOrdersChanged) this.ui.onOrdersChanged(this.activeOrders);
            }
        }

        // Spawn Orders
        this.orderSpawnTimer += dt;
        if (this.orderSpawnTimer >= 15 && this.activeOrders.length < 3) {
            this.orderSpawnTimer = 0;
            this.spawnOrder();
        }

        // Snappy Movement Controls (No ice-skating!)
        let targetVx = 0;
        let targetVz = 0;

        if (this.keys['w'] || this.keys['arrowup']) targetVz -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) targetVz += 1;
        if (this.keys['a'] || this.keys['arrowleft']) targetVx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) targetVx += 1;

        if (this.touchMove.active) {
            targetVx = this.touchMove.dx;
            targetVz = this.touchMove.dy;
        }

        const isMoving = targetVx !== 0 || targetVz !== 0;

        if (isMoving) {
            const len = Math.hypot(targetVx, targetVz);
            targetVx = (targetVx / len) * this.player.speed;
            targetVz = (targetVz / len) * this.player.speed;

            // Character Target Angle & Smooth Rotation
            this.player.targetRotation = Math.atan2(targetVx, targetVz);

            if (Math.abs(targetVx) > Math.abs(targetVz)) {
                this.player.dir = targetVx > 0 ? 'right' : 'left';
            } else {
                this.player.dir = targetVz > 0 ? 'down' : 'up';
            }

            this.player.vx = THREE.MathUtils.lerp(this.player.vx, targetVx, 0.45);
            this.player.vz = THREE.MathUtils.lerp(this.player.vz, targetVz, 0.45);

            // PARTICLE TRAIL ANIMATION: Spawn footstep dust trail when walking
            if (this.trailTimer > 0.08) {
                this.trailTimer = 0;
                this.scene3d.spawnParticle({
                    x: this.player.x + (Math.random() - 0.5) * 0.22,
                    y: 0.03,
                    z: this.player.z + (Math.random() - 0.5) * 0.22,
                    color: 0x00E5FF,
                    size: 0.05,
                    vy: 0.15,
                    life: 0.35
                });
            }
        } else {
            this.player.vx = THREE.MathUtils.lerp(this.player.vx, 0, 0.6);
            this.player.vz = THREE.MathUtils.lerp(this.player.vz, 0, 0.6);
        }

        // Rotation Lerp
        this.scientist.mesh.rotation.y = THREE.MathUtils.lerp(
            this.scientist.mesh.rotation.y,
            this.player.targetRotation,
            0.25
        );

        // Integrate position
        this.player.x += this.player.vx * dt;
        this.player.z += this.player.vz * dt;

        // IMPENETRABLE CIRCLE-TO-AABB PUSH-OUT COLLISION RESOLUTION
        for (let iter = 0; iter < 3; iter++) {
            this.resolveCollisions();
        }

        this.scientist.mesh.position.set(this.player.x, 0, this.player.z);

        // Walking Animation Cycle
        if (isMoving && Math.hypot(this.player.vx, this.player.vz) > 0.5) {
            this.player.walkTimer += dt * 16;
            const swing = Math.sin(this.player.walkTimer) * 0.48;
            this.scientist.leftLeg.rotation.x = swing;
            this.scientist.rightLeg.rotation.x = -swing;
            this.scientist.leftArm.rotation.x = -swing;
            this.scientist.rightArm.rotation.x = swing;
        } else {
            this.scientist.leftLeg.rotation.x = 0;
            this.scientist.rightLeg.rotation.x = 0;
            this.scientist.leftArm.rotation.x = 0;
            this.scientist.rightArm.rotation.x = 0;
        }

        // Continuous Interaction (Soldering)
        if (this.keys[' '] || this.keys['e']) {
            this.handleContinuousAction(dt);
        }

        // Hover & Bobbing for Carried Item
        if (this.player.carriedMesh) {
            this.player.carriedMesh.position.y = 0.02 + Math.sin(this.hoverTimer * 6) * 0.04;
            this.player.carriedMesh.rotation.y += dt * 1.5;

            // Glowing carry orbit trail
            if (Math.random() < 0.3) {
                this.scene3d.spawnParticle({
                    x: this.player.x + (Math.random() - 0.5) * 0.3,
                    y: 1.2 + Math.random() * 0.4,
                    z: this.player.z + (Math.random() - 0.5) * 0.3,
                    color: 0xF59E0B,
                    size: 0.04,
                    vy: 0.25,
                    life: 0.4
                });
            }
        }

        // TVAC Chamber Animations & Vapor Trails
        this.tvacStations.forEach(tvac => {
            const st = tvac.props;
            if (st.status === 'RUNNING') {
                st.timer += dt;
                tvac.props.hatchGroup.rotation.y = THREE.MathUtils.lerp(tvac.props.hatchGroup.rotation.y, 0, 0.15);
                if (tvac.props.ledMesh) tvac.props.ledMesh.material.color.setHex(0xA855F7); // Pulsing purple thermal-vac test light

                // Spawn testing vapor trail inside chamber
                if (Math.random() < 0.4) {
                    const pos = this.gridToWorld(tvac.cell.col || 10, tvac.cell.row || 9);
                    this.scene3d.spawnParticle({
                        x: pos.x + (Math.random() - 0.5) * 0.4,
                        y: 0.7 + Math.random() * 0.2,
                        z: pos.z + (Math.random() - 0.5) * 0.4,
                        color: 0x38BDF8,
                        size: 0.05,
                        vy: 0.2,
                        life: 0.45
                    });
                }

                if (st.timer >= st.duration) {
                    st.status = 'DONE';
                    if (tvac.cell.item && tvac.cell.item.type === 'cubesat') {
                        tvac.cell.item.tvacPassed = true;
                        this.updateStationItemMesh(tvac.cell, tvac.cell.col, tvac.cell.row);
                    }
                    audio.playSuccess();
                    if (this.ui.showToast) this.ui.showToast("✅ CUBESAT THERMAL VACUUM TEST PASSED!", 'success');
                    if (tvac.props.ledMesh) tvac.props.ledMesh.material.color.setHex(0x10B981); // Green success LED

                    // Steam release burst trail when hatch unlocks!
                    const pos = this.gridToWorld(tvac.cell.col || 10, tvac.cell.row || 9);
                    for (let p = 0; p < 15; p++) {
                        this.scene3d.spawnParticle({
                            x: pos.x + 0.5,
                            y: 0.7,
                            z: pos.z + (Math.random() - 0.5) * 0.5,
                            color: 0xFFFFFF,
                            size: 0.08,
                            vx: 0.5 + Math.random() * 0.5,
                            vy: Math.random() * 0.4,
                            life: 0.6
                        });
                    }
                }
            } else {
                tvac.props.hatchGroup.rotation.y = THREE.MathUtils.lerp(tvac.props.hatchGroup.rotation.y, Math.PI * 0.55, 0.15);
                if (tvac.props.ledMesh && st.status === 'IDLE') tvac.props.ledMesh.material.color.setHex(0x00E5FF);
            }
        });

        // Animated Conveyor Belt Loop (Moving yellow chevrons along belt toward delivery chute)
        this.conveyorBelts.forEach(conv => {
            if (conv && conv.arrows) {
                conv.arrows.forEach(arrow => {
                    arrow.position.z += dt * 0.8;
                    if (arrow.position.z > 0.65) {
                        arrow.position.z = -0.65;
                    }
                });
            }
        });

        // Part Testing Station Animations & Timers
        this.testStations.forEach(stObj => {
            const st = stObj.props;
            if (st.status === 'RUNNING') {
                st.timer += dt;
                if (st.compTerm && st.compTerm.screenMesh) {
                    st.compTerm.screenMesh.material.color.setHex(0x38BDF8); // Pulsing blue testing light
                }
                // Spawn sparks/vapor while testing part
                if (Math.random() < 0.35) {
                    const pos = this.gridToWorld(stObj.cell.col || 0, stObj.cell.row || 3);
                    this.scene3d.spawnParticle({
                        x: pos.x + (Math.random() - 0.5) * 0.3,
                        y: 0.85,
                        z: pos.z + (Math.random() - 0.5) * 0.3,
                        color: 0x00E5FF,
                        size: 0.04,
                        vy: 0.25,
                        life: 0.35
                    });
                }
                if (st.timer >= st.duration) {
                    st.status = 'DONE';
                    if (stObj.cell.item && stObj.cell.item.type === 'component') {
                        stObj.cell.item.tested = true;
                        this.updateStationItemMesh(stObj.cell, stObj.cell.col, stObj.cell.row);
                    }
                    audio.playSuccess();
                    if (this.ui.showToast) this.ui.showToast(`✅ ${stObj.cell.item ? stObj.cell.item.data.name : 'Part'} TESTED & READY!`, 'success');
                    if (st.compTerm && st.compTerm.screenMesh) {
                        st.compTerm.screenMesh.material.color.setHex(0x10B981); // Green success LED
                    }
                    const pos = this.gridToWorld(stObj.cell.col || 0, stObj.cell.row || 3);
                    this.spawnBurst(pos.x, pos.z, 0x10B981);
                }
            } else if (st.status === 'IDLE') {
                if (st.compTerm && st.compTerm.screenMesh) {
                    st.compTerm.screenMesh.material.color.setHex(0x047857); // Darker green idle
                }
            }
        });

        // Weighing Station Animations & Timers
        this.weighingStations.forEach(weighObj => {
            const st = weighObj.props;
            if (st.status === 'RUNNING') {
                st.timer += dt;
                if (weighObj.props.screenMesh) weighObj.props.screenMesh.material.color.setHex(0x38BDF8);
                if (Math.random() < 0.35) {
                    const pos = this.gridToWorld(weighObj.cell.col || 13, weighObj.cell.row || 3);
                    this.scene3d.spawnParticle({
                        x: pos.x + (Math.random() - 0.5) * 0.3,
                        y: 0.85,
                        z: pos.z + (Math.random() - 0.5) * 0.3,
                        color: 0xFACC15,
                        size: 0.04,
                        vy: 0.25,
                        life: 0.35
                    });
                }
                if (st.timer >= st.duration) {
                    st.status = 'DONE';
                    if (weighObj.cell.item && weighObj.cell.item.type === 'cubesat') {
                        weighObj.cell.item.weighed = true;
                        this.updateStationItemMesh(weighObj.cell, weighObj.cell.col, weighObj.cell.row);
                    }
                    audio.playSuccess();
                    if (this.ui.showToast) this.ui.showToast("⚖️ CUBESAT MASS & BALANCE VERIFIED!", 'success');
                    if (weighObj.props.screenMesh) weighObj.props.screenMesh.material.color.setHex(0x10B981);
                    const pos = this.gridToWorld(weighObj.cell.col || 13, weighObj.cell.row || 3);
                    this.spawnBurst(pos.x, pos.z, 0xFACC15);
                }
            } else if (st.status === 'IDLE') {
                if (weighObj.props.screenMesh) weighObj.props.screenMesh.material.color.setHex(0x0284C7);
            }
        });

        // HUD Update
        if (this.ui.onHudUpdate) {
            this.ui.onHudUpdate({
                scoreEarth: this.scoreEarth,
                scoreDeepSpace: this.scoreDeepSpace,
                satellitesBuilt: this.satellitesBuilt,
                timeRemaining: Math.ceil(this.timeRemaining)
            });
        }
    }

    // Continuous Push-Out Separating Axis Physics
    resolveCollisions() {
        const r = this.player.radius;
        for (const box of this.colliders) {
            const closestX = Math.max(box.minX, Math.min(box.maxX, this.player.x));
            const closestZ = Math.max(box.minZ, Math.min(box.maxZ, this.player.z));

            const dx = this.player.x - closestX;
            const dz = this.player.z - closestZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < r * r && distSq > 0.000001) {
                const dist = Math.sqrt(distSq);
                const overlap = r - dist;
                this.player.x += (dx / dist) * overlap;
                this.player.z += (dz / dist) * overlap;
            } else if (distSq <= 0.000001 && (this.player.x >= box.minX && this.player.x <= box.maxX && this.player.z >= box.minZ && this.player.z <= box.maxZ)) {
                const distLeft = Math.abs(this.player.x - box.minX);
                const distRight = Math.abs(box.maxX - this.player.x);
                const distTop = Math.abs(this.player.z - box.minZ);
                const distBottom = Math.abs(box.maxZ - this.player.z);
                const minEdge = Math.min(distLeft, distRight, distTop, distBottom);

                if (minEdge === distLeft) this.player.x = box.minX - r;
                else if (minEdge === distRight) this.player.x = box.maxX + r;
                else if (minEdge === distTop) this.player.z = box.minZ - r;
                else this.player.z = box.maxZ + r;
            }
        }
    }

    getFacingCell() {
        const gridPos = this.worldToGrid(this.player.x, this.player.z);
        let fc = gridPos.col;
        let fr = gridPos.row;

        switch (this.player.dir) {
            case 'up': fr -= 1; break;
            case 'down': fr += 1; break;
            case 'left': fc -= 1; break;
            case 'right': fc += 1; break;
        }

        if (fc < 0 || fc >= this.mapCols || fr < 0 || fr >= this.mapRows) return { cell: null };
        return { col: fc, row: fr, cell: this.grid[fr][fc] };
    }

    // Dynamic Look-At Highlight System
    updateLookAtHighlight(dt) {
        const facing = this.getFacingCell();
        const cell = facing.cell || null;

        const currentItem = cell ? cell.item : null;
        if (cell !== this.currentHighlightedCell || currentItem !== this.currentHighlightedItem) {
            this.unhighlightCurrent();
            this.currentHighlightedCell = cell;
            this.currentHighlightedItem = currentItem;
            if (cell) this.highlightCell(cell, facing.col, facing.row);
        }

        if (cell && (cell.type || cell.item)) {
            if (this.lookAtReticle) {
                this.lookAtReticle.visible = true;
                const pos = this.gridToWorld(facing.col, facing.row);
                this.lookAtReticle.position.set(pos.x, 0.01, pos.z);
                if (this.lookAtReticle.children[0]) this.lookAtReticle.children[0].rotation.z += dt * 1.5;
                if (this.lookAtReticle.children[1]) this.lookAtReticle.children[1].rotation.z -= dt * 2.0;
                const pulse = 0.68 + Math.sin(this.hoverTimer * 6) * 0.04;
                for (let i = 2; i < this.lookAtReticle.children.length; i++) {
                    this.lookAtReticle.children[i].position.y = pulse;
                }
            }

            // Animate emissive pulse using pre-built flat array — O(1), no traversal
            const emissivePulse = 0.45 + Math.sin(this.hoverTimer * 8) * 0.35;
            for (let i = 0; i < this.activeEmissiveMats.length; i++) {
                this.activeEmissiveMats[i].emissiveIntensity = emissivePulse;
            }

            if (this.ui && this.ui.updateLookAtHud) this.ui.updateLookAtHud(cell);
        } else {
            if (this.lookAtReticle) this.lookAtReticle.visible = false;
            if (this.ui && this.ui.updateLookAtHud) this.ui.updateLookAtHud(null);
        }
    }

    highlightCell(cell, col, row) {
        this.highlightedMeshes = [];
        this.activeEmissiveMats = [];

        if (cell.itemMesh) this.highlightedMeshes.push(cell.itemMesh);
        if (cell.crateCompMesh) this.highlightedMeshes.push(cell.crateCompMesh);
        if (cell.props && cell.props.compTerm) this.highlightedMeshes.push(cell.props.compTerm);
        if (cell.mesh && cell.mesh !== cell.itemMesh) this.highlightedMeshes.push(cell.mesh);

        this.highlightedMeshes.forEach(mesh => {
            mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (!child.userData.origMaterial) {
                        child.userData.origMaterial = child.material;
                        child.material = Array.isArray(child.material)
                            ? child.material.map(m => m.clone())
                            : child.material.clone();
                    }
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        if (mat.emissive !== undefined) {
                            mat.userData = mat.userData || {};
                            if (mat.userData.origEmissive === undefined) {
                                mat.userData.origEmissive = mat.emissive.getHex();
                                mat.userData.origIntensity = mat.emissiveIntensity || 0;
                            }
                            const isPart = (mesh === cell.itemMesh || mesh === cell.crateCompMesh);
                            mat.emissive.setHex(isPart ? 0xFACC15 : 0x00E5FF);
                            mat.emissiveIntensity = isPart ? 0.75 : 0.25;
                            this.activeEmissiveMats.push(mat);
                        }
                    });
                }
            });
        });
    }

    unhighlightCurrent() {
        this.highlightedMeshes.forEach(mesh => {
            if (!mesh) return;
            mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        if (mat.emissive !== undefined && mat.userData && mat.userData.origEmissive !== undefined) {
                            mat.emissive.setHex(mat.userData.origEmissive);
                            mat.emissiveIntensity = mat.userData.origIntensity;
                        }
                    });
                }
            });
        });
        this.highlightedMeshes = [];
        this.activeEmissiveMats = [];
    }

    // Particle Burst Helper for Assembly & Delivery
    spawnBurst(x, z, color) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 0.8;
            this.scene3d.spawnParticle({
                x: x,
                y: 0.75,
                z: z,
                color: color || 0xFACC15,
                size: 0.06,
                vx: Math.cos(angle) * speed,
                vy: 0.3 + Math.random() * 0.4,
                vz: Math.sin(angle) * speed,
                life: 0.5
            });
        }
    }

    handleAction() {
        const facing = this.getFacingCell();
        if (!facing.cell) return;

        const cell = facing.cell;
        const stationType = cell.type;
        const pos = this.gridToWorld(facing.col, facing.row);

        // 1. CRATE
        if (stationType === 'CRATE') {
            if (!this.player.carriedItem) {
                const compKey = cell.station.component;
                if (compKey === 'chassis') {
                    this.player.carriedItem = {
                        type: 'cubesat',
                        chassis: 'chassis',
                        components: [],
                        tvacPassed: false,
                        weighed: false
                    };
                    if (this.ui.showToast) this.ui.showToast("🧊 Picked up CubeSat Box (Place on workbench)", 'info');
                } else {
                    this.player.carriedItem = {
                        type: 'component',
                        id: compKey,
                        data: ISRO_COMPONENTS[compKey],
                        tested: false
                    };
                    if (this.ui.showToast) this.ui.showToast(`📦 Picked up ${ISRO_COMPONENTS[compKey].name} (UNTESTED)`, 'info');
                }
                this.updateCarriedMesh();
                this.spawnBurst(pos.x, pos.z, 0x00E5FF);
                audio.playPick();
            }
        }

        // 2. BENCH
        else if (stationType === 'BENCH') {
            if (this.player.carriedItem && this.player.carriedItem.type === 'component' && cell.item && cell.item.type === 'cubesat') {
                const compId = this.player.carriedItem.id;
                if (!this.player.carriedItem.tested) {
                    audio.playFail();
                    if (this.ui.showToast) this.ui.showToast("⚠️ TEST PART AT COMPUTER STATION FIRST!", 'error');
                    this.spawnBurst(pos.x, pos.z, 0xEF4444);
                    return;
                }
                if (!cell.item.components.includes(compId)) {
                    cell.item.components.push(compId);
                    if (this.ui.showToast) this.ui.showToast(`🔧 Added ${this.player.carriedItem.data.name} to CubeSat!`, 'success');
                    this.removeCarriedMesh();
                    this.player.carriedItem = null;
                    audio.playAssemble();
                    this.updateStationItemMesh(cell, facing.col, facing.row);
                    this.spawnBurst(pos.x, pos.z, 0x4ADE80);
                } else {
                    audio.playFail();
                    if (this.ui.showToast) this.ui.showToast("⚠️ Part already inside this CubeSat!", 'error');
                }
            } else if (this.player.carriedItem && !cell.item) {
                cell.item = this.player.carriedItem;
                this.player.carriedItem = null;
                this.removeCarriedMesh();
                this.updateStationItemMesh(cell, facing.col, facing.row);
                this.spawnBurst(pos.x, pos.z, 0xFACC15);
                audio.playDrop();
            } else if (!this.player.carriedItem && cell.item) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                this.removeStationItemMesh(cell);
                this.updateCarriedMesh();
                audio.playPick();
            }
        }

        // 3. TEST_STATION (or SOLDER)
        else if (stationType === 'TEST_STATION' || stationType === 'SOLDER') {
            const st = cell.station;
            if (st.status === 'IDLE' && !cell.item && this.player.carriedItem) {
                if (this.player.carriedItem.type === 'component') {
                    if (this.player.carriedItem.tested) {
                        if (this.ui.showToast) this.ui.showToast("✅ Part is already tested!", 'info');
                        audio.playFail();
                        return;
                    }
                    cell.item = this.player.carriedItem;
                    this.player.carriedItem = null;
                    this.removeCarriedMesh();
                    this.updateStationItemMesh(cell, facing.col, facing.row);
                    st.status = 'RUNNING';
                    st.timer = 0;
                    this.spawnBurst(pos.x, pos.z, 0x00E5FF);
                    audio.playTVAC();
                    if (this.ui.showToast) this.ui.showToast(`🖥️ Testing ${cell.item.data.name}...`, 'info');
                } else {
                    audio.playFail();
                    if (this.ui.showToast) this.ui.showToast("⚠️ Drop individual CubeSat parts here to test!", 'error');
                }
            } else if (st.status === 'DONE' && cell.item && !this.player.carriedItem) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                this.removeStationItemMesh(cell);
                this.updateCarriedMesh();
                st.status = 'IDLE';
                st.timer = 0;
                audio.playPick();
                if (this.ui.showToast) this.ui.showToast(`✅ Picked up TESTED ${this.player.carriedItem.data.name}`, 'success');
            } else if (st.status === 'RUNNING') {
                if (this.ui.showToast) this.ui.showToast("⏳ Testing in progress... Please wait!", 'info');
                audio.playFail();
            }
        }

        // 4. TVAC
        else if (stationType === 'TVAC') {
            const st = cell.station;
            if (st.status === 'IDLE' && !cell.item && this.player.carriedItem) {
                if (this.player.carriedItem.type === 'cubesat') {
                    if (this.player.carriedItem.components.length === 0) {
                        audio.playFail();
                        if (this.ui.showToast) this.ui.showToast("⚠️ Add components to CubeSat box before testing!", 'error');
                        return;
                    }
                    if (this.player.carriedItem.tvacPassed) {
                        if (this.ui.showToast) this.ui.showToast("✅ CubeSat already vacuum tested!", 'info');
                        audio.playFail();
                        return;
                    }
                    cell.item = this.player.carriedItem;
                    this.player.carriedItem = null;
                    this.removeCarriedMesh();
                    this.updateStationItemMesh(cell, facing.col, facing.row);
                    st.status = 'RUNNING';
                    st.timer = 0;
                    this.spawnBurst(pos.x, pos.z, 0x38BDF8);
                    audio.playTVAC();
                    if (this.ui.showToast) this.ui.showToast("🌀 Running Thermal Vacuum Test Chamber...", 'info');
                } else {
                    audio.playFail();
                    if (this.ui.showToast) this.ui.showToast("⚠️ Drop assembled CubeSat box here!", 'error');
                }
            } else if (st.status === 'DONE' && cell.item && !this.player.carriedItem) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                this.removeStationItemMesh(cell);
                this.updateCarriedMesh();
                st.status = 'IDLE';
                st.timer = 0;
                audio.playPick();
                if (this.ui.showToast) this.ui.showToast("✅ Picked up VACUUM TESTED CubeSat!", 'success');
            } else if (st.status === 'RUNNING') {
                if (this.ui.showToast) this.ui.showToast("⏳ TVAC testing in progress...", 'info');
                audio.playFail();
            }
        }

        // 5. WEIGHING
        else if (stationType === 'WEIGHING') {
            const st = cell.station;
            if (st.status === 'IDLE' && !cell.item && this.player.carriedItem) {
                if (this.player.carriedItem.type === 'cubesat') {
                    if (this.player.carriedItem.components.length === 0) {
                        audio.playFail();
                        if (this.ui.showToast) this.ui.showToast("⚠️ Add components to CubeSat box before weighing!", 'error');
                        return;
                    }
                    if (this.player.carriedItem.weighed) {
                        if (this.ui.showToast) this.ui.showToast("✅ CubeSat already weighed!", 'info');
                        audio.playFail();
                        return;
                    }
                    cell.item = this.player.carriedItem;
                    this.player.carriedItem = null;
                    this.removeCarriedMesh();
                    this.updateStationItemMesh(cell, facing.col, facing.row);
                    st.status = 'RUNNING';
                    st.timer = 0;
                    this.spawnBurst(pos.x, pos.z, 0xFACC15);
                    audio.playTVAC();
                    if (this.ui.showToast) this.ui.showToast("⚖️ Weighing CubeSat mass properties...", 'info');
                } else {
                    audio.playFail();
                    if (this.ui.showToast) this.ui.showToast("⚠️ Drop assembled CubeSat box here!", 'error');
                }
            } else if (st.status === 'DONE' && cell.item && !this.player.carriedItem) {
                this.player.carriedItem = cell.item;
                cell.item = null;
                this.removeStationItemMesh(cell);
                this.updateCarriedMesh();
                st.status = 'IDLE';
                st.timer = 0;
                audio.playPick();
                if (this.ui.showToast) this.ui.showToast("✅ Picked up WEIGHED CubeSat!", 'success');
            } else if (st.status === 'RUNNING') {
                if (this.ui.showToast) this.ui.showToast("⏳ Weighing in progress...", 'info');
                audio.playFail();
            }
        }

        // 6. DELIVERY CONVEYOR
        else if (stationType === 'DELIVERY') {
            if (this.player.carriedItem && this.player.carriedItem.type === 'cubesat') {
                this.processDelivery(this.player.carriedItem, pos.x, pos.z);
                this.player.carriedItem = null;
                this.removeCarriedMesh();
            } else if (this.player.carriedItem) {
                audio.playFail();
                if (this.ui.showToast) this.ui.showToast("⚠️ Only assembled CubeSats can be shipped!", 'error');
            }
        }

        // 7. TRASH
        else if (stationType === 'TRASH') {
            if (this.player.carriedItem) {
                if (this.ui.showToast) this.ui.showToast("♻️ Recycled item in trash bin!", 'info');
                this.player.carriedItem = null;
                this.removeCarriedMesh();
                this.spawnBurst(pos.x, pos.z, 0xEF4444);
                audio.playDrop();
            }
        }
    }

    handleContinuousAction(dt) {
        // Continuous actions no longer needed since testing is automatic time-based upon placing items!
    }

    processDelivery(cubesat, x, z) {
        if (!cubesat.tvacPassed) {
            audio.playFail();
            if (this.ui.showToast) this.ui.showToast("⚠️ NOT VACUUM TESTED! Drop at TVAC Chamber! 🌀", 'error');
            this.spawnBurst(x, z, 0xEF4444);
            return;
        }
        if (!cubesat.weighed) {
            audio.playFail();
            if (this.ui.showToast) this.ui.showToast("⚠️ NOT WEIGHED! Drop at Weighing Scale! ⚖️", 'error');
            this.spawnBurst(x, z, 0xEF4444);
            return;
        }

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

            if (order.blueprint.id === 'eos07' || order.blueprint.id === 'oceansat' || order.blueprint.id === 'astrosat') {
                this.scoreEarth += reward;
            } else {
                this.scoreDeepSpace += reward;
            }

            this.satellitesBuilt += 1;
            this.timeRemaining += 15;
            this.activeOrders.splice(matchedIndex, 1);
            audio.playLaunchRoar();
            if (this.ui.showToast) this.ui.showToast(`🚀 SHIPPED ${order.blueprint.code} (+${reward} PTS)!`, 'success');

            // Massive launch celebration particle burst trail!
            this.spawnBurst(x, z, 0xFF9933);
            this.spawnBurst(x, z, 0x00E5FF);

            if (this.ui.onLaunchCelebration) {
                this.ui.onLaunchCelebration(order.blueprint, reward);
            }

            this.spawnOrder();
            if (this.ui.onOrdersChanged) this.ui.onOrdersChanged(this.activeOrders);
        } else {
            audio.playFail();
            if (this.ui.showToast) this.ui.showToast("❌ DOES NOT MATCH ANY ACTIVE ORDER! (Take to Recycle Bin)", 'error');
            this.spawnBurst(x, z, 0xEF4444);
        }
    }

    updateCarriedMesh() {
        this.removeCarriedMesh();
        if (!this.player.carriedItem) return;

        let mesh = null;
        if (this.player.carriedItem.type === 'component') {
            mesh = this.models.createComponent(this.player.carriedItem.id);
            if (this.player.carriedItem.tested) {
                const badge = this.models.createStatusBadge('TESTED ✅', '#10B981');
                badge.position.set(0, 0.6, 0);
                mesh.add(badge);
            } else {
                const badge = this.models.createStatusBadge('UNTESTED ⚠️', '#EF4444');
                badge.position.set(0, 0.6, 0);
                mesh.add(badge);
            }
        } else if (this.player.carriedItem.type === 'cubesat') {
            mesh = this.models.createComponent('chassis');
            const item = this.player.carriedItem;
            let statusText = `${item.components.length} PARTS`;
            if (item.components.length === 0) statusText = 'EMPTY BOX';
            let tags = [];
            if (item.tvacPassed) tags.push('TVAC ✅');
            if (item.weighed) tags.push('SCALE ✅');
            if (tags.length > 0) statusText += ' • ' + tags.join(' ');

            let bg = '#0284C7';
            if (item.tvacPassed && item.weighed) bg = '#10B981';
            else if (item.tvacPassed || item.weighed) bg = '#8B5CF6';

            const badge = this.models.createStatusBadge(statusText, bg);
            badge.position.set(0, 0.7, 0);
            mesh.add(badge);
        }

        if (mesh) {
            mesh.scale.set(0.68, 0.68, 0.68);
            this.scientist.carriedAnchor.add(mesh);
            this.player.carriedMesh = mesh;
        }
    }

    removeCarriedMesh() {
        if (this.player.carriedMesh) {
            this.scientist.carriedAnchor.remove(this.player.carriedMesh);
            this.player.carriedMesh = null;
        }
    }

    updateStationItemMesh(cell, col, row) {
        this.removeStationItemMesh(cell);
        if (!cell.item) return;

        const pos = this.gridToWorld(col, row);
        let mesh = null;
        if (cell.item.type === 'component') {
            mesh = this.models.createComponent(cell.item.id);
            if (cell.item.tested) {
                const badge = this.models.createStatusBadge('TESTED ✅', '#10B981');
                badge.position.set(0, 0.6, 0);
                mesh.add(badge);
            } else {
                const badge = this.models.createStatusBadge('UNTESTED ⚠️', '#EF4444');
                badge.position.set(0, 0.6, 0);
                mesh.add(badge);
            }
        } else if (cell.item.type === 'cubesat') {
            mesh = this.models.createComponent('chassis');
            const item = cell.item;
            let statusText = `${item.components.length} PARTS`;
            if (item.components.length === 0) statusText = 'EMPTY BOX';
            let tags = [];
            if (item.tvacPassed) tags.push('TVAC ✅');
            if (item.weighed) tags.push('SCALE ✅');
            if (tags.length > 0) statusText += ' • ' + tags.join(' ');

            let bg = '#0284C7';
            if (item.tvacPassed && item.weighed) bg = '#10B981';
            else if (item.tvacPassed || item.weighed) bg = '#8B5CF6';

            const badge = this.models.createStatusBadge(statusText, bg);
            badge.position.set(0, 0.7, 0);
            mesh.add(badge);
        }

        if (mesh) {
            mesh.position.set(pos.x, 0.72, pos.z);
            this.scene3d.scene.add(mesh);
            cell.itemMesh = mesh;
        }
    }

    removeStationItemMesh(cell) {
        if (cell.itemMesh) {
            this.scene3d.scene.remove(cell.itemMesh);
            cell.itemMesh = null;
        }
    }

    endGame() {
        this.gameState = 'OVER';
        audio.playSuccess();
        if (this.ui.onGameOver) {
            this.ui.onGameOver(this.scoreEarth + this.scoreDeepSpace, this.satellitesBuilt);
        }
    }
}
