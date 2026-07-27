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
  isMenuOpen: false,
  controlsHintTimer: null,
  mode: null,              // 'story' | 'freestyle'
  celestialKeys: new Set(),
  spaceDunkScore: 0,
  paperPlaneScore: 0,
  aiBotEncounterActive: false,
  aiBotTimeRemaining: 90,
  aiBotTimerId: null,
  aiBotUsedForQuestion: new Set(),
  freestyleHighScores: {},
};
if (typeof window !== 'undefined') window.GameState = GameState;

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
      { text: "⚖️ [Judge] Team Conflict: Investigate CAD simulation plagiarism accusation", role: "Judge", action: "judge_verdict", verdictKey: "verdict_conflict" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Verify & Stack Divyam's CubeSat Modules!", role: "Judge", action: "minigame_cubestack" },
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "⚖️ [Judge] Rule-Breaker Debate: Decide on project submitted 5 mins late", role: "Judge", action: "judge_verdict", verdictKey: "verdict_rulebreaker" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
      { text: "See you at the flight line!", action: "close" }
    ]
  },
  npc_host: {
    name: "Auditorium Stage Host",
    avatar: "🎤",
    text: "Welcome to the Main Auditorium! Up next on stage: AEROSS Theatre comedy skit followed by the Dimension III 3D CAD showcases!",
    choices: [
      { text: "⚖️ [Judge] Popularity vs Merit: Balance audience applause with technical rigor", role: "Judge", action: "judge_verdict", verdictKey: "verdict_popularity" },
      { text: "🚨 [Organizer] Power Outage Panic: Auditorium Lights Out!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_power" },
      { text: "🚨 [Organizer] Double Booking Disaster: Main Stage Scheduling Clash!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_doublebook" },
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
      { text: "🚨 [Organizer] Double Booking Disaster: Resolve main stage schedule clash!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_doublebook" },
      { text: "🚧 [Organizer Challenge] Play Crowd Control: Barricade and Manage Student Flow!", role: "Organizer", action: "minigame_crowd" },
      { text: "🔍 [Organizer Challenge] Play Scavenger Hunt: Find Missing Equipment and VIPs!", role: "Organizer", action: "minigame_scavenger" },
      { text: "🚀 [Participant] I'm ready to present my Business Power Pitch!", role: "Participant", action: "say", resp: "Awesome! Step up to the Power Pitch booth right here in the room and show us your space tech startup roadmap." },
      { text: "⚖️ [Judge] I have finalized the evaluation scores for the top teams.", role: "Judge", action: "say", resp: "Thank you for your integrity and hard work. Let's get ready for the prize distribution!" },
      { text: "⚖️ [Judge Challenge] Play CubeStack: Cleanroom Stacking Inspection!", role: "Judge", action: "minigame_cubestack" },
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
      { text: "🧠 [Judge Challenge] Play Bias Buster: Score Calibration & Bias Elimination!", role: "Judge", action: "minigame_bias" },
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
  },
  npc_ai_bot: {
    name: "AEROSS AI Science & Aerospace Helper Bot",
    avatar: "🤖",
    text: "BEEP BOOP! I am the AEROSS AI Science Helper Bot! As the cosmic rift destabilizes, I am analyzing telemetry data and AEROSS Journal entries. How can I assist your aerospace defense?",
    choices: [
      { text: "🤖 Open AI Science Knowledge Base & Ask Technical Question", action: "open_ai_bot" },
      { text: "🚨 Start 90-Second Emergency Bot Search Challenge! (+250 Celeste)", action: "start_ai_timer" },
      { text: "Goodbye, AI!", action: "close" }
    ]
  },
  portal_black_hole_gateway: {
    name: "🌌 Campus Portal: Celestial Rift Gateway",
    avatar: "🌀",
    text: "An ominous cosmic hum vibrates from this sealed gateway! Hidden messages in the AEROSS Journal reveal an ancient alien artifact accidentally triggered during a past CelesteCon. Only those with 3 Celestial Keys can enter the Black Hole Gateway to power the cosmic device and seal the rift!",
    choices: [
      { text: "🌀 [Enter Rift] Travel to Black Hole Gateway (Requires 3 Keys)", action: "teleport", targetZone: "black_hole_gateway" },
      { text: "Stay here and defend campus zones", action: "close" }
    ]
  },
  rift_gate: {
    name: "🌌 The Black Hole Singularity & Cosmic Device",
    avatar: "🌀",
    text: "You stand before the pulsing Black Hole Gateway! As the rift destabilizes, strange space creatures called Nebulons swarm around you, while a rival faction attempts to harness the rift's energy for their own gain! What is your ultimate strategy for the fate of CelesteCon?",
    choices: [
      { text: "🏀 [Cosmic Savior] Play Space Dunk into the black hole to power up the cosmic device & close the rift!", action: "minigame_space_dunk", endingKey: "savior" },
      { text: "✈️ [Aerodynamic Assault] Launch Paper Plane Rush to intercept Nebulons in mid-flight!", action: "minigame_paper_plane", endingKey: "pioneer" },
      { text: "💥 [Rival Showdown] Confront the rival faction leader in an epic aerospace debate & arcade duel!", action: "climax_ending", endingKey: "nebulon" },
      { text: "Step back to prepare", action: "close" }
    ]
  },
  booth_spacedunk: {
    name: "Space Dunk Arena — Zero-G Vortex Challenge",
    avatar: "🏀",
    text: "Here at the edge of the singularity, gravity curves trajectories in wild ways! Master the zero-G slam dunk to generate cosmic energy.",
    choices: [
      { text: "🏀 [Participant] Launch orbital probes into the vortex hoop!", role: "Participant", action: "minigame_space_dunk" },
      { text: "⚖️ [Judge] Certify orbital trajectory calculations and physics compliance", role: "Judge", action: "judge_verdict", verdictKey: "verdict_quizzitch" },
      { text: "🚨 [Organizer] Stabilize the gravity containment field around the arena!", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_cubesat" },
      { text: "Leave booth", action: "close" }
    ]
  },
  booth_paperplane: {
    name: "Paper Plane Rush — Aerodynamic Flight Challenge",
    avatar: "✈️",
    text: "Test your aerodynamic instincts! Glide through campus wind tunnels, collect rings, and evade turbulence.",
    choices: [
      { text: "✈️ [Participant] Pilot the high-speed AEROSS paper plane!", role: "Participant", action: "minigame_paper_plane" },
      { text: "⚖️ [Judge] Evaluate lift-to-drag ratios and wing geometry", role: "Judge", action: "judge_verdict", verdictKey: "verdict_volatus" },
      { text: "🚨 [Organizer] Clear ventilation obstructions and deploy safety mats", role: "Organizer", action: "organizer_crisis", crisisKey: "crisis_volatus" },
      { text: "Leave booth", action: "close" }
    ]
  }
};

// --- STAGE 1: LOADING SCREEN ---
function initLoadingScreen() {
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
      switchScreen('MODE_SELECT');
    });
  }
}

// --- STAGE 1.5: MODE SELECTION ---
function initModeSelect() {
  const cards = document.querySelectorAll('.mode-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.getAttribute('data-mode');
      GameState.mode = mode;
      if (mode === 'story') {
        switchScreen('ROLE_SELECT');
      } else if (mode === 'freestyle') {
        GameState.role = 'Participant';
        GameState.character = CHARACTERS.Siddharth;
        switchScreen('FREESTYLE_HUB');
        if (typeof updateFreestyleScoreUI === 'function') updateFreestyleScoreUI();
      }
    });
  });
}

// --- STAGE 1.8: FREE STYLE HUB & ARCHIVE ---
const ARCHIVE_ARTICLES = [
  {
    title: "🚀 The Founding of AEROSS (2018)",
    date: "October 12, 2018",
    body: "AEROSS (Aerospace Society of DPS R.K. Puram) was established by a passionate group of student engineers and astronomers. Their mission: to bring rocket propulsion, orbital mechanics, and aerial robotics out of textbooks and into hands-on campus projects."
  },
  {
    title: "🛰️ Project Vyom — The First Campus CubeSat",
    date: "August 24, 2021",
    body: "In collaboration with student research mentors, AEROSS designed 'Vyom-1', a 1U CubeSat payload designed for atmospheric telemetry and aerosol monitoring in the stratosphere. The cleanroom assembly protocols developed during this project formed the foundation for the CelesteCon CubeSat Builder challenge."
  },
  {
    title: "✈️ Volatus — The Aerial Dynamics Revolution",
    date: "November 15, 2023",
    body: "Volatus became the club's signature UAV engineering challenge. Teams construct fixed-wing aircraft and quadcopters capable of autonomous obstacle navigation and precision payload delivery. Aerodynamic stability and thrust-to-weight ratios are rigorously evaluated by expert student judges."
  },
  {
    title: "🌌 The CelesteCon Symposium Legacy",
    date: "Present Day (2026)",
    body: "CelesteCon stands as India's premier high school aerospace symposium. Bringing together debaters, quiz geniuses, CAD designers, and drone pilots, it celebrates the intersection of space technology, creativity, and leadership. Under the guidance of Mrs. Vibha Arora and Mr. Sanchit Chauhan, the festival continues to reach for the stars."
  }
];

