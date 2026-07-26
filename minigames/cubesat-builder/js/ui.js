// ISRO Game UI Controller

class UIController {
    constructor() {
        this.ordersContainer = document.getElementById('orders-list');
        this.scoreElement = document.getElementById('score-val');
        this.builtElement = document.getElementById('built-val');
        this.timerElement = document.getElementById('timer-val');

        this.launchModal = document.getElementById('launch-modal');
        this.launchRocketName = document.getElementById('launch-rocket-name');
        this.launchSatName = document.getElementById('launch-sat-name');
        this.launchBadge = document.getElementById('launch-badge');
        this.launchPoints = document.getElementById('launch-points');

        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalBuiltEl = document.getElementById('final-built');

        this.onOrdersChanged = this.onOrdersChanged.bind(this);
        this.onHudUpdate = this.onHudUpdate.bind(this);
        this.onLaunchCelebration = this.onLaunchCelebration.bind(this);
        this.onGameOver = this.onGameOver.bind(this);
    }

    onOrdersChanged(orders) {
        if (!this.ordersContainer) return;
        this.ordersContainer.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';

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
        if (this.scoreElement) this.scoreElement.textContent = data.score;
        if (this.builtElement) this.builtElement.textContent = data.satellitesBuilt;
        if (this.timerElement) {
            const mins = Math.floor(data.timeRemaining / 60);
            const secs = data.timeRemaining % 60;
            this.timerElement.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            if (data.timeRemaining < 30) {
                this.timerElement.classList.add('timer-warning');
            } else {
                this.timerElement.classList.remove('timer-warning');
            }
        }
    }

    onLaunchCelebration(blueprint, points) {
        if (!this.launchModal) return;

        this.launchRocketName.textContent = `🚀 ISRO LAUNCH VEHICLE: ${blueprint.rocket}`;
        this.launchSatName.textContent = blueprint.name;
        this.launchBadge.textContent = blueprint.badge;
        this.launchPoints.textContent = `+${points} SCIENCE POINTS AWARDED!`;

        this.launchModal.classList.remove('hidden');

        // Auto hide after 2.8 seconds
        setTimeout(() => {
            this.launchModal.classList.add('hidden');
        }, 2800);
    }

    onGameOver(finalScore, builtCount) {
        if (!this.gameOverModal) return;
        this.finalScoreEl.textContent = finalScore;
        this.finalBuiltEl.textContent = builtCount;
        this.gameOverModal.classList.remove('hidden');
    }
}
