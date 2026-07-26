// ISRO 3D Game UI Controller (Matching Reference Screenshot)

class UIController3D {
    constructor() {
        this.ordersContainer = document.getElementById('orders-list');

        this.earthScoreEl = document.getElementById('earth-score-val');
        this.solarScoreEl = document.getElementById('solar-score-val');
        this.timerElement = document.getElementById('timer-val-3d');

        this.launchModal = document.getElementById('launch-modal');
        this.launchRocketName = document.getElementById('launch-rocket-name');
        this.launchSatName = document.getElementById('launch-sat-name');
        this.launchBadge = document.getElementById('launch-badge');
        this.launchPoints = document.getElementById('launch-points');

        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalBuiltEl = document.getElementById('final-built');
        this.toastContainer = document.getElementById('toast-container');

        this.onOrdersChanged = this.onOrdersChanged.bind(this);
        this.onHudUpdate = this.onHudUpdate.bind(this);
        this.onLaunchCelebration = this.onLaunchCelebration.bind(this);
        this.onGameOver = this.onGameOver.bind(this);
        this.showToast = this.showToast.bind(this);
    }

    onOrdersChanged(orders) {
        if (!this.ordersContainer) return;
        this.ordersContainer.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card-3d';

            const pct = Math.max(0, (order.timeRemaining / order.maxTime) * 100);
            const isUrgent = pct < 25;

            let reqIconsHTML = '<span class="part-tag chassis-tag">🧊 FRAME</span>';
            order.blueprint.required.forEach(compId => {
                if (compId !== 'chassis') {
                    const comp = ISRO_COMPONENTS[compId];
                    reqIconsHTML += `<span class="part-tag" style="background:${comp.color}22; border-color:${comp.color}">${comp.icon} ${comp.short}</span>`;
                }
            });

            card.innerHTML = `
                <div class="order-header">
                    <span class="order-title">${order.blueprint.name}</span>
                    <span class="order-reward">+${order.blueprint.reward} PTS</span>
                </div>
                <div class="order-desc">${order.blueprint.desc}</div>
                <div class="order-parts">${reqIconsHTML}</div>
                <div class="timer-bar-bg">
                    <div class="timer-bar-fill ${isUrgent ? 'urgent' : ''}" style="width: ${pct}%"></div>
                </div>
            `;
            this.ordersContainer.appendChild(card);
        });
    }

    onHudUpdate(data) {
        if (this.earthScoreEl) this.earthScoreEl.textContent = data.scoreEarth;
        if (this.solarScoreEl) this.solarScoreEl.textContent = data.scoreDeepSpace;
        if (this.timerElement) {
            const mins = Math.floor(data.timeRemaining / 60);
            const secs = data.timeRemaining % 60;
            this.timerElement.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    }

    onLaunchCelebration(blueprint, points) {
        if (!this.launchModal) return;

        if (window.parent && typeof window.parent.onMinigameVictory === 'function') {
            window.parent.onMinigameVictory('cubesat', 250, `Successfully assembled and launched ${blueprint.name}!`);
        }

        this.launchRocketName.textContent = `🚀 ISRO LAUNCH VEHICLE: ${blueprint.rocket}`;
        this.launchSatName.textContent = blueprint.name;
        this.launchBadge.textContent = blueprint.badge;
        this.launchPoints.textContent = `+${points} SCIENCE POINTS AWARDED!`;

        this.launchModal.classList.remove('hidden');

        setTimeout(() => {
            this.launchModal.classList.add('hidden');
        }, 2600);
    }

    onGameOver(finalScore, builtCount) {
        if (!this.gameOverModal) return;
        if (window.parent && typeof window.parent.onMinigameDefeat === 'function' && builtCount === 0) {
            window.parent.onMinigameDefeat('cubesat', 30, "Cleanroom shift ended without launching a satellite!");
        } else if (window.parent && typeof window.parent.onMinigameVictory === 'function' && builtCount > 0) {
            window.parent.onMinigameVictory('cubesat', finalScore || 200, `Completed shift with ${builtCount} satellite(s) launched!`);
        }
        this.finalScoreEl.textContent = finalScore;
        this.finalBuiltEl.textContent = builtCount;
        this.gameOverModal.classList.remove('hidden');
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        toast.innerHTML = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2600);
    }

    // Called each frame by the game engine with the cell the character is facing
    updateLookAtHud(cell) {
        // No DOM update needed - the 3D reticle/glow is the primary indicator
        // This hook can be used for future context-sensitive UI elements
    }
}
