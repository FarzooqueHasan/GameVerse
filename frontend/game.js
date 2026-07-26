// game.js
// Single-page RPG game engine for CelesteCon (AEROSS Club).
// Handles state machine, questionnaire, 3D voxel campus navigation, 2D visual novel dialogues,
// minigame integration, and easter egg collection.

import * as THREE from './vendor/three/three.module.js';
import { buildScene } from './voxel/sceneComposer.js';
import { SCENES } from './voxel/scenes.js';
import { Kit, PALETTE } from './voxel/voxelKit.js';

// ==================== GLOBAL GAME STATE ====================
const GameState = {
  screen: 'LOADING',       // LOADING | ROLE_SELECT | QUESTIONNAIRE | REVEAL | GAMEPLAY
  role: 'Participant',     // Organizer | Participant | Judge
  character: null,         // Allotted character object
  repPoints: 0,
  foundEggs: new Set(),
  currentZone: 'celestecon_amphitheater',
  sceneData: null,         // { scene, camera, renderer }
  playerGroup: null,
  playerPos: { x: 0, z: 2 },
  playerRot: 0,
  keys: {},
  activeInteractTarget: null,
  isDialogueOpen: false,
  isMinigameOpen: false,
};

// ==================== CHARACTER ARCHETYPES ====================
const CHARACTERS = {
  Tarushi: {
    name: 'Tarushi',
    emoji: '😎',
    power: 'Creative Chaos & Boundless Energy',
    drive: 'Passion & Spontaneous Innovation',
    stress: 'Explodes with creative energy & bold ideas',
    sidekick: 'Goose (Chaotic Mascot)',
    catchphrase: '"Let\'s make this epic and unforgettable!"',
    desc: 'You are the creative dynamo of CelesteCon! Where others see constraints, you see endless possibilities for bold design and thrilling aerospace events.',
  },
  Siddharth: {
    name: 'Siddharth',
    emoji: '🧠',
    power: 'Methodical Precision & Crisis Leadership',
    drive: 'Structure, Timelines & Flawless Execution',
    stress: 'Ultra-calm, delegates systematically',
    sidekick: 'Automated Task Dispatcher Drone',
    catchphrase: '"Trust the process. Everything is under control."',
    desc: 'You are the backbone of event operations. When technical crises strike or timelines tighten, your calm leadership and analytical mind save the day.',
  },
  Farzooque: {
    name: 'Farzooque',
    emoji: '👋',
    power: 'Charismatic Networking & Team Synergy',
    drive: 'Connecting people & resolving conflicts',
    stress: 'Uses humor and charm to defuse tension',
    sidekick: 'Megaphone of Motivation',
    catchphrase: '"When we work together, we are unstoppable!"',
    desc: 'The ultimate team player and communicator. You excel at bringing debaters, quiz geniuses, and UAV pilots together into a unified, spirited campus community.',
  },
  Anant: {
    name: 'Anant',
    emoji: '🤫',
    power: 'Silent Focus & Flawless Reliability',
    drive: 'Delivering perfection without needing the spotlight',
    stress: 'Laser-focused, executes silently in the zone',
    sidekick: 'Stealth Debugging Bot',
    catchphrase: '"Actions speak louder than words. Done."',
    desc: 'You speak through results. Whether coding CubeSat telemetry or calibrating flight simulators, your precision and reliability are unmatched.',
  },
  Ryaan: {
    name: 'Ryaan',
    emoji: '🤯',
    power: 'Strategic Architecture & Grand Vision',
    drive: 'Pushing aerospace boundaries & futuristic concepts',
    stress: 'Analyzes every variable simultaneously',
    sidekick: 'Quantum Orbit Blueprint',
    catchphrase: '"The future of aerospace begins right here at CelesteCon."',
    desc: 'A visionary thinker who sees the 30,000-foot view. You design the grand challenges and inspire participants to reach for the stars.',
  },
};

