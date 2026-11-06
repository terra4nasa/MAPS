function changeView(mode, event) {
    const visor = document.getElementById('visor-container');
    visor.className = ''; 
    visor.classList.add(`view-${mode}`);
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

class TelemetrySystem {
    constructor() {
        this.oxygen = 100; this.battery = 100; this.shield = 100; this.co2 = 12;
        this.time = 0; this.inventory = []; this.maxInventory = 4; this.score = 0;
        this.audioCtx = null;
        this.nextAlarmTime = 0;
        
        // Audio synthesis tracks
        this.windNoise = null; this.windGain = null; this.windFilter = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupWindEngine();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    setupWindEngine() {
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        this.windNoise = this.audioCtx.createBufferSource();
        this.windNoise.buffer = noiseBuffer;
        this.windNoise.loop = true;

        this.windFilter = this.audioCtx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 320;
        this.windFilter.Q.value = 3.0;

        this.windGain = this.audioCtx.createGain();
        this.windGain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);

        this.windNoise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.audioCtx.destination);
        this.windNoise.start();
    }

    collectMineral(name) {
        if (this.inventory.length >= this.maxInventory) return false;
        this.inventory.push(name);
        this.score += 250;
        this.updateInventoryUI();
        this.playBeep(600, 0.15);
        return true;
    }

    updateInventoryUI() {
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach((slot, index) => {
            if (this.inventory[index]) {
                slot.innerText = this.inventory[index];
                slot.classList.remove('empty');
                slot.classList.add('occupied');
            }
        });
        document.getElementById('score-txt').innerText = this.score;
    }

    triggerStormDamage() {
        this.shield = Math.max(0, this.shield - 0.25);
        this.playBeep(140, 0.04);
    }

    playBeep(freq, duration) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(this.audioCtx.currentTime + duration);
    }

    triggerAlarmTone() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        if (now < this.nextAlarmTime) return;

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gainNode); gainNode.connect(this.audioCtx.destination);
        osc.start(now); osc.stop(now + 0.3);
        this.nextAlarmTime = now + 0.7;
    }

    update(isMoving) {
        this.time += 1/60;
        const m = Math.floor(this.time / 60).toString().padStart(2, '0');
        const s = Math.floor(this.time % 60).toString().padStart(2, '0');
        document.getElementById('time-elapsed').innerText = `${m}:${s}`;

        if (isMoving) {
            this.initAudio();
            this.oxygen = Math.max(0, this.oxygen - 0.02);
            this.battery = Math.max(0, this.battery - 0.03);
            this.co2 = Math.min(100, this.co2 + 0.005);
            document.getElementById('speed-txt').innerText = "VELOCITY: 3.1 m/s";

            if (this.audioCtx && this.windGain && this.windFilter) {
                const now = this.audioCtx.currentTime;
                this.windFilter.frequency.exponentialRampToValueAtTime(520, now + 0.3);
                this.windGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
            }
        } else {
            document.getElementById('speed-txt').innerText = "VELOCITY: 0.0 m/s";
            if (this.audioCtx && this.windGain && this.windFilter) {
                const now = this.audioCtx.currentTime;
                this.windFilter.frequency.exponentialRampToValueAtTime(320, now + 0.5);
                this.windGain.gain.linearRampToValueAtTime(0.02, now + 0.5);
            }
        }

        document.getElementById('o2-bar').style.width = `${this.oxygen}%`;
        document.getElementById('battery-txt').innerText = `${Math.floor(this.battery)}%`;
        document.getElementById('co2-bar').style.width = `${this.co2}%`;
        document.getElementById('shield-bar').style.width = `${this.shield}%`;

        const alertElement = document.getElementById('master-alert');
        if (this.shield < 30 || this.oxygen < 25 || this.battery < 20) {
            document.getElementById('visor-container').classList.add('critical-alert');
            alertElement.innerText = "⚠️ DANGER: RUNNING CRITICAL";
            alertElement.classList.add('alert-flash');
            this.initAudio();
            this.triggerAlarmTone();
        } else {
            document.getElementById('visor-container').classList.remove('critical-alert');
            alertElement.innerText = "SYSTEM NOMINAL";
            alertElement.classList.remove('alert-flash');
        }

        const jitter = (Math.random() - 0.5) * 0.05;
        document.getElementById('pressure-txt').innerText = `SUIT: ${(34.50 + jitter).toFixed(2)} kPa`;
        document.getElementById('thermal-txt').innerText = `CORE: ${(36.6 + jitter).toFixed(1)}°C`;
    }
}
window.MarsTelemetry = new TelemetrySystem();

function handleHazard(choice) {
    document.getElementById('hazard-card').classList.add('hidden');
    if (choice === 'brace') {
        window.MarsTelemetry.shield = Math.max(0, window.MarsTelemetry.shield - 20);
        window.MarsTelemetry.score = Math.max(0, window.MarsTelemetry.score - 100);
    } else if (choice === 'divert') {
        window.MarsTelemetry.battery = Math.max(0, window.MarsTelemetry.battery - 10);
        window.MarsTelemetry.score += 150;
    }
    window.MarsTelemetry.updateInventoryUI();
    window.isHazardActive = false;
}
