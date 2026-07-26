// ISRO 3D High-Fidelity Procedural Model Builder & Particle Systems (input_file_0.png Match)

class ModelBuilder {
    constructor() {
        // Shared Premium Materials
        this.matMetal = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.25, metalness: 0.85 });
        this.matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.75 });
        this.matSteel = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.3, metalness: 0.6 });
        this.matWhiteCounter = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2, metalness: 0.1 });
        this.matESD = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.5 }); // Green ESD cutting mat
        this.matSuit = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
        this.matSuitBlue = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3 });
        this.matVisor = new THREE.MeshPhysicalMaterial({
            color: 0x0B132B,
            metalness: 0.3,
            roughness: 0.1,
            transmission: 0.6,
            transparent: true,
            opacity: 0.92
        });
        this.matGold = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.2, metalness: 0.9 });
        this.matCopper = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.3, metalness: 0.8 });
    }

    // 1. Create 3D Scientist Character (Astronaut)
    createScientist() {
        const group = new THREE.Group();

        // Torso with backpack
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.7, 16);
        const bodyMesh = new THREE.Mesh(bodyGeo, this.matSuit);
        bodyMesh.position.y = 0.65;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        // Life support pack on back
        const packGeo = new THREE.BoxGeometry(0.36, 0.45, 0.18);
        const packMesh = new THREE.Mesh(packGeo, this.matSuitBlue);
        packMesh.position.set(0, 0.7, -0.22);
        packMesh.castShadow = true;
        group.add(packMesh);

        // ISRO Saffron Chest Badge Stripe
        const stripeGeo = new THREE.BoxGeometry(0.22, 0.08, 0.05);
        const stripeMesh = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: 0xFF9933 }));
        stripeMesh.position.set(0, 0.78, 0.28);
        group.add(stripeMesh);

        // Head & Helmet
        const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const headMesh = new THREE.Mesh(headGeo, this.matSuit);
        headMesh.position.y = 1.15;
        headMesh.castShadow = true;
        group.add(headMesh);

        // Visor
        const visorGeo = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const visorMesh = new THREE.Mesh(visorGeo, this.matVisor);
        visorMesh.rotation.x = Math.PI * 0.5;
        visorMesh.position.set(0, 1.15, 0.12);
        group.add(visorMesh);

        // Legs & Pivots
        const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.45, 12);
        const bootGeo = new THREE.BoxGeometry(0.15, 0.12, 0.25);

        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.14, 0.35, 0);
        const leftLeg = new THREE.Mesh(legGeo, this.matSuit);
        leftLeg.position.y = -0.15;
        leftLeg.castShadow = true;
        leftLegPivot.add(leftLeg);
        const leftBoot = new THREE.Mesh(bootGeo, this.matSuitBlue);
        leftBoot.position.set(0, -0.34, 0.05);
        leftBoot.castShadow = true;
        leftLegPivot.add(leftBoot);
        group.add(leftLegPivot);

        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.14, 0.35, 0);
        const rightLeg = new THREE.Mesh(legGeo, this.matSuit);
        rightLeg.position.y = -0.15;
        rightLeg.castShadow = true;
        rightLegPivot.add(rightLeg);
        const rightBoot = new THREE.Mesh(bootGeo, this.matSuitBlue);
        rightBoot.position.set(0, -0.34, 0.05);
        rightBoot.castShadow = true;
        rightLegPivot.add(rightBoot);
        group.add(rightLegPivot);

        // Arms & Gloves
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 12);
        const gloveGeo = new THREE.SphereGeometry(0.09, 12, 12);

        const leftArmPivot = new THREE.Group();
        leftArmPivot.position.set(-0.35, 0.85, 0);
        const leftArm = new THREE.Mesh(armGeo, this.matSuit);
        leftArm.position.y = -0.18;
        leftArm.castShadow = true;
        leftArmPivot.add(leftArm);
        const leftGlove = new THREE.Mesh(gloveGeo, this.matSuitBlue);
        leftGlove.position.y = -0.38;
        leftArmPivot.add(leftGlove);
        group.add(leftArmPivot);

        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(0.35, 0.85, 0);
        const rightArm = new THREE.Mesh(armGeo, this.matSuit);
        rightArm.position.y = -0.18;
        rightArm.castShadow = true;
        rightArmPivot.add(rightArm);
        const rightGlove = new THREE.Mesh(gloveGeo, this.matSuitBlue);
        rightGlove.position.y = -0.38;
        rightArmPivot.add(rightGlove);
        group.add(rightArmPivot);

        // Carried Item Anchor Node (with glowing hover ring)
        const carriedAnchor = new THREE.Group();
        carriedAnchor.position.set(0, 1.7, 0);
        group.add(carriedAnchor);

        return {
            mesh: group,
            leftLeg: leftLegPivot,
            rightLeg: rightLegPivot,
            leftArm: leftArmPivot,
            rightArm: rightArmPivot,
            carriedAnchor: carriedAnchor
        };
    }

    // 2. Create Sleek Metallic Workbenches (input_file_0.png match)
    createWorkbench(width = 0.9, depth = 0.9, height = 0.65, options = {}) {
        const group = new THREE.Group();

        // Thick brushed steel counter top
        const topGeo = new THREE.BoxGeometry(width, 0.08, depth);
        const topMesh = new THREE.Mesh(topGeo, options.whiteTop ? this.matWhiteCounter : this.matSteel);
        topMesh.position.y = height - 0.04;
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        group.add(topMesh);

        // Optional green cutting mat with tools
        if (options.withMat) {
            const matGeo = new THREE.BoxGeometry(width * 0.75, 0.008, depth * 0.65);
            const matMesh = new THREE.Mesh(matGeo, this.matESD);
            matMesh.position.set(0, height + 0.004, 0);
            matMesh.receiveShadow = true;
            group.add(matMesh);

            if (options.withTool) {
                // Red screwdriver & yellow pliers on mat
                const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
                const handleMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.3 });
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.rotation.z = Math.PI * 0.5;
                handle.position.set(0.12, height + 0.015, 0.1);
                handle.castShadow = true;
                group.add(handle);

                const bladeGeo = new THREE.BoxGeometry(0.08, 0.015, 0.015);
                const blade = new THREE.Mesh(bladeGeo, this.matMetal);
                blade.position.set(0.2, height + 0.015, 0.1);
                group.add(blade);
            }
        }

        // Silver metallic legs
        const legGeo = new THREE.CylinderGeometry(0.035, 0.035, height - 0.08);
        const legPositions = [
            [-width / 2 + 0.06, (height - 0.08) / 2, -depth / 2 + 0.06],
            [width / 2 - 0.06, (height - 0.08) / 2, -depth / 2 + 0.06],
            [-width / 2 + 0.06, (height - 0.08) / 2, depth / 2 - 0.06],
            [width / 2 - 0.06, (height - 0.08) / 2, depth / 2 - 0.06]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, this.matDarkMetal);
            leg.position.set(...pos);
            leg.castShadow = true;
            group.add(leg);
        });

        return group;
    }

    // 3. Create Computer Terminal (High Contrast Green Telemetry)
    createComputerTerminal() {
        const group = new THREE.Group();

        const baseGeo = new THREE.BoxGeometry(0.48, 0.42, 0.34);
        const matBeige = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.4 });
        const baseMesh = new THREE.Mesh(baseGeo, matBeige);
        baseMesh.position.y = 0.21;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Screen frame & glowing green telemetry display
        const screenGeo = new THREE.PlaneGeometry(0.36, 0.28);
        const matScreen = new THREE.MeshBasicMaterial({ color: 0x10B981 });
        const screenMesh = new THREE.Mesh(screenGeo, matScreen);
        screenMesh.position.set(0, 0.22, 0.175);
        group.add(screenMesh);
        group.screenMesh = screenMesh;

        // Keyboard on desk
        const kbGeo = new THREE.BoxGeometry(0.32, 0.015, 0.14);
        const kbMesh = new THREE.Mesh(kbGeo, this.matDarkMetal);
        kbMesh.position.set(0, 0.01, 0.3);
        group.add(kbMesh);

        return group;
    }

    // 4. Create High-Fidelity Perforated TVAC Vacuum Testing Chamber (input_file_0.png match)
    createTVACChamber() {
        const group = new THREE.Group();

        // Blue metallic support stand base
        const standGeo = new THREE.BoxGeometry(0.8, 0.35, 1.1);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3, metalness: 0.5 });
        const standMesh = new THREE.Mesh(standGeo, standMat);
        standMesh.position.set(0, 0.175, 0);
        standMesh.castShadow = true;
        standMesh.receiveShadow = true;
        group.add(standMesh);

        // Main White Cylindrical Vacuum Tank
        const tankGeo = new THREE.CylinderGeometry(0.52, 0.52, 1.35, 32);
        const tankMesh = new THREE.Mesh(tankGeo, this.matSuit);
        tankMesh.rotation.z = Math.PI * 0.5;
        tankMesh.position.y = 0.65;
        tankMesh.castShadow = true;
        tankMesh.receiveShadow = true;
        group.add(tankMesh);

        // Silver End Flange Ring
        const ringGeo = new THREE.TorusGeometry(0.53, 0.04, 16, 32);
        const ringMesh = new THREE.Mesh(ringGeo, this.matMetal);
        ringMesh.rotation.y = Math.PI * 0.5;
        ringMesh.position.set(0.68, 0.65, 0);
        ringMesh.castShadow = true;
        group.add(ringMesh);

        // Hatch Group (Swinging left)
        const hatchGroup = new THREE.Group();
        hatchGroup.position.set(0.68, 0.65, 0.52);

        const lidGeo = new THREE.CylinderGeometry(0.54, 0.54, 0.08, 32);
        const lidMesh = new THREE.Mesh(lidGeo, this.matMetal);
        lidMesh.rotation.z = Math.PI * 0.5;
        lidMesh.position.set(0, 0, -0.52);
        lidMesh.castShadow = true;
        hatchGroup.add(lidMesh);

        // Locking bolt protrusions around hatch
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8),
                this.matDarkMetal
            );
            bolt.rotation.z = Math.PI * 0.5;
            bolt.position.set(0.04, Math.cos(a) * 0.44, -0.52 + Math.sin(a) * 0.44);
            hatchGroup.add(bolt);
        }

        group.add(hatchGroup);

        // Perforated White Slide-Out Test Tray (input_file_0.png exact feature!)
        const trayGroup = new THREE.Group();
        const trayGeo = new THREE.BoxGeometry(0.85, 0.025, 0.52);
        const trayMesh = new THREE.Mesh(trayGeo, this.matWhiteCounter);
        trayMesh.position.set(0.45, 0.52, 0);
        trayMesh.castShadow = true;
        trayMesh.receiveShadow = true;
        trayGroup.add(trayMesh);

        // Create matrix of black grid holes on perforated tray
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
        for (let hx = 0.15; hx <= 0.75; hx += 0.15) {
            for (let hz = -0.18; hz <= 0.18; hz += 0.12) {
                const hole = new THREE.Mesh(new THREE.CircleGeometry(0.02, 8), holeMat);
                hole.rotation.x = -Math.PI * 0.5;
                hole.position.set(hx, 0.534, hz);
                trayGroup.add(hole);
            }
        }
        group.add(trayGroup);

        // Glowing LED test status indicator bar on top of chamber
        const ledGeo = new THREE.BoxGeometry(0.4, 0.04, 0.08);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(0, 1.2, 0);
        group.add(ledMesh);

        return {
            mesh: group,
            hatchGroup: hatchGroup,
            ledMesh: ledMesh
        };
    }

    // 5. Create High-Fidelity Animated Conveyor Belt with Delivery Chute & Controls (input_file_1.png match)
    createConveyorBelt() {
        const group = new THREE.Group();
        const arrows = [];

        // Main Blue & Steel Support Frame
        const frameGeo = new THREE.BoxGeometry(0.88, 0.45, 1.75);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3, metalness: 0.5 });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.y = 0.225;
        frameMesh.castShadow = true;
        frameMesh.receiveShadow = true;
        group.add(frameMesh);

        // Stainless Steel Side Rails
        const railGeo = new THREE.BoxGeometry(0.08, 0.5, 1.76);
        const lRail = new THREE.Mesh(railGeo, this.matSteel);
        lRail.position.set(-0.41, 0.25, 0);
        group.add(lRail);
        const rRail = new THREE.Mesh(railGeo, this.matSteel);
        rRail.position.set(0.41, 0.25, 0);
        group.add(rRail);

        // Moving Dark Grey Rubber Conveyor Belt
        const beltGeo = new THREE.BoxGeometry(0.74, 0.02, 1.68);
        const matBelt = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
        const beltMesh = new THREE.Mesh(beltGeo, matBelt);
        beltMesh.position.set(0, 0.46, 0);
        beltMesh.receiveShadow = true;
        group.add(beltMesh);

        // Animated Yellow Chevron Arrows (Will be animated by gameEngine3D.js)
        for (let i = -0.6; i <= 0.6; i += 0.4) {
            const arrowGeo = new THREE.ConeGeometry(0.12, 0.22, 3);
            const matArrow = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
            const arrowMesh = new THREE.Mesh(arrowGeo, matArrow);
            arrowMesh.rotation.x = Math.PI * 0.5;
            arrowMesh.rotation.y = Math.PI; // Pointing along +Z toward delivery chute
            arrowMesh.position.set(0, 0.475, i);
            group.add(arrowMesh);
            arrows.push(arrowMesh);
        }

        // Angled Black Delivery Chute / Hood at the end of the belt (input_file_1.png match)
        const hoodGroup = new THREE.Group();
        hoodGroup.position.set(0, 0.65, 0.75);
        const hoodGeo = new THREE.BoxGeometry(0.86, 0.4, 0.35);
        const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.2 });
        const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
        hoodMesh.rotation.x = Math.PI * 0.25;
        hoodMesh.castShadow = true;
        hoodGroup.add(hoodMesh);
        group.add(hoodGroup);

        // Side Control Box with Red Stop and Green Start Buttons
        const ctrlBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.2, 0.35),
            this.matDarkMetal
        );
        ctrlBox.position.set(-0.48, 0.45, -0.5);
        group.add(ctrlBox);

        const stopBtn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12),
            new THREE.MeshBasicMaterial({ color: 0xEF4444 })
        );
        stopBtn.rotation.z = Math.PI * 0.5;
        stopBtn.position.set(-0.55, 0.5, -0.58);
        group.add(stopBtn);

        const startBtn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12),
            new THREE.MeshBasicMaterial({ color: 0x10B981 })
        );
        startBtn.rotation.z = Math.PI * 0.5;
        startBtn.position.set(-0.55, 0.5, -0.42);
        group.add(startBtn);

        return { mesh: group, arrows: arrows };
    }

    // 5B. Create Weighing Scale / Diagnostics Table (input_file_1.png top-left of conveyor)
    createWeighingTable() {
        const group = this.createWorkbench(0.85, 0.85, 0.65);

        // Pristine white digital weighing scale unit
        const scaleBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.08, 0.42),
            new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2 })
        );
        scaleBase.position.set(0, 0.69, 0);
        scaleBase.castShadow = true;
        group.add(scaleBase);

        // Angled Blue Screen Console
        const screenGeo = new THREE.BoxGeometry(0.34, 0.12, 0.08);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.rotation.x = -Math.PI * 0.25;
        screenMesh.position.set(0, 0.77, -0.14);
        group.add(screenMesh);
        group.screenMesh = screenMesh;

        return group;
    }

    // 5C. Create Recycle Table with Green Recycling Symbol (input_file_1.png bottom of conveyor)
    createRecycleTable() {
        const group = this.createWorkbench(0.85, 0.85, 0.65);

        // Recessed Tray Border
        const trayBorder = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.03, 0.65),
            this.matSteel
        );
        trayBorder.position.y = 0.66;
        group.add(trayBorder);

        // Canvas texture for crisp Green Recycling Logo
        const recCanvas = document.createElement('canvas');
        recCanvas.width = 128;
        recCanvas.height = 128;
        const rCtx = recCanvas.getContext('2d');
        rCtx.fillStyle = '#F8FAFC';
        rCtx.fillRect(0, 0, 128, 128);
        rCtx.fillStyle = '#15803D';
        rCtx.font = 'bold 84px sans-serif';
        rCtx.textAlign = 'center';
        rCtx.textBaseline = 'middle';
        rCtx.fillText('♻', 64, 68);

        const recTexture = new THREE.CanvasTexture(recCanvas);
        const tileMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 0.55),
            new THREE.MeshBasicMaterial({ map: recTexture })
        );
        tileMesh.rotation.x = -Math.PI * 0.5;
        tileMesh.position.set(0, 0.68, 0);
        group.add(tileMesh);

        return group;
    }

    // 6. Create Floor Hazard Decals (Radiation / Soldering / Tool)
    createFloorDecal(type, x, z) {
        const group = new THREE.Group();
        const ringGeo = new THREE.RingGeometry(0.16, 0.34, 24);
        let color = 0xFACC15;
        if (type === 'radiation') color = 0xEF4444;
        else if (type === 'solder') color = 0xF59E0B;
        else if (type === 'tool') color = 0x3B82F6;

        const decalMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
        const decalMesh = new THREE.Mesh(ringGeo, decalMat);
        decalMesh.rotation.x = -Math.PI * 0.5;
        decalMesh.position.set(x, 0.012, z);
        group.add(decalMesh);

        // Center symbol background circle
        const dotGeo = new THREE.CircleGeometry(0.12, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x0F172A, side: THREE.DoubleSide });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.rotation.x = -Math.PI * 0.5;
        dotMesh.position.set(x, 0.013, z);
        group.add(dotMesh);

        return group;
    }

    // 7. Create White Pedestal Tile with Colored Decal Tile (input_file_0.png match)
    createSupplyDecal(colorHex) {
        const group = new THREE.Group();
        // White base tile
        const whiteGeo = new THREE.BoxGeometry(0.68, 0.02, 0.68);
        const whiteMesh = new THREE.Mesh(whiteGeo, this.matWhiteCounter);
        group.add(whiteMesh);

        // Colored inner decal tile
        const colorGeo = new THREE.BoxGeometry(0.56, 0.025, 0.56);
        const colorMat = new THREE.MeshStandardMaterial({ color: colorHex || 0x3B82F6, roughness: 0.3 });
        const colorMesh = new THREE.Mesh(colorGeo, colorMat);
        colorMesh.position.y = 0.005;
        group.add(colorMesh);

        return group;
    }

    // 8. Create Floating Order Marker Sprite matching reference "1" indicator
    createOrderMarker(numStr = '1') {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 10;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(16, 16, 96, 96, 24);
        } else {
            ctx.rect(16, 16, 96, 96);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 76px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numStr, 64, 68);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.85, 0.85, 1);
        return sprite;
    }

    // 9. Ultra-High-Fidelity 3D Component Models (No more vague shapes!)
    createComponent(type) {
        const group = new THREE.Group();

        if (type === 'chassis') {
            // Gold foil cube with silver rails and solar panels
            const coreGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
            const coreMesh = new THREE.Mesh(coreGeo, this.matGold);
            coreMesh.castShadow = true;
            group.add(coreMesh);

            const frameGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
            const frameMesh = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({ color: 0x64748B, wireframe: true }));
            group.add(frameMesh);

            // Top green avionics LED
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.08), new THREE.MeshBasicMaterial({ color: 0x10B981 }));
            led.position.y = 0.17;
            group.add(led);
        } else if (type === 'solar') {
            // Twin blue photovoltaic panels with gold grid lines
            const panelMat = new THREE.MeshStandardMaterial({ color: 0x1D4ED8, roughness: 0.2, metalness: 0.8 });
            const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.22), panelMat);
            leftPanel.position.x = -0.2;
            leftPanel.castShadow = true;
            group.add(leftPanel);

            const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.22), panelMat);
            rightPanel.position.x = 0.2;
            rightPanel.castShadow = true;
            group.add(rightPanel);

            const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), this.matGold);
            hinge.rotation.x = Math.PI * 0.5;
            group.add(hinge);
        } else if (type === 'battery') {
            // 4 emerald cylindrical cells in silver bracket
            const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), this.matMetal);
            bracket.position.y = -0.06;
            group.add(bracket);

            for (let x = -0.06; x <= 0.06; x += 0.12) {
                for (let z = -0.06; z <= 0.06; z += 0.12) {
                    const cell = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12),
                        new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.3 })
                    );
                    cell.position.set(x, 0.04, z);
                    cell.castShadow = true;
                    group.add(cell);
                }
            }
        } else if (type === 'obc') {
            // PCB motherboard with gold pins and pulsing core
            const pcb = new THREE.Mesh(
                new THREE.BoxGeometry(0.34, 0.03, 0.34),
                new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 })
            );
            pcb.castShadow = true;
            group.add(pcb);

            const cpu = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.04, 0.14),
                new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.2 })
            );
            cpu.position.y = 0.035;
            group.add(cpu);

            const coreLed = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.05, 0.06),
                new THREE.MeshBasicMaterial({ color: 0xA855F7 })
            );
            coreLed.position.y = 0.04;
            group.add(coreLed);
        } else if (type === 'imager') {
            // Metallic silver telescope tube with dark blue lens
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.1, 0.32, 24),
                this.matMetal
            );
            body.castShadow = true;
            group.add(body);

            const lens = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24),
                new THREE.MeshPhysicalMaterial({ color: 0x1E3A8A, metalness: 0.9, roughness: 0.1 })
            );
            lens.position.y = 0.17;
            group.add(lens);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.12, 0.02, 12, 24),
                this.matGold
            );
            ring.rotation.x = Math.PI * 0.5;
            ring.position.y = 0.05;
            group.add(ring);
        } else if (type === 'sar') {
            // Gold radar mesh dish with silver feed horn
            const dish = new THREE.Mesh(
                new THREE.BoxGeometry(0.38, 0.03, 0.26),
                this.matGold
            );
            dish.rotation.x = 0.2;
            dish.castShadow = true;
            group.add(dish);

            const horn = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.16, 8),
                this.matMetal
            );
            horn.position.set(0, 0.08, -0.05);
            group.add(horn);
        } else if (type === 'spectrometer') {
            // Cyan analyzer box with cooling grill and sensor slit
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(0.28, 0.22, 0.24),
                new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.3, metalness: 0.5 })
            );
            box.castShadow = true;
            group.add(box);

            const slit = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.04, 0.02),
                new THREE.MeshBasicMaterial({ color: 0x0F172A })
            );
            slit.position.set(0, 0.02, 0.125);
            group.add(slit);
        } else if (type === 'magnetometer') {
            // Red sensor boom rod with gold toroidal coils
            const rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12),
                new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.4 })
            );
            rod.rotation.z = Math.PI * 0.5;
            rod.castShadow = true;
            group.add(rod);

            const coil1 = new THREE.Mesh(
                new THREE.TorusGeometry(0.06, 0.02, 12, 16),
                this.matGold
            );
            coil1.rotation.y = Math.PI * 0.5;
            coil1.position.x = -0.18;
            group.add(coil1);

            const coil2 = new THREE.Mesh(
                new THREE.TorusGeometry(0.06, 0.02, 12, 16),
                this.matGold
            );
            coil2.rotation.y = Math.PI * 0.5;
            coil2.position.x = 0.18;
            group.add(coil2);
        } else if (type === 'adcs') {
            // Silver cylinder housing with visible gold gyro ring
            const housing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.16, 0.22, 24),
                this.matMetal
            );
            housing.castShadow = true;
            group.add(housing);

            const gyro = new THREE.Mesh(
                new THREE.TorusGeometry(0.12, 0.025, 12, 24),
                this.matGold
            );
            gyro.rotation.x = Math.PI * 0.3;
            gyro.position.y = 0.12;
            group.add(gyro);
        } else if (type === 'antenna') {
            // Gold parabolic dish with central feed horn
            const dish = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45),
                this.matGold
            );
            dish.rotation.x = Math.PI;
            dish.castShadow = true;
            group.add(dish);

            const feed = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8),
                this.matMetal
            );
            feed.position.y = 0.08;
            group.add(feed);
        } else if (type === 'thruster') {
            // Silver conical nozzle with blue glowing plasma inside
            const tank = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 16, 16),
                this.matSuit
            );
            tank.position.y = -0.06;
            tank.castShadow = true;
            group.add(tank);

            const nozzle = new THREE.Mesh(
                new THREE.ConeGeometry(0.12, 0.24, 16),
                this.matMetal
            );
            nozzle.rotation.x = Math.PI;
            nozzle.position.y = 0.1;
            nozzle.castShadow = true;
            group.add(nozzle);

            const plasma = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0x00E5FF })
            );
            plasma.position.y = 0.18;
            group.add(plasma);
        }

        return group;
    }

    createStatusBadge(text = '✅', bgColor = '#10B981', textColor = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(8, 8, 240, 48, 18);
            ctx.fill();
        } else {
            ctx.fillRect(8, 8, 240, 48);
        }

        ctx.fillStyle = textColor;
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 34);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.0, 0.25, 1);
        return sprite;
    }

    // Animated look-at reticle on the floor (rotating rings + corner brackets)
    createLookAtReticle() {
        const group = new THREE.Group();

        // Outer rotating ring
        const outerGeo = new THREE.RingGeometry(0.38, 0.42, 32);
        const outerMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const outerRing = new THREE.Mesh(outerGeo, outerMat);
        outerRing.rotation.x = -Math.PI / 2;
        group.add(outerRing);

        // Inner counter-rotating ring
        const innerGeo = new THREE.RingGeometry(0.24, 0.27, 32);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const innerRing = new THREE.Mesh(innerGeo, innerMat);
        innerRing.rotation.x = -Math.PI / 2;
        group.add(innerRing);

        // Corner bracket indicators (4 corners)
        const bGeo = new THREE.BoxGeometry(0.12, 0.01, 0.03);
        const bMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
        const corners = [
            [0.32, 0, 0.32, 0],
            [-0.32, 0, 0.32, Math.PI / 2],
            [0.32, 0, -0.32, -Math.PI / 2],
            [-0.32, 0, -0.32, Math.PI]
        ];
        corners.forEach(([x, y, z, ry]) => {
            const b = new THREE.Mesh(bGeo, bMat);
            b.position.set(x, 0.02, z);
            b.rotation.y = ry;
            group.add(b);
        });

        return group;
    }
}