// ==================== 10-QUESTION QUESTIONNAIRE ====================
const QUESTIONNAIRE = [
  {
    q: "When someone hands you a project with no instructions, you:",
    options: [
      { text: "Jump right in and start experimenting!", char: "Tarushi" },
      { text: "Take a deep breath, map out a structure, and delegate tasks.", char: "Siddharth" },
      { text: "Sit quietly, analyze what needs to be done, and execute silently.", char: "Anant" },
      { text: "Organize a quick team huddle to brainstorm ideas together.", char: "Farzooque" },
    ]
  },
  {
    q: "In a group project, what is your typical role?",
    options: [
      { text: "The creative engine who generates bold ideas.", char: "Tarushi" },
      { text: "The leader who keeps everyone on track and organized.", char: "Siddharth" },
      { text: "The reliable executor who gets the job done without fuss.", char: "Anant" },
      { text: "The collaborator who ensures everyone's voice is heard.", char: "Farzooque" },
    ]
  },
  {
    q: "When faced with a sudden deadline, how do you react?",
    options: [
      { text: "I work best under pressure—bring it on!", char: "Tarushi" },
      { text: "I create a timeline and stick to it religiously.", char: "Siddharth" },
      { text: "I focus quietly and get my part done ahead of time.", char: "Anant" },
      { text: "I check in with teammates to see how we can support each other.", char: "Farzooque" },
    ]
  },
  {
    q: "What is your preferred working style for aerospace challenges?",
    options: [
      { text: "Fast-paced, dynamic, and full of high energy.", char: "Tarushi" },
      { text: "Structured, methodical, and well-planned.", char: "Siddharth" },
      { text: "Independent, focused, and low-key.", char: "Anant" },
      { text: "Collaborative, communicative, and supportive.", char: "Farzooque" },
    ]
  },
  {
    q: "When a disagreement arises in your team, how do you handle it?",
    options: [
      { text: "I use humor and positive energy to defuse the situation.", char: "Farzooque" },
      { text: "I step in, mediate, and find a logical, structured solution.", char: "Siddharth" },
      { text: "I avoid the drama and focus purely on getting the work done.", char: "Anant" },
      { text: "I propose a bold compromise that integrates both creative visions.", char: "Ryaan" },
    ]
  },
  {
    q: "How do you handle critical feedback from judges on your work?",
    options: [
      { text: "I take it in stride and use it to fuel my creative pivot.", char: "Tarushi" },
      { text: "I analyze the metrics carefully and integrate them into my plan.", char: "Siddharth" },
      { text: "I accept it quietly and make immediate, flawless adjustments.", char: "Anant" },
      { text: "I discuss it with my peers to gain diverse perspectives.", char: "Farzooque" },
    ]
  },
  {
    q: "What motivates you the most when participating in CelesteCon?",
    options: [
      { text: "The thrill of designing something brand new and futuristic.", char: "Ryaan" },
      { text: "The satisfaction of executing a flawless project and winning.", char: "Siddharth" },
      { text: "The pride in building robust, high-quality technical hardware.", char: "Anant" },
      { text: "The joy of collaborating and celebrating with campus friends.", char: "Farzooque" },
    ]
  },
  {
    q: "When learning a complex new aerospace skill (like orbital mechanics), you:",
    options: [
      { text: "Dive into hands-on simulation and trial-and-error experimentation.", char: "Tarushi" },
      { text: "Read the NASA technical documentation and build a step-by-step plan.", char: "Siddharth" },
      { text: "Observe experts quietly and practice intensely on my own.", char: "Anant" },
      { text: "Form a study circle and debate the physics concepts together.", char: "Ryaan" },
    ]
  },
  {
    q: "How do you prioritize when 3 events (Debate, Quiz, UAV) happen at once?",
    options: [
      { text: "Tackle the most exciting, high-stakes challenge first!", char: "Tarushi" },
      { text: "Make an organized schedule and allocate exact time slots.", char: "Siddharth" },
      { text: "Quietly solve the technical tasks one by one without stress.", char: "Anant" },
      { text: "Analyze the overarching strategy to maximize total points.", char: "Ryaan" },
    ]
  },
  {
    q: "Describe your ideal campus festival environment:",
    options: [
      { text: "Energetic, vibrant, and full of spontaneous celebrations!", char: "Tarushi" },
      { text: "Well-managed, on-schedule, and running with clockwork precision.", char: "Siddharth" },
      { text: "Peaceful, focused, and equipped with top-tier technology.", char: "Anant" },
      { text: "Visionary, inspiring, and pushing the boundaries of what a school club can do.", char: "Ryaan" },
    ]
  }
];

