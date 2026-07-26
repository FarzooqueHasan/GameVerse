// sceneComposer.js
// Turns a plain-object "layout" (which you can write per location, or I can
// write from your reference photos) into a rendered fixed-camera 3D scene.
// This is the piece that makes "5+ locations" achievable: each new location
// is a small JSON-like layout reusing voxelKit pieces, not new geometry code.

import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { Kit } from './voxelKit.js';

/**
 * Example layout shape:
 * {
 *   background: '#dfe7f5',
 *   camera: { position: [0, 4, 11], lookAt: [0, 1.5, 0], fov: 45 },
 *   light:  { ambient: 0.6, sunColor: '#fff2d9', sunIntensity: 0.9, sunPosition: [6, 10, 6] },
 *   idleDrift: true,   // subtle camera sway for a "living scene" feel
 *   objects: [
 *     { type: 'floor',  position: [0, 0, 0],   params: [20, 20, 0xc9b79c] },
 *     { type: 'wall',   position: [0, 0, -10], params: [20, 6, 0.4, 0xe8ddcf] },
 *     { type: 'pillar', position: [-8, 0, -6], params: [6, 0.5] },
 *     { type: 'banner', position: [0, 4.5, -9.8], params: [6, 1.2], text: 'CelesteCon' },
 *   ]
 * }
 */