function initFreestyleHub() {
  const backBtn = document.getElementById('hub-back-mode-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      switchScreen('MODE_SELECT');
    };
  }
  updateFreestyleScoreUI();

  const tiles = document.querySelectorAll('.hub-tile');
  tiles.forEach(tile => {
    tile.onclick = () => {
      const gameType = tile.getAttribute('data-game');
      if (gameType === 'archive') {
        openArchiveModal();
      } else if (gameType) {
        openMinigame(gameType);
      }
    };
  });
}

function updateFreestyleScoreUI() {
  try {
    const saved = localStorage.getItem('celestecon_freestyle_scores');
    if (saved) {
      GameState.freestyleHighScores = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read freestyle scores:', e);
  }
  const scores = GameState.freestyleHighScores || {};
  ['cubesat', 'paper_plane', 'space_dunk', 'cubestack', 'bias_buster'].forEach(g => {
    const el = document.getElementById(`hub-score-${g}`);
    if (el) el.textContent = scores[g] || 0;
  });
}
window.updateFreestyleScoreUI = updateFreestyleScoreUI;

function initArchiveModal() {
  const closeBtn = document.getElementById('archive-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      const modal = document.getElementById('archive-modal');
      if (modal) modal.classList.add('hidden');
    };
  }
}

function openArchiveModal() {
  const modal = document.getElementById('archive-modal');
  const listEl = document.getElementById('archive-articles-list');
  if (!modal || !listEl) return;
  listEl.innerHTML = '';
  ARCHIVE_ARTICLES.forEach(art => {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 2rem; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 1.5rem;';
    div.innerHTML = `
      <h4 style="color: var(--gold); font-size: 1.2rem; margin-bottom: 0.3rem;">${art.title}</h4>
      <small style="color: var(--cyan); font-family: 'JetBrains Mono', monospace; display: block; margin-bottom: 0.8rem;">${art.date}</small>
      <p style="color: #d1cae5; line-height: 1.6; font-size: 0.95rem;">${art.body}</p>
    `;
    listEl.appendChild(div);
  });
  modal.classList.remove('hidden');
}
window.openArchiveModal = openArchiveModal;

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
const ZONE_HUD_DETAILS = {
  celestecon_amphitheater: {
    name: 'OAT Amphitheater',
    objective: 'Meet the event hosts and explore the challenge booths',
  },
  auditorium_demo: {
    name: 'Main Auditorium',
    objective: 'Check the stage, theatre, and presentation challenges',
  },
  management_room_demo: {
    name: 'Management HQ',
    objective: 'Review operations and help resolve live event issues',
  },
  black_hole_gateway: {
    name: 'Celestial Rift Gateway',
    objective: 'Collect three Celestial Keys to stabilize the rift',
  },
};

function updateGameplayHud(zoneKey) {
  const detail = ZONE_HUD_DETAILS[zoneKey] || {
    name: 'Campus Sector',
    objective: 'Explore the CelesteCon campus',
  };
  const zoneName = document.getElementById('hud-zone-name');
  const objective = document.getElementById('hud-objective-text');
  if (zoneName) zoneName.textContent = detail.name;
  if (objective) objective.textContent = detail.objective;
}

function setGameplayMenuOpen(open) {
  const hud = document.getElementById('game-hud');
  const button = document.getElementById('pause-menu-btn');
  const travelMenu = document.getElementById('hud-travel-menu');
  GameState.isMenuOpen = Boolean(open);
  if (GameState.isMenuOpen) GameState.keys = {};
  if (hud) hud.classList.toggle('menu-open', GameState.isMenuOpen);
  if (button) button.setAttribute('aria-expanded', String(GameState.isMenuOpen));
  if (travelMenu) travelMenu.setAttribute('aria-hidden', String(!GameState.isMenuOpen));
}

function showControlsHint() {
  const hint = document.getElementById('controls-hint');
  if (!hint) return;
  hint.classList.remove('is-dismissed');
  if (GameState.controlsHintTimer) window.clearTimeout(GameState.controlsHintTimer);
  GameState.controlsHintTimer = window.setTimeout(() => {
    hint.classList.add('is-dismissed');
  }, 6500);
}

function init3DWorld(zoneKey) {
  GameState.currentZone = zoneKey;
  const container = document.getElementById('rpg-viewport');
  const layout = SCENES[zoneKey];
  if (!container || !layout) return;

  if (GameState.sceneData && typeof GameState.sceneData.dispose === 'function') {
    GameState.sceneData.dispose();
  }
  setGameplayMenuOpen(false);
  showControlsHint();

  // Update HUD
  if (GameState.character) {
    document.getElementById('hud-avatar').textContent = GameState.character.emoji;
    document.getElementById('hud-char-name').textContent = GameState.character.name;
    document.getElementById('hud-role-name').textContent = GameState.role;
  }
  document.getElementById('campus-zone-select').value = zoneKey;
  updateGameplayHud(zoneKey);
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
  GameState.playerRot = Math.PI;
  GameState.playerGroup.position.set(0, 0, 4);
  GameState.playerGroup.rotation.y = Math.PI;
  scene.add(GameState.playerGroup);

  refreshScavengerVisibility();

  // Add 3D Teleport Portals to other zones
  const portalZonesMap = {
    celestecon_amphitheater: [
      { key: 'auditorium_demo', name: '🎭 Portal: Main Auditorium', x: -10, z: 1, color: 0x7fa7c9 },
      { key: 'management_room_demo', name: '👔 Portal: Management HQ', x: 10, z: 1, color: 0x8fb996 },
      { key: 'black_hole_gateway', name: '🌌 Portal: Celestial Rift Gateway (3 Keys Req.)', x: -10, z: -5, color: 0xff007b }
    ],
    auditorium_demo: [
      { key: 'celestecon_amphitheater', name: '🏛️ Portal: OAT Amphitheater', x: -9, z: 2, color: 0xffd166 },
      { key: 'management_room_demo', name: '👔 Portal: Management HQ', x: 9, z: 2, color: 0x8fb996 },
      { key: 'black_hole_gateway', name: '🌌 Portal: Celestial Rift Gateway (3 Keys Req.)', x: -9, z: -5, color: 0xff007b }
    ],
    management_room_demo: [
      { key: 'celestecon_amphitheater', name: '🏛️ Portal: OAT Amphitheater', x: -5.5, z: 1.5, color: 0xffd166 },
      { key: 'auditorium_demo', name: '🎭 Portal: Main Auditorium', x: 5.5, z: 1.5, color: 0x7fa7c9 },
      { key: 'black_hole_gateway', name: '🌌 Portal: Celestial Rift Gateway (3 Keys Req.)', x: -5.5, z: -3.5, color: 0xff007b }
    ],
    black_hole_gateway: [
      { key: 'celestecon_amphitheater', name: '🏛️ Portal: OAT Amphitheater', x: -6.5, z: 2.5, color: 0xffd166 },
      { key: 'auditorium_demo', name: '🎭 Portal: Main Auditorium', x: 6.5, z: 2.5, color: 0x7fa7c9 },
      { key: 'management_room_demo', name: '👔 Portal: Management HQ', x: 6.5, z: -2.5, color: 0x8fb996 }
    ]
  };
  const portalZones = portalZonesMap[zoneKey] || [];
  portalZones.forEach(pz => {
    const portalGroup = Kit.eventBooth(2.2, 1.5, 2.4, 0x141b33, pz.color, { text: pz.name });
    portalGroup.position.set(pz.x, 0, pz.z);
    portalGroup.userData = { id: `portal_${pz.key}`, interactName: pz.name, dialogueKey: `portal_${pz.key}`, type: 'portal' };
    scene.add(portalGroup);
    if (GameState.interactables) GameState.interactables.push(portalGroup);
  });

  // Exploration is deliberately direct-control: movement belongs to WASD /
  // arrow keys and interactions use E. This prevents the world from reading
  // like a click-to-navigate webpage.
  container.onpointerdown = null;
  GameState.targetMove = null;
}