// ==================== DIALOGUE TREES & QUESTS ====================
const DIALOGUES = {
  npc_vibha: {
    name: "Mrs. Vibha Arora (Teacher Coordinator)",
    avatar: "👩‍🏫",
    text: "Welcome to CelesteCon! As teacher coordinators, Mr. Sanchit and I are thrilled to see our AEROSS Club students leading such an ambitious aerospace festival.",
    choices: [
      { text: "How can I help with event operations?", role: "Organizer", action: "crisis_cubesat" },
      { text: "Where can I register for the aerospace competitions?", role: "Participant", action: "say", resp: "Check out the event booths around the plaza! You can compete in Quizzitch, Debate, UAVs, and more." },
      { text: "Are the scoring rubrics ready for evaluation?", role: "Judge", action: "say", resp: "Yes! Please ensure fairness in your judging. These students have poured weeks into their 3D models and pitches." },
      { text: "Goodbye, ma'am!", action: "close" }
    ]
  },
  npc_sanchit: {
    name: "Mr. Sanchit Chauhan (Teacher Coordinator)",
    avatar: "👨‍🏫",
    text: "Ah, hello there! The UAV Volatus arena is experiencing some wind gusts today. We must ensure safety guidelines are strictly followed.",
    choices: [
      { text: "I'll inspect the drone flight simulator stability!", role: "Organizer", action: "crisis_flight" },
      { text: "I'm ready to pilot my UAV drone in the Volatus challenge!", role: "Participant", action: "crisis_flight" },
      { text: "I will evaluate the aerodynamic control of the contestants.", role: "Judge", action: "say", resp: "Excellent. Pay close attention to how smoothly they handle simulated engine failures!" },
      { text: "Thank you, sir!", action: "close" }
    ]
  },
  npc_jatin: {
    name: "Jatin — the_blue_warrior (CelesteCon Host)",
    avatar: "🎙️",
    text: "Hey, aerospace adventurer! Welcome to CelesteCon! I'm your host and narrator. Did you know there are 5 secret glowing Easter Eggs hidden across our campus zones?",
    choices: [
      { text: "Tell me more about the Easter Eggs!", action: "say", resp: "Search the Amphitheater, Auditorium, and Management Room! Clicking glowing gems unlocks secret powers like Instant Crisis Solving and extra Rep Points!" },
      { text: "What events are happening in this zone?", action: "say", resp: "Right here in the Amphitheater we have the Debate Booth, Quizzitch Booth, and Volatus UAV challenge! Step up and interact with them!" },
      { text: "Let's get back to exploring!", action: "close" }
    ]
  },
  npc_divyam: {
    name: "Divyam (AEROSS Member)",
    avatar: "🧑‍💻",
    text: "I've been working on my CubeSat orbital attitude determination system all night, but my telemetry wiring is throwing an error!",
    choices: [
      { text: "[Help Divyam] Let me open the CubeSat Builder and fix your telemetry!", action: "minigame_cubesat" },
      { text: "Good luck troubleshooting!", action: "close" }
    ]
  },
  npc_shaktam: {
    name: "Shaktam (AEROSS Member)",
    avatar: "👨‍🚀",
    text: "Have you seen the 3D designs in Dimension III? The CAD models of the lunar lander are mind-blowing this year!",
    choices: [
      { text: "I'm heading to the Auditorium to check them out!", action: "close" }
    ]
  },
  npc_kiara: {
    name: "Kiara (Debate Finalist)",
    avatar: "👩‍⚖️",
    text: "We are debating space debris mitigation policies in 'In pursuit of dispute'. The arguments are super intense!",
    choices: [
      { text: "[Test Skills] Give me a quick aerospace question!", action: "minigame_circuit" },
      { text: "Keep up the great debate!", action: "close" }
    ]
  },
  npc_manya: {
    name: "Manya (Quiz Team)",
    avatar: "🙋‍♀️",
    text: "Quizzitch is about to start! Do you know the difference between LEO, MEO, and Geostationary orbits?",
    choices: [
      { text: "[Play Quiz] Let's test my aerospace knowledge right now!", action: "minigame_circuit" },
      { text: "I need to brush up on my physics first!", action: "close" }
    ]
  },
  npc_aarav: {
    name: "Aarav Anand (UAV Pilot)",
    avatar: "🛩️",
    text: "My drone's PID controller needs tuning before the Volatus obstacle course. Want to run a flight sim test?",
    choices: [
      { text: "[Launch Flight Sim] Let's jump into the cockpit simulator!", action: "minigame_flight" },
      { text: "See you at the flight line!", action: "close" }
    ]
  },
  npc_host: {
    name: "Auditorium Stage Host",
    avatar: "🎤",
    text: "Welcome to the Main Auditorium! Up next on stage: AEROSS Theatre comedy skit followed by the Dimension III 3D CAD showcases!",
    choices: [
      { text: "Can't wait to see the show!", action: "close" },
      { text: "🏆 [Grand Finale] Conclude CelesteCon & Attend the Awards Ceremony!", action: "finale" }
    ]
  },
  npc_siddharth: {
    name: "Siddharth (AEROSS President)",
    avatar: "👔",
    text: "Welcome to the Management HQ. Organizing CelesteCon takes months of planning, but seeing our school community united around aerospace science makes every sleepless night worth it.",
    choices: [
      { text: "We have an emergency circuit failure in the sound system!", role: "Organizer", action: "minigame_circuit" },
      { text: "I'm ready to present my Business Power Pitch!", role: "Participant", action: "say", resp: "Awesome! Step up to the Power Pitch booth right here in the room and show us your space tech startup roadmap." },
      { text: "I have finalized the evaluation scores for the top teams.", role: "Judge", action: "say", resp: "Thank you for your integrity and hard work. Let's get ready for the prize distribution!" },
      { text: "🏆 [Grand Finale] Conclude CelesteCon & Attend the Awards Ceremony!", action: "finale" },
      { text: "Honor to meet you, President!", action: "close" }
    ]
  },
  booth_debate: {
    name: "In pursuit of dispute — Debate Event Booth",
    avatar: "🗣️",
    text: "Welcome to the premier CelesteCon debate! Teams are currently arguing: 'Should private corporations have property rights over lunar resources?'",
    choices: [
      { text: "[Participate] Enter the debate challenge & test your reasoning!", action: "minigame_circuit" },
      { text: "[Judge] Evaluate the rebuttal arguments and score points.", role: "Judge", action: "say", resp: "You awarded +50 points to the affirmative team for solid international treaty citations!" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_quizzitch: {
    name: "Quizzitch — Aerospace Quiz Challenge",
    avatar: "⚡",
    text: "Step right up to Quizzitch! Test your mastery over rocket propulsion, astronomy, and aviation history.",
    choices: [
      { text: "[Take Challenge] Answer the aerospace brain teaser!", action: "minigame_circuit" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_volatus: {
    name: "Volatus — Aviation & UAV Challenge Booth",
    avatar: "🚁",
    text: "Welcome to Volatus! Test your drone piloting reflexes and aerodynamic stability in our flight simulator.",
    choices: [
      { text: "[Launch Simulator] Take control in the Flight Simulator!", action: "minigame_flight" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_theatre: {
    name: "AEROSS Theatre — Standup, Skit & Comedy",
    avatar: "🎭",
    text: "A crowd gathers around the stage! Students are performing a hilarious educational skit about what happens when astronauts forget their wrenches in zero gravity.",
    choices: [
      { text: "[Applaud & Watch] Cheer for the performers! (+25 Rep)", action: "rep", val: 25 },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_dim3: {
    name: "Dimension III — 3D CAD Design Exhibition",
    avatar: "📐",
    text: "Examine the incredible 3D printed rover prototypes and orbital space station CAD assemblies created by school competitors.",
    choices: [
      { text: "[Inspect Models] Review the structural integrity & design aesthetics! (+30 Rep)", action: "rep", val: 30 },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_settle: {
    name: "Settle-Me-This — Space Settlement Challenge",
    avatar: "🌐",
    text: "Competitors are designing a self-sustaining Martian colony for 10,000 inhabitants, handling life support, radiation shielding, and agriculture.",
    choices: [
      { text: "[Contribute Idea] Suggest hydroponic algae farms for oxygen balance! (+40 Rep)", action: "rep", val: 40 },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_pitch: {
    name: "Business Power Pitch — Space Venture Challenge",
    avatar: "💼",
    text: "Student entrepreneurs are pitching commercial space tech startups to a panel of venture capitalists and industry judges.",
    choices: [
      { text: "[Pitch / Evaluate] Analyze unit economics of reusable rocket boosters! (+45 Rep)", action: "rep", val: 45 },
      { text: "Leave booth", action: "close" }
    ]
  },
  portal_celestecon_amphitheater: {
    name: "🏛️ Campus Portal: OAT Amphitheater",
    avatar: "🚪",
    text: "This corridor leads directly to the Open-Air Amphitheater & Plaza, where the main stage and outdoor competition booths are located.",
    choices: [
      { text: "🚀 Travel to OAT Amphitheater now", action: "teleport", targetZone: "celestecon_amphitheater" },
      { text: "Stay here", action: "close" }
    ]
  },
  portal_auditorium_demo: {
    name: "🎭 Campus Portal: Main Auditorium",
    avatar: "🚪",
    text: "Step through these doors into the Main Auditorium to witness AEROSS Theatre performances and Dimension III CAD showcases.",
    choices: [
      { text: "🚀 Travel to Main Auditorium now", action: "teleport", targetZone: "auditorium_demo" },
      { text: "Stay here", action: "close" }
    ]
  },
  portal_management_room_demo: {
    name: "👔 Campus Portal: Management HQ",
    avatar: "🚪",
    text: "Enter the AEROSS Management Headquarters, where President Siddharth and the executive council plan CelesteCon and host the Business Pitch.",
    choices: [
      { text: "🚀 Travel to Management HQ now", action: "teleport", targetZone: "management_room_demo" },
      { text: "Stay here", action: "close" }
    ]
  }
};

// --- STAGE 1: LOADING SCREEN ---
function initLoadingScreen() {
  const canvas = document.getElementById('stars-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.75,
      r: Math.random() * 1.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
    }));

    function drawStars(t) {
      if (GameState.screen !== 'LOADING') return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx.globalAlpha = 0.15 + twinkle * 0.65;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }
    requestAnimationFrame(drawStars);
  }

  const fill = document.getElementById('loading-fill');
  const label = document.getElementById('loading-label');
  const enterBtn = document.getElementById('enter-btn');
  let progress = 0;
  const loadTimer = setInterval(() => {
    progress += Math.random() * 18 + 8;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadTimer);
      if (label) label.textContent = 'All Campus Assets Ready';
      if (enterBtn) enterBtn.classList.add('visible');
    }
    if (fill) fill.style.width = progress + '%';
  }, 180);

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      switchScreen('ROLE_SELECT');
    });
  }
}

// --- STAGE 2: ROLE SELECTION ---
function initRoleSelect() {
  const cards = document.querySelectorAll('.role-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const role = card.getAttribute('data-role') || 'Participant';
      GameState.role = role;
      console.log(`[CelesteCon] Role selected: ${role}`);
      switchScreen('QUESTIONNAIRE');
      startQuiz();
    });
  });
}

// --- STAGE 3: QUESTIONNAIRE ---
let currentQIdx = 0;
let quizScores = { Tarushi: 0, Siddharth: 0, Farzooque: 0, Anant: 0, Ryaan: 0 };

function initQuestionnaire() {
  currentQIdx = 0;
  quizScores = { Tarushi: 0, Siddharth: 0, Farzooque: 0, Anant: 0, Ryaan: 0 };
}

function startQuiz() {
  currentQIdx = 0;
  quizScores = { Tarushi: 0, Siddharth: 0, Farzooque: 0, Anant: 0, Ryaan: 0 };
  renderQuestion();
}

function renderQuestion() {
  const qObj = QUESTIONNAIRE[currentQIdx];
  if (!qObj) {
    finishQuiz();
    return;
  }

  const titleEl = document.getElementById('question-title');
  const optsEl = document.getElementById('question-options');
  const fillEl = document.getElementById('quiz-progress-fill');
  const textEl = document.getElementById('quiz-progress-text');

  if (titleEl) titleEl.textContent = `${currentQIdx + 1}. ${qObj.q}`;
  if (fillEl) fillEl.style.width = `${((currentQIdx + 1) / QUESTIONNAIRE.length) * 100}%`;
  if (textEl) textEl.textContent = `Question ${currentQIdx + 1} of ${QUESTIONNAIRE.length}`;

  if (optsEl) {
    optsEl.innerHTML = '';
    qObj.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (opt.char && quizScores[opt.char] !== undefined) {
          quizScores[opt.char] += 10;
        }
        currentQIdx++;
        renderQuestion();
      });
      optsEl.appendChild(btn);
    });
  }
}

