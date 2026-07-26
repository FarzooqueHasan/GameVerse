// ISRO CubeSat Builder Main Initialization

const ISRO_FACTS = [
    "ISRO holds world records for launching 104 satellites in a single mission using PSLV-C37 from Sriharikota!",
    "Chandrayaan-3 made India the first nation to soft-land near the lunar South Pole on August 23, 2023!",
    "Aditya-L1 is India's first solar space observatory, stationed at the Sun-Earth L1 Lagrange point 1.5 million km from Earth.",
    "The U R Rao Satellite Centre (URSC) in Bengaluru has developed over 100 Indian satellites since Aryabhata in 1975.",
    "PSLV (Polar Satellite Launch Vehicle) is known as the trusted 'Workhorse of ISRO' with over 50 successful missions.",
    "NavIC is India's independent regional satellite navigation system providing precise positioning across South Asia."
];

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ui = new UIController();
    const game = new GameEngine(canvas, ui);

    // Header buttons
    const btnAudio = document.getElementById('btn-audio');
    const btnHelp = document.getElementById('btn-help');
    const btnRestart = document.getElementById('btn-restart');

    const helpModal = document.getElementById('help-modal');
    const btnCloseHelp = document.getElementById('btn-close-help');
    const gameOverModal = document.getElementById('game-over-modal');
    const btnPlayAgain = document.getElementById('btn-play-again');

    // Mute Audio Toggle
    btnAudio.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        btnAudio.textContent = isMuted ? '🔇' : '🔊';
    });

    // Help Modal
    btnHelp.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    btnCloseHelp.addEventListener('click', () => {
        helpModal.classList.add('hidden');
        if (game.gameState === 'READY') {
            game.startLevel('sdsc');
        }
    });

    // Restart Level
    btnRestart.addEventListener('click', () => {
        audio.playPick();
        game.startLevel('sdsc');
    });

    // Play Again Modal Button
    btnPlayAgain.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        game.startLevel('sdsc');
    });

    // Touch D-Pad Controls for mobile / touch screens
    const dpadUp = document.getElementById('btn-up');
    const dpadLeft = document.getElementById('btn-left');
    const dpadDown = document.getElementById('btn-down');
    const dpadRight = document.getElementById('btn-right');
    const btnAction = document.getElementById('btn-action');

    const bindTouchDir = (btn, dx, dy) => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            game.touchMove.active = true;
            game.touchMove.dx = dx;
            game.touchMove.dy = dy;
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            game.touchMove.active = false;
            game.touchMove.dx = 0;
            game.touchMove.dy = 0;
        });
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            game.touchMove.active = true;
            game.touchMove.dx = dx;
            game.touchMove.dy = dy;
        });
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            game.touchMove.active = false;
            game.touchMove.dx = 0;
            game.touchMove.dy = 0;
        });
    };

    bindTouchDir(dpadUp, 0, -1);
    bindTouchDir(dpadDown, 0, 1);
    bindTouchDir(dpadLeft, -1, 0);
    bindTouchDir(dpadRight, 1, 0);

    if (btnAction) {
        btnAction.addEventListener('click', () => {
            game.handleAction();
        });
    }

    // Rotate ISRO Facts every 12 seconds
    let factIdx = 0;
    const factTextEl = document.getElementById('isro-fact-text');
    setInterval(() => {
        factIdx = (factIdx + 1) % ISRO_FACTS.length;
        if (factTextEl) factTextEl.textContent = ISRO_FACTS[factIdx];
    }, 12000);

    // Auto-start level on boot
    game.startLevel('sdsc');
});
