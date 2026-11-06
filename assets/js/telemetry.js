class TelemetrySystem {
    constructor() { this.oxygen = 100; this.basePressure = 34.5; this.baseTemperature = -62; }
    update(isMoving) {
        if (isMoving) { this.oxygen = Math.max(0, this.oxygen - 0.004); }
        else { this.oxygen = Math.max(0, this.oxygen - 0.001); }
        const microFluctuation = (Math.random() - 0.5) * 0.1;
        const targetPressure = this.basePressure + microFluctuation;
        const targetTemp = this.baseTemperature + (isMoving ? 1 : 0) + (Math.random() - 0.5) * 0.4;
        document.getElementById('o2-bar').style.width = `${this.oxygen.toFixed(1)}%`;
        document.getElementById('pressure-txt').innerText = `Suit Pressure: ${targetPressure.toFixed(2)} kPa`;
        document.getElementById('thermal-txt').innerText = `Thermal Flux: ${targetTemp.toFixed(1)}°C`;
    }
}
window.MarsTelemetry = new TelemetrySystem();