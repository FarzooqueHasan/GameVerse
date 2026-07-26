// voxelKit.js
// Reusable, soft low-poly building blocks. Flat-shaded materials + muted
// palette give the "gentle voxel" look (like Monument Valley / low-poly
// mobile games) rather than sharp Minecraft cubes -- matches the
// "softer low-poly, less blocky" style you picked.
//
// Every function returns a THREE.Group so it can be positioned, rotated,
// and scaled as one unit when placed into a scene.

import * as THREE from '../vendor/three/three.module.js';

// A shared soft-pastel palette. Scenes can override colors per-object,
// but reusing these keeps every location feeling like the same game.
export const PALETTE = {
  floorWarm: 0xc9b79c,
  floorCool: 0xb7c4d1,
  wallLight: 0xe8ddcf,
  wallDark: 0x9c8f7c,
  wood: 0xb98d5e,
  accentGold: 0xf6c667,
  accentBlue: 0x7fa7c9,
  accentRed: 0xd9776a,
  stone: 0xd9cdb8,
  leaf: 0x8fb996,
};

function baseMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.85,
    metalness: 0.05,
  });
}

// Generates a repeating quarter-circle "fan" paver pattern, like the
// plaza tiling in the amphitheater reference photos -- a bordered square
// with concentric arcs radiating from each corner.
function createPaverTexture(repeat = 6, tileColor = '#d9c9a3', borderColor = '#a85c42') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = tileColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.035;
  ctx.strokeRect(0, 0, size, size);

  ctx.strokeStyle = '#c7b48c';
  ctx.lineWidth = size * 0.008;
  const corners = [
    { x: 0, y: 0, start: 0, end: Math.PI / 2 },
    { x: size, y: 0, start: Math.PI / 2, end: Math.PI },
    { x: size, y: size, start: Math.PI, end: 1.5 * Math.PI },
    { x: 0, y: size, start: 1.5 * Math.PI, end: 2 * Math.PI },
  ];
  corners.forEach(({ x, y, start, end }) => {
    for (let r = size * 0.08; r < size * 0.55; r += size * 0.07) {
      ctx.beginPath();
      ctx.arc(x, y, r, start, end);
      ctx.stroke();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
}

function group(mesh, opts = {}) {
  const g = new THREE.Group();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  if (opts.position) g.position.set(...opts.position);
  if (opts.rotation) g.rotation.set(...opts.rotation);
  if (opts.scale) g.scale.set(...opts.scale);
  return g;
}

export const Kit = {
  floor(width = 10, depth = 10, color = PALETTE.floorWarm, opts = {}) {
    const geo = new THREE.BoxGeometry(width, 0.4, depth);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.position.y = -0.2;
    return group(mesh, opts);
  },

  wall(width = 10, height = 5, thickness = 0.4, color = PALETTE.wallLight, opts = {}) {
    const geo = new THREE.BoxGeometry(width, height, thickness);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.position.y = height / 2;
    return group(mesh, opts);
  },

  pillar(height = 5, radius = 0.4, color = PALETTE.stone, opts = {}) {
    const geo = new THREE.CylinderGeometry(radius, radius * 1.1, height, 8);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.position.y = height / 2;
    return group(mesh, opts);
  },

  stage(width = 6, depth = 4, height = 0.6, color = PALETTE.wood, opts = {}) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.position.y = height / 2;
    return group(mesh, opts);
  },

  table(width = 1.6, depth = 0.8, height = 0.75, color = PALETTE.wood, opts = {}) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), baseMaterial(color));
    top.position.y = height;
    const legGeo = new THREE.BoxGeometry(0.08, height, 0.08);
    const legMat = baseMaterial(color);
    const offsets = [
      [width / 2 - 0.1, depth / 2 - 0.1],
      [-width / 2 + 0.1, depth / 2 - 0.1],
      [width / 2 - 0.1, -depth / 2 + 0.1],
      [-width / 2 + 0.1, -depth / 2 + 0.1],
    ];
    offsets.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, height / 2, z);
      leg.castShadow = true;
      g.add(leg);
    });
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  chair(color = PALETTE.accentRed, opts = {}) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), baseMaterial(color));
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.08), baseMaterial(color));
    back.position.set(0, 0.7, -0.2);
    [seat, back].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  // Flat panel with an optional text label (canvas texture) -- good for
  // event banners, name plaques, screens.
  banner(width = 4, height = 1, color = PALETTE.accentGold, opts = {}) {
    let material;
    if (opts.text) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2a2a2a';
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      material = new THREE.MeshStandardMaterial({ map: texture, flatShading: true });
    } else {
      material = baseMaterial(color);
    }
    const geo = new THREE.BoxGeometry(width, height, 0.1);
    const mesh = new THREE.Mesh(geo, material);
    return group(mesh, opts);
  },

  plant(color = PALETTE.leaf, opts = {}) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.22, 0.4, 8),
      baseMaterial(PALETTE.wood)
    );
    pot.position.y = 0.2;
    const foliage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 0),
      baseMaterial(color)
    );
    foliage.position.y = 0.85;
    [pot, foliage].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  window(width = 1.2, height = 1.6, frameColor = PALETTE.wallDark, paneColor = PALETTE.accentBlue, opts = {}) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.15), baseMaterial(frameColor));
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.8, height * 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: paneColor, flatShading: true, roughness: 0.2, transparent: true, opacity: 0.6 })
    );
    pane.position.z = 0.06;
    [frame, pane].forEach(m => g.add(m));
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  podium(color = PALETTE.wood, opts = {}) {
    const geo = new THREE.BoxGeometry(0.7, 1.1, 0.5);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.position.y = 0.55;
    return group(mesh, opts);
  },

  stairs(steps = 5, stepWidth = 2, stepHeight = 0.25, stepDepth = 0.4, color = PALETTE.stone, opts = {}) {
    const g = new THREE.Group();
    for (let i = 0; i < steps; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
        baseMaterial(color)
      );
      step.position.set(0, stepHeight / 2 + i * stepHeight, -i * stepDepth);
      step.castShadow = true;
      step.receiveShadow = true;
      g.add(step);
    }
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  // Floor with the fan-pattern paver texture, for plaza/courtyard scenes.
  patternedFloor(width = 20, depth = 20, opts = {}) {
    const repeat = Math.max(2, Math.round((width + depth) / 6));
    const texture = createPaverTexture(repeat);
    const geo = new THREE.BoxGeometry(width, 0.4, depth);
    const mat = new THREE.MeshStandardMaterial({ map: texture, flatShading: true, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -0.2;
    return group(mesh, opts);
  },

  // Oval/elliptical raised stage (amphitheater-style, vs. the rectangular `stage`).
  ellipticalStage(radiusX = 5, radiusZ = 2.5, height = 0.6, color = PALETTE.floorWarm, opts = {}) {
    const geo = new THREE.CylinderGeometry(1, 1, height, 32);
    const mesh = new THREE.Mesh(geo, baseMaterial(color));
    mesh.scale.set(radiusX, 1, radiusZ);
    mesh.position.y = height / 2;
    return group(mesh, opts);
  },

  tree(trunkColor = 0x8a6244, foliageColor = PALETTE.leaf, opts = {}) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 6), baseMaterial(trunkColor));
    trunk.position.y = 0.8;
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), baseMaterial(foliageColor));
    foliage.position.y = 2.1;
    [trunk, foliage].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  // Translucent panel standing in for chain-link/mesh fencing.
  fence(width = 10, height = 3, color = 0xe8e8e8, opts = {}) {
    const geo = new THREE.BoxGeometry(width, height, 0.05);
    const mat = new THREE.MeshStandardMaterial({
      color, flatShading: true, transparent: true, opacity: 0.35, roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    return group(mesh, opts);
  },

  stripedTower(height = 4, radius = 0.35, stripeCount = 6, colorA = PALETTE.accentRed, colorB = 0xffffff, opts = {}) {
    const g = new THREE.Group();
    const segH = height / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const color = i % 2 === 0 ? colorA : colorB;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, segH, 8), baseMaterial(color));
      seg.position.y = segH / 2 + i * segH;
      seg.castShadow = true;
      seg.receiveShadow = true;
      g.add(seg);
    }
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  simpleBuilding(width = 3, depth = 2.5, height = 2, color = 0xf3ede0, roofColor = PALETTE.wallDark, opts = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), baseMaterial(color));
    body.position.y = height / 2;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, 0.15, depth * 1.05), baseMaterial(roofColor));
    roof.position.y = height + 0.08;
    [body, roof].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  booth(width = 2.4, depth = 1.6, height = 2.2, color = 0x141b33, canopyColor = PALETTE.accentGold, opts = {}) {
    return this.eventBooth(width, depth, height, color, canopyColor, opts);
  },

  eventBooth(width = 2.4, depth = 1.6, height = 2.2, color = 0x141b33, canopyColor = PALETTE.accentGold, opts = {}) {
    const g = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(width, 0.9, depth), baseMaterial(color));
    table.position.y = 0.45;
    const poleMat = baseMaterial(0xd9cdb8);
    [ [-width/2+0.1, -depth/2+0.1], [width/2-0.1, -depth/2+0.1], [-width/2+0.1, depth/2-0.1], [width/2-0.1, depth/2-0.1] ].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height, 8), poleMat);
      pole.position.set(px, height/2, pz);
      g.add(pole);
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 1.1, 0.25, depth * 1.1), baseMaterial(canopyColor));
    canopy.position.y = height;
    [table, canopy].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    
    if (opts.text) {
      const canvas = document.createElement('canvas');
      canvas.width = 360; canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(20,27,51,0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
      sprite.scale.set(1.8, 0.4, 1);
      sprite.position.y = height + 0.5;
      g.add(sprite);
    }

    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  easterEgg(color = 0xffd166, size = 0.45, opts = {}) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.2, metalness: 0.8, emissive: 0xd9776a, emissiveIntensity: 0.4,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), mat);
    gem.position.y = 0.8;
    gem.castShadow = true;
    g.add(gem);

    if (opts.text) {
      const canvas = document.createElement('canvas');
      canvas.width = 250; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
      sprite.scale.set(1.2, 0.3, 1);
      sprite.position.y = 1.6;
      g.add(sprite);
    }

    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },

  // Simple stylized humanoid -- for NPCs (teachers, students, narrator).
  // opts.text (already supported by sceneComposer for every kit piece)
  // becomes a floating nameplate above the figure's head.
  person(height = 1.6, bodyColor = PALETTE.accentBlue, skinColor = 0xe8b98a, hairColor = 0x3a2e26, opts = {}) {
    const g = new THREE.Group();
    const bodyH = height * 0.55;

    const legs = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.1, height * 0.09, height * 0.32, 8),
      baseMaterial(0x40474f)
    );
    legs.position.y = height * 0.16;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.14, height * 0.11, bodyH, 8),
      baseMaterial(bodyColor)
    );
    body.position.y = height * 0.32 + bodyH / 2;

    const head = new THREE.Mesh(
      new THREE.IcosahedronGeometry(height * 0.11, 1),
      baseMaterial(skinColor)
    );
    head.position.y = height * 0.32 + bodyH + height * 0.11;

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(height * 0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
      baseMaterial(hairColor)
    );
    hair.position.y = head.position.y + height * 0.035;

    [legs, body, head, hair].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

    if (opts.text) {
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(10,14,31,0.78)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
      sprite.scale.set(1.3, 0.32, 1);
      sprite.position.y = height + 0.4;
      g.add(sprite);
    }

    if (opts.position) g.position.set(...opts.position);
    if (opts.rotation) g.rotation.set(...opts.rotation);
    if (opts.scale) g.scale.set(...opts.scale);
    return g;
  },
};