function finishQuiz() {
  // Determine top character
  let topChar = 'Tarushi';
  let maxScore = -1;
  for (const [charName, score] of Object.entries(quizScores)) {
    if (score > maxScore) {
      maxScore = score;
      topChar = charName;
    }
  }

  const charData = CHARACTERS[topChar] || CHARACTERS['Tarushi'];
  GameState.character = charData;
  console.log(`[CelesteCon] Quiz finished. Allotted Character: ${charData.name}`);

  // Populate Reveal Card
  document.getElementById('reveal-emoji').textContent = charData.emoji;
  document.getElementById('reveal-name').textContent = charData.name;
  document.getElementById('reveal-role-tag').textContent = `Role: ${GameState.role} • Score Match: ${maxScore} pts`;
  document.getElementById('reveal-desc').textContent = charData.desc;
  document.getElementById('reveal-power').textContent = charData.power;
  document.getElementById('reveal-drive').textContent = charData.drive;
  document.getElementById('reveal-stress').textContent = charData.stress;
  document.getElementById('reveal-sidekick').textContent = charData.sidekick;
  document.getElementById('reveal-catchphrase').textContent = charData.catchphrase;

  switchScreen('REVEAL');
}

// --- STAGE 4: REVEAL SCREEN ---
function initReveal() {
  const startBtn = document.getElementById('start-gameplay-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      switchScreen('GAMEPLAY');
      init3DWorld(GameState.currentZone);
    });
  }
}

