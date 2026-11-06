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
        this.time = 0; this.score = 0; this.inventory = []; this.maxInventory = 4;
        this.audioCtx = null; this.nextAlarmTime = 0;
        
        // Audio nodes for procedural weather
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

    triggerAlarmTone() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        if (now < this.nextAlarmTime) return;

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
        this.nextAlarmTime = now + 0.8;
    }

    collectMineral(name) {
        if (this.inventory.length >= this.maxInventory) return false;
        this.inventory.push(name);
        this.score += 250;
        this.updateInventoryUI();
        this.playBeep(880, 0.08);
        return true;
    }

    updateInventoryUI() {
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach((slot, index) => {
            if (this.inventory[index]) {
                slot.innerText = `[ ${this.inventory[index]} ]`;
                slot.classList.remove('empty');
                slot.classList.add('occupied');
            }
        });
    }

    triggerStormDamage() {
        this.shield = Math.max(0, this.shield - 0.25);
        this.score = Math.max(0, this.score - 2);
        this.playBeep(120, 0.04);
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

    update(isMoving) {
        this.time += 1/60;
        const m = Math.floor(this.time / 60).toString().padStart(2, '0');
        const s = Math.floor(this.time % 60).toString().padStart(2, '0');
        document.getElementById('time-elapsed').innerText = `${m}:${s}`;

        if (isMoving) {
            this.initAudio();
            this.oxygen = Math.max(0, this.oxygen - 0.012);
            this.battery = Math.max(0, this.battery - 0.018);
            this.co2 = Math.min(100, this.co2 + 0.003);
            this.score += 1;
            document.getElementById('speed-txt').innerText = "VELOCITY: 3.4 m/s";

            if (this.audioCtx && this.windGain && this.windFilter) {
                const now = this.audioCtx.currentTime;
                this.windFilter.frequency.exponentialRampToValueAtTime(550, now + 0.3);
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
        document.getElementById('o2-pct-txt').innerText = `${Math.ceil(this.oxygen)}%`;
        document.getElementById('battery-txt').innerText = `${Math.ceil(this.battery)}%`;
        document.getElementById('co2-bar').style.width = `${this.co2}%`;
        document.getElementById('co2-pct-txt').innerText = `${Math.ceil(this.co2)}%`;
        document.getElementById('shield-bar').style.width = `${this.shield}%`;
        document.getElementById('shield-pct-txt').innerText = `${Math.ceil(this.shield)}%`;
        document.getElementById('score-txt').innerText = Math.floor(this.score).toString().padStart(4, '0');

        const alertElement = document.getElementById('master-alert');
        if (this.shield < 30 || this.oxygen < 25) {
            alertElement.innerText = "⚠️ SYSTEM FAILURE IMMINENT";
            alertElement.style.color = "#ff3333";
            alertElement.style.borderColor = "#ff3333";
            this.triggerAlarmTone();
        } else {
            alertElement.innerText = "SYSTEM NOMINAL";
            alertElement.style.color = "#00ffcc";
            alertElement.style.borderColor = "#00ffcc";
        }
    }
}
window.MarsTelemetry = new TelemetrySystem();

function handleHazard(choice) {
    document.getElementById('hazard-card').classList.add('hidden');
    document.getElementById('visor-container').classList.remove('critical-shake-active');
    if (choice === 'brace') {
        window.MarsTelemetry.shield = Math.max(5, window.MarsTelemetry.shield - 12);
        window.MarsTelemetry.score += 150;
    } else {
        window.MarsTelemetry.score += 300;
    }
    window.isHazardActive = false;
}
