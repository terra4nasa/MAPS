const canvas = document.getElementById('environmentCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mCtx = minimapCanvas.getContext('2d');
const walkBtn = document.getElementById('walkBtn');
const distanceTxt = document.getElementById('distance-txt');

let distanceWalked = 0; let isWalking = false; let stepCycle = 0;
const totalPathLength = 1000; const horizonPoints = [];

// Dynamic game variables
let targetMineral = { x: 0, y: 0, scale: 0, active: false, name: 'OLIVINE' };
window.isHazardActive = false;

function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    minimapCanvas.width = 200; minimapCanvas.height = 200;
}
function setupHorizon() {
    horizonPoints.length = 0;
    for (let i = 0; i <= 50; i++) horizonPoints.push(canvas.height * 0.45 + Math.sin(i * 0.4) * 12);
}
window.addEventListener('resize', () => { resize(); setupHorizon(); });
resize(); setupHorizon();

window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'w' && !window.isHazardActive) isWalking = true; });
window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() === 'w') isWalking = false; });
walkBtn.addEventListener('mousedown', () => { if(!window.isHazardActive) isWalking = true; });
window.addEventListener('mouseup', () => isWalking = false);
walkBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if(!window.isHazardActive) isWalking = true; });
walkBtn.addEventListener('touchend', () => isWalking = false);

function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isWalking) { distanceWalked += 0.6; stepCycle += 0.15; }
    if (window.MarsTelemetry) window.MarsTelemetry.update(isWalking);

    let bob = isWalking ? Math.sin(stepCycle) * 6 : 0;
    let horizonY = canvas.height * 0.5 + bob;

    // Draw Background Sky & Mars Terrain
    ctx.fillStyle = '#cc6644'; ctx.fillRect(0, 0, canvas.width, horizonY);
    ctx.fillStyle = '#441100'; ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    // Draw Mountains
    ctx.fillStyle = '#2d0b00'; ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
        let x = (canvas.width / 50) * i;
        let y = horizonPoints[i] + bob;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, horizonY); ctx.lineTo(0, horizonY); ctx.fill();

    // 3D Perspective Path Grid System
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)'; ctx.lineWidth = 2;
    let pathCenter = canvas.width / 2;
    ctx.beginPath();
    ctx.moveTo(pathCenter - 220, canvas.height); ctx.lineTo(pathCenter - 10, horizonY);
    ctx.moveTo(pathCenter + 220, canvas.height); ctx.lineTo(pathCenter + 10, horizonY);
    ctx.stroke();

    // Procedural Mineral Spawning Logic
    if (!targetMineral.active && Math.random() < 0.006 && isWalking) {
        const types = ['HEMATITE', 'OLIVINE', 'REGOLITH', 'BASALT'];
        targetMineral = { x: pathCenter + (Math.random() - 0.5) * 100, y: horizonY, scale: 0.01, active: true, name: types[Math.floor(Math.random() * types.length)] };
    }

    // Render & Expand Spawned Rock Sample
    if (targetMineral.active) {
        if (isWalking) { targetMineral.y += 3.5; targetMineral.scale += 0.016; }
        ctx.fillStyle = '#00bbff'; ctx.shadowBlur = 15; ctx.shadowColor = '#00bbff';
        ctx.beginPath();
        ctx.arc(targetMineral.x, targetMineral.y, 45 * targetMineral.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (targetMineral.y > canvas.height - 100) {
            if (window.MarsTelemetry) window.MarsTelemetry.collectMineral(targetMineral.name);
            targetMineral.active = false;
        }
    }

    // Weather Hazard Triggers
    if (!window.isHazardActive && Math.random() < 0.0015 && isWalking) {
        window.isHazardActive = true; isWalking = false;
        document.getElementById('hazard-card').classList.remove('hidden');
    }

    if (window.isHazardActive && !document.getElementById('hazard-card').classList.contains('hidden')) {
        ctx.fillStyle = 'rgba(255, 51, 51, 0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if (window.MarsTelemetry) window.MarsTelemetry.triggerStormDamage();
    }

    // Minimap Radar Generation
    mCtx.clearRect(0,0,200,200);
    mCtx.strokeStyle = 'rgba(0, 255, 204, 0.4)'; mCtx.beginPath();
    mCtx.arc(100,100,80,0,Math.PI*2); mCtx.moveTo(100,10); mCtx.lineTo(100,190); mCtx.stroke();
    mCtx.fillStyle = '#ff3333'; mCtx.beginPath();
    mCtx.arc(100, 170 - (distanceWalked / totalPathLength) * 140, 4, 0, Math.PI*2); mCtx.fill();

    let remaining = Math.max(0, Math.floor(totalPathLength - distanceWalked));
    distanceTxt.innerText = `NEXT WP: ${remaining}m`;
    
    if (remaining <= 0) {
        distanceTxt.innerText = "MISSION COMPLETED";
        isWalking = false;
    }

    requestAnimationFrame(renderLoop);
}
renderLoop();
