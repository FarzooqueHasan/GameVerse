/* ==========================================================================
   BIAS BUSTER - GAME ENGINE & INTERACTIVE LOGIC
   ========================================================================== */

// --- SOUND EFFECTS SYNTHESIS (Web Audio API) ---
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    playClick() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playSuccess() {
        if (this.muted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.08);
            osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
        });
    }

    playTrapAlert() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

const audio = new SoundManager();

function toggleAudio() {
    audio.muted = !audio.muted;
    const btn = document.getElementById('btn-sound');
    btn.innerHTML = audio.muted ? '🔇' : '🔊';
}


// --- GAME DATA: 6 PROGRESSIVE ROUNDS ---
const GAME_ROUNDS = [
    {
        id: 1,
        title: "Round 1: The Halo Effect (Visual & Style Trap)",
        category: "LEAD ARCHITECT SELECTION",
        desc: "Evaluate 3 candidates for Senior Software Architect. Mission: Select the highest merit candidate while disregarding physical appearance, designer attire, and groomed headshots.",
        biasTrapName: "Halo Effect (Physical & Visual Aesthetics)",
        biasTrapDesc: "The Halo Effect occurs when an evaluator's impression of a person's physical attractiveness, personal style, or polished headshot improperly inflates their perceived technical competency.",
        candidates: [
            {
                id: "c1_1",
                name: "Julian Vance",
                avatarEmoji: "🕺🏻",
                role: "Senior Software Architect",
                meritScore: 48,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "Speaks with effortless charm, wears bespoke suits, and presents polished keynotes.",
                meritAttributes: [
                    { text: "3 years experience in Python", isMerit: true },
                    { text: "Managed 2 small dev teams", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Voted Most Stylish Tech Leader", isMerit: false },
                    { text: "Ultra-high resolution professional portrait photo", isMerit: false },
                    { text: "Models for GQ Tech magazine", isMerit: false },
                    { text: "Drives a custom luxury electric sports car", isMerit: false }
                ]
            },
            {
                id: "c1_2",
                name: "Dr. Aris Thorne",
                avatarEmoji: "👩🏽‍💻",
                role: "Senior Software Architect",
                meritScore: 96,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Unassuming, plain plain hoodie attire, introverted, focused entirely on high-scale systems architecture.",
                meritAttributes: [
                    { text: "12 years cloud architecture experience", isMerit: true },
                    { text: "Architected system handling 100M daily active users", isMerit: true },
                    { text: "Authored 4 patents in distributed data consensus", isMerit: true },
                    { text: "Reduced infrastructure latency by 45%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Plain monochrome avatar photo", isMerit: false },
                    { text: "Wears oversized hoodies to work", isMerit: false },
                    { text: "No personal branding on social media", isMerit: false }
                ]
            },
            {
                id: "c1_3",
                name: "Marcus Brody",
                avatarEmoji: "👨🏼‍💼",
                role: "Senior Software Architect",
                meritScore: 72,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Solid mid-level candidate with dependable software skills.",
                meritAttributes: [
                    { text: "6 years Full Stack development", isMerit: true },
                    { text: "AWS Certified Solutions Architect", isMerit: true },
                    { text: "Led migration to Kubernetes microservices", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Loves mountain biking", isMerit: false },
                    { text: "Casually dressed in plaid shirts", isMerit: false }
                ]
            }
        ]
    },
    {
        id: 2,
        title: "Round 2: Social Proof & Hype Trap",
        category: "HEAD OF CYBERSECURITY",
        desc: "Evaluate 3 cybersecurity specialists. Mission: Distinguish between actual vulnerability discovery records vs viral social media follower metrics and podcast clout.",
        biasTrapName: "Social Proof & Bandwagon Bias",
        biasTrapDesc: "Evaluators often mistake high follower counts, viral popularity, and loud public hype for actual domain mastery and security rigor.",
        candidates: [
            {
                id: "c2_1",
                name: "Leo 'Hax' Rivera",
                avatarEmoji: "📱",
                role: "Head of Cybersecurity",
                meritScore: 52,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "Cybersecurity influencer with viral clips and huge follower count.",
                meritAttributes: [
                    { text: "CompTIA Security+ Certified", isMerit: true },
                    { text: "2 years junior SOC analyst experience", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "350k Followers on TikTok & YouTube", isMerit: false },
                    { text: "Hosts #1 Trending Tech Podcast", isMerit: false },
                    { text: "Sells signature 'Hacker' merch line", isMerit: false },
                    { text: "Featured on viral meme pages", isMerit: false }
                ]
            },
            {
                id: "c2_2",
                name: "Elena Rostova",
                avatarEmoji: "🛡️",
                role: "Head of Cybersecurity",
                meritScore: 98,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Quiet researcher dedicated to low-level vulnerability research and zero-day patches.",
                meritAttributes: [
                    { text: "Discovered & patched 14 Critical Zero-Day CVEs", isMerit: true },
                    { text: "10+ years penetration testing in defense banking", isMerit: true },
                    { text: "DEF CON keynote paper on Post-Quantum Encryption", isMerit: true },
                    { text: "Built security audit tool used by 500+ enterprises", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Only 15 followers on Twitter", isMerit: false },
                    { text: "Has zero YouTube or TikTok videos", isMerit: false },
                    { text: "Rarely speaks at casual networking mixers", isMerit: false }
                ]
            },
            {
                id: "c2_3",
                name: "Siddharth Patel",
                avatarEmoji: "👨🏽‍💻",
                role: "Head of Cybersecurity",
                meritScore: 78,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Experienced IT security manager with solid compliance track record.",
                meritAttributes: [
                    { text: "7 years ISO-27001 compliance management", isMerit: true },
                    { text: "CISSP & CISM certified", isMerit: true },
                    { text: "Reduced security breach response time by 30%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Active in local chess club", isMerit: false },
                    { text: "Writes occasional blog posts on LinkedIn", isMerit: false }
                ]
            }
        ]
    },
    {
        id: 3,
        title: "Round 3: In-Group Affinity Bias",
        category: "PRINCIPAL DATA SCIENTIST",
        desc: "Evaluate 3 Data Science candidates. Mission: Beware of candidate who shares your exact hometown, favorite band, and personal hobbies.",
        biasTrapName: "In-Group Affinity Bias",
        biasTrapDesc: "We naturally favor people who remind us of ourselves or share common background details (hobbies, schools, hometowns), falsely viewing them as more competent.",
        candidates: [
            {
                id: "c3_1",
                name: "Dr. Maya Lin",
                avatarEmoji: "📊",
                role: "Principal Data Scientist",
                meritScore: 95,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Machine learning research scientist with groundbreaking NLP models.",
                meritAttributes: [
                    { text: "Ph.D. in Machine Learning & Neural Networks", isMerit: true },
                    { text: "15 publications in NeurIPS & ICML", isMerit: true },
                    { text: "Developed predictive AI model generating $12M revenue", isMerit: true },
                    { text: "Expert in PyTorch, CUDA, and LLM optimization", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Grew up in a country far away from yours", isMerit: false },
                    { text: "Listens exclusively to classical opera", isMerit: false },
                    { text: "Does not follow popular sports leagues", isMerit: false }
                ]
            },
            {
                id: "c3_2",
                name: "Ethan Walker",
                avatarEmoji: "🎸",
                role: "Principal Data Scientist",
                meritScore: 50,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "Shares your hometown, loves your favorite indie rock band, and plays the same video games as you.",
                meritAttributes: [
                    { text: "2 years data analyst experience", isMerit: true },
                    { text: "Basic knowledge of SQL and Python", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Grew up in your exact hometown neighbourhood!", isMerit: false },
                    { text: "Diehard fan of your favorite indie band", isMerit: false },
                    { text: "Plays the exact same online RPG games as you", isMerit: false },
                    { text: "Attended your same high school rival", isMerit: false }
                ]
            },
            {
                id: "c3_3",
                name: "Kavita Rao",
                avatarEmoji: "👩🏽‍🔬",
                role: "Principal Data Scientist",
                meritScore: 76,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Quantitative analyst with strong statistical background.",
                meritAttributes: [
                    { text: "M.S. in Applied Statistics", isMerit: true },
                    { text: "5 years building customer churn models", isMerit: true },
                    { text: "Proficient in R, Python, and Tableau", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Enjoys gourmet coffee roasting", isMerit: false },
                    { text: "Volunteers at local cat shelter", isMerit: false }
                ]
            }
        ]
    },
    {
        id: 4,
        title: "Round 4: Prestige & Brand-Name Fallacy",
        category: "VP OF PRODUCT ENGINEERING",
        desc: "Evaluate 3 Product Executives. Mission: Do not be dazzled by elite university names or big-tech logos when the candidate had minimal actual project impact.",
        biasTrapName: "Prestige & Brand-Name Fallacy",
        biasTrapDesc: "Assuming that a candidate from an elite university or famous tech giant is automatically superior, ignoring their actual personal contributions.",
        candidates: [
            {
                id: "c4_1",
                name: "Chadwick Sterling III",
                avatarEmoji: "🏛️",
                role: "VP of Product Engineering",
                meritScore: 45,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "Rides on the coattails of Ivy League credentials and big-company brand names.",
                meritAttributes: [
                    { text: "1.5 years associate product manager", isMerit: true },
                    { text: "Attended executive weekend seminar", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Harvard Magna Cum Laude graduate", isMerit: false },
                    { text: "Ex-Google, Ex-Apple, Ex-Goldman Sachs titles", isMerit: false },
                    { text: "Member of exclusive secret golf club", isMerit: false },
                    { text: "Family name is on a university library wing", isMerit: false }
                ]
            },
            {
                id: "c4_2",
                name: "Amara Okezie",
                avatarEmoji: "🚀",
                role: "VP of Product Engineering",
                meritScore: 97,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Self-taught relentless operator who scaled two high-growth tech startups from scratch.",
                meritAttributes: [
                    { text: "Scaled product from 0 to 5M monthly active users", isMerit: true },
                    { text: "Managed 80+ engineering org across 3 continents", isMerit: true },
                    { text: "Achieved 99.99% service uptime during peak surge", isMerit: true },
                    { text: "Pioneered open-source developer framework used by 40k devs", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Attended local state community college", isMerit: false },
                    { text: "No famous big-tech logos on resume", isMerit: false },
                    { text: "Started career as self-taught night coder", isMerit: false }
                ]
            },
            {
                id: "c4_3",
                name: "David Miller",
                avatarEmoji: "👨🏻‍💻",
                role: "VP of Product Engineering",
                meritScore: 75,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Experienced engineering director from mid-market SaaS company.",
                meritAttributes: [
                    { text: "8 years directing engineering teams", isMerit: true },
                    { text: "Delivered 12 enterprise SaaS releases on schedule", isMerit: true },
                    { text: "Reduced team turnover to under 4%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Enjoys woodworking on weekends", isMerit: false },
                    { text: "Degree from State University", isMerit: false }
                ]
            }
        ]
    },
    {
        id: 5,
        title: "Round 5: Confidence & Jargon vs Substance Trap",
        category: "CHIEF AI OFFICER",
        desc: "Evaluate 3 AI Leadership candidates. Mission: Filter out superficial buzzwords and aggressive bravado; focus on empirical model benchmarks and testing validation.",
        biasTrapName: "Confidence Heuristic (Charisma over Substance)",
        biasTrapDesc: "Evaluators frequently confuse high social dominance, loud assertive posture, and buzzword fluency with real technical knowledge.",
        candidates: [
            {
                id: "c5_1",
                name: "Rex 'Disruptor' Vance",
                avatarEmoji: "⚡",
                role: "Chief AI Officer",
                meritScore: 40,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "Uses hyper-aggressive corporate jargon like 'quantum-synergy' and 'hyper-scale disruptor'.",
                meritAttributes: [
                    { text: "1 year AI sales consultant", isMerit: true },
                    { text: "Prompt engineering certificate online", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Speaks with intense eye contact and bravado", isMerit: false },
                    { text: "Uses buzzwords: 'Quantum-Synergy Quantum AI Paradigm'", isMerit: false },
                    { text: "Claims he will 'disrupt human consciousness'", isMerit: false },
                    { text: "Interprets questioning as lack of vision", isMerit: false }
                ]
            },
            {
                id: "c5_2",
                name: "Dr. Kenji Sato",
                avatarEmoji: "🔬",
                role: "Chief AI Officer",
                meritScore: 99,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Rigorously empirical AI researcher who measures everything by benchmark scores and validation loss curves.",
                meritAttributes: [
                    { text: "Reduced LLM hallucination rate by 64% using RAG & RLHF", isMerit: true },
                    { text: "Authored fundamental transformer architecture benchmark paper", isMerit: true },
                    { text: "Built enterprise AI safety alignment protocols", isMerit: true },
                    { text: "14 years AI research at National Labs", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Speaks quietly and carefully in simple language", isMerit: false },
                    { text: "Avoids hype buzzwords like 'ASI disruption'", isMerit: false },
                    { text: "Admits model limitations transparently", isMerit: false }
                ]
            },
            {
                id: "c5_3",
                name: "Rachel Green",
                avatarEmoji: "👩🏼‍💼",
                role: "Chief AI Officer",
                meritScore: 77,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Pragmatic AI implementation manager.",
                meritAttributes: [
                    { text: "Deployed machine learning models to production for 6 years", isMerit: true },
                    { text: "Managed $5M AI GPU cluster infrastructure", isMerit: true },
                    { text: "Improved recommendation model click-through by 18%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Enjoys marathon running", isMerit: false },
                    { text: "Hosts monthly team pizza nights", isMerit: false }
                ]
            }
        ]
    },
    {
        id: 6,
        title: "Round 6: The Multi-Bias Crucible (Final Trial)",
        category: "CHIEF EXECUTIVE JUDGE",
        desc: "Final Master Level Case: 3 candidates for Chief Executive Officer. Distractions combine visual charm, follower clout, Ivy prestige, and shared hobbies into one massive cognitive trap!",
        biasTrapName: "Multi-Layered Cognitive Bias Crucible",
        biasTrapDesc: "The ultimate test: several cognitive bias vectors are combined simultaneously into a single candidate to overwhelm your judgment filters.",
        candidates: [
            {
                id: "c6_1",
                name: "Maximillian 'Max' Sterling",
                avatarEmoji: "🌟",
                role: "Chief Executive Officer",
                meritScore: 42,
                isBestChoice: false,
                isDistractionTrap: true,
                bio: "The ultimate distraction trap candidate combining beauty, prestige, followers, and shared hobbies.",
                meritAttributes: [
                    { text: "2 years CEO at bankrupt tech venture", isMerit: true },
                    { text: "Published 1 sponsored opinion article", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Model-grade headshot & designer suit", isMerit: false },
                    { text: "500k Followers on Instagram & LinkedIn", isMerit: false },
                    { text: "Stanford Alumni & Ivy League Polo Team Captain", isMerit: false },
                    { text: "Plays your exact favorite video game & loves your hometown", isMerit: false },
                    { text: "Charismatic storytelling speaker", isMerit: false }
                ]
            },
            {
                id: "c6_2",
                name: "Dr. Fatima Al-Mansoor",
                avatarEmoji: "👩🏽‍💼",
                role: "Chief Executive Officer",
                meritScore: 100,
                isBestChoice: true,
                isDistractionTrap: false,
                bio: "Stellar operational executive with unmatched P&L growth metrics and crisis turnarounds.",
                meritAttributes: [
                    { text: "Turned around 2 distressed companies, growing valuation by 300%", isMerit: true },
                    { text: "18 years executive leadership with zero ethics compliance violations", isMerit: true },
                    { text: "Grew annual enterprise revenue from $50M to $450M", isMerit: true },
                    { text: "Pioneered employee profit-sharing model increasing retention by 92%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Modest attire with no designer logos", isMerit: false },
                    { text: "Zero interest in social media influencer fame", isMerit: false },
                    { text: "Did not attend Ivy League schools", isMerit: false },
                    { text: "Enjoys gardening quietly in spare time", isMerit: false }
                ]
            },
            {
                id: "c6_3",
                name: "Robert Chen",
                avatarEmoji: "👨🏻‍💼",
                role: "Chief Executive Officer",
                meritScore: 80,
                isBestChoice: false,
                isDistractionTrap: false,
                bio: "Experienced COO with strong execution track record.",
                meritAttributes: [
                    { text: "12 years Chief Operating Officer experience", isMerit: true },
                    { text: "Managed global supply chain operations across 14 countries", isMerit: true },
                    { text: "Reduced operating expenses by 22%", isMerit: true }
                ],
                noiseAttributes: [
                    { text: "Avid tennis player", isMerit: false },
                    { text: "Attended Midwestern State University", isMerit: false }
                ]
            }
        ]
    }
];

// --- STATE MANAGEMENT ---
let gameState = {
    currentRoundIndex: 0,
    totalScore: 0,
    streak: 0,
    maxStreak: 0,
    correctPicksCount: 0,
    selectedCandidateId: null,
    taggedAttributes: {}, // key: tagId, val: 'merit' | 'noise'
    biasHistory: [], // log of bias results for summary
    biasVulnerability: {
        "Halo Effect": { tested: 0, resisted: 0 },
        "Social Proof": { tested: 0, resisted: 0 },
        "In-Group Bias": { tested: 0, resisted: 0 },
        "Prestige Fallacy": { tested: 0, resisted: 0 },
        "Confidence Trap": { tested: 0, resisted: 0 },
        "Multi-Bias Crucible": { tested: 0, resisted: 0 }
    }
};


// --- INITIALIZATION & VIEW SWITCHING ---
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupGddNav();
});

function switchView(viewName) {
    audio.playClick();
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (viewName === 'game') {
        document.getElementById('view-game').classList.add('active');
        document.getElementById('btn-play-mode').classList.add('active');
    } else if (viewName === 'gdd') {
        document.getElementById('view-gdd').classList.add('active');
        document.getElementById('btn-gdd-mode').classList.add('active');
    }
}

function initGame() {
    gameState.currentRoundIndex = 0;
    gameState.totalScore = 0;
    gameState.streak = 0;
    gameState.maxStreak = 0;
    gameState.correctPicksCount = 0;
    gameState.selectedCandidateId = null;
    gameState.taggedAttributes = {};
    gameState.biasHistory = [];
    
    // Reset vulnerability meters
    Object.keys(gameState.biasVulnerability).forEach(k => {
        gameState.biasVulnerability[k].tested = 0;
        gameState.biasVulnerability[k].resisted = 0;
    });

    renderRound();
    updateHud();
    document.getElementById('view-summary').classList.add('hidden');
    document.getElementById('view-game').classList.add('active');
}

function claimOfficialVerdict() {
    audio.playSuccess();
    if (window.parent && typeof window.parent.onMinigameVictory === 'function') {
        window.parent.onMinigameVictory('bias_buster', 200, "Official Judge Scoring Calibration certified for fair tournament grading!");
    } else if (window.parent && typeof window.parent.addRepPoints === 'function') {
        window.parent.addRepPoints(200);
        if (window.parent.closeMinigame) window.parent.closeMinigame();
    }
}

function restartGame() {
    audio.playClick();
    initGame();
}

// --- ROUND RENDERING ---
function renderRound() {
    const roundData = GAME_ROUNDS[gameState.currentRoundIndex];
    gameState.selectedCandidateId = null;
    gameState.taggedAttributes = {};

    // Update HUD & Banners
    document.getElementById('hud-round').innerText = `${roundData.id} / ${GAME_ROUNDS.length}`;
    document.getElementById('round-category').innerText = `CATEGORY: ${roundData.category}`;
    document.getElementById('round-title').innerText = roundData.title;
    document.getElementById('round-desc').innerText = roundData.desc;
    document.getElementById('selected-candidate-name').innerText = "None Selected";
    document.getElementById('btn-submit-judgment').disabled = true;

    // Render Candidates Grid
    const grid = document.getElementById('candidates-container');
    grid.innerHTML = '';

    roundData.candidates.forEach(cand => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.id = `card-${cand.id}`;
        card.onclick = (e) => {
            // Prevent candidate select if clicking tag pills
            if (!e.target.classList.contains('attr-tag')) {
                selectCandidate(cand.id, cand.name);
            }
        };

        // Combine merit and noise into tagged list
        let allAttributesHTML = '';

        allAttributesHTML += `<div class="attr-group-title">Key Profile Attributes (Click to Classify):</div><div class="attr-list">`;
        
        cand.meritAttributes.forEach((attr, idx) => {
            const tagId = `${cand.id}_m_${idx}`;
            allAttributesHTML += `<span class="attr-tag" id="tag-${tagId}" onclick="toggleTag('${tagId}', true)">${attr.text}</span>`;
        });

        cand.noiseAttributes.forEach((attr, idx) => {
            const tagId = `${cand.id}_n_${idx}`;
            allAttributesHTML += `<span class="attr-tag" id="tag-${tagId}" onclick="toggleTag('${tagId}', false)">${attr.text}</span>`;
        });

        allAttributesHTML += `</div>`;

        card.innerHTML = `
            <div class="candidate-header">
                <div class="avatar-wrapper">${cand.avatarEmoji}</div>
                <div class="candidate-meta">
                    <h3>${cand.name}</h3>
                    <div class="subtitle">${cand.role}</div>
                </div>
            </div>
            <p class="scenario-desc" style="font-size: 0.9rem; margin-bottom: 0.75rem;">"${cand.bio}"</p>
            ${allAttributesHTML}
            <button class="card-select-btn" id="btn-select-${cand.id}">Select for Bench Appointment</button>
        `;

        grid.appendChild(card);
    });
}

function selectCandidate(candId, candName) {
    audio.playClick();
    gameState.selectedCandidateId = candId;

    // Update UI highlights
    document.querySelectorAll('.candidate-card').forEach(card => card.classList.remove('selected'));
    document.querySelectorAll('.card-select-btn').forEach(btn => btn.innerText = 'Select for Bench Appointment');

    const selectedCard = document.getElementById(`card-${candId}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        document.getElementById(`btn-select-${candId}`).innerText = '✓ Selected Candidate';
    }

    document.getElementById('selected-candidate-name').innerText = candName;
    document.getElementById('btn-submit-judgment').disabled = false;
}

// Tag toggling: Neutral -> Merit (Green) -> Noise (Purple) -> Neutral
function toggleTag(tagId, actualIsMerit) {
    audio.playClick();
    const tagElem = document.getElementById(`tag-${tagId}`);
    if (!tagElem) return;

    const currentStatus = gameState.taggedAttributes[tagId];

    if (!currentStatus) {
        // Set to Merit
        gameState.taggedAttributes[tagId] = { userClassified: 'merit', actualIsMerit };
        tagElem.classList.add('classified-merit');
        tagElem.classList.remove('classified-noise');
    } else if (currentStatus.userClassified === 'merit') {
        // Set to Noise
        gameState.taggedAttributes[tagId] = { userClassified: 'noise', actualIsMerit };
        tagElem.classList.remove('classified-merit');
        tagElem.classList.add('classified-noise');
    } else {
        // Remove tag
        delete gameState.taggedAttributes[tagId];
        tagElem.classList.remove('classified-merit', 'classified-noise');
    }
}

// --- SUBMIT JUDGMENT & SCORING ---
function submitJudgment() {
    if (!gameState.selectedCandidateId) return;

    const roundData = GAME_ROUNDS[gameState.currentRoundIndex];
    const selectedCand = roundData.candidates.find(c => c.id === gameState.selectedCandidateId);
    const bestCand = roundData.candidates.find(c => c.isBestChoice);

    // Calculate Scores
    let baseScore = 0;
    let isCorrect = false;
    let isTrap = selectedCand.isDistractionTrap;

    if (selectedCand.isBestChoice) {
        baseScore = 100;
        isCorrect = true;
        gameState.correctPicksCount++;
        gameState.streak++;
        if (gameState.streak > gameState.maxStreak) gameState.maxStreak = gameState.streak;
        audio.playSuccess();
    } else if (selectedCand.isDistractionTrap) {
        baseScore = 0;
        gameState.streak = 0;
        audio.playTrapAlert();
    } else {
        baseScore = 30; // Suboptimal candidate
        gameState.streak = 0;
        audio.playTrapAlert();
    }

    // Calculate Tagging Reasoning Score
    let reasoningPoints = 0;
    Object.keys(gameState.taggedAttributes).forEach(tagId => {
        const item = gameState.taggedAttributes[tagId];
        if ((item.userClassified === 'merit' && item.actualIsMerit) || 
            (item.userClassified === 'noise' && !item.actualIsMerit)) {
            reasoningPoints += 10;
        } else {
            reasoningPoints -= 5;
        }
    });
    reasoningPoints = Math.max(0, reasoningPoints); // Floor at 0

    // Streak Multiplier calculation (1.0x, 1.3x, 1.6x, 2.0x, etc.)
    const streakMultiplier = 1 + (gameState.streak * 0.2);
    const streakBonus = Math.round(baseScore * (streakMultiplier - 1));

    const roundTotalScore = Math.round((baseScore + reasoningPoints + streakBonus));
    gameState.totalScore += roundTotalScore;

    // Record vulnerability stats
    const keyBias = getShortBiasKey(roundData.biasTrapName);
    if (gameState.biasVulnerability[keyBias]) {
        gameState.biasVulnerability[keyBias].tested++;
        if (isCorrect) gameState.biasVulnerability[keyBias].resisted++;
    }

    // Update HUD
    updateHud();

    // Render Modal Feedback
    renderFeedbackModal(selectedCand, bestCand, roundData, baseScore, reasoningPoints, streakBonus, roundTotalScore, isCorrect, isTrap);
}

function getShortBiasKey(fullName) {
    if (fullName.includes("Halo")) return "Halo Effect";
    if (fullName.includes("Social")) return "Social Proof";
    if (fullName.includes("Affinity")) return "In-Group Bias";
    if (fullName.includes("Prestige")) return "Prestige Fallacy";
    if (fullName.includes("Confidence")) return "Confidence Trap";
    return "Multi-Bias Crucible";
}

function updateHud() {
    document.getElementById('hud-score').innerText = gameState.totalScore;
    document.getElementById('hud-streak').innerText = `${gameState.streak}x 🔥`;

    const totalEvaluated = gameState.currentRoundIndex + (gameState.selectedCandidateId ? 1 : 0);
    const accuracy = totalEvaluated > 0 ? Math.round((gameState.correctPicksCount / totalEvaluated) * 100) : 100;
    document.getElementById('hud-accuracy').innerText = `${accuracy}%`;
}

function renderFeedbackModal(selectedCand, bestCand, roundData, baseScore, reasoningPoints, streakBonus, totalRound, isCorrect, isTrap) {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('hidden');

    const icon = document.getElementById('outcome-icon');
    const title = document.getElementById('outcome-title');
    const subtitle = document.getElementById('outcome-subtitle');

    if (isCorrect) {
        icon.innerText = "🎯";
        title.innerText = "Objective Verdict Delivered!";
        title.style.color = "var(--merit-green)";
        subtitle.innerText = `+${totalRound} Points Earned!`;
        subtitle.style.background = "var(--merit-bg)";
        subtitle.style.color = "var(--merit-green)";
    } else if (isTrap) {
        icon.innerText = "⚠️";
        title.innerText = "You Fell For The Distraction Trap!";
        title.style.color = "var(--noise-purple)";
        subtitle.innerText = `+${totalRound} Points (Sucked into Hype Trap)`;
        subtitle.style.background = "var(--noise-bg)";
        subtitle.style.color = "var(--noise-purple)";
    } else {
        icon.innerText = "⚖️";
        title.innerText = "Suboptimal Judicial Pick";
        title.style.color = "var(--gold-accent)";
        subtitle.innerText = `+${totalRound} Points (Missed Top Performer)`;
        subtitle.style.background = "rgba(245, 158, 11, 0.15)";
        subtitle.style.color = "var(--gold-accent)";
    }

    // Scores
    document.getElementById('score-merit-points').innerText = `+${baseScore} pts`;
    document.getElementById('score-reasoning-points').innerText = `+${reasoningPoints} pts`;
    document.getElementById('score-streak-points').innerText = `+${streakBonus} pts`;
    document.getElementById('score-round-total').innerText = `+${totalRound} pts`;

    // Audit Text
    const auditText = document.getElementById('bias-audit-text');
    if (isCorrect) {
        auditText.innerText = `Outstanding objectivity! You appointed ${bestCand.name} based purely on their verified merit score of ${bestCand.meritScore}/100, ignoring superficial noise.`;
    } else {
        auditText.innerText = `You appointed ${selectedCand.name} (Merit Score: ${selectedCand.meritScore}/100). The most qualified candidate was ${bestCand.name} with a true Merit Score of ${bestCand.meritScore}/100.`;
    }

    document.getElementById('bias-type-name').innerText = roundData.biasTrapName;
    document.getElementById('bias-type-desc').innerText = roundData.biasTrapDesc;

    // Comparison Table
    const tbody = document.getElementById('matrix-table-body');
    tbody.innerHTML = '';

    roundData.candidates.forEach(cand => {
        const row = document.createElement('tr');
        const isPicked = cand.id === selectedCand.id;
        
        row.innerHTML = `
            <td><strong>${cand.name}</strong> ${cand.isBestChoice ? '🌟 (Best)' : ''}</td>
            <td><strong style="color: ${cand.meritScore > 80 ? 'var(--merit-green)' : 'var(--text-muted)'}">${cand.meritScore} / 100</strong></td>
            <td>${cand.isDistractionTrap ? '🔴 High Distraction Trap' : '🟢 Low Noise'}</td>
            <td>${isPicked ? '👉 Your Selection' : '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function nextRound() {
    audio.playClick();
    document.getElementById('feedback-modal').classList.add('hidden');

    if (gameState.currentRoundIndex + 1 < GAME_ROUNDS.length) {
        gameState.currentRoundIndex++;
        renderRound();
    } else {
        showFinalSummary();
    }
}

// --- FINAL SUMMARY SCREEN ---
function showFinalSummary() {
    document.getElementById('view-game').classList.remove('active');
    document.getElementById('view-summary').classList.remove('hidden');

    // Final Stats
    document.getElementById('final-score').innerText = gameState.totalScore;
    
    const accuracy = Math.round((gameState.correctPicksCount / GAME_ROUNDS.length) * 100);
    document.getElementById('final-accuracy').innerText = `${accuracy}%`;
    document.getElementById('final-streak').innerText = `${gameState.maxStreak}x`;

    // Rank Assignment
    let rank = "Master Objective Sentinel";
    if (accuracy < 50) rank = "Susceptible to Hype";
    else if (accuracy < 80) rank = "Discriminating Magistrate";
    document.getElementById('final-rank').innerText = rank;

    // Render Cognitive Bias Vulnerability Meter Bars
    const list = document.getElementById('bias-bars-list');
    list.innerHTML = '';

    Object.keys(gameState.biasVulnerability).forEach(biasKey => {
        const item = gameState.biasVulnerability[biasKey];
        const pct = item.tested > 0 ? Math.round((item.resisted / item.tested) * 100) : 100;
        
        const row = document.createElement('div');
        row.className = 'bias-meter-row';
        row.innerHTML = `
            <div class="meter-header">
                <span>${biasKey} Resistance</span>
                <strong>${pct}% Resisted</strong>
            </div>
            <div class="meter-track">
                <div class="meter-fill" style="width: ${pct}%;"></div>
            </div>
        `;
        list.appendChild(row);
    });
}

// --- GDD SIDEBAR SCROLL SPY ---
function setupGddNav() {
    const navLinks = document.querySelectorAll('.gdd-nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}
