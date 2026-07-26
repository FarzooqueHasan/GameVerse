// ISRO 3D Cleanroom Scene Setup & Particle Manager (input_file_0.png Match)

class CleanroomScene3D {
    constructor(containerEl) {
        this.container = containerEl;
        this.models = new ModelBuilder();

        // 1. WebGL Renderer with High-Quality Shadow Maps
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);

        // 2. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xDDE6ED); // Soft grey-blue backdrop matching input_file_0.png

        // 3. Perspective Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);

        // Exact angle matching input_file_0.png
        this.camera.position.set(0, 11.2, 13.5);
        this.camera.lookAt(0, -0.2, -0.8);

        // 4. Studio Lighting & High-Contrast Shadow Setup
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.82);
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.95);
        this.dirLight.position.set(5, 16, 9);
        this.dirLight.castShadow = true;

        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 35;
        this.dirLight.shadow.camera.left = -10;
        this.dirLight.shadow.camera.right = 10;
        this.dirLight.shadow.camera.top = 10;
        this.dirLight.shadow.camera.bottom = -10;
        this.dirLight.shadow.bias = -0.0004;
        this.dirLight.shadow.radius = 2; // Softened edges

        this.scene.add(this.dirLight);

        const fillLight = new THREE.DirectionalLight(0x0284C7, 0.28);
        fillLight.position.set(-8, 10, -8);
        this.scene.add(fillLight);

        // Red alarm glow light
        const alarmLight = new THREE.PointLight(0xEF4444, 1.2, 4);
        alarmLight.position.set(0, 2.9, -4.8);
        this.scene.add(alarmLight);

        // 5. Dynamic Particle System Manager for Trails
        this.particles = [];
        this.particleGroup = new THREE.Group();
        this.scene.add(this.particleGroup);

        // Build Architecture
        this.buildArchitecture();

        window.addEventListener('resize', () => this.onResize());
    }

    // Particle Spawn Helper (For footstep trails, carry orbit trails, TVAC vapor)
    spawnParticle(options) {
        const geo = new THREE.SphereGeometry(options.size || 0.08, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: options.color || 0x00E5FF,
            transparent: true,
            opacity: options.opacity !== undefined ? options.opacity : 0.85
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(options.x, options.y, options.z);

        if (options.scale !== undefined) {
            mesh.scale.set(options.scale, options.scale, options.scale);
        }

        this.particleGroup.add(mesh);
        this.particles.push({
            mesh: mesh,
            vx: options.vx || 0,
            vy: options.vy || (Math.random() * 0.4 + 0.2),
            vz: options.vz || 0,
            life: options.life || 0.6,
            maxLife: options.life || 0.6,
            shrink: options.shrink !== undefined ? options.shrink : true
        });
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.particleGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += p.vz * dt;

                const ratio = p.life / p.maxLife;
                p.mesh.material.opacity = ratio * 0.85;
                if (p.shrink) {
                    p.mesh.scale.set(ratio, ratio, ratio);
                }
            }
        }
    }

    buildArchitecture() {
        // Light Blue Glossy Tile Floor Grid (13.5 wide x 10.5 deep matching input_file_0.png)
        const floorGeo = new THREE.PlaneGeometry(13.5, 10.5);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0xE8F0F6,
            roughness: 0.18,
            metalness: 0.08
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI * 0.5;
        floorMesh.position.set(0, 0, 0);
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);

        // Grid Lines matching reference floor tiles
        const gridHelper = new THREE.GridHelper(13.5, 15, 0x94A3B8, 0xCBD5E1);
        gridHelper.position.set(0, 0.006, 0);
        this.scene.add(gridHelper);

        // Back Wall
        const backWallGeo = new THREE.PlaneGeometry(13.5, 5.5);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.5 });
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, 2.75, -5.25);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left Wall
        const leftWallGeo = new THREE.PlaneGeometry(10.5, 5.5);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.rotation.y = Math.PI * 0.5;
        leftWall.position.set(-6.75, 2.75, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Right Wall (Partial enclosure)
        const rightWallGeo = new THREE.PlaneGeometry(10.5, 5.5);
        const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
        rightWall.rotation.y = -Math.PI * 0.5;
        rightWall.position.set(6.75, 2.75, 0);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // Protruding Exit Room Portal Archway (Exact match of input_file_0.png)
        const portalMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.25 });

        // Left Arch Column
        const leftCol = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.7, 0.65), portalMat);
        leftCol.position.set(-1.15, 1.35, -4.9);
        leftCol.castShadow = true;
        leftCol.receiveShadow = true;
        this.scene.add(leftCol);

        // Right Arch Column
        const rightCol = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.7, 0.65), portalMat);
        rightCol.position.set(1.15, 1.35, -4.9);
        rightCol.castShadow = true;
        rightCol.receiveShadow = true;
        this.scene.add(rightCol);

        // Top Arch Lintel / Header
        const topHeader = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.7, 0.65), portalMat);
        topHeader.position.set(0, 2.35, -4.9);
        topHeader.castShadow = true;
        topHeader.receiveShadow = true;
        this.scene.add(topHeader);

        // Recessed Double Security Doors inside Alcove
        const doorLeafGeo = new THREE.BoxGeometry(0.9, 2.0, 0.06);
        const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.3, metalness: 0.4 });

        const leftDoor = new THREE.Mesh(doorLeafGeo, doorLeafMat);
        leftDoor.position.set(-0.46, 1.0, -5.15);
        this.scene.add(leftDoor);

        const rightDoor = new THREE.Mesh(doorLeafGeo, doorLeafMat);
        rightDoor.position.set(0.46, 1.0, -5.15);
        this.scene.add(rightDoor);

        // Vertical Dark Blue Windows on Doors
        const doorWinGeo = new THREE.PlaneGeometry(0.28, 0.55);
        const doorWinMat = new THREE.MeshBasicMaterial({ color: 0x1E3A8A });
        const lWin = new THREE.Mesh(doorWinGeo, doorWinMat);
        lWin.position.set(-0.46, 1.35, -5.11);
        this.scene.add(lWin);

        const rWin = new THREE.Mesh(doorWinGeo, doorWinMat);
        rWin.position.set(0.46, 1.35, -5.11);
        this.scene.add(rWin);

        // Silver Vertical Door Handles
        const handleGeo = new THREE.BoxGeometry(0.04, 0.35, 0.04);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.8, roughness: 0.2 });
        const lHandle = new THREE.Mesh(handleGeo, handleMat);
        lHandle.position.set(-0.12, 0.95, -5.09);
        this.scene.add(lHandle);
        const rHandle = new THREE.Mesh(handleGeo, handleMat);
        rHandle.position.set(0.12, 0.95, -5.09);
        this.scene.add(rHandle);

        // Red EXIT Sign Plaque above doors (input_file_0.png match)
        const signBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.18, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 })
        );
        signBox.position.set(0, 2.09, -4.55);
        this.scene.add(signBox);

        // Canvas texture for crisp "EXIT" text with red border
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256;
        signCanvas.height = 96;
        const sCtx = signCanvas.getContext('2d');
        sCtx.fillStyle = '#FFFFFF';
        sCtx.fillRect(0, 0, 256, 96);
        sCtx.strokeStyle = '#EF4444';
        sCtx.lineWidth = 12;
        sCtx.strokeRect(6, 6, 244, 84);
        sCtx.fillStyle = '#EF4444';
        sCtx.font = 'bold 54px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText('EXIT', 128, 50);

        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.46, 0.16),
            new THREE.MeshBasicMaterial({ map: signTexture })
        );
        signPlane.position.set(0, 2.09, -4.529);
        this.scene.add(signPlane);

        // Red Warning Lamp above EXIT sign with glowing halo
        const lampBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.08, 16),
            new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        lampBase.position.set(0, 2.22, -4.52);
        this.scene.add(lampBase);

        const lampBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF2222 })
        );
        lampBulb.position.set(0, 2.3, -4.52);
        this.scene.add(lampBulb);

        // Transparent glowing red halo
        const lampHalo = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0.35 })
        );
        lampHalo.position.set(0, 2.3, -4.52);
        this.scene.add(lampHalo);

        // Back Windows (Left of doors)
        const winGeo = new THREE.PlaneGeometry(3.6, 1.0);
        const winMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.1 });

        const win1 = new THREE.Mesh(winGeo, winMat);
        win1.position.set(-3.8, 3.6, -5.23);
        this.scene.add(win1);

        // Left Wall Windows
        const winLeft1 = new THREE.Mesh(winGeo, winMat);
        winLeft1.rotation.y = Math.PI * 0.5;
        winLeft1.position.set(-6.73, 3.6, -2.5);
        this.scene.add(winLeft1);

        const winLeft2 = new THREE.Mesh(winGeo, winMat);
        winLeft2.rotation.y = Math.PI * 0.5;
        winLeft2.position.set(-6.73, 3.6, 1.5);
        this.scene.add(winLeft2);
    }

    onResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
