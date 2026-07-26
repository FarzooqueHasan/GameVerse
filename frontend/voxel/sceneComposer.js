// sceneComposer.js
// Turns a plain-object "layout" (which you can write per location, or I can
// write from your reference photos) into a rendered fixed-camera 3D scene.
// This is the piece that makes "5+ locations" achievable: each new location
// is a small JSON-like layout reusing voxelKit pieces, not new geometry code.

import * as THREE from '../vendor/three/three.module.js';
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
  scene.background = new THREE.Color(layout.background || '#dfe7f5');

  const camera = new THREE.PerspectiveCamera(layout.camera?.fov || 45, width / height, 0.1, 100);
  const camPos = layout.camera?.position || [0, 4, 11];
  camera.position.set(...camPos);
  const lookAt = layout.camera?.lookAt || [0, 1, 0];
  camera.lookAt(...lookAt);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Lighting rig: soft ambient + a warm "sun" for gentle shadows.
  const lightCfg = layout.light || {};
  const ambient = new THREE.AmbientLight(0xffffff, lightCfg.ambient ?? 0.6);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(lightCfg.sunColor || '#fff2d9', lightCfg.sunIntensity ?? 0.9);
  sun.position.set(...(lightCfg.sunPosition || [6, 10, 6]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

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

    scene.add(piece);
  });

  // Render loop with optional subtle idle camera drift (gives the fixed
  // scene a bit of life without turning it into a free-roam space).
  let frame = 0;
  function animate() {
    frame += 0.005;
    if (layout.idleDrift) {
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
