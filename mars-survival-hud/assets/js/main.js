const canvas = document.getElementById('environmentCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mCtx = minimapCanvas.getContext('2d');
const walkBtn = document.getElementById('walkBtn');
const distanceTxt = document.getElementById('distance-txt');
let distanceWalked = 0, isWalking = false, stepCycle = 0;
const totalPathLength = 500, horizonPoints = [];
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; minimapCanvas.width = 200; minimapCanvas.height = 200; }
function generateHorizon() { horizonPoints.length = 0; for (let i = 0; i <= 50; i++) { horizonPoints.push(canvas.height * 0.45 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.2) * 10); } }
window.addEventListener('resize', () => { resize(); generateHorizon(); });
resize(); generateHorizon();
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'w') isWalking = true; });
window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() === 'w') isWalking = false; });
walkBtn.addEventListener('mousedown', () => isWalking = true);
walkBtn.addEventListener('mouseup', () => isWalking = false);
walkBtn.addEventListener('mouseleave', () => isWalking = false);
function engineTick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isWalking) { distanceWalked += 0.4; stepCycle += 0.15; }
    if (window.MarsTelemetry) { window.MarsTelemetry.update(isWalking); }
    let headBob = isWalking ? Math.sin(stepCycle) * 7 : 0;
    let horizonY = canvas.height * 0.5 + headBob;
    let skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#4a251b'); skyGrad.addColorStop(1, '#df7a5e');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, horizonY);
    let groundGrad = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    groundGrad.addColorStop(0, '#5c2c16'); groundGrad.addColorStop(1, '#240f06');
    ctx.fillStyle = groundGrad; ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);
    ctx.beginPath(); ctx.fillStyle = '#3a1a0e';
    for (let i = 0; i <= 50; i++) {
        let x = (canvas.width / 50) * i; let y = horizonPoints[i] + headBob;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, horizonY); ctx.lineTo(0, horizonY); ctx.fill();
    ctx.save(); ctx.lineWidth = 4; ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc'; ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)'; ctx.fillStyle = 'rgba(0, 255, 204, 0.05)'; ctx.beginPath();
    let centerX = canvas.width / 2, startWidth = 240;
    ctx.moveTo(centerX - startWidth - (Math.sin(distanceWalked * 0.02) * 100), canvas.height);
    ctx.bezierCurveTo(centerX - 50, canvas.height * 0.75 + headBob, centerX - 10 + (Math.cos(distanceWalked * 0.01) * 30), horizonY + 10, centerX + (Math.cos(distanceWalked * 0.01) * 30), horizonY);
    ctx.lineTo(centerX + 5 + (Math.cos(distanceWalked * 0.01) * 30), horizonY);
    ctx.bezierCurveTo(centerX + 10 + (Math.cos(distanceWalked * 0.01) * 30), horizonY + 10, centerX + 50, canvas.height * 0.75 + headBob, centerX + startWidth - (Math.sin(distanceWalked * 0.02) * 100), canvas.height);
    ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    drawTacticalMinimap();
    let distanceRemaining = Math.max(0, Math.floor(totalPathLength - distanceWalked));
    distanceTxt.innerText = `NEXT WP: ${distanceRemaining}m`;
    if (distanceRemaining <= 0) { distanceTxt.innerText = "ARRIVED AT HABITAT 1"; isWalking = false; }
    requestAnimationFrame(engineTick);
}
function drawTacticalMinimap() {
    mCtx.clearRect(0, 0, 200, 200); mCtx.strokeStyle = 'rgba(0, 255, 204, 0.3)'; mCtx.lineWidth = 1;
    mCtx.beginPath(); mCtx.arc(100, 100, 80, 0, Math.PI * 2); mCtx.stroke();
    mCtx.beginPath(); mCtx.arc(100, 100, 40, 0, Math.PI * 2); mCtx.stroke();
    mCtx.strokeStyle = '#00ffcc'; mCtx.lineWidth = 3; mCtx.beginPath(); mCtx.moveTo(100, 160); mCtx.bezierCurveTo(110, 120, 80, 80, 100, 30); mCtx.stroke();
    mCtx.fillStyle = '#ff3333'; let trackRatio = distanceWalked / totalPathLength;
    let dotY = 160 - (trackRatio * 130), dotX = 100 + Math.sin(trackRatio * Math.PI) * 10;
    mCtx.beginPath(); mCtx.arc(dotX, dotY, 5, 0, Math.PI * 2); mCtx.fill();
}
engineTick();