// --- STAGE 5: RPG GAMEPLAY & 3D WORLD ---
function init3DWorld(zoneKey) {
  GameState.currentZone = zoneKey;
  const container = document.getElementById('rpg-viewport');
  const layout = SCENES[zoneKey];
  if (!container || !layout) return;

  // Update HUD
  if (GameState.character) {
    document.getElementById('hud-avatar').textContent = GameState.character.emoji;
    document.getElementById('hud-char-name').textContent = GameState.character.name;
    document.getElementById('hud-role-name').textContent = GameState.role;
  }
  document.getElementById('campus-zone-select').value = zoneKey;
  const zoneBtns = document.querySelectorAll('.zone-btn');
  zoneBtns.forEach(b => {
    if (b.getAttribute('data-zone') === zoneKey) b.classList.add('active');
    else b.classList.remove('active');
  });

  // Build 3D Scene
  GameState.sceneData = buildScene(container, layout);
  const { scene, camera, renderer } = GameState.sceneData;

  // Add Player Avatar
  const playerColor = GameState.role === 'Organizer' ? PALETTE.accentGold : (GameState.role === 'Judge' ? PALETTE.accentBlue : PALETTE.accentRed);
  GameState.playerGroup = Kit.person(1.65, playerColor, 0xd9a878, 0x1a202c, {
    text: `${GameState.character ? GameState.character.name : 'Player'} (${GameState.role})`,
  });
  GameState.playerPos = { x: 0, z: 4 };
  GameState.playerGroup.position.set(0, 0, 4);
  scene.add(GameState.playerGroup);

  // Add 3D Teleport Portals to other zones
  const portalZones = [
    { key: 'celestecon_amphitheater', name: '🏛️ Portal: OAT Amphitheater', x: -10, z: -8, color: 0xffd166 },
    { key: 'auditorium_demo', name: '🎭 Portal: Main Auditorium', x: 0, z: -10, color: 0x7fa7c9 },
    { key: 'management_room_demo', name: '👔 Portal: Management HQ', x: 10, z: -8, color: 0x8fb996 }
  ];
  portalZones.forEach(pz => {
    if (pz.key === zoneKey) return;
    const portalGroup = Kit.booth(pz.color, pz.name, "🚪");
    portalGroup.position.set(pz.x, 0, pz.z);
    portalGroup.userData = { id: `portal_${pz.key}`, interactName: pz.name, dialogueKey: `portal_${pz.key}` };
    scene.add(portalGroup);
    if (GameState.interactables) GameState.interactables.push(portalGroup);
  });

  // Setup Raycaster for Click-to-Move
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const planeIntersect = new THREE.Vector3();

  container.onpointerdown = (e) => {
    if (GameState.isDialogueOpen || GameState.isMinigameOpen) return;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
      // Clamp coordinates within bounds
      const targetX = Math.max(-14, Math.min(14, planeIntersect.x));
      const targetZ = Math.max(-14, Math.min(10, planeIntersect.z));
      GameState.targetMove = { x: targetX, z: targetZ };
    }
  };
}

function initGameplayControls() {
  // Keyboard listeners
  window.addEventListener('keydown', (e) => {
    GameState.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e' && GameState.activeInteractTarget && !GameState.isDialogueOpen && !GameState.isMinigameOpen) {
      interactWithTarget(GameState.activeInteractTarget);
    }
    if (e.key === 'Escape') {
      closeDialogue();
      closeMinigame();
    }
  });

  window.addEventListener('keyup', (e) => {
    GameState.keys[e.key.toLowerCase()] = false;
  });

  // Zone selector dropdown
  const zoneSelect = document.getElementById('campus-zone-select');
  if (zoneSelect) {
    zoneSelect.addEventListener('change', (e) => {
      init3DWorld(e.target.value);
    });
  }

  // Zone buttons navigation
  const zoneBtns = document.querySelectorAll('.zone-btn');
  zoneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetZone = btn.getAttribute('data-zone');
      if (targetZone) init3DWorld(targetZone);
    });
  });

  // Interact Prompt click
  const promptEl = document.getElementById('interact-prompt');
  if (promptEl) {
    promptEl.addEventListener('click', () => {
      if (GameState.activeInteractTarget && !GameState.isDialogueOpen && !GameState.isMinigameOpen) {
        interactWithTarget(GameState.activeInteractTarget);
      }
    });
  }

  // Dialogue close button
  const diagCloseBtn = document.getElementById('dialogue-close-btn');
  if (diagCloseBtn) diagCloseBtn.addEventListener('click', closeDialogue);

  // Start Animation Loop for Movement & Proximity
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  if (GameState.screen !== 'GAMEPLAY' || !GameState.playerGroup || !GameState.sceneData) return;

  const moveSpeed = 0.12;
  let dx = 0;
  let dz = 0;

  // Keyboard controls
  if (GameState.keys['w'] || GameState.keys['arrowup']) dz -= moveSpeed;
  if (GameState.keys['s'] || GameState.keys['arrowdown']) dz += moveSpeed;
  if (GameState.keys['a'] || GameState.keys['arrowleft']) dx -= moveSpeed;
  if (GameState.keys['d'] || GameState.keys['arrowright']) dx += moveSpeed;

  // Click-to-move target processing
  if (GameState.targetMove) {
    const distSq = (GameState.targetMove.x - GameState.playerPos.x) ** 2 + (GameState.targetMove.z - GameState.playerPos.z) ** 2;
    if (distSq < 0.1) {
      GameState.targetMove = null;
    } else {
      const angle = Math.atan2(GameState.targetMove.x - GameState.playerPos.x, GameState.targetMove.z - GameState.playerPos.z);
      dx = Math.sin(angle) * moveSpeed;
      dz = Math.cos(angle) * moveSpeed;
    }
  }

  // Apply Movement if not in dialogue or minigame
  if ((dx !== 0 || dz !== 0) && !GameState.isDialogueOpen && !GameState.isMinigameOpen) {
    GameState.playerPos.x = Math.max(-14, Math.min(14, GameState.playerPos.x + dx));
    GameState.playerPos.z = Math.max(-14, Math.min(10, GameState.playerPos.z + dz));
    GameState.playerGroup.position.set(GameState.playerPos.x, 0, GameState.playerPos.z);

    // Turn character in movement direction
    const targetRot = Math.atan2(dx, dz);
    GameState.playerGroup.rotation.y = targetRot;
  }

  // Proximity Detection with NPCs, Booths, and Easter Eggs
  const { scene } = GameState.sceneData;
  let nearestTarget = null;
  let minDist = 2.8; // Interaction radius

  scene.children.forEach(child => {
    if (child === GameState.playerGroup) return;
    if (!child.userData || (!child.userData.interactName && !child.userData.isEasterEgg)) return;

    // Skip already collected easter eggs
    if (child.userData.isEasterEgg && GameState.foundEggs.has(child.userData.id)) return;

    const dist = Math.hypot(child.position.x - GameState.playerPos.x, child.position.z - GameState.playerPos.z);
    if (dist < minDist) {
      minDist = dist;
      nearestTarget = child;
    }
  });

  const promptEl = document.getElementById('interact-prompt');
  if (nearestTarget && !GameState.isDialogueOpen && !GameState.isMinigameOpen) {
    GameState.activeInteractTarget = nearestTarget;
    if (promptEl) {
      promptEl.classList.remove('hidden');
      const nameEl = document.getElementById('interact-target-name');
      if (nameEl) {
        if (nearestTarget.userData.isEasterEgg) {
          nameEl.textContent = `Collect Easter Egg: ${nearestTarget.userData.easterEggName || 'Secret Item'}`;
        } else {
          nameEl.textContent = nearestTarget.userData.interactName || 'Interact';
        }
      }
    }
  } else {
    GameState.activeInteractTarget = null;
    if (promptEl && !promptEl.classList.contains('hidden')) {
      promptEl.classList.add('hidden');
    }
  }
}