function initGameplayControls() {
  const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
  const isTextInput = (target) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

  const closeGuide = () => {
    const bubble = document.getElementById('narrator-bubble');
    const toggle = document.getElementById('narrator-toggle');
    if (!bubble || bubble.classList.contains('hidden')) return false;
    bubble.classList.add('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    return true;
  };

  // Game-first controls: direct movement, explicit interact, predictable menu
  // behavior, and number-key dialogue choices. Mouse remains available for
  // ordinary UI controls but is no longer required to explore.
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const inGameplay = GameState.screen === 'GAMEPLAY';
    if (!inGameplay || isTextInput(e.target)) return;

    if (movementKeys.has(key)) {
      e.preventDefault();
      if (!GameState.isDialogueOpen && !GameState.isMinigameOpen && !GameState.isMenuOpen) {
        GameState.keys[key] = true;
      }
      return;
    }

    if (GameState.isDialogueOpen) {
      if (key === 'escape') {
        e.preventDefault();
        closeDialogue();
        return;
      }
      const choiceIndex = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
      const choices = document.querySelectorAll('#dialogue-choices .dialogue-btn');
      if (choiceIndex >= 0 && choices[choiceIndex]) {
        e.preventDefault();
        choices[choiceIndex].click();
        return;
      }
      if (key === 'enter' && choices[0]) {
        e.preventDefault();
        choices[0].click();
      }
      return;
    }

    const openModal = document.querySelector('.modal:not(.hidden)');
    if (openModal) {
      if (key === 'escape') {
        e.preventDefault();
        openModal.classList.add('hidden');
        if (GameState.isMinigameOpen) closeMinigame();
      }
      return;
    }

    if (GameState.isMinigameOpen) {
      if (key === 'escape') {
        e.preventDefault();
        closeMinigame();
      }
      return;
    }

    if (e.repeat) return;

    if (key === 'e' && GameState.activeInteractTarget) {
      e.preventDefault();
      interactWithTarget(GameState.activeInteractTarget);
      return;
    }

    if (key === 'm') {
      e.preventDefault();
      setGameplayMenuOpen(!GameState.isMenuOpen);
      return;
    }

    if (key === 'g' && typeof window.toggleNarratorGuide === 'function') {
      e.preventDefault();
      window.toggleNarratorGuide();
      return;
    }

    if (key === 'escape') {
      e.preventDefault();
      if (GameState.isMenuOpen) {
        setGameplayMenuOpen(false);
      } else if (!closeGuide()) {
        setGameplayMenuOpen(true);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (GameState.screen === 'GAMEPLAY' && movementKeys.has(key)) {
      e.preventDefault();
      GameState.keys[key] = false;
    }
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

  const menuBtn = document.getElementById('pause-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      setGameplayMenuOpen(!GameState.isMenuOpen);
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

  // Apply Movement with 3D Collision Detection & Wall-Sliding Physics if not in dialogue or minigame
  if ((dx !== 0 || dz !== 0) && !GameState.isDialogueOpen && !GameState.isMinigameOpen && !GameState.isMenuOpen) {
    const nextX = GameState.playerPos.x + dx;
    const nextZ = GameState.playerPos.z + dz;

    const checkCollision = (nx, nz) => {
      // Zone-specific map bounds
      if (GameState.currentZone === 'management_room_demo') {
        if (nx < -6.5 || nx > 6.5 || nz < -5.5 || nz > 6.5) return true;
      } else if (GameState.currentZone === 'black_hole_gateway') {
        if (nx < -7.5 || nx > 7.5 || nz < -7.5 || nz > 7.5) return true;
      } else {
        if (nx < -14 || nx > 14 || nz < -14 || nz > 10) return true; // Out of map bounds
      }

      // Zone-specific architectural boundaries (buildings, back-walls, stage columns)
      if (GameState.currentZone === 'celestecon_amphitheater') {
        if (nz < -8.8) return true; // Main HQ building & canopy back-wall
        if (Math.hypot(nx - (-7.5), nz - (-4.5)) < 1.2) return true; // Left canopy pillar
        if (Math.hypot(nx - 7.5, nz - (-4.5)) < 1.2) return true; // Right canopy pillar
      } else if (GameState.currentZone === 'auditorium_demo') {
        if (nz < -15.0 || nx < -11.0 || nx > 11.0) return true; // Auditorium walls & backdrop
      }

      // Proximity collision against scene objects (Event Booths, Portals, NPCs, Tables, Chairs, Plants, Pillars)
      const { scene } = GameState.sceneData;
      if (scene) {
        for (let i = 0; i < scene.children.length; i++) {
          const child = scene.children[i];
          if (child === GameState.playerGroup) continue;
          if (!child.userData) continue;

          // Pass through collectibles so player can walk over to pick them up
          if (child.userData.isEasterEgg || child.userData.isScavengerTarget) continue;

          const objType = child.userData.type || '';
          const objId = child.userData.id || '';

          // Determine solid hitbox radius for each object type
          let colRadius = 0;
          if (objId.startsWith('booth') || objType === 'eventBooth') {
            colRadius = 1.5;
          } else if (objId.startsWith('portal') || objType === 'portal') {
            colRadius = 1.5;
          } else if (objId.startsWith('npc_') || objType === 'person') {
            colRadius = 0.7; // Character body hitbox so you can't walk inside NPCs
          } else if (objType === 'table') {
            colRadius = 1.3;
          } else if (objType === 'chair' || objType === 'plant') {
            colRadius = 0.6;
          } else if (objType === 'pillar' || objType === 'column') {
            colRadius = 0.8;
          } else if (objType === 'blackHole' || objId.startsWith('rift')) {
            colRadius = 2.2;
          }

          if (colRadius > 0) {
            if (Math.hypot(child.position.x - nx, child.position.z - nz) < colRadius) return true;
          }
        }
      }
      return false;
    };

    let moved = false;
    // Attempt diagonal / 2D movement first
    if (!checkCollision(nextX, nextZ)) {
      GameState.playerPos.x = nextX;
      GameState.playerPos.z = nextZ;
      moved = true;
    } else if (dx !== 0 && !checkCollision(nextX, GameState.playerPos.z)) {
      // Wall-slide along X axis
      GameState.playerPos.x = nextX;
      moved = true;
    } else if (dz !== 0 && !checkCollision(GameState.playerPos.x, nextZ)) {
      // Wall-slide along Z axis
      GameState.playerPos.z = nextZ;
      moved = true;
    }

    if (moved) {
      GameState.playerGroup.position.set(GameState.playerPos.x, 0, GameState.playerPos.z);
    }

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
  if (nearestTarget && !GameState.isDialogueOpen && !GameState.isMinigameOpen && !GameState.isMenuOpen) {
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
  window.awardCelestialKey("Secret Relic Discovery");
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

window.awardCelestialKey = function(reason = "Special Achievement") {
  if (!GameState.celestialKeys) GameState.celestialKeys = 0;
  if (GameState.celestialKeys >= 3) return;
  GameState.celestialKeys++;
  const keysEl = document.getElementById('hud-keys');
  if (keysEl) keysEl.textContent = `${GameState.celestialKeys} / 3`;
  
  const toast = document.getElementById('toast-notify');
  if (toast) {
    document.getElementById('toast-title').textContent = `🔑 Celestial Key Earned (${GameState.celestialKeys}/3)!`;
    document.getElementById('toast-msg').textContent = `Unlocked via: ${reason}. Collect 3 keys to enter the Black Hole Gateway!`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 6000);
  }
};

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

window.onMinigameVictory = function(type, rewardCeleste, successMessage, score) {
  console.log(`[CelesteCon] Minigame VICTORY: ${type}, +${rewardCeleste} Celeste, score: ${score}`);
  if (!GameState.certifiedEvents) GameState.certifiedEvents = new Set();
  GameState.certifiedEvents.add(type);

  if (score && typeof score === 'number') {
    if (!GameState.freestyleHighScores) GameState.freestyleHighScores = {};
    GameState.freestyleHighScores[type] = Math.max(GameState.freestyleHighScores[type] || 0, score);
    try {
      localStorage.setItem('celestecon_freestyle_scores', JSON.stringify(GameState.freestyleHighScores));
    } catch (e) {
      console.warn('Could not save freestyle scores:', e);
    }
  }

  addCeleste(rewardCeleste || 200);
  window.awardCelestialKey("Aerospace Challenge Victory");

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
    bias_buster: "🎙️ Jatin: Cognitive Bias eliminated! Official Judge Scoring Calibration certified for fair tournament grading!",
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
  validChoices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    btn.dataset.shortcut = String(index + 1);
    btn.setAttribute('aria-label', 'Option ' + (index + 1) + ': ' + choice.text);
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
    btn.dataset.shortcut = '1';
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
    btn.dataset.shortcut = '1';
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
  } else if (choice.action === 'minigame_bias' || choice.action === 'judge_bias') {
    closeDialogue();
    openMinigame('bias_buster');
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
    if (choice.targetZone === 'black_hole_gateway' && (GameState.celestialKeys || 0) < 3) {
      document.getElementById('dialogue-text').textContent = `⚠️ Access Denied! The Celestial Rift Gateway is locked by powerful cosmic instability. You must collect 3 Celestial Keys (${GameState.celestialKeys || 0}/3) by winning challenges, finding relics, or solving crises to enter!`;
      const choicesContainer = document.getElementById('dialogue-choices');
      choicesContainer.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'dialogue-btn';
      btn.dataset.shortcut = '1';
      btn.textContent = 'I will collect the keys!';
      btn.addEventListener('click', closeDialogue);
      choicesContainer.appendChild(btn);
      return;
    }
    closeDialogue();
    if (choice.targetZone) init3DWorld(choice.targetZone);
  } else if (choice.action === 'finale') {
    closeDialogue();
    openFinaleModal();
  } else if (choice.action === 'minigame_space_dunk') {
    closeDialogue();
    openMinigame('space_dunk');
  } else if (choice.action === 'minigame_paper_plane') {
    closeDialogue();
    openMinigame('paper_plane');
  } else if (choice.action === 'climax_ending') {
    closeDialogue();
    if (typeof openClimaxModal === 'function') openClimaxModal(choice.endingKey || 'savior');
  } else if (choice.action === 'open_ai_bot') {
    closeDialogue();
    if (typeof openAIBotModal === 'function') openAIBotModal();
  } else if (choice.action === 'start_ai_timer') {
    closeDialogue();
    if (typeof startAIBotTimerChallenge === 'function') startAIBotTimerChallenge();
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
  } else if (type === 'bias_buster') {
    if (title) title.textContent = '🧠 Bias Buster — Judge Cognitive Bias & Scoring Calibration';
    if (iframe) {
      iframe.src = './minigames/bias_buster/index.html';
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
  } else if (type === 'space_dunk') {
    if (title) title.textContent = '🏀 Space Dunk — Orbital Gravity Vortex Challenge';
    if (iframe) {
      iframe.src = './minigames/space-dunk/index.html';
      iframe.classList.remove('hidden');
    }
    if (builtin) builtin.classList.add('hidden');
  } else if (type === 'paper_plane') {
    if (title) title.textContent = '✈️ Paper Plane Rush — Campus Aerodynamics Challenge';
    if (iframe) {
      iframe.src = './minigames/paper-plane-rush/index.html';
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
  },
  {
    title: "🌟 Participant Puzzle #1: Constellation Riddle",
    q: "I shine in the night sky, guiding travelers with my belt of three. Who am I?",
    options: [
      { text: "Orion", correct: true },
      { text: "Ursa Major", correct: false },
      { text: "Cassiopeia", correct: false }
    ],
    explanation: "Correct! Orion is famous for his belt formed by three bright stars: Alnitak, Alnilam, and Mintaka!"
  },
  {
    title: "🧩 Participant Puzzle #2: Missing Star Logic",
    q: "Five stars form a pentagon. Each connects to two others. One star vanishes—how many connections are lost?",
    options: [
      { text: "2 connections", correct: true },
      { text: "3 connections", correct: false },
      { text: "5 connections", correct: false }
    ],
    explanation: "Correct! Since each star in the pentagon loop is connected to its 2 immediate neighbors, removing one star breaks exactly 2 connections!"
  },
  {
    title: "💡 Participant Puzzle #3: Innovation Riddle",
    q: "I start with an idea, grow with teamwork, and shine brightest when shared. What am I?",
    options: [
      { text: "An Innovation / Aerospace Project", correct: true },
      { text: "A Classified Secret", correct: false },
      { text: "A Solid Rocket Booster", correct: false }
    ],
    explanation: "Correct! Innovation flourishes through collaborative teamwork and open scientific exchange!"
  },
  {
    title: "📐 Participant Puzzle #4: Constellation Math",
    q: "A constellation has 12 stars. If each star connects to 3 others, how many total connections exist?",
    options: [
      { text: "18 total connections", correct: true },
      { text: "36 total connections", correct: false },
      { text: "24 total connections", correct: false }
    ],
    explanation: "Correct! Using the handshake formula: (12 stars × 3 connections each) ÷ 2 = 18 unique connections!"
  },
  {
    title: "✨ Participant Puzzle #5: Celestial Riddle",
    q: "I’m not alive, but I grow. I have no mouth, but I roar. I light up the sky, yet I’m born from collapse.",
    options: [
      { text: "A Star / Supernova", correct: true },
      { text: "A Black Hole", correct: false },
      { text: "An Asteroid Belt", correct: false }
    ],
    explanation: "Correct! Stars form from collapsing gravitational nebulae and ignite with tremendous energy!"
  },
  {
    title: "🔤 Participant Puzzle #6: Word Unscramble",
    q: "Unscramble these letters to reveal the heart of our festival: 'CENLESTE' → ?",
    options: [
      { text: "CELESTE", correct: true },
      { text: "TENACLE", correct: false },
      { text: "ELECTEN", correct: false }
    ],
    explanation: "Correct! CELESTE is our namesake, celebrating the celestial skies and aerospace exploration!"
  },
  {
    title: "🌌 Participant Puzzle #7: Star Path Navigation",
    q: "You must travel from Star A to Star D. A connects to B, B connects to C, C connects to D. What’s the minimum number of jumps?",
    options: [
      { text: "3 jumps", correct: true },
      { text: "4 jumps", correct: false },
      { text: "2 jumps", correct: false }
    ],
    explanation: "Correct! Jump 1: A→B, Jump 2: B→C, Jump 3: C→D. Exactly 3 interstellar jumps!"
  },
  {
    title: "🏛️ Participant Puzzle #8: Event Lore Riddle",
    q: "I am the heart of CelesteCon, where ideas converge and sparks fly. What am I?",
    options: [
      { text: "The Main Auditorium", correct: true },
      { text: "The Campus Cafeteria", correct: false },
      { text: "The Security Gate", correct: false }
    ],
    explanation: "Correct! The Main Auditorium is the grand stage where keynotes, pitches, and theatre converge!"
  },
  {
    title: "🔢 Participant Puzzle #9: Binary Star Pattern",
    q: "Stars blink in sequence: 2, 4, 8, 16… What’s the next blink count?",
    options: [
      { text: "32 blinks", correct: true },
      { text: "24 blinks", correct: false },
      { text: "64 blinks", correct: false }
    ],
    explanation: "Correct! Each number in the sequence doubles (powers of two: 2^1, 2^2, 2^3, 2^4, 2^5 = 32)!"
  },
  {
    title: "🏹 Participant Puzzle #10: Cosmic Hunter",
    q: "I’m shaped like a hunter, but I’m not alive. I’m drawn with stars, but I’m not on paper.",
    options: [
      { text: "The Orion Constellation", correct: true },
      { text: "The Pegasus Constellation", correct: false },
      { text: "The Andromeda Galaxy", correct: false }
    ],
    explanation: "Correct! Orion the Hunter is one of the most recognizable constellations in the night sky!"
  },
  {
    title: "🪙 Participant Puzzle #11: Token Economics",
    q: "You have 10 Celeste Tokens. You give 3 away, then earn double back. How many now?",
    options: [
      { text: "14 tokens", correct: true },
      { text: "16 tokens", correct: false },
      { text: "13 tokens", correct: false }
    ],
    explanation: "Correct! According to CelesteCon token economics, your balance grows to 14 tokens!"
  },
  {
    title: "⚖️ Participant Puzzle #12: Riddle of Balance",
    q: "I balance chaos and order, judge fairness, and shine with wisdom. Who am I in CelesteCon?",
    options: [
      { text: "An Official Judge", correct: true },
      { text: "An Event Volunteer", correct: false },
      { text: "A Drone Pilot", correct: false }
    ],
    explanation: "Correct! Judges balance competing rubrics and ensure tournament fairness!"
  },
  {
    title: "🌀 Participant Puzzle #13: Fibonacci Stars",
    q: "Stars numbered in a spiral sequence: 1, 1, 2, 3, 5, 8… What’s next?",
    options: [
      { text: "13 (Fibonacci sequence)", correct: true },
      { text: "12", correct: false },
      { text: "15", correct: false }
    ],
    explanation: "Correct! In the Fibonacci sequence, each number is the sum of the two preceding numbers (5 + 8 = 13)!"
  },
  {
    title: "🎙️ Participant Puzzle #14: Voice of CelesteCon",
    q: "Without me, CelesteCon falls into silence. With me, voices rise and ideas spread. What am I?",
    options: [
      { text: "The Microphone / Stage", correct: true },
      { text: "The Entrance Sign", correct: false },
      { text: "The ID Badge", correct: false }
    ],
    explanation: "Correct! The stage microphone amplifies student voices and pitches across campus!"
  },
  {
    title: "🌟 Participant Puzzle #15: The Final Star",
    q: "I’m the star that completes the constellation of knowledge. Without me, the sky is incomplete. What am I?",
    options: [
      { text: "The Participant / Student", correct: true },
      { text: "The Keynote Speaker", correct: false },
      { text: "The Trophy Award", correct: false }
    ],
    explanation: "Correct! You, the participant, are the essential star that makes CelesteCon shine!"
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
  if (typeof updateFreestyleScoreUI === 'function') updateFreestyleScoreUI();
}

// --- JUDGE & ORGANIZER MODAL SYSTEM ---
function openJudgeModal(verdictKey) {
  const modal = document.getElementById('judge-modal');
  const titleEl = document.getElementById('judge-modal-title');
  const disputeTitleEl = document.getElementById('judge-dispute-title');
  const descEl = document.getElementById('judge-dispute-desc');
  const tagEl = document.getElementById('judge-event-tag');
  const optionsWrap = document.getElementById('judge-verdict-options');
  if (!modal || !optionsWrap) return;

  const verdicts = {
    verdict_quizzitch: {
      tag: "Event: Quizzitch (Astrophysics Trivia)",
      title: "🪐 Astrophysics Ambiguity Rule Dispute",
      desc: "In the sudden-death round, Team Nova defined the event horizon using a rotating Kerr black hole metric, while the judges' answer key assumed a static Schwarzschild metric. Should points be awarded?",
      options: [
        { text: "✅ Accept Answer: Advanced Kerr relativity demonstrates superior astrophysical mastery (+150 🪙 Celeste)", rep: 150, toast: "You ruled in favor of advanced theoretical relativity!" },
        { text: "❌ Enforce Answer Key: Tournament fairness requires strict adherence to standardized solutions (+100 🪙 Celeste)", rep: 100, toast: "You upheld strict answer key standardization!" }
      ]
    },
    verdict_debate: {
      tag: "Event: In Pursuit of Dispute (Space Policy Debate)",
      title: "📜 Orbital Debris Treaty Interpretation",
      desc: "During cross-examination, a speaker cited a real-time classified satellite conjunction alert that is not in the public domain. Is citation of non-public orbital data admissible in competition?",
      options: [
        { text: "⚠️ Allow with Warning: Policy realism requires accounting for live space awareness (+150 🪙 Celeste)", rep: 150, toast: "You encouraged real-world space domain awareness!" },
        { text: "🛑 Strike Testimony: Debates must rely exclusively on peer-reviewed public treaties (+100 🪙 Celeste)", rep: 100, toast: "You enforced evidentiary standards in debate!" }
      ]
    },
    verdict_theatre: {
      tag: "Event: Tech Theatre & Cultural Arts",
      title: "🎭 Sci-Fi Pyrotechnics Safety Dispute",
      desc: "A drama troupe utilized cold-spark nitro pyrotechnics during their stage climax to simulate a rocket booster ignition. The stage manager claims this violates campus fire safety protocols.",
      options: [
        { text: "🔥 Approve Effects: Cold-spark tech emits zero thermal heat and is certified safe (+150 🪙 Celeste)", rep: 150, toast: "You approved certified cold-spark tech theatre!" },
        { text: "🧯 Disallow & Deduct 10 Points: Unapproved stage effects risk sensor alarms (+100 🪙 Celeste)", rep: 100, toast: "You enforced strict campus fire safety protocols!" }
      ]
    },
    verdict_dim3: {
      tag: "Event: Dimension III (3D CAD Design)",
      title: "📐 CAD Structural Tolerance Infraction",
      desc: "Team Centauri submitted a 3D printable bracket with 0.2mm wall thickness. Simulation shows it saves 40% weight but fails under 8G launch vibrations. Should design innovation override safety margins?",
      options: [
        { text: "🏆 Award Weight Innovation: Extreme lightweighting is vital for deep space missions (+150 🪙 Celeste)", rep: 150, toast: "You rewarded structural lightweighting innovation!" },
        { text: "🛡️ Require Reinforcement: Structural integrity under max-Q loads is non-negotiable (+100 🪙 Celeste)", rep: 100, toast: "You prioritized launch load structural safety!" }
      ]
    },
    verdict_settle: {
      tag: "Event: Settle-Me-This (Martian Colony)",
      title: "🔴 Martian Micro-Reactor Radiator Dispute",
      desc: "A Martian habitat blueprint places nuclear heat radiators directly above the hydroponic agricultural domes to save piping mass, risking radiation scatter to crops.",
      options: [
        { text: "🌱 Order Blueprint Revision: Agricultural shielding takes priority over mass savings (+150 🪙 Celeste)", rep: 150, toast: "You safeguarded Martian agricultural life support!" },
        { text: "⚡ Approve Mass Optimization: Calculated shielding dosage is within limits (+100 🪙 Celeste)", rep: 100, toast: "You approved mass-optimized thermal design!" }
      ]
    },
    verdict_pitch: {
      tag: "Event: Power Pitch (Aerospace Startup)",
      title: "💼 Venture ROI vs. Tech Feasibility",
      desc: "An asteroid mining startup claims $50 billion projected revenue by 2030 but lacks an orbital propulsion demonstration prototype. How should judges weigh financial projections against TRL?",
      options: [
        { text: "🚀 Prioritize TRL Score: Hardware prototypes trump theoretical spreadsheet valuation (+150 🪙 Celeste)", rep: 150, toast: "You emphasized physical engineering hardware validation!" },
        { text: "📈 Reward Vision & Market Size: Early-stage venture capital rewards bold market disruption (+100 🪙 Celeste)", rep: 100, toast: "You rewarded bold commercial aerospace vision!" }
      ]
    },
    verdict_cubesat: {
      tag: "Event: CubeSat Builder",
      title: "🛰️ CubeSat Hardware Legality Dispute",
      desc: "Team Divyam used an unverified high-gain S-band transceiver from a commercial off-the-shelf drone. Is this allowable under CelesteCon Division rules?",
      options: [
        { text: "✅ Rule Allowable: COTS components encourage rapid prototyping (+150 🪙 Celeste)", rep: 150, toast: "You ruled in favor of open hardware innovation!" },
        { text: "❌ Rule Violation: All RF modules must undergo pre-event chamber certification (+100 🪙 Celeste)", rep: 100, toast: "You upheld strict aerospace RF safety compliance!" }
      ]
    },
    verdict_volatus: {
      tag: "Event: Volatus UAV Arena",
      title: "✈️ Volatus Drone Flight Envelope Dispute",
      desc: "A quadrotor team performed a high-G split-S maneuver 2 meters above the spectator net. Does this exceed campus indoor flight safety envelopes?",
      options: [
        { text: "🏆 Award Bonus Tech Points: Telemetry confirms autopilot maintained 3x safety margins (+150 🪙 Celeste)", rep: 150, toast: "You rewarded advanced autonomous flight control!" },
        { text: "⚠️ Issue Yellow Card: Maneuver was thrilling but violated safety altitude buffers (+100 🪙 Celeste)", rep: 100, toast: "You maintained strict drone safety discipline!" }
      ]
    },
    verdict_rulebreaker: {
      tag: "Event: Project Deadline Dispute",
      title: "⏳ Rule-Breaker Debate: 5-Minute Late Submission",
      desc: "A participant submits an amazing aerospace project with breakthrough propulsion concepts, but missed the official deadline by 5 minutes due to compiling errors. How do judges rule?",
      options: [
        { text: "🛡️ Strict Penalty: Reject submission to uphold 100% tournament fairness (+100 🪙 Celeste)", rep: 100, toast: "You enforced strict tournament rules and fairness!" },
        { text: "⚠️ Partial Credit: Accept with a 15% late deduction to reward innovation (+150 🪙 Celeste)", rep: 150, toast: "You balanced fairness with innovation via partial credit!" },
        { text: "🌟 Full Acceptance: Grant full entry since 5 minutes did not alter project quality (+200 🪙 Celeste)", rep: 200, toast: "You prioritized breakthrough scientific merit over bureaucracy!" }
      ]
    },
    verdict_conflict: {
      tag: "Event: Team Ethics & Integrity",
      title: "🔍 Team Conflict: Plagiarism Accusation",
      desc: "Two teams accuse each other of copying their CAD aerodynamic simulation code. NPC witnesses present conflicting git commit timestamps and design logs.",
      options: [
        { text: "🕵️ Deep Investigation: Audit commit logs and question NPC witnesses (+150 🪙 Celeste)", rep: 150, toast: "Your thorough audit uncovered the true original author!" },
        { text: "🤝 Joint Attribution: Mandate a collaborative merger of both teams' submissions (+100 🪙 Celeste)", rep: 100, toast: "You mediated a collaborative merger between rival teams!" }
      ]
    },
    verdict_popularity: {
      tag: "Event: Audience Showcase & Grading",
      title: "👏 Popularity vs Merit: Crowd Favorite vs Technical Rigor",
      desc: "A crowd-favorite project with flashy LED displays gets huge applause from students, but scores low on technical innovation and mathematical rigor on the rubric.",
      options: [
        { text: "🔬 Uphold Criteria: Score strictly by technical rigor and scientific merit (+150 🪙 Celeste)", rep: 150, toast: "You upheld scientific excellence and grading rubrics!" },
        { text: "🎉 People's Choice Award: Create a special Audience Favorite award (+200 🪙 Celeste)", rep: 200, toast: "You satisfied the crowd while preserving technical standards!" }
      ]
    },
    verdict_general: {
      tag: "Event: CelesteCon General Competition",
      title: "⚖️ CelesteCon General Competition Dispute",
      desc: "An aerospace team exceeded their 7-minute pitch presentation by 45 seconds, claiming technical audiovisual difficulties with the auditorium projector.",
      options: [
        { text: "🤝 Waive Penalty: Technical AV delays were outside student control (+150 🪙 Celeste)", rep: 150, toast: "You demonstrated gracious sporting equity!" },
        { text: "⏳ Deduct 5 Points: Strict adherence to mission timelines is essential (+100 🪙 Celeste)", rep: 100, toast: "You enforced professional timeline rigor!" }
      ]
    }
  };

  const v = verdicts[verdictKey] || verdicts.verdict_general;
  if (tagEl) tagEl.textContent = v.tag || "Event: CelesteCon Competition";
  if (disputeTitleEl) disputeTitleEl.textContent = v.title || "Official Dispute Ruling";
  if (descEl) descEl.textContent = v.desc || "Review the case parameters below and issue your binding ruling.";
  optionsWrap.innerHTML = '';

  v.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'glow-btn small-btn';
    btn.style.margin = '6px 0';
    btn.style.width = '100%';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      const sysType = (verdictKey || 'general').replace('verdict_', '');
      certifySystem(sysType, opt.rep || 150, opt.toast || "Verdict recorded officially in the tournament ledger!");
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

  const biasBtn = document.createElement('button');
  biasBtn.className = 'glow-btn small-btn';
  biasBtn.style.background = 'linear-gradient(135deg, #ff007f, #9900ff)';
  biasBtn.style.color = '#fff';
  biasBtn.style.marginTop = '10px';
  biasBtn.style.width = '100%';
  biasBtn.style.fontWeight = '800';
  biasBtn.textContent = '🧠 Launch Bias Buster: Cognitive Bias & Scoring Calibration';
  biasBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    openMinigame('bias_buster');
  });
  optionsWrap.appendChild(biasBtn);

  modal.classList.remove('hidden');
}

function openOrganizerModal(crisisKey) {
  const modal = document.getElementById('organizer-modal');
  const tagEl = document.getElementById('organizer-crisis-tag');
  const titleEl = document.getElementById('organizer-crisis-title');
  const descEl = document.getElementById('organizer-crisis-desc');
  const optionsWrap = document.getElementById('organizer-crisis-options');
  if (!modal || !optionsWrap) return;

  const crises = {
    crisis_quizzitch: {
      tag: "Severity: HIGH EMERGENCY (Table 4)",
      title: "⚡ Astrophysics Buzzer Circuit Short",
      desc: "The electronic buzzer system on Table 4 short-circuited during the astrophysics tie-breaker round! Contestants cannot buzz in!",
      options: [
        { text: "🔌 Deploy Wireless Reserve Buzzers & Reset Timer (+150 🪙 Celeste)", rep: 150, toast: "Wireless reserve buzzers online! Match resumed!" },
        { text: "📢 Switch to Manual Hand-Raise & Audio Officiating (+100 🪙 Celeste)", rep: 100, toast: "Manual officiating engaged! Tournament saved!" }
      ]
    },
    crisis_volatus: {
      tag: "Severity: CRITICAL FLIGHT HAZARD",
      title: "🚁 Spectator Netting Anchor Detachment",
      desc: "Spectator drone net in Sector B detached from ceiling anchor during high-speed FPV trials! Spectators are exposed to flying UAVs!",
      options: [
        { text: "🚨 Halt Flights & Deploy Emergency Winch Crew (+150 🪙 Celeste)", rep: 150, toast: "Winch crew secured safety nets in 60 seconds!" },
        { text: "🛡️ Reroute Flight Path Away From Sector B (+100 🪙 Celeste)", rep: 100, toast: "Flight envelope rerouted away from spectators!" }
      ]
    },
    crisis_cubesat: {
      tag: "Severity: CLEANROOM CONTAMINATION",
      title: "🧪 Laminar Flow Hood Filter Failure",
      desc: "Cleanroom laminar flow hood filter failed, blowing particulate dust over unsealed satellite optical sensors during integration!",
      options: [
        { text: "🧪 Deploy Portable HEPA Vacuum & Clean Tents (+150 🪙 Celeste)", rep: 150, toast: "HEPA purge cleaned optical sensors to ISO 5 standards!" },
        { text: "⏳ Pause Assembly for 15-Minute Atmospheric Purge (+100 🪙 Celeste)", rep: 100, toast: "Atmospheric purge cleared cleanroom particulates!" }
      ]
    },
    crisis_sound: {
      tag: "Severity: AUDIOVISUAL BLACKOUT",
      title: "📢 Main Stage Acoustic Feedback Loop",
      desc: "Main stage PA system audio feedback is drowning out the keynote ISRO speaker! 500 audience members cannot hear the presentation!",
      options: [
        { text: "🎛️ Switch to Digital Anti-Feedback EQ & Wireless Mics (+150 🪙 Celeste)", rep: 150, toast: "Digital EQ eliminated feedback instantly!" },
        { text: "📢 Deploy Auxiliary Side-Fill Speakers (+100 🪙 Celeste)", rep: 100, toast: "Side-fill speakers restored stage acoustics!" }
      ]
    },
    crisis_debate: {
      tag: "Severity: LOGISTICAL BOTTLENECK",
      title: "🚧 Debate Hall Aisle Overcapacity",
      desc: "Overcapacity crowd trying to enter the Debate booth is blocking the main aisle, violating campus fire marshal egress rules!",
      options: [
        { text: "🚧 Launch Crowd Control Barricades & Stanchions (+150 🪙 Celeste)", rep: 150, toast: "Stanchions redirected crowd flow smoothly!" },
        { text: "📺 Open Overflow Stream in Auditorium (+100 🪙 Celeste)", rep: 100, toast: "Auditorium overflow stream relieved crowd pressure!" }
      ]
    },
    crisis_theatre: {
      tag: "Severity: TECHNICAL THEATRE FAULT",
      title: "💡 Stage DMX Lighting Controller Crash",
      desc: "Stage lighting console lost DMX signal 5 minutes before curtain rise for the cultural sci-fi performance!",
      options: [
        { text: "💡 Engage Manual Spotlights & Override Controller (+150 🪙 Celeste)", rep: 150, toast: "Manual spotlights saved the cultural performance!" },
        { text: "🌟 Switch to Acoustic Unplugged Lighting Mode (+100 🪙 Celeste)", rep: 100, toast: "Acoustic ambient lighting created intimate stage mood!" }
      ]
    },
    crisis_dim3: {
      tag: "Severity: CAD HARDWARE TRIP",
      title: "⚡ 3D Printer Farm Power Surge",
      desc: "3D Printer farm tripped breaker during a 12-hour continuous endurance print for the aerospace CAD division!",
      options: [
        { text: "⚡ Engage UPS Battery Backup & Reroute Power Feed (+150 🪙 Celeste)", rep: 150, toast: "UPS power restored printing without layer shift!" },
        { text: "🔧 Resume Prints from Saved G-Code Layer (+100 🪙 Celeste)", rep: 100, toast: "G-Code recovery resumed print at exact layer!" }
      ]
    },
    crisis_settle: {
      tag: "Severity: VR SIMULATION ERROR",
      title: "🔴 Martian VR Tracking Loss",
      desc: "VR headsets at Martian Colony booth lost optical tracking calibration just as VIP judges arrived for habitat walkthrough!",
      options: [
        { text: "🥽 Re-center Optical Trackers & Reboot Hub (+150 🪙 Celeste)", rep: 150, toast: "VR calibration restored 6DoF tracking!" },
        { text: "🖥️ Switch to 4K Monitor Flythrough Mode (+100 🪙 Celeste)", rep: 100, toast: "4K flythrough showcased Martian colony flawlessly!" }
      ]
    },
    crisis_pitch: {
      tag: "Severity: VIP PROTOCOL DELAY",
      title: "🚨 VIP Judge Security Bottleneck",
      desc: "VIP Guest Judges are stuck at campus security due to unprinted QR badges while the startup founders are waiting on stage!",
      options: [
        { text: "🚨 Dispatch Volunteer Golf Cart & Issue Digital By-pass (+150 🪙 Celeste)", rep: 150, toast: "VIPs escorted successfully to the boardroom!" },
        { text: "🎤 Delay Stage Pitch by 10 Mins & Play ISRO Launch Reel (+100 🪙 Celeste)", rep: 100, toast: "Audience entertained while VIPs arrive!" }
      ]
    },
    crisis_power: {
      tag: "Severity: AUDITORIUM BLACKOUT",
      title: "⚡ Power Outage Panic: Auditorium Lights Out",
      desc: "Suddenly, the lights in the main auditorium go out right during the keynote speech! The crowd starts to panic in the dark.",
      options: [
        { text: "🔋 Reroute Emergency Feeder: Switch to auxiliary battery backup immediately (+150 🪙 Celeste)", rep: 150, toast: "Auxiliary power rerouted! Stage lights are back on!" },
        { text: "📢 Calm NPC Crowd & Deploy Generators: Use megaphones to reassure attendees (+200 🪙 Celeste)", rep: 200, toast: "Crowd calmed and backup generators brought online!" }
      ]
    },
    crisis_doublebook: {
      tag: "Severity: SCHEDULING CLASH",
      title: "📅 Double Booking Disaster: Main Stage Clash",
      desc: "Two major events—the Volatus UAV Finals and the Power Pitch Boardroom—are scheduled in the auditorium at the exact same time!",
      options: [
        { text: "🏛️ Relocate UAVs to Outdoor Lawn: Move drone arena outside for better acoustics (+150 🪙 Celeste)", rep: 150, toast: "UAV arena relocated smoothly without delaying VIP pitches!" },
        { text: "⏱️ Split-Screen Dual Showcase: Host a synchronized hybrid festival presentation (+200 🪙 Celeste)", rep: 200, toast: "Synchronized dual showcase delighted judges and fans alike!" }
      ]
    },
    crisis_general: {
      tag: "Severity: CAMPUS ELECTRICAL FAULT",
      title: "⚡ Exhibition Hall Circuit Trip",
      desc: "High-voltage power surge tripped the main circuit breaker in the Aerospace Exhibition Hall!",
      options: [
        { text: "⚡ Switch to Auxiliary Generator & Reroute Feeders (+150 🪙 Celeste)", rep: 150, toast: "Power restored in 45 seconds flat!" },
        { text: "📢 Announce Emergency Acoustic Tech Discussion (+100 🪙 Celeste)", rep: 100, toast: "Crowd stays calm and engaged during reset!" }
      ]
    }
  };

  const c = crises[crisisKey] || crises.crisis_general;
  if (tagEl) tagEl.textContent = c.tag || "Severity: CAMPUS EMERGENCY";
  if (titleEl) titleEl.textContent = c.title || "Logistical Crisis Alert";
  if (descEl) descEl.textContent = c.desc || "Immediate organizer intervention required on campus!";
  optionsWrap.innerHTML = '';

  c.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'glow-btn small-btn';
    btn.style.margin = '6px 0';
    btn.style.width = '100%';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      const sysType = (crisisKey || 'general').replace('crisis_', '');
      certifySystem(sysType, opt.rep || 150, opt.toast || "Logistical crisis averted smoothly! Great event management!");
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
  // Correct IDs matching index.html narrator widget
  const bubble = document.getElementById('narrator-bubble');
  const textEl  = document.getElementById('narrator-text');
  const toggle  = document.getElementById('narrator-toggle');
  const minBtn  = document.getElementById('narrator-min-btn');

  const setGuideOpen = (open) => {
    if (!bubble) return;
    bubble.classList.toggle('hidden', !open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  };
  window.toggleNarratorGuide = () => {
    setGuideOpen(!bubble || bubble.classList.contains('hidden'));
  };

  // Toggle open/close by clicking the avatar
  if (toggle && bubble) {
    toggle.addEventListener('click', () => {
      setGuideOpen(bubble.classList.contains('hidden'));
    });
  }
  // Minimise (✕) button closes bubble
  if (minBtn && bubble) {
    minBtn.addEventListener('click', (e) => { e.stopPropagation(); setGuideOpen(false); });
  }

  // Topic buttons
  const TOPICS = {
    about:  '🌟 CelesteCon is the annual aerospace festival by the AEROSS Club of DPS RK Puram! Explore 7 events: Debate, Quiz, Flight Sim, CubeSat Design, UAV, Theatre & 3D Design!',
    events: '🚀 7 Events: Quizzitch (Quiz) • In Pursuit of Dispute (Debate) • Volatus (UAV) • Dimension III (3D Design) • AEROSS Theatre • CubeSat Challenge • Flight Sim!',
    role:   '💡 Organizer: manage crowd & logistics | Participant: compete in events & win Celeste | Judge: audit participants & CubeStack challenges!',
    eggs:   '✨ There are 5 secret Easter Egg Relics hidden across all 3 campus zones! Collect them to unlock power-ups and bonus Celeste currency!'
  };
  document.querySelectorAll('.n-topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.getAttribute('data-topic');
      if (textEl && TOPICS[topic]) {
        textEl.textContent = TOPICS[topic];
        setGuideOpen(true);
      }
    });
  });

  // Allow other parts of the code to trigger narrator messages
  window.triggerNarratorComment = function(msg) {
    if (!textEl) return;
    textEl.textContent = msg;
    setGuideOpen(true);
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
  if (screenName === 'MODE_SELECT') targetId = 'screen-mode-select';
  if (screenName === 'ROLE_SELECT') targetId = 'screen-role-select';
  if (screenName === 'QUESTIONNAIRE') targetId = 'screen-questionnaire';
  if (screenName === 'REVEAL') targetId = 'screen-reveal';
  if (screenName === 'FREESTYLE_HUB') targetId = 'screen-freestyle-hub';
  if (screenName === 'GAMEPLAY') targetId = 'screen-gameplay';

  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.classList.add('active');
}

// ==================== ENGINE INITIALIZATION ====================
function initEngine() {
  if (typeof window !== 'undefined') {
    window.__celesteConEngineStarted = true;
  }
  initLoadingScreen();
  initModeSelect();
  initFreestyleHub();
  initArchiveModal();
  initRoleSelect();
  initQuestionnaire();
  initReveal();
  initGameplayControls();
  initMinigameModal();
  initJudgeAndOrganizerModals();
  initNarratorWidget();
  initInfoModal();
  initFinaleModal();
  initAIBotModal();
}

if (typeof window !== 'undefined') {
  window.__celesteConEngineStarted = true;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
}

// ==================== PHASE 4: CLIMAX & BRANCHING ENDINGS ====================
window.openClimaxModal = function(endingKey = 'savior') {
  GameState.isDialogueOpen = false;
  const diagBox = document.getElementById('dialogue-box');
  if (diagBox) diagBox.classList.add('hidden');

  let title = "", icon = "", text = "", color = "#ffd166";
  if (endingKey === 'savior') {
    title = "🏆 ENDING 1: THE COSMIC SAVIOR";
    icon = "🌟";
    color = "#00ff88";
    text = "With 3 Celestial Keys in hand, you plunge into the Black Hole Challenge and execute a legendary Space Dunk! The cosmic device powers to 100%, stabilizing the gravity anomaly and sealing the rift forever. CelesteCon '26 is saved! AEROSS gains worldwide recognition as Earth's premier aerospace defenders. The school returns to normal just in time for a grand offline celebration filled with food stalls, awards, and triumphant cheers!";
  } else if (endingKey === 'pioneer') {
    title = "🚀 ENDING 2: THE RIFT UNLEASHED";
    icon = "🪐";
    color = "#00f0ff";
    text = "The cosmic energy surge cannot be contained! Instead of collapsing, the rift expands and permanently transforms Delhi Public School R.K. Puram into a magnificent floating space station orbiting a new celestial frontier! AEROSS students become interstellar pioneers, adapting to life and engineering challenges in this breathtaking new cosmic dimension.";
  } else if (endingKey === 'nebulon') {
    title = "👾 ENDING 3: THE DARK NEBULON";
    icon = "☄️";
    color = "#ff007b";
    text = "During the chaotic climax, the rival faction intercepts the energy flow and harnesses the rift's dark power! Swarms of Nebulons take over the campus halls, turning CelesteCon into a zero-gravity battleground. But all is not lost—you and the AEROSS council retreat to the secret underground labs to regroup, upgrade your CubeSats, and prepare for a sequel event to reclaim your world!";
  }

  let climaxModal = document.getElementById('climax-modal');
  if (!climaxModal) {
    climaxModal = document.createElement('div');
    climaxModal.id = 'climax-modal';
    climaxModal.className = 'modal-backdrop';
    climaxModal.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(5,8,20,0.95);z-index:9999;display:flex;justify-content:center;align-items:center;padding:20px;";
    document.body.appendChild(climaxModal);
  }
  climaxModal.innerHTML = `
    <div style="background:linear-gradient(145deg, #10142d, #1a2046);border:2px solid ${color};border-radius:20px;padding:40px;max-width:650px;text-align:center;box-shadow:0 0 50px ${color}44;color:#fff;font-family:'Outfit',sans-serif;">
      <div style="font-size:4.5rem;margin-bottom:16px;filter:drop-shadow(0 0 15px ${color});">${icon}</div>
      <h2 style="font-size:2.2rem;color:${color};margin-bottom:16px;text-transform:uppercase;letter-spacing:2px;">${title}</h2>
      <p style="font-size:1.1rem;line-height:1.7;color:#cbd5e0;margin-bottom:32px;text-align:left;background:rgba(0,0,0,0.3);padding:20px;border-radius:12px;border-left:4px solid ${color};">${text}</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <button onclick="document.getElementById('climax-modal').style.display='none'; switchScreen('FREESTYLE_HUB');" style="background:${color};color:#000;font-weight:800;padding:14px 28px;border-radius:30px;border:none;cursor:pointer;font-size:1.05rem;box-shadow:0 0 20px ${color}66;">🎮 Play Free Style Hub</button>
        <button onclick="document.getElementById('climax-modal').style.display='none'; init3DWorld('celestecon_amphitheater');" style="background:transparent;color:#fff;font-weight:700;padding:14px 28px;border-radius:30px;border:2px solid #fff;cursor:pointer;font-size:1.05rem;">🏛️ Return to Amphitheater</button>
      </div>
    </div>
  `;
  climaxModal.style.display = 'flex';
  if (typeof window.triggerNarratorComment === 'function') {
    window.triggerNarratorComment(`🎉 EPIC CONCLUSION! You unlocked ${title}! Check out the narrative summary on screen.`);
  }
};

// ==================== PHASE 5: AI HELPER BOT & TIMER CHALLENGE ====================
const AI_KNOWLEDGE_BASE = [
  { keywords: ['adcs', 'attitude', 'orientation', 'control', 'pointing'], answer: "🛰️ **ADCS (Attitude Determination and Control System):** In CubeSats and satellites, ADCS stabilizes the orientation and points directional antennas or solar panels accurately using sensors (star trackers, magnetometers) and actuators (reaction wheels, magnetorquers)." },
  { keywords: ['leo', 'meo', 'geo', 'orbit', 'geostationary', 'altitude', 'iss'], answer: "🌐 **Orbital Regimes:**\n• **LEO (Low Earth Orbit):** 160–2,000 km altitude (e.g., ISS, Hubble, Starlink). Rapid orbital periods (~90 mins).\n• **MEO (Medium Earth Orbit):** 2,000–35,786 km (e.g., GPS, Galileo navigation satellites).\n• **GEO (Geostationary Orbit):** ~35,786 km altitude directly over the equator. Satellite orbital period matches Earth's rotation (24 hours), remaining stationary in the sky." },
  { keywords: ['lift', 'drag', 'aerodynamics', 'bernoulli', 'wing', 'plane', 'paper', 'aeromodelling'], answer: "✈️ **Aerodynamics & Flight:** Four forces act on an aircraft: Lift (upward force from wing shape and Bernoulli's principle/Newton's laws), Drag (air resistance pushing back), Thrust (forward propulsion), and Weight (gravity pulling down). A higher Lift-to-Drag (L/D) ratio creates a more efficient glider!" },
  { keywords: ['pid', 'controller', 'drone', 'uav', 'volatus', 'stability', 'quadcopter'], answer: "🚁 **PID Controllers in UAVs:** A Proportional-Integral-Derivative (PID) controller continuously calculates an error value as the difference between a desired flight setpoint and a measured process variable (like tilt angle) and applies a correction to motor RPMS to maintain stable flight." },
  { keywords: ['rift', 'nebulon', 'artifact', 'celestecon', 'story', 'journal', 'aeross', 'origin'], answer: "🌌 **The Celestial Rift & Nebulons:** According to the AEROSS Journal, an ancient alien artifact accidentally triggered during a past CelesteCon caused the cosmic rift! To seal it and stop the Nebulon invasion, you must collect 3 Celestial Keys and execute a Space Dunk at the Black Hole Gateway!" },
  { keywords: ['key', 'keys', 'celestial', 'gateway', 'portal', 'black hole', 'singularity', 'enter'], answer: "🔑 **Celestial Keys & Black Hole Gateway:** You earn Celestial Keys by conquering technical minigames and finding secret glowing Easter egg relics across campus! Collect 3 keys to unlock the portal to the Black Hole Gateway." },
  { keywords: ['quizzitch', 'quiz', 'debate', 'pitch', 'settle', 'event', 'booth', 'compete'], answer: "🏆 **CelesteCon Competitions:** Visit the event booths across the campus! You can participate as a student, organize event logistics, or judge disputes in Quizzitch, Debate, UAV Volatus, Business Power Pitch, and Settle-Me-This space settlement design!" },
  { keywords: ['orion', 'belt of three', 'belt', 'hunter', 'constellation'], answer: "🌌 **Constellation Riddle / Cosmic Hunter Solution:** The constellation with a belt of three guiding stars, shaped like a hunter, is **Orion**! (Stars: Alnitak, Alnilam, and Mintaka)." },
  { keywords: ['pentagon', 'vanishes', 'missing star', 'connections are lost'], answer: "🧩 **Missing Star Logic Solution:** If five stars form a pentagon loop where each connects to 2 others, removing one star breaks exactly **2 connections**!" },
  { keywords: ['innovation riddle', 'shine brightest when shared', 'start with an idea'], answer: "💡 **Innovation Riddle Solution:** You start with an idea, grow with teamwork, and shine brightest when shared: **An Innovation / Aerospace Project**!" },
  { keywords: ['12 stars', 'connects to 3', 'handshake', 'math puzzle', 'total connections'], answer: "📐 **Constellation Math Solution:** If 12 stars each connect to 3 others, there are exactly **18 total connections** (calculated as 12 × 3 ÷ 2)!" },
  { keywords: ['celestial riddle', 'not alive but i grow', 'born from collapse', 'roar'], answer: "✨ **Celestial Riddle Solution:** Born from gravitational collapse, lighting up the sky without a mouth: **A Star / Supernova**!" },
  { keywords: ['cenleste', 'unscramble', 'word puzzle'], answer: "🔤 **Word Unscramble Solution:** Unscrambling 'CENLESTE' gives **CELESTE** — the heart of our CelesteCon festival!" },
  { keywords: ['star a to star d', 'path of stars', 'minimum number of jumps', 'a connects to b'], answer: "🌌 **Star Path Navigation Solution:** Traveling A→B→C→D requires a minimum of exactly **3 jumps**!" },
  { keywords: ['heart of celestecon', 'ideas converge', 'sparks fly', 'event lore'], answer: "🏛️ **Event Lore Solution:** The heart of CelesteCon where ideas converge is **The Main Auditorium**!" },
  { keywords: ['blink', '2, 4, 8, 16', 'pattern puzzle', 'next blink'], answer: "🔢 **Binary Star Pattern Solution:** In the doubling sequence 2, 4, 8, 16..., the next blink count is **32** (powers of two)!" },
  { keywords: ['token', '10 celeste tokens', 'give 3 away', 'earn double back', 'star trade'], answer: "🪙 **Token Economics Solution:** Following CelesteCon token trade logic, you end up with **14 tokens**!" },
  { keywords: ['riddle of balance', 'balance chaos and order', 'judge fairness', 'wisdom'], answer: "⚖️ **Riddle of Balance Solution:** The figure who balances chaos and order and judges fairness with wisdom is **An Official Judge**!" },
  { keywords: ['1, 1, 2, 3, 5, 8', 'sequence puzzle', 'fibonacci', 'spiral'], answer: "🌀 **Fibonacci Sequence Solution:** In the sequence 1, 1, 2, 3, 5, 8..., the next number is **13** (the sum of 5 and 8)!" },
  { keywords: ['without me celestecon falls into silence', 'voices rise', 'lore puzzle', 'microphone'], answer: "🎙️ **Voice of CelesteCon Solution:** What lets voices rise and ideas spread is **The Microphone / Stage**!" },
  { keywords: ['final star', 'completes the constellation of knowledge', 'without me the sky is incomplete'], answer: "🌟 **The Final Star Solution:** The star that completes the constellation of knowledge is **The Participant / Student** (You)!" }
];

function initAIBotModal() {
  const closeBtn = document.getElementById('ai-bot-close-btn');
  const submitBtn = document.getElementById('ai-bot-submit-btn');
  const inputEl = document.getElementById('ai-bot-input');

  if (closeBtn) closeBtn.addEventListener('click', () => {
    const modal = document.getElementById('ai-bot-modal');
    if (modal) modal.classList.add('hidden');
  });

  if (submitBtn && inputEl) {
    const handleQuery = () => {
      const q = inputEl.value.toLowerCase().trim();
      if (!q) return;
      const respArea = document.getElementById('ai-bot-response-area');
      if (!respArea) return;
      
      let found = null;
      for (const item of AI_KNOWLEDGE_BASE) {
        if (item.keywords.some(kw => q.includes(kw))) {
          found = item.answer;
          break;
        }
      }
      if (!found) {
        found = "🤖 **AI Analysis:** I searched my offline AEROSS databanks for your query but didn't find an exact match! Try asking about **ADCS**, **LEO vs GEO orbits**, **Aerodynamics & Lift**, **UAV PID Controllers**, **Celestial Keys**, or **The Celestial Rift**!";
      }
      respArea.innerHTML = found.replace(/\n/g, '<br>');
      respArea.style.display = 'block';
    };
    submitBtn.addEventListener('click', handleQuery);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleQuery();
    });
  }
}

window.openAIBotModal = function() {
  if (GameState.aiSearchActive) {
    GameState.aiSearchActive = false;
    if (aiTimerInterval) clearInterval(aiTimerInterval);
    const timerHud = document.getElementById('ai-bot-timer-hud');
    if (timerHud) timerHud.classList.add('hidden');
    window.onMinigameVictory('ai_search', 250, "You successfully located the AI Helper Bot before the emergency countdown expired!");
  }

  const modal = document.getElementById('ai-bot-modal');
  if (modal) {
    const respArea = document.getElementById('ai-bot-response-area');
    if (respArea) {
      respArea.innerHTML = "🤖 **Ready:** Ask any technical question above to query the offline aerospace knowledge base!";
      respArea.style.display = 'block';
    }
    modal.classList.remove('hidden');
  }
};

let aiTimerInterval = null;
window.startAIBotTimerChallenge = function() {
  if (aiTimerInterval) clearInterval(aiTimerInterval);
  GameState.aiSearchActive = true;
  let timeLeft = 90;
  
  const timerHud = document.getElementById('ai-bot-timer-hud');
  const secEl = document.getElementById('ai-timer-seconds');
  const barFill = document.getElementById('ai-timer-bar-fill');
  
  if (timerHud) timerHud.classList.remove('hidden');
  if (secEl) secEl.textContent = `${timeLeft}s`;
  if (barFill) barFill.style.width = '100%';

  if (typeof window.triggerNarratorComment === 'function') {
    window.triggerNarratorComment("🚨 EMERGENCY AI BOT SEARCH! You have 90 seconds to locate and interact with the AI Helper Bot on campus!");
  }

  aiTimerInterval = setInterval(() => {
    timeLeft--;
    if (secEl) secEl.textContent = `${timeLeft}s`;
    if (barFill) barFill.style.width = `${(timeLeft / 90) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(aiTimerInterval);
      GameState.aiSearchActive = false;
      if (timerHud) timerHud.classList.add('hidden');
      const toast = document.getElementById('toast-notify');
      if (toast) {
        document.getElementById('toast-title').textContent = `⏱️ AI Bot Search Timed Out!`;
        document.getElementById('toast-msg').textContent = `The emergency countdown expired! You can retry at any AI Bot station.`;
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 5000);
      }
    }
  }, 1000);
};

