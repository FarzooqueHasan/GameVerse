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
  scavengerActive: false,
  foundScavengerItems: new Set(),
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
    q: "When someone hands you a complex aerospace project with no instructions, you:",
    options: [
      { text: "Jump right in and start experimenting spontaneously!", char: "Tarushi" },
      { text: "Take a deep breath, map out a structure, and delegate tasks.", char: "Siddharth" },
      { text: "Sit quietly, analyze what needs to be done, and execute silently.", char: "Anant" },
      { text: "Organize a quick team huddle to brainstorm ideas together.", char: "Farzooque" },
      { text: "Envision the overarching architectural roadmap and futuristic impact.", char: "Ryaan" },
    ]
  },
  {
    q: "In an AEROSS Club event team, what is your typical leadership style?",
    options: [
      { text: "The creative dynamo generating boundless energy and bold concepts.", char: "Tarushi" },
      { text: "The calm crisis manager keeping timelines and logistics organized.", char: "Siddharth" },
      { text: "The reliable engineer delivering flawless technical hardware.", char: "Anant" },
      { text: "The charismatic networker bringing diverse talents into harmony.", char: "Farzooque" },
      { text: "The visionary strategist designing the big-picture challenge goals.", char: "Ryaan" },
    ]
  },
  {
    q: "When faced with an unexpected technical failure 10 minutes before deadlines, you:",
    options: [
      { text: "Thrive on the adrenaline and pull off a miraculous creative pivot!", char: "Tarushi" },
      { text: "Follow established protocols and systematically resolve the bottleneck.", char: "Siddharth" },
      { text: "Focus intensely and debug the hardware/code without a single word.", char: "Anant" },
      { text: "Rally the team's morale and coordinate peer-to-peer support.", char: "Farzooque" },
      { text: "Re-evaluate the strategic parameters to preserve mission success.", char: "Ryaan" },
    ]
  },
  {
    q: "What is your preferred working environment for space science challenges?",
    options: [
      { text: "Fast-paced, high-voltage, and full of spontaneous innovation.", char: "Tarushi" },
      { text: "Methodical, structured, and operating with clockwork precision.", char: "Siddharth" },
      { text: "Independent, laser-focused, and equipped with top-tier tech.", char: "Anant" },
      { text: "Collaborative, communicative, and buzzing with team spirit.", char: "Farzooque" },
      { text: "Visionary, boundary-pushing, and inspired by grand space exploration.", char: "Ryaan" },
    ]
  },
  {
    q: "When a disagreement over debate arguments or 3D designs arises, how do you resolve it?",
    options: [
      { text: "Propose an exciting, out-of-the-box alternative that excites everyone.", char: "Tarushi" },
      { text: "Step in as mediator and apply a logical, evidence-based rubric.", char: "Siddharth" },
      { text: "Avoid the noise and focus purely on proving the concept via data.", char: "Anant" },
      { text: "Use warmth, humor, and empathy to defuse tension immediately.", char: "Farzooque" },
      { text: "Synthesize both viewpoints into a superior, unified grand design.", char: "Ryaan" },
    ]
  },
  {
    q: "How do you respond when event judges provide tough critical feedback?",
    options: [
      { text: "Embrace the critique and instantly spark a bold new iteration.", char: "Tarushi" },
      { text: "Analyze the evaluation metrics and adjust the workflow systematically.", char: "Siddharth" },
      { text: "Accept it quietly and execute flawless technical corrections.", char: "Anant" },
      { text: "Discuss the feedback with teammates to share insights and learn.", char: "Farzooque" },
      { text: "Incorporate the lessons into a longer-term strategic vision.", char: "Ryaan" },
    ]
  },
  {
    q: "What excites you the most about participating in CelesteCon?",
    options: [
      { text: "The sheer joy of creative expression and unforgettable campus vibes.", char: "Tarushi" },
      { text: "The satisfaction of executing a well-run, professional competition.", char: "Siddharth" },
      { text: "The pride in mastering complex aerospace simulators and hardware.", char: "Anant" },
      { text: "The chance to connect, celebrate, and build lifelong friendships.", char: "Farzooque" },
      { text: "The opportunity to push student space research to new frontiers.", char: "Ryaan" },
    ]
  },
  {
    q: "When learning orbital mechanics or drone flight physics, your approach is:",
    options: [
      { text: "Hands-on trial-and-error simulation and fearless experimentation.", char: "Tarushi" },
      { text: "Reading technical documentation and building a step-by-step model.", char: "Siddharth" },
      { text: "Intense, solitary practice until muscle memory and calculation are exact.", char: "Anant" },
      { text: "Forming interactive study groups and debating theories together.", char: "Farzooque" },
      { text: "Studying the foundational principles to invent new aerospace concepts.", char: "Ryaan" },
    ]
  },
  {
    q: "With 3 major events (Debate, Quizzitch, Volatus UAV) happening simultaneously, you:",
    options: [
      { text: "Dive straight into the most thrilling, high-energy event first!", char: "Tarushi" },
      { text: "Create a precision master schedule to manage time slots flawlessly.", char: "Siddharth" },
      { text: "Quietly complete your technical assignments one by one in the zone.", char: "Anant" },
      { text: "Move between booths checking on friends and cheering them on.", char: "Farzooque" },
      { text: "Analyze tournament scoring dynamics to optimize overall victory.", char: "Ryaan" },
    ]
  },
  {
    q: "In one sentence, what is your ultimate motto as an aerospace pioneer?",
    options: [
      { text: "'Let's make this epic, bold, and totally unforgettable!'", char: "Tarushi" },
      { text: "'Trust the process. Structure and preparation conquer all crises.'", char: "Siddharth" },
      { text: "'Actions and flawless results speak louder than any words.'", char: "Anant" },
      { text: "'When our school community works together, we are unstoppable!'", char: "Farzooque" },
      { text: "'The future of interplanetary exploration begins right here.'", char: "Ryaan" },
    ]
  }
];