// --- INTERACTION HANDLING ---
function interactWithTarget(target) {
  if (!target || !target.userData) return;

  // Handle Easter Egg Collection
  if (target.userData.isEasterEgg) {
    collectEasterEgg(target);
    return;
  }

  // Handle NPC or Booth Dialogue
  const key = target.userData.dialogueKey || target.userData.id;
  const diagData = DIALOGUES[key];
  if (diagData) {
    openDialogue(diagData);
  } else {
    // Default dialogue fallback
    openDialogue({
      name: target.userData.interactName || "CelesteCon Participant",
      avatar: "🧑‍🚀",
      text: "The atmosphere at CelesteCon is electric! Make sure to visit all the event booths.",
      choices: [{ text: "Will do!", action: "close" }]
    });
  }
}

function collectEasterEgg(target) {
  const id = target.userData.id || `egg_${Math.random()}`;
  if (GameState.foundEggs.has(id)) return;

  GameState.foundEggs.add(id);
  const name = target.userData.easterEggName || "Secret Aerospace Relic";
  const power = target.userData.easterEggPower || "+100 Rep Points Booster";

  // Remove mesh from scene
  if (GameState.sceneData && GameState.sceneData.scene) {
    GameState.sceneData.scene.remove(target);
  }

  // Update HUD
  addRepPoints(100);
  document.getElementById('hud-eggs').textContent = `${GameState.foundEggs.size} / 5`;

  // Show Toast
  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `🥚 Easter Egg Discovered: ${name}!`;
    document.getElementById('toast-msg').textContent = `Unlocked Perk: ${power} (+100 Rep Points)`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 5000);
  }

  console.log(`[CelesteCon] Collected Easter Egg: ${name} (${power})`);
}

function addRepPoints(val) {
  GameState.repPoints += val;
  const repEl = document.getElementById('hud-rep');
  if (repEl) {
    repEl.textContent = GameState.repPoints;
    repEl.style.transform = 'scale(1.2)';
    setTimeout(() => { repEl.style.transform = 'scale(1)'; }, 300);
  }
}

// --- 2D VISUAL NOVEL DIALOGUE SYSTEM ---
function openDialogue(diagData) {
  GameState.isDialogueOpen = true;
  const box = document.getElementById('dialogue-box');
  if (!box) return;

  document.getElementById('dialogue-avatar').textContent = diagData.avatar || '💬';
  document.getElementById('dialogue-name').textContent = diagData.name || 'NPC';
  document.getElementById('dialogue-text').textContent = diagData.text || '';

  const choicesContainer = document.getElementById('dialogue-choices');
  choicesContainer.innerHTML = '';

  // Filter choices by selected role if applicable
  const validChoices = (diagData.choices || []).filter(c => !c.role || c.role === GameState.role);
  validChoices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    if (choice.action && choice.action.startsWith('minigame') || choice.action && choice.action.startsWith('crisis')) {
      btn.classList.add('minigame-trigger-btn');
    }
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      handleDialogueAction(choice, diagData);
    });
    choicesContainer.appendChild(btn);
  });

  box.classList.remove('hidden');
}

