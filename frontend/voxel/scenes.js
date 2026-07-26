// scenes.js
// Complete CelesteCon 3D campus layout with interactive NPCs, Event Booths, and Easter Eggs.

export const SCENES = {
  // OAT Amphitheater & Plaza -- Primary festival hub
  celestecon_amphitheater: {
    background: '#dfe3df',
    camera: { position: [0, 4.5, 14], lookAt: [0, 1.0, -4], fov: 60 },
    light: { ambient: 0.75, sunColor: '#fdfaf0', sunIntensity: 0.65, sunPosition: [8, 15, 5] },
    idleDrift: false,
    glbModel: './assets/models/oat_dps_rkpuram.glb',
    glbScale: [1.25, 1.25, 1.25],
    glbPosition: [0, 0, -2],
    glbRotation: [0, 0, 0],
    objects: [

      // ==================== INTERACTIVE NPCS ====================
      // Teachers
      { type: 'person', position: [-5, 0, -5.5], rotation: [0, 0.6, 0],
        params: [1.7, 0x4a5568, 0xd9a878, 0x2b2118], text: 'Mrs. Vibha Arora',
        id: 'npc_vibha', interactName: 'Talk to Mrs. Vibha Arora (Teacher Coordinator)', dialogueKey: 'npc_vibha' },
      
      { type: 'person', position: [5, 0, -5.5], rotation: [0, -0.6, 0],
        params: [1.68, 0x2c5282, 0xc98a5e, 0x1c1c1c], text: 'Mr. Sanchit Chauhan',
        id: 'npc_sanchit', interactName: 'Talk to Mr. Sanchit Chauhan (Teacher Coordinator)', dialogueKey: 'npc_sanchit' },

      // Narrator / Host
      { type: 'person', position: [0, 0.6, -9], rotation: [0, 0, 0],
        params: [1.65, 0x2b6cb0, 0xd9a878, 0x1a202c], text: 'Jatin (the_blue_warrior)',
        id: 'npc_jatin', interactName: 'Talk to Jatin (CelesteCon Host & Narrator)', dialogueKey: 'npc_jatin' },

      // Students
      { type: 'person', position: [-2.5, 0, 1.5], rotation: [0, 0.3, 0],
        params: [1.58, 0xd9776a, 0xe8b98a, 0x3a2e26], text: 'Divyam',
        id: 'npc_divyam', interactName: 'Talk to Divyam', dialogueKey: 'npc_divyam' },

      { type: 'person', position: [2.5, 0, 1.5], rotation: [0, -0.4, 0],
        params: [1.6, 0x7fa7c9, 0xc98a5e, 0x1c1c1c], text: 'Shaktam',
        id: 'npc_shaktam', interactName: 'Talk to Shaktam', dialogueKey: 'npc_shaktam' },

      { type: 'person', position: [-5.5, 0, 4], rotation: [0, 0.8, 0],
        params: [1.55, 0xf6c667, 0xd9a878, 0x2b2118], text: 'Kiara',
        id: 'npc_kiara', interactName: 'Talk to Kiara', dialogueKey: 'npc_kiara' },

      { type: 'person', position: [5.5, 0, 4], rotation: [0, -0.7, 0],
        params: [1.54, 0x8fb996, 0xe8b98a, 0x4a3b32], text: 'Manya',
        id: 'npc_manya', interactName: 'Talk to Manya', dialogueKey: 'npc_manya' },

      { type: 'person', position: [0, 0, 5], rotation: [0, Math.PI, 0],
        params: [1.59, 0xe58e65, 0xd9a878, 0x1c1c1c], text: 'Aarav Anand',
        id: 'npc_aarav', interactName: 'Talk to Aarav Anand', dialogueKey: 'npc_aarav' },

      // ==================== AEROSS EVENT BOOTHS ====================
      { type: 'eventBooth', position: [-7, 0, -1], params: [2.4, 1.6, 2.2, 0x141b33, 0xd9776a], text: 'Debate Booth',
        id: 'booth_debate', interactName: 'In pursuit of dispute (Debate Event)', dialogueKey: 'booth_debate' },

      { type: 'eventBooth', position: [7, 0, -1], params: [2.4, 1.6, 2.2, 0x141b33, 0x7fa7c9], text: 'Quizzitch Booth',
        id: 'booth_quizzitch', interactName: 'Quizzitch (Aerospace Quiz Event)', dialogueKey: 'booth_quizzitch' },

      { type: 'eventBooth', position: [-3.5, 0, 7.5], params: [2.6, 1.8, 2.3, 0x141b33, 0xf6c667], text: 'Volatus UAV Challenge',
        id: 'booth_volatus', interactName: 'Volatus (UAV Challenge Booth)', dialogueKey: 'booth_volatus' },

      // ==================== COLLECTIBLE EASTER EGGS ====================
      { type: 'easterEgg', position: [-10.5, 0.2, -4], params: [0xffd166, 0.45], text: '💎 Relic: Propeller',
        id: 'egg_1', isEasterEgg: true, easterEggName: 'Golden Propeller', easterEggPower: 'Instant Crisis Solver Ability' },

      { type: 'easterEgg', position: [10.5, 0.2, -4], params: [0x7fa7c9, 0.45], text: '🔑 Relic: Master Key',
        id: 'egg_2', isEasterEgg: true, easterEggName: 'AEROSS Master Key', easterEggPower: 'VIP Campus Access & +100 Rep' },

      // ==================== EMERGENCY SCAVENGER HUNT TARGETS ====================
      { type: 'scavengerItem', position: [-6.5, 0.2, 1], params: [0x00f0ff, 0.5], text: '🎙️ Target: Wireless Mic',
        id: 'scav_1', isScavengerTarget: true, scavengerName: 'Missing Wireless Microphone' },

      { type: 'person', position: [7.5, 0, 2], params: [1.7, 0x00f0ff, 0xe8b98a, 0x3a2e26], text: '🧑‍💻 Target: Divyam (VIP)',
        id: 'scav_2', isScavengerTarget: true, scavengerName: 'Divyam (Missing Tech Lead)' },
    ],
  },

  // Main Auditorium -- Indoor Stage Events
  auditorium_demo: {
    background: '#dfe7f5',
    camera: { position: [0, 4.5, 11], lookAt: [0, 1.2, -4], fov: 60 },
    light: { ambient: 0.65, sunColor: '#fff2d9', sunIntensity: 0.9, sunPosition: [6, 10, 6] },
    idleDrift: false,
    glbModel: './assets/models/school_OAT.glb',
    glbScale: [1.2, 1.2, 1.2],
    glbPosition: [0, 0, -2],
    glbRotation: [0, 0, 0],
    objects: [

      // Host NPC
      { type: 'person', position: [0, 0.6, -6.5], rotation: [0, 0, 0],
        params: [1.65, 0x8fb996, 0xd9a878, 0x1a202c], text: 'Auditorium Host',
        id: 'npc_host', interactName: 'Talk to Auditorium Host', dialogueKey: 'npc_host' },

      // AEROSS Event Booths
      { type: 'eventBooth', position: [-6, 0, -3], params: [2.5, 1.6, 2.2, 0x141b33, 0xd9776a], text: 'AEROSS Theatre',
        id: 'booth_theatre', interactName: 'AEROSS Theatre (Standup / Skit / Improv)', dialogueKey: 'booth_theatre' },

      { type: 'eventBooth', position: [6, 0, -3], params: [2.5, 1.6, 2.2, 0x141b33, 0x7fa7c9], text: 'Dimension III',
        id: 'booth_dim3', interactName: 'Dimension III (3D Design Event)', dialogueKey: 'booth_dim3' },

      // Collectible Easter Eggs
      { type: 'easterEgg', position: [-8.5, 0.2, -7.5], params: [0xd9776a, 0.45], text: '🏷️ Relic: Space Patch',
        id: 'egg_3', isEasterEgg: true, easterEggName: 'Secret Space Patch', easterEggPower: 'Charisma Boost in Debates' },

      { type: 'easterEgg', position: [8.5, 0.2, -7.5], params: [0x8fb996, 0.45], text: '💾 Relic: Telemetry Chip',
        id: 'egg_4', isEasterEgg: true, easterEggName: 'CubeSat Telemetry Chip', easterEggPower: 'Genius Hint in Quiz' },

      // Scavenger Hunt Target
      { type: 'scavengerItem', position: [-5.5, 0.2, -3], params: [0xff007f, 0.5], text: '📽️ Target: Projector Lens',
        id: 'scav_3', isScavengerTarget: true, scavengerName: 'Misplaced 4K Projector Lens' },
    ],
  },

  // Management Room -- Exclusive HQ
  management_room_demo: {
    background: '#efe6d8',
    camera: { position: [0, 4.0, 8], lookAt: [0, 0.8, -2], fov: 60 },
    light: { ambient: 0.65, sunColor: '#fff6e0', sunIntensity: 0.8, sunPosition: [4, 8, 4] },
    idleDrift: false,
    objects: [
      { type: 'floor', position: [0, 0, 0], params: [14, 14, 0xb7c4d1] },
      { type: 'wall', position: [0, 0, -6], params: [14, 5, 0.4, 0xe8ddcf] },
      { type: 'window', position: [-3.5, 2.2, -5.75], params: [1.6, 1.8] },
      { type: 'window', position: [3.5, 2.2, -5.75], params: [1.6, 1.8] },
      { type: 'table', position: [0, 0, -2], params: [3.0, 1.3, 0.75, 0xb98d5e] },
      { type: 'chair', position: [-1.2, 0, -0.4] },
      { type: 'chair', position: [0, 0, -0.4] },
      { type: 'chair', position: [1.2, 0, -0.4] },
      { type: 'banner', position: [0, 3.5, -5.7], params: [3.5, 0.8, 0xd9776a], text: 'AEROSS HQ' },
      { type: 'plant', position: [-5.5, 0, -5] },

      // Management Head NPC
      { type: 'person', position: [0, 0, -3.2], rotation: [0, 0, 0],
        params: [1.7, 0xf6c667, 0xd9a878, 0x1a202c], text: 'Siddharth (President)',
        id: 'npc_siddharth', interactName: 'Talk to Siddharth (AEROSS President)', dialogueKey: 'npc_siddharth' },

      // Event Booths
      { type: 'eventBooth', position: [-4, 0, 1.5], params: [2.4, 1.5, 2.2, 0x141b33, 0xf6c667], text: 'Settle-Me-This',
        id: 'booth_settle', interactName: 'Settle-me-this (Settlement Design Challenge)', dialogueKey: 'booth_settle' },

      { type: 'eventBooth', position: [4, 0, 1.5], params: [2.4, 1.5, 2.2, 0x141b33, 0x8fb996], text: 'Power Pitch',
        id: 'booth_pitch', interactName: 'Business Power Pitch Challenge', dialogueKey: 'booth_pitch' },

      // Easter Egg
      { type: 'easterEgg', position: [0, 0.9, -2], params: [0xffffff, 0.5], text: '🏆 Relic: Champion Trophy',
        id: 'egg_5', isEasterEgg: true, easterEggName: 'CelesteCon Trophy', easterEggPower: '+500 Rep Points & Champion Status' },

      // Scavenger Hunt Target
      { type: 'scavengerItem', position: [4.5, 0.2, -4], params: [0xffd166, 0.5], text: '📋 Target: Judge Rubrics',
        id: 'scav_4', isScavengerTarget: true, scavengerName: 'Confidential Judge Rubric Sheets' },
    ],
  },
};