const DIALOGUES = {
  npc_vibha: {
    name: "Mrs. Vibha Arora (Teacher Coordinator)",
    avatar: "👩‍🏫",
    text: "Welcome to CelesteCon! As teacher coordinators, Mr. Sanchit and I are thrilled to see our AEROSS Club students leading such an ambitious aerospace festival.",
    choices: [
      { text: "🚨 [Organizer Action] Inspect campus emergency protocols & logistics", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_general" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "🚀 [Participant Action] Where can I register for the aerospace competitions?", role: "Participant", action: "say", resp: "Check out the event booths around the plaza! You can compete in Quizzitch, Debate, UAVs, and more." },
      { text: "⚖️ [Judge Action] Review official scoring rubrics and ethical guidelines", role: "Judge", action: "judge_verdict", verdictKey: "verdict_general" },
      { text: "Goodbye, ma'am!", action: "close" }
    ]
  },
  npc_sanchit: {
    name: "Mr. Sanchit Chauhan (Teacher Coordinator)",
    avatar: "👨‍🏫",
    text: "Ah, hello there! The UAV Volatus arena is experiencing some wind gusts today. We must ensure safety guidelines are strictly followed.",
    choices: [
      { text: "🚨 [Organizer Action] Deploy stabilizing nets around the flight arena", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_volatus" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "🚀 [Participant Action] Let me jump into the drone cockpit simulator!", role: "Participant", action: "minigame_flight" },
      { text: "⚖️ [Judge Action] Evaluate contestant aerodynamic recovery maneuvers", role: "Judge", action: "judge_verdict", verdictKey: "verdict_volatus" },
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
      { text: "🚀 [Participant] Let me open the CubeSat Builder and fix your telemetry!", role: "Participant", action: "minigame_cubesat" },
      { text: "🚨 [Organizer] Supply spare telemetry sensors from inventory!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_cubesat" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "⚖️ [Judge] Inspect whether third-party hardware modules are legal", role: "Judge", action: "judge_verdict", verdictKey: "verdict_cubesat" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Verify & Stack Divyam's CubeSat Modules!", role: "Judge", action: "minigame_cubestack" },
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
      { text: "🚀 [Participant] Give me a quick aerospace question!", role: "Participant", action: "minigame_circuit" },
      { text: "⚖️ [Judge] Rule on a disputed time limit violation in the semi-finals", role: "Judge", action: "judge_verdict", verdictKey: "verdict_debate" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "Keep up the great debate!", action: "close" }
    ]
  },
  npc_manya: {
    name: "Manya (Quiz Team)",
    avatar: "🙋‍♀️",
    text: "Quizzitch is about to start! Do you know the difference between LEO, MEO, and Geostationary orbits?",
    choices: [
      { text: "🚀 [Participant] Let's test my aerospace knowledge right now!", role: "Participant", action: "minigame_circuit" },
      { text: "🚨 [Organizer] Resolve the buzzer malfunction on table 4!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_quizzitch" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "I need to brush up on my physics first!", action: "close" }
    ]
  },
  npc_aarav: {
    name: "Aarav Anand (UAV Pilot)",
    avatar: "🛩️",
    text: "My drone's PID controller needs tuning before the Volatus obstacle course. Want to run a flight sim test?",
    choices: [
      { text: "🚀 [Participant] Let's jump into the cockpit simulator!", role: "Participant", action: "minigame_flight" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
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
      { text: "🚨 [Organizer] We have an emergency circuit failure in the sound system!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_sound" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "🚀 [Participant] I'm ready to present my Business Power Pitch!", role: "Participant", action: "say", resp: "Awesome! Step up to the Power Pitch booth right here in the room and show us your space tech startup roadmap." },
      { text: "⚖️ [Judge] I have finalized the evaluation scores for the top teams.", role: "Judge", action: "say", resp: "Thank you for your integrity and hard work. Let's get ready for the prize distribution!" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🏆 [Grand Finale] Conclude CelesteCon & Attend the Awards Ceremony!", action: "finale" },
      { text: "Honor to meet you, President!", action: "close" }
    ]
  },
  booth_debate: {
    name: "In pursuit of dispute — Debate Event Booth",
    avatar: "🗣️",
    text: "Welcome to the premier CelesteCon debate! Teams are currently arguing: 'Should private corporations have property rights over lunar resources?'",
    choices: [
      { text: "🚀 [Participant] Enter the debate challenge & test your reasoning!", role: "Participant", action: "minigame_circuit" },
      { text: "⚖️ [Judge] Rule on a dispute over unauthorized AI note-taking tools", role: "Judge", action: "judge_verdict", verdictKey: "verdict_debate" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Handle microphone feedback & podium scheduling clash", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_debate" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_quizzitch: {
    name: "Quizzitch — Aerospace Quiz Challenge",
    avatar: "⚡",
    text: "Step right up to Quizzitch! Test your mastery over rocket propulsion, astronomy, and aviation history.",
    choices: [
      { text: "🚀 [Participant] Answer the aerospace brain teaser challenge!", role: "Participant", action: "minigame_circuit" },
      { text: "⚖️ [Judge] Determine if an ambiguous astrophysics answer should be awarded points", role: "Judge", action: "judge_verdict", verdictKey: "verdict_quizzitch" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Fix a blown fuse in the electronic buzzer display", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_quizzitch" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_volatus: {
    name: "Volatus — Aviation & UAV Challenge Booth",
    avatar: "🚁",
    text: "Welcome to Volatus! Test your drone piloting reflexes and aerodynamic stability in our flight simulator.",
    choices: [
      { text: "🚀 [Participant] Take control in the Flight Simulator challenge!", role: "Participant", action: "minigame_flight" },
      { text: "⚖️ [Judge] Inspect drone propeller dimensions against tournament regulations", role: "Judge", action: "judge_verdict", verdictKey: "verdict_volatus" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Establish safety netting and crowd control perimeter", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_volatus" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_theatre: {
    name: "AEROSS Theatre — Standup, Skit & Comedy",
    avatar: "🎭",
    text: "A crowd gathers around the stage! Students are performing a hilarious educational skit about what happens when astronauts forget their wrenches in zero gravity.",
    choices: [
      { text: "🚀 [Participant] Perform an impromptu standup skit! (+35 Rep)", role: "Participant", action: "rep", val: 35 },
      { text: "⚖️ [Judge] Score the performance on educational value and comedic timing", role: "Judge", action: "judge_verdict", verdictKey: "verdict_theatre" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Manage backstage prop transitions and lighting cues", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_theatre" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_dim3: {
    name: "Dimension III — 3D CAD Design Exhibition",
    avatar: "📐",
    text: "Examine the incredible 3D printed rover prototypes and orbital space station CAD assemblies created by school competitors.",
    choices: [
      { text: "🚀 [Participant] Inspect CAD models & review structural integrity (+30 Rep)", role: "Participant", action: "rep", val: 30 },
      { text: "⚖️ [Judge] Evaluate CAD structural tolerances and originality", role: "Judge", action: "judge_verdict", verdictKey: "verdict_dim3" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Verify & Stack 3D Assembly Modules!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Fix a jammed 3D filament extruder before judging begins", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_dim3" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_settle: {
    name: "Settle-Me-This — Space Settlement Challenge",
    avatar: "🌐",
    text: "Competitors are designing a self-sustaining Martian colony for 10,000 inhabitants, handling life support, radiation shielding, and agriculture.",
    choices: [
      { text: "🚀 [Participant] Suggest hydroponic algae farms for oxygen balance! (+40 Rep)", role: "Participant", action: "rep", val: 40 },
      { text: "⚖️ [Judge] Rule on feasibility of proposed nuclear micro-reactors", role: "Judge", action: "judge_verdict", verdictKey: "verdict_settle" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Provide emergency backup power to the CAD projection screens", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_settle" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_pitch: {
    name: "Business Power Pitch — Space Venture Challenge",
    avatar: "💼",
    text: "Student entrepreneurs are pitching commercial space tech startups to a panel of venture capitalists and industry judges.",
    choices: [
      { text: "🚀 [Participant] Analyze unit economics of reusable rocket boosters! (+45 Rep)", role: "Participant", action: "rep", val: 45 },
      { text: "⚖️ [Judge] Evaluate startup ROI, patent defensibility, and market size", role: "Judge", action: "judge_verdict", verdictKey: "verdict_pitch" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🚨 [Organizer] Escort VIP guest judges from campus security to the boardroom", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_pitch" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
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

  refreshScavengerVisibility();

  // Add 3D Teleport Portals to other zones
  const portalZones = [
    { key: 'celestecon_amphitheater', name: '🏛️ Portal: OAT Amphitheater', x: -10, z: -8, color: 0xffd166 },
    { key: 'auditorium_demo', name: '🎭 Portal: Main Auditorium', x: 0, z: -10, color: 0x7fa7c9 },
    { key: 'management_room_demo', name: '👔 Portal: Management HQ', x: 10, z: -8, color: 0x8fb996 }
  ];
  portalZones.forEach(pz => {
    if (pz.key === zoneKey) return;
    const portalGroup = Kit.eventBooth(2.2, 1.5, 2.4, 0x141b33, pz.color, { text: pz.name });
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
    if (!child.userData || (!child.userData.interactName && !child.userData.isEasterEgg && !child.userData.isScavengerTarget)) return;

    // Skip already collected easter eggs or inactive/collected scavenger items
    if (child.userData.isEasterEgg && GameState.foundEggs.has(child.userData.id)) return;
    if (child.userData.isScavengerTarget && (!GameState.scavengerActive || GameState.foundScavengerItems.has(child.userData.id))) return;

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
        if (nearestTarget.userData.isScavengerTarget) {
          nameEl.textContent = `Recover Scavenger Target: ${nearestTarget.userData.scavengerName || 'Missing Equipment'}`;
        } else if (nearestTarget.userData.isEasterEgg) {
          nameEl.textContent = `Collect Secret Relic: ${nearestTarget.userData.easterEggName || 'Secret Item'}`;
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

  // Handle Scavenger Hunt Target
  if (target.userData.isScavengerTarget) {
    collectScavengerTarget(target);
    return;
  }

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
  const power = target.userData.easterEggPower || "+150 Celeste Booster";

  // Remove mesh from scene
  if (GameState.sceneData && GameState.sceneData.scene) {
    GameState.sceneData.scene.remove(target);
  }

  // Update HUD
  addCeleste(150);
  document.getElementById('hud-eggs').textContent = `${GameState.foundEggs.size} / 5`;

  // Show Toast
  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `✨ Secret Relic Found: ${name}!`;
    document.getElementById('toast-msg').textContent = `Unlocked Perk: ${power} (+150 🪙 Celeste)`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 5000);
  }

  console.log(`[CelesteCon] Collected Relic: ${name} (${power})`);
}

window.startInWorldScavengerHunt = function() {
  GameState.scavengerActive = true;
  const banner = document.getElementById('scavenger-hud-banner');
  if (banner) banner.classList.remove('hidden');
  const countEl = document.getElementById('scav-count');
  if (countEl) countEl.textContent = GameState.foundScavengerItems.size;

  refreshScavengerVisibility();

  // Show Toast
  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `🚨 EMERGENCY SCAVENGER HUNT ACTIVE!`;
    document.getElementById('toast-msg').textContent = `Explore OAT Amphitheater, Main Auditorium & Management Room to locate all 4 missing targets!`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 6000);
  }
};

function refreshScavengerVisibility() {
  if (GameState.sceneData && GameState.sceneData.scene) {
    GameState.sceneData.scene.children.forEach(child => {
      if (child.userData && child.userData.isScavengerTarget) {
        child.visible = GameState.scavengerActive && !GameState.foundScavengerItems.has(child.userData.id);
      }
    });
  }
}

function collectScavengerTarget(target) {
  if (!GameState.scavengerActive) return;
  const id = target.userData.id || `scav_${Math.random()}`;
  if (GameState.foundScavengerItems.has(id)) return;

  GameState.foundScavengerItems.add(id);
  const name = target.userData.scavengerName || "Missing Equipment";

  // Hide or remove mesh
  target.visible = false;
  if (GameState.sceneData && GameState.sceneData.scene) {
    GameState.sceneData.scene.remove(target);
  }

  // Update counter
  const countEl = document.getElementById('scav-count');
  if (countEl) countEl.textContent = GameState.foundScavengerItems.size;

  // Show Toast
  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `🔍 Recovered: ${name}!`;
    document.getElementById('toast-msg').textContent = `Progress: ${GameState.foundScavengerItems.size} / 4 targets located across campus!`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 5000);
  }

  // Check victory condition
  if (GameState.foundScavengerItems.size >= 4) {
    GameState.scavengerActive = false;
    const banner = document.getElementById('scavenger-hud-banner');
    if (banner) banner.classList.add('hidden');
    window.onMinigameVictory('scavenger', 250, "Successfully recovered all missing equipment and key personnel across the campus locations!");
  }
}

window.addCeleste = function(val) {
  GameState.repPoints = (GameState.repPoints || 0) + val;
  GameState.celeste = GameState.repPoints;
  const repEl = document.getElementById('hud-rep');
  if (repEl) {
    repEl.textContent = `${GameState.celeste}`;
    repEl.style.transform = 'scale(1.25)';
    repEl.style.color = '#00f0ff';
    setTimeout(() => { 
      repEl.style.transform = 'scale(1)'; 
      repEl.style.color = '#ffd166';
    }, 400);
  }
  checkFestivalCompletion();
};
window.addRepPoints = window.addCeleste;

function checkFestivalCompletion() {
  const certEl = document.getElementById('hud-certified');
  if (certEl && GameState.certifiedEvents) {
    certEl.textContent = `${GameState.certifiedEvents.size} / 5`;
  }
  if ((GameState.certifiedEvents && GameState.certifiedEvents.size >= 4) || (GameState.celeste && GameState.celeste >= 800)) {
    const finaleBtn = document.getElementById('hud-finale-btn');
    if (finaleBtn && finaleBtn.classList.contains('hidden')) {
      finaleBtn.classList.remove('hidden');
      finaleBtn.style.animation = 'pulseGlow 1.5s infinite alternate';
      window.triggerNarratorComment("🎉 INCREDIBLE! You have certified enough aerospace systems and earned massive Celeste currency! The Grand Finale & Awards Ceremony is now unlocked in the HUD top right!");
    }
  }
}

window.onMinigameVictory = function(type, rewardCeleste, successMessage) {
  console.log(`[CelesteCon] Minigame VICTORY: ${type}, +${rewardCeleste} Celeste`);
  if (!GameState.certifiedEvents) GameState.certifiedEvents = new Set();
  GameState.certifiedEvents.add(type);

  addCeleste(rewardCeleste || 200);

  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `🏆 AEROSPACE CHALLENGE CONQUERED!`;
    document.getElementById('toast-msg').textContent = `${successMessage || 'System certified!'} (+${rewardCeleste || 200} 🪙 Celeste Earned!)`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 6000);
  }

  if (typeof closeMinigame === 'function') closeMinigame();

  const storyNarrations = {
    cubesat: "🎙️ Jatin: Phenomenal space engineering! With the ISRO CubeSat payload certified and orbital telemetry locked in, our satellite link is 100% operational! Next: Visit the Volatus UAV Arena!",
    flight: "🎙️ Jatin: Masterful piloting! You demonstrated elite UAV aerodynamics in the Volatus arena! The festival crowds are cheering your name!",
    circuit: "🎙️ Jatin: Brilliance under pressure! You solved the aerospace circuit emergency and restored power to the stage! Next: Visit the Debate Booth or Quizzitch!",
    cubestack: "🎙️ Jatin: Official Judge Certification granted! The cleanroom structural tower is certified safe for competition!",
    crowd_control: "🎙️ Jatin: Masterful event logistics! You guided all student cohorts into their correct event halls without a single bottleneck!",
    scavenger: "🎙️ Jatin: Crisis averted! All 4 missing pieces of equipment and key personnel have been safely recovered across campus!"
  };
  if (typeof window.triggerNarratorComment === 'function') {
    window.triggerNarratorComment(storyNarrations[type] || `🎙️ Jatin: Outstanding victory in ${type}! You earned +${rewardCeleste} 🪙 Celeste! Keep exploring campus!`);
  }
};

window.onMinigameDefeat = function(type, penaltyCeleste, failMessage) {
  console.log(`[CelesteCon] Minigame DEFEAT: ${type}, -${penaltyCeleste} Celeste`);
  
  const penalty = penaltyCeleste || 30;
  GameState.repPoints = Math.max(0, (GameState.repPoints || 0) - penalty);
  GameState.celeste = GameState.repPoints;
  const repEl = document.getElementById('hud-rep');
  if (repEl) {
    repEl.textContent = `${GameState.celeste}`;
    repEl.style.color = '#ff3300';
    setTimeout(() => { repEl.style.color = '#ffd166'; }, 600);
  }

  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `⚠️ ATTEMPT FAILED!`;
    document.getElementById('toast-msg').textContent = `${failMessage || 'System instability detected.'} (-${penalty} 🪙 Celeste). Try again to certify this event!`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 5000);
  }

  if (typeof closeMinigame === 'function') closeMinigame();

  if (typeof window.triggerNarratorComment === 'function') {
    window.triggerNarratorComment(`🎙️ Jatin: Don't give up! That test run didn't go as planned (${failMessage || 'circuit overload'}). Re-check your aerodynamics and try again to win those Celeste points!`);
  }
};

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
  } else if (choice.action === 'minigame_cubestack' || choice.action === 'judge_cubestack') {
    closeDialogue();
    openMinigame('cubestack');
  } else if (choice.action === 'minigame_crowd' || choice.action === 'organizer_crowd') {
    closeDialogue();
    openMinigame('crowd_control');
  } else if (choice.action === 'minigame_scavenger' || choice.action === 'organizer_scavenger') {
    closeDialogue();
    openMinigame('scavenger');
  } else if (choice.action === 'judge_verdict') {
    closeDialogue();
    openJudgeModal(choice.verdictKey || 'verdict_general');
  } else if (choice.action === 'organizer_crisis') {
    closeDialogue();
    openOrganizerModal(choice.crisisKey || 'crisis_general');
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
}

function openMinigame(type) {
  GameState.isMinigameOpen = true;
  const modal = document.getElementById('minigame-modal');
  const iframe = document.getElementById('minigame-iframe');
  const builtin = document.getElementById('builtin-minigame-wrap');
  const title = document.getElementById('modal-title');
  const completeBtn = document.getElementById('modal-complete-btn');
  if (!modal) return;

  // Always hide external cheat/skip button to enforce Gamer POV completion inside the actual simulation!
  if (completeBtn) {
    completeBtn.classList.add('hidden');
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
    loadDynamicCircuitChallenge();
  } else if (type === 'cubestack') {
    if (title) title.textContent = '🏗️ CubeStack — Judge Structural Verification & Assembly Tower';
    if (iframe) {
      iframe.src = './minigames/cubestack/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
  } else if (type === 'crowd_control') {
    if (title) title.textContent = '🚧 AEROSS Crowd Control — Event Barricade & Flow Manager';
    if (iframe) {
      iframe.src = './minigames/crowd-control/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
  } else if (type === 'scavenger') {
    if (title) title.textContent = '🔍 Emergency Scavenger Hunt — Locate Missing Equipment & VIPs';
    if (iframe) {
      iframe.src = './minigames/scavenger-hunt/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
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
  if (descEl) descEl.textContent = "Select the correct technical solution to stabilize the system and earn your Celeste currency!";
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
          setTimeout(() => {
            if (window.onMinigameVictory) window.onMinigameVictory('circuit', 150, challenge.explanation);
          }, 800);
        } else {
          btn.classList.add('wrong');
          if (window.onMinigameDefeat) window.onMinigameDefeat('circuit', 30, "Incorrect technical solution selected!");
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

// --- JUDGE & ORGANIZER MODAL SYSTEM ---
function openJudgeModal(verdictKey) {
  const modal = document.getElementById('judge-modal');
  const descEl = document.getElementById('judge-verdict-desc');
  const optionsWrap = document.getElementById('judge-verdict-options');
  if (!modal || !optionsWrap) return;

  const verdicts = {
    verdict_cubesat: {
      title: "🛰️ CubeSat Hardware Legality Dispute",
      desc: "Team Divyam used an unverified high-gain S-band transceiver from a commercial off-the-shelf drone. Is this allowable under CelesteCon Division rules?",
      options: [
        { text: "✅ Rule Allowable: COTS components encourage rapid prototyping (+50 Rep)", rep: 50, toast: "You ruled in favor of open hardware innovation!" },
        { text: "❌ Rule Violation: All RF modules must undergo pre-event chamber certification (+50 Rep)", rep: 50, toast: "You upheld strict aerospace RF safety compliance!" }
      ]
    },
    verdict_volatus: {
      title: "✈️ Volatus Drone Flight Envelope Dispute",
      desc: "A quadrotor team performed a high-G split-S maneuver 2 meters above the spectator net. Does this exceed campus indoor flight safety envelopes?",
      options: [
        { text: "⚠️ Issue Yellow Card: Maneuver was thrilling but violated safety altitude buffers (+50 Rep)", rep: 50, toast: "You maintained strict drone safety discipline!" },
        { text: "🏆 Award Bonus Tech Points: Telemetry confirms autopilot maintained 3x safety margins (+60 Rep)", rep: 60, toast: "You rewarded advanced autonomous flight control!" }
      ]
    },
    verdict_general: {
      title: "⚖️ CelesteCon General Competition Dispute",
      desc: "An aerospace team exceeded their 7-minute pitch presentation by 45 seconds, claiming technical audiovisual difficulties.",
      options: [
        { text: "⏳ Deduct 5 Points: Strict adherence to mission timelines is essential (+50 Rep)", rep: 50, toast: "You enforced professional timeline rigor!" },
        { text: "🤝 Waive Penalty: Technical AV delays were outside student control (+50 Rep)", rep: 50, toast: "You demonstrated gracious sporting equity!" }
      ]
    }
  };

  const v = verdicts[verdictKey] || verdicts.verdict_general;
  if (descEl) descEl.textContent = v.desc;
  optionsWrap.innerHTML = '';

  v.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'glow-btn small-btn';
    btn.style.margin = '6px 0';
    btn.style.width = '100%';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      addRepPoints(opt.rep || 50);
      modal.classList.add('hidden');
      showToast(opt.toast || "Verdict recorded officially in the tournament ledger!", "success");
    });
    optionsWrap.appendChild(btn);
  });

  const minigameBtn = document.createElement('button');
  minigameBtn.className = 'glow-btn small-btn';
  minigameBtn.style.background = 'linear-gradient(135deg, #00f0ff, #0080ff)';
  minigameBtn.style.color = '#000';
  minigameBtn.style.marginTop = '15px';
  minigameBtn.style.width = '100%';
  minigameBtn.style.fontWeight = '800';
  minigameBtn.textContent = '🏗️ Launch CubeStack: Cleanroom Structural Verification Minigame';
  minigameBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    openMinigame('cubestack');
  });
  optionsWrap.appendChild(minigameBtn);

  modal.classList.remove('hidden');
}

function openOrganizerModal(crisisKey) {
  const modal = document.getElementById('organizer-modal');
  const descEl = document.getElementById('organizer-crisis-desc');
  const optionsWrap = document.getElementById('organizer-crisis-options');
  if (!modal || !optionsWrap) return;

  const crises = {
    crisis_pitch: {
      desc: "VIP Guest Judges are stuck at campus security due to unprinted QR badges while the startup founders are waiting on stage!",
      options: [
        { text: "🚨 Dispatch Volunteer Golf Cart & Issue Digital By-pass (+75 Rep)", rep: 75, toast: "VIPs escorted successfully to the boardroom!" },
        { text: "🎤 Delay Stage Pitch by 10 Mins & Play ISRO Launch Reel (+50 Rep)", rep: 50, toast: "Audience entertained while VIPs arrive!" }
      ]
    },
    crisis_general: {
      desc: "High-voltage power surge tripped the circuit breaker in the Main Aerospace Exhibition Hall!",
      options: [
        { text: "⚡ Switch to Auxiliary Generator & Reroute Feeders (+75 Rep)", rep: 75, toast: "Power restored in 45 seconds flat!" },
        { text: "📢 Announce Emergency Acoustic Tech Discussion (+50 Rep)", rep: 50, toast: "Crowd stays calm and engaged during reset!" }
      ]
    }
  };

  const c = crises[crisisKey] || crises.crisis_general;
  if (descEl) descEl.textContent = c.desc;
  optionsWrap.innerHTML = '';

  c.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'glow-btn small-btn';
    btn.style.margin = '6px 0';
    btn.style.width = '100%';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      addRepPoints(opt.rep || 50);
      modal.classList.add('hidden');
      showToast(opt.toast || "Crisis averted smoothly! Great event management!", "success");
    });
    optionsWrap.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

function initJudgeAndOrganizerModals() {
  const judgeClose = document.getElementById('judge-close-btn');
  const orgClose = document.getElementById('organizer-close-btn');
  const judgeModal = document.getElementById('judge-modal');
  const orgModal = document.getElementById('organizer-modal');

  if (judgeClose && judgeModal) judgeClose.addEventListener('click', () => judgeModal.classList.add('hidden'));
  if (orgClose && orgModal) orgClose.addEventListener('click', () => orgModal.classList.add('hidden'));

  const btnCubestack = document.getElementById('btn-launch-cubestack');
  if (btnCubestack) {
    btnCubestack.addEventListener('click', () => {
      if (judgeModal) judgeModal.classList.add('hidden');
      openMinigame('cubestack');
    });
  }

  const btnCrowd = document.getElementById('btn-launch-crowd');
  if (btnCrowd) {
    btnCrowd.addEventListener('click', () => {
      if (orgModal) orgModal.classList.add('hidden');
      openMinigame('crowd_control');
    });
  }

  const btnScavenger = document.getElementById('btn-launch-scavenger');
  if (btnScavenger) {
    btnScavenger.addEventListener('click', () => {
      if (orgModal) orgModal.classList.add('hidden');
      openMinigame('scavenger');
    });
  }
}

function initNarratorWidget() {
  const box = document.getElementById('narrator-box');
  const textEl = document.getElementById('narrator-text');
  const closeBtn = document.getElementById('narrator-close-btn');

  if (closeBtn && box) {
    closeBtn.addEventListener('click', () => {
      box.classList.add('hidden');
    });
  }

  window.triggerNarratorComment = function(msg) {
    if (!box || !textEl) return;
    textEl.textContent = msg;
    box.classList.remove('hidden');
  };
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
  initJudgeAndOrganizerModals();
  initNarratorWidget();
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