function handleDialogueAction(choice, diagData) {
  if (choice.action === 'close') {
    closeDialogue();
  } else if (choice.action === 'say') {
    document.getElementById('dialogue-text').textContent = choice.resp || 'Thank you for your input!';
    const choicesContainer = document.getElementById('dialogue-choices');
    choicesContainer.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    btn.textContent = 'Continue';
    btn.addEventListener('click', closeDialogue);
    choicesContainer.appendChild(btn);
  } else if (choice.action === 'rep') {
    addRepPoints(choice.val || 25);
    document.getElementById('dialogue-text').textContent = `Awesome participation! You earned +${choice.val || 25} Reputation Points for your team!`;
    const choicesContainer = document.getElementById('dialogue-choices');
    choicesContainer.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    btn.textContent = 'Awesome!';
    btn.addEventListener('click', closeDialogue);
    choicesContainer.appendChild(btn);
  } else if (choice.action === 'minigame_cubesat' || choice.action === 'crisis_cubesat') {
    closeDialogue();
    openMinigame('cubesat');
  } else if (choice.action === 'minigame_flight' || choice.action === 'crisis_flight') {
    closeDialogue();
    openMinigame('flight');
  } else if (choice.action === 'minigame_circuit') {
    closeDialogue();
    openMinigame('circuit');
  } else if (choice.action === 'teleport') {
    closeDialogue();
    if (choice.targetZone) init3DWorld(choice.targetZone);
  } else if (choice.action === 'finale') {
    closeDialogue();
    openFinaleModal();
  }
}

function closeDialogue() {
  GameState.isDialogueOpen = false;
  const box = document.getElementById('dialogue-box');
  if (box) box.classList.add('hidden');
}

// --- MINIGAME / CRISIS MODAL SYSTEM ---
function initMinigameModal() {
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeMinigame);

  const completeBtn = document.getElementById('modal-complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      addRepPoints(150);
      closeMinigame();
      // Show reward toast
      const toast = document.getElementById('toast-notify');
      if (toast) {
        document.getElementById('toast-title').textContent = `🎉 Crisis Solved / Minigame Conquered!`;
        document.getElementById('toast-msg').textContent = `Awarded +150 Rep Points! The AEROSS team is grateful!`;
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 5000);
      }
    });
  }

  // Wire up circuit buttons
  const circBtns = document.querySelectorAll('.circuit-btn');
  circBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        btn.classList.add('correct');
        const completeBtn = document.getElementById('modal-complete-btn');
        if (completeBtn) {
          completeBtn.classList.remove('hidden');
          completeBtn.textContent = '⚡ Calibration Successful! Claim +150 Rep Points';
        }
      } else {
        btn.classList.add('wrong');
      }
    });
  });
}

function openMinigame(type) {
  GameState.isMinigameOpen = true;
  const modal = document.getElementById('minigame-modal');
  const iframe = document.getElementById('minigame-iframe');
  const builtin = document.getElementById('builtin-minigame-wrap');
  const title = document.getElementById('modal-title');
  const completeBtn = document.getElementById('modal-complete-btn');
  if (!modal) return;

  if (completeBtn) {
    completeBtn.classList.remove('hidden');
    completeBtn.textContent = 'Claim Reward & Complete Challenge (+150 Rep)';
  }

  if (type === 'cubesat') {
    if (title) title.textContent = '🛰️ NASA CubeSat Builder Minigame — Build a Spacecraft!';
    if (iframe) {
      iframe.src = './minigames/cubesat-builder/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
  } else if (type === 'flight') {
    if (title) title.textContent = '✈️ Volatus Flight Simulator — UAV Stability & Aerodynamics';
    if (iframe) {
      iframe.src = './minigames/flight-sim/dist/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
  } else if (type === 'circuit') {
    if (title) title.textContent = '⚡ Aerospace Emergency Circuit & Quiz Challenge';
    if (iframe) {
      iframe.src = 'about:blank';
      iframe.classList.add('hidden');
    }
    if (builtin) builtin.classList.remove('hidden');
    if (completeBtn) completeBtn.classList.add('hidden');
    loadDynamicCircuitChallenge();
  }

  modal.classList.remove('hidden');
}

let currentCircuitIndex = 0;
const CIRCUIT_CHALLENGES = [
  {
    title: "⚡ Aerospace Emergency: CubeSat ADCS Failure",
    q: "What is the primary function of an ADCS (Attitude Determination and Control System) on a CubeSat?",
    options: [
      { text: "Orienting the satellite's position and angle in space", correct: true },
      { text: "Generating solar power from ambient radiation", correct: false },
      { text: "Transmitting high-frequency radio waves to Earth", correct: false }
    ],
    explanation: "Correct! ADCS sensors and magnetorquers keep the satellite precisely aligned in orbit."
  },
  {
    title: "🗣️ Debate Rebuttal: Space Treaty Compliance",
    q: "Under the 1967 Outer Space Treaty, which entity bears international responsibility for national activities in outer space?",
    options: [
      { text: "The State (Nation) launching or sponsoring the activity", correct: true },
      { text: "The individual private corporation operating the spacecraft", correct: false },
      { text: "The United Nations Office for Outer Space Affairs directly", correct: false }
    ],
    explanation: "Correct! Article VI places international liability directly on national governments."
  },
  {
    title: "⚡ Quizzitch Brain Teaser: Orbital Velocity",
    q: "As an orbiting satellite moves from its apogee (farthest point) to its perigee (closest point) in an elliptical orbit, what happens to its velocity?",
    options: [
      { text: "Its orbital velocity increases due to gravitational acceleration", correct: true },
      { text: "Its orbital velocity decreases to conserve angular momentum", correct: false },
      { text: "Its orbital velocity remains constant throughout the orbit", correct: false }
    ],
    explanation: "Correct! According to Kepler's Second Law, satellites accelerate as they approach the celestial body."
  },
  {
    title: "🚁 Volatus Aerodynamics: UAV Flight Control",
    q: "Which rotor speed adjustment is primarily responsible for controlling yaw (left/right rotation) on a standard quadrotor drone?",
    options: [
      { text: "Varying the speed of diagonally opposing clockwise/counter-clockwise pairs", correct: true },
      { text: "Tilting all four rotors forward simultaneously by 15 degrees", correct: false },
      { text: "Increasing the speed of all rotors equally by 500 RPM", correct: false }
    ],
    explanation: "Correct! Yaw control relies on balancing torque generated by spinning diagonal propeller pairs."
  },
  {
    title: "🌐 Settle-Me-This: Martian Life Support",
    q: "In a closed-loop environmental control system for a Martian colony, what is the most efficient biological method for scrubbing CO2 while producing O2 and food?",
    options: [
      { text: "Hydroponic algae and crop photobioreactors", correct: true },
      { text: "Cryogenic freezing of ambient atmospheric carbon", correct: false },
      { text: "Open-air chemical combustion with sulfur compounds", correct: false }
    ],
    explanation: "Correct! Biological systems like Chlorella algae solve gas exchange and nutrition simultaneously!"
  },
  {
    title: "💼 Business Power Pitch: Venture Unit Economics",
    q: "When evaluating a commercial reusable launch vehicle startup, what key metric determines long-term profitability over traditional expendable rockets?",
    options: [
      { text: "Marginal cost per kilogram to orbit after refurbishment cycles", correct: true },
      { text: "Total thrust generated by the first-stage engines in vacuum", correct: false },
      { text: "Number of solid rocket boosters attached to the core stage", correct: false }
    ],
    explanation: "Correct! Venture capitalists care about recurring unit costs and reusability turn-around times."
  }
];

function loadDynamicCircuitChallenge() {
  const challenge = CIRCUIT_CHALLENGES[currentCircuitIndex % CIRCUIT_CHALLENGES.length];
  currentCircuitIndex++;
  
  const titleEl = document.querySelector('.builtin-header h4');
  const descEl = document.querySelector('.builtin-header p');
  const qEl = document.querySelector('.quiz-q');
  const optionsWrap = document.querySelector('.circuit-options');
  const completeBtn = document.getElementById('modal-complete-btn');

  if (titleEl) titleEl.textContent = challenge.title;
  if (descEl) descEl.textContent = "Select the correct technical solution to stabilize the system and earn your reputation points!";
  if (qEl) qEl.textContent = `Challenge #${currentCircuitIndex}: ${challenge.q}`;
  if (completeBtn) completeBtn.classList.add('hidden');

  if (optionsWrap) {
    optionsWrap.innerHTML = '';
    challenge.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'circuit-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        const allBtns = optionsWrap.querySelectorAll('.circuit-btn');
        allBtns.forEach(b => b.classList.remove('correct', 'wrong'));
        if (opt.correct) {
          btn.classList.add('correct');
          if (completeBtn) {
            completeBtn.classList.remove('hidden');
            completeBtn.textContent = `⚡ Successful! ${challenge.explanation} (+150 Rep)`;
          }
        } else {
          btn.classList.add('wrong');
        }
      });
      optionsWrap.appendChild(btn);
    });
  }
}