export function buildScene(container, layout) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  // Maxed-out Cyberpunk / Deep Space Galactic Atmosphere
  scene.background = new THREE.Color('#050814');
  scene.fog = new THREE.FogExp2(0x050814, 0.012);

  const camera = new THREE.PerspectiveCamera(layout.camera?.fov || 55, width / height, 0.1, 150);
  const camPos = layout.camera?.position || [0, 4, 11];
  camera.position.set(...camPos);
  const lookAt = layout.camera?.lookAt || [0, 1, 0];
  camera.lookAt(...lookAt);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // --- MAXED OUT LIGHTING RIG ---
  const lightCfg = layout.light || {};
  const ambient = new THREE.AmbientLight(0xffffff, lightCfg.ambient ?? 0.7);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x7fa7c9, 0x141b33, 0.5);
  scene.add(hemi);

  // High-Resolution Golden Sun Directional Light with Soft Shadows
  const sun = new THREE.DirectionalLight(lightCfg.sunColor || '#fff8ed', lightCfg.sunIntensity ?? 1.4);
  sun.position.set(...(lightCfg.sunPosition || [8, 16, 8]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 60;
  const d = 25;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  // Cyberpunk Studio Point Lights (Neon Rim & Warm Gold Fill)
  const cyanLight = new THREE.PointLight(0x00f0ff, 2.5, 45);
  cyanLight.position.set(-15, 8, -10);
  scene.add(cyanLight);

  const goldLight = new THREE.PointLight(0xffd166, 2.0, 45);
  goldLight.position.set(15, 6, 12);
  scene.add(goldLight);

  const stageUplight = new THREE.PointLight(0x00f0ff, 1.5, 20);
  stageUplight.position.set(0, 1.0, -6);
  scene.add(stageUplight);

  // --- 3D DEEP SPACE STARFIELD & CYBER HORIZON ---
  const starGeo = new THREE.BufferGeometry();
  const starCount = 2000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const palette = [new THREE.Color('#ffffff'), new THREE.Color('#00f0ff'), new THREE.Color('#ffd166'), new THREE.Color('#7fa7c9')];
  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 70 + Math.random() * 20;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 5; // keep in upper sky
    starPositions[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity: 0.85 });
  const starGroup = new THREE.Points(starGeo, starMat);
  scene.add(starGroup);

  // Hovering Celestial Moon / Orbital Planet
  const moonGeo = new THREE.SphereGeometry(12, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({ color: 0x141b33, emissive: 0x0080ff, emissiveIntensity: 0.3, wireframe: true, roughness: 0.2 });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.set(20, 32, -55);
  scene.add(moon);

  // Futuristic Holographic Ground Grid
  const grid = new THREE.GridHelper(160, 80, 0x00f0ff, 0x112244);
  grid.position.y = -0.05;
  scene.add(grid);

  // Place every object from the layout using the shared kit.
  (layout.objects || []).forEach(obj => {
    const factory = Kit[obj.type];
    if (!factory) {
      console.warn(`Unknown voxel kit piece: "${obj.type}" -- skipping.`);
      return;
    }
    const args = [...(obj.params || [])];
    const opts = { position: obj.position, rotation: obj.rotation, scale: obj.scale, text: obj.text };
    const piece = factory(...args, opts);

    // Attach RPG interaction metadata if defined
    if (obj.id) piece.userData.id = obj.id;
    if (obj.interactName) piece.userData.interactName = obj.interactName;
    if (obj.dialogueKey) piece.userData.dialogueKey = obj.dialogueKey;
    if (obj.isEasterEgg) piece.userData.isEasterEgg = true;
    if (obj.easterEggName) piece.userData.easterEggName = obj.easterEggName;
    if (obj.easterEggPower) piece.userData.easterEggPower = obj.easterEggPower;
    if (obj.isScavengerTarget) piece.userData.isScavengerTarget = true;
    if (obj.scavengerName) piece.userData.scavengerName = obj.scavengerName;
    // Hide scavenger target by default until scavenger hunt is activated!
    if (obj.isScavengerTarget) {
      piece.visible = window.GameState && window.GameState.scavengerActive ? true : false;
    }

    scene.add(piece);
  });

  // Load provided 3D GLB models if specified in the scene layout
  if (layout.glbModel) {
    const loader = new GLTFLoader();
    loader.load(layout.glbModel, (gltf) => {
      const model = gltf.scene;
      if (layout.glbScale) model.scale.set(...layout.glbScale);
      if (layout.glbPosition) model.position.set(...layout.glbPosition);
      if (layout.glbRotation) model.rotation.set(...layout.glbRotation);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.min(0.6, child.material.roughness || 0.6);
            child.material.metalness = Math.max(0.2, child.material.metalness || 0.2);
          }
        }
      });
      scene.add(model);
    }, undefined, (err) => {
      console.warn("Error loading GLB model:", layout.glbModel, err);
    });
  }

  // Render loop with dynamic camera tracking (follows player avatar smoothly)
  let frame = 0;
  // Cinematic Hollywood Steady-Cam state (prevents violent camera snapping and whipping on turns)
  let smoothCamX = null;
  let smoothCamY = null;
  let smoothCamZ = null;
  let smoothLookX = null;
  let smoothLookY = null;
  let smoothLookZ = null;
  let currentCamYaw = Math.PI;

  function animate() {
    frame += 0.005;
    if (starGroup) starGroup.rotation.y += 0.0003;
    if (moon) moon.rotation.y += 0.002;

    // Animate collectibles (Easter Eggs & Scavenger items float and spin)
    scene.children.forEach(c => {
      if (c.userData && (c.userData.isEasterEgg || c.userData.isScavengerTarget)) {
        c.rotation.y += 0.02;
        c.position.y += Math.sin(frame * 4) * 0.006;
      }
    });

    if (window.GameState && window.GameState.playerGroup) {
      const px = window.GameState.playerGroup.position.x;
      const py = window.GameState.playerGroup.position.y || 0;
      const pz = window.GameState.playerGroup.position.z;
      const targetRotY = window.GameState.playerGroup.rotation.y || 0;

      // Smooth shortest-path angle damping for cinematic Hollywood steady-cam (prevents violent whipping on turns!)
      let diff = (targetRotY - currentCamYaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      currentCamYaw += diff * 0.045; // Gentle 4.5% lerp per frame keeps camera rock-steady and smooth

      const distBehind = 3.6;
      const heightAbove = 2.0;
      const targetCamX = px - Math.sin(currentCamYaw) * distBehind;
      const targetCamY = py + heightAbove;
      const targetCamZ = pz - Math.cos(currentCamYaw) * distBehind;

      // Look slightly ahead of character upper chest/head (keeps avatar beautifully framed without dizzying swings)
      const targetLookX = px + Math.sin(currentCamYaw) * 1.5;
      const targetLookY = py + 1.45;
      const targetLookZ = pz + Math.cos(currentCamYaw) * 1.5;

      // Initialize instantly on first frame so there is no universe-wide lerp across scenes
      if (smoothCamX === null) {
        smoothCamX = targetCamX; smoothCamY = targetCamY; smoothCamZ = targetCamZ;
        smoothLookX = targetLookX; smoothLookY = targetLookY; smoothLookZ = targetLookZ;
        currentCamYaw = targetRotY;
      }

      smoothCamX += (targetCamX - smoothCamX) * 0.1;
      smoothCamY += (targetCamY - smoothCamY) * 0.1;
      smoothCamZ += (targetCamZ - smoothCamZ) * 0.1;

      smoothLookX += (targetLookX - smoothLookX) * 0.12;
      smoothLookY += (targetLookY - smoothLookY) * 0.12;
      smoothLookZ += (targetLookZ - smoothLookZ) * 0.12;

      camera.position.set(smoothCamX, smoothCamY, smoothCamZ);
      camera.lookAt(smoothLookX, smoothLookY, smoothLookZ);
    } else if (layout.idleDrift) {
      camera.position.x = camPos[0] + Math.sin(frame) * 0.3;
      camera.lookAt(...lookAt);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Keep it responsive if the container resizes.
  function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  return { scene, camera, renderer };
}
