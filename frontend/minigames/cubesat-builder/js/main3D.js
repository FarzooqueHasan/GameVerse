// ISRO 3D Main Entry Point

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('webgl-container');
    const ui = new UIController3D();
    const game = new GameEngine3D(container, ui);

    // -- Modal / Overlay Elements --
    const tutorialModal = document.getElementById('tutorial-modal');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNum = document.getElementById('countdown-number');
    const countdownSub = document.getElementById('countdown-subtext');
    const btnStartMission = document.getElementById('btn-start-mission');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const gameOverModal = document.getElementById('game-over-modal');
    const btnAudio = document.getElementById('btn-audio-3d');
    const btnPause = document.getElementById('btn-pause-3d');

    // -- Countdown & Game Start --
    const COUNTDOWN_TEXTS = ['PREPARING CLEANROOM...', 'SYSTEMS NOMINAL!', '🚀 GO GO GO!'];

    function setCountdownNum(text) {
        // Force CSS animation restart by briefly removing the element
        countdownNum.textContent = text;
        countdownNum.style.animation = 'none';
        countdownNum.offsetHeight; // reflow
        countdownNum.style.animation = '';
    }

    function startCountdown(onDone) {
        countdownOverlay.classList.remove('hidden');
        let count = 3;
        setCountdownNum(count);
        countdownSub.textContent = COUNTDOWN_TEXTS[0];

        const tick = () => {
            count--;
            if (count > 0) {
                setCountdownNum(count);
                countdownSub.textContent = COUNTDOWN_TEXTS[3 - count] || 'GET READY...';
                setTimeout(tick, 950);
            } else {
                setCountdownNum('GO!');
                countdownSub.textContent = '🚀 MISSION START!';
                setTimeout(() => {
                    countdownOverlay.classList.add('hidden');
                    onDone();
                }, 900);
            }
        };
        setTimeout(tick, 950);
    }


    // -- Tutorial -> Countdown -> Game --
    if (btnStartMission) {
        btnStartMission.addEventListener('click', () => {
            tutorialModal.classList.add('hidden');
            startCountdown(() => {
                game.startLevel();
            });
        });
    } else {
        // Fallback: auto-start if no tutorial button
        game.startLevel();
    }

    // -- Audio & Pause Controls --
    if (btnAudio) {
        btnAudio.addEventListener('click', () => {
            const isMuted = audio.toggleMute();
            btnAudio.textContent = isMuted ? '🔇' : '🔊';
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (game.gameState === 'PLAYING') {
                game.gameState = 'PAUSED';
                btnPause.textContent = '▶️';
            } else if (game.gameState === 'PAUSED') {
                game.gameState = 'PLAYING';
                btnPause.textContent = '⏸️';
                game.lastTime = performance.now();
            }
        });
    }

    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            gameOverModal.classList.add('hidden');
            startCountdown(() => {
                game.startLevel();
            });
        });
    }

    // -- Touch D-Pad Controls --
    const dpadUp = document.getElementById('btn-up');
    const dpadLeft = document.getElementById('btn-left');
    const dpadDown = document.getElementById('btn-down');
    const dpadRight = document.getElementById('btn-right');
    const btnAction = document.getElementById('btn-action');

    const bindTouchDir = (btn, dx, dy) => {
        if (!btn) return;
        const start = (e) => {
            e.preventDefault();
            game.touchMove.active = true;
            game.touchMove.dx = dx;
            game.touchMove.dy = dy;
        };
        const stop = (e) => {
            e.preventDefault();
            game.touchMove.active = false;
            game.touchMove.dx = 0;
            game.touchMove.dy = 0;
        };
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop, { passive: false });
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
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
});