function closeMinigame() {
  GameState.isMinigameOpen = false;
  const modal = document.getElementById('minigame-modal');
  const iframe = document.getElementById('minigame-iframe');
  if (iframe) iframe.src = 'about:blank';
  if (modal) modal.classList.add('hidden');
}

// --- INFO / CONTROLS MODAL ---
function initInfoModal() {
  const openBtn = document.getElementById('help-controls-btn');
  const closeBtn = document.getElementById('info-close-btn');
  const modal = document.getElementById('info-modal');
  if (openBtn && modal) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
}

// --- GRAND FINALE & AWARDS CEREMONY ---
function initFinaleModal() {
  const openBtn = document.getElementById('hud-finale-btn');
  const closeBtn = document.getElementById('finale-close-btn');
  const contBtn = document.getElementById('finale-continue-btn');
  const resBtn = document.getElementById('finale-restart-btn');
  const modal = document.getElementById('finale-modal');

  if (openBtn) openBtn.addEventListener('click', openFinaleModal);
  if (closeBtn) closeBtn.addEventListener('click', () => modal && modal.classList.add('hidden'));
  if (contBtn) contBtn.addEventListener('click', () => modal && modal.classList.add('hidden'));
  if (resBtn) {
    resBtn.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
      GameState.repPoints = 0;
      if (GameState.foundEggs) GameState.foundEggs.clear();
      switchScreen('ROLE_SELECT');
    });
  }
}

function openFinaleModal() {
  const modal = document.getElementById('finale-modal');
  if (!modal) return;
  const charEl = document.getElementById('f-stat-char');
  const roleEl = document.getElementById('f-stat-role');
  const repEl = document.getElementById('f-stat-rep');
  const eggsEl = document.getElementById('f-stat-eggs');
  if (charEl) charEl.textContent = GameState.character ? GameState.character.name : 'Siddharth';
  if (roleEl) roleEl.textContent = GameState.role || 'Participant';
  if (repEl) repEl.textContent = GameState.repPoints || 0;
  if (eggsEl) eggsEl.textContent = `${GameState.foundEggs ? GameState.foundEggs.size : 0} / 5`;
  modal.classList.remove('hidden');
}

// --- UTILITY: SCREEN SWITCHER ---
function switchScreen(screenName) {
  GameState.screen = screenName;
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  let targetId = '';
  if (screenName === 'LOADING') targetId = 'screen-loading';
  if (screenName === 'ROLE_SELECT') targetId = 'screen-role-select';
  if (screenName === 'QUESTIONNAIRE') targetId = 'screen-questionnaire';
  if (screenName === 'REVEAL') targetId = 'screen-reveal';
  if (screenName === 'GAMEPLAY') targetId = 'screen-gameplay';

  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.classList.add('active');
}

// ==================== ENGINE INITIALIZATION ====================
function initEngine() {
  initLoadingScreen();
  initRoleSelect();
  initQuestionnaire();
  initReveal();
  initGameplayControls();
  initMinigameModal();
  initInfoModal();
  initFinaleModal();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
}

