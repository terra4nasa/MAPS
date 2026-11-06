const canvas = document.getElementById('environmentCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mCtx = minimapCanvas.getContext('2d');
const walkBtn = document.getElementById('walkBtn');
const distanceTxt = document.getElementById('distance-txt');

let distanceWalked = 0; let isWalking = false; let stepCycle = 0;
const totalPathLength = 1000; const horizonPoints = [];

let targetMineral = { x: 0, y: 0, scale: 0, active: false, name: 'JEZERO-REGOLITH' };
const particleArray = [];
window.isHazardActive = false;

function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    minimapCanvas.width = 180; minimapCanvas.height = 180;
}
function setupHorizon() {
    horizonPoints.length = 0;
    for (let i = 0; i <= 50; i++) horizonPoints.push(canvas.height * 0.48 + Math.sin(i * 0.3) * 10);
}
window.addEventListener('resize', () => { resize(); setupHorizon(); });
resize(); setupHorizon();

for(let i=0; i<40; i++) {
    particleArray.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, sz: Math.random() * 2 + 0.5, sp: Math.random() * 2 + 1 });
}

window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'w' && !window.isHazardActive) isWalking = true; });
window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() === 'w') isWalking = false; });
walkBtn.addEventListener('mousedown', () => { if(!window.isHazardActive) isWalking = true; });
window.addEventListener('mouseup', () => isWalking = false);

function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isWalking) { distanceWalked += 0.6; stepCycle += 0.15; }
    if (window.MarsTelemetry) window.MarsTelemetry.update(isWalking);

    let bob = isWalking ? Math.sin(stepCycle) * 5 : 0;
    let horizonY = canvas.height * 0.52 + bob;

    let skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#2d140f'); skyGrad.addColorStop(1, '#693627');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, horizonY);

    let groundGrad = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    groundGrad.addColorStop(0, '#3d160c'); groundGrad.addColorStop(1, '#170703');
    ctx.fillStyle = groundGrad; ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    ctx.fillStyle = '#210a05'; ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
        let x = (canvas.width / 50) * i;
        let y = horizonPoints[i] + bob;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, horizonY); ctx.lineTo(0, horizonY); ctx.fill();

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)'; ctx.lineWidth = 2;
    let cx = canvas.width / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 280, canvas.height); ctx.lineTo(cx - 8, horizonY);
    ctx.moveTo(cx + 280, canvas.height); ctx.lineTo(cx + 8, horizonY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
    let lineSpacing = 35;
    let dynamicShift = (distanceWalked * 6) % lineSpacing;
    for (let y = horizonY; y < canvas.height; y += lineSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y + dynamicShift); ctx.lineTo(canvas.width, y + dynamicShift); ctx.stroke();
    }

    if (!targetMineral.active && Math.random() < 0.006 && isWalking) {
        const types = ['HEMATITE CORES', 'OLIVINE CRYSTALS', 'REGOLITH MATRIX'];
        targetMineral = { x: cx + (Math.random() - 0.5) * 120, y: horizonY, scale: 0.01, active: true, name: types[Math.floor(Math.random() * types.length)] };
    }

    if (targetMineral.active) {
        if (isWalking) { targetMineral.y += 3.5; targetMineral.scale += 0.016; }
        let itemRadius = 30 * targetMineral.scale;
        
        ctx.strokeStyle = 'rgba(0,187,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(targetMineral.x, targetMineral.y, itemRadius + 6, 0, Math.PI*2); ctx.stroke();
        
        ctx.fillStyle = '#ff9900'; ctx.beginPath();
        ctx.arc(targetMineral.x, targetMineral.y, itemRadius, 0, Math.PI * 2); ctx.fill();

        if (targetMineral.y > canvas.height - 110) {
            if (window.MarsTelemetry) window.MarsTelemetry.collectMineral(targetMineral.name);
            targetMineral.active = false;
        }
    }

    if (!window.isHazardActive && Math.random() < 0.0025 && isWalking) {
        window.isHazardActive = true; isWalking = false;
        document.getElementById('visor-container').classList.add('critical-shake-active');
        document.getElementById('hazard-card').classList.remove('hidden');
    }
    if (window.isHazardActive && !document.getElementById('hazard-card').classList.contains('hidden')) {
        if (window.MarsTelemetry) window.MarsTelemetry.triggerStormDamage();
    }

    ctx.fillStyle = 'rgba(223, 122, 94, 0.4)';
    particleArray.forEach(p => {
        p.x -= p.sp * (isWalking ? 2.5 : 1);
        if (p.x < 0) { p.x = canvas.width; p.y = Math.random() * canvas.height; }
        ctx.fillRect(p.x, p.y, p.sz, p.sz);
    });

    mCtx.clearRect(0,0,180,180);
    mCtx.strokeStyle = 'rgba(0, 255, 204, 0.2)'; mCtx.lineWidth = 1;
    mCtx.beginPath(); mCtx.arc(90,90,75,0,Math.PI*2); mCtx.arc(90,90,40,0,Math.PI*2); mCtx.stroke();
    mCtx.beginPath(); mCtx.moveTo(90,5); mCtx.lineTo(90,175); mCtx.moveTo(5,90); mCtx.lineTo(175,90); mCtx.stroke();
    
    mCtx.strokeStyle = 'var(--hud-primary)'; mCtx.lineWidth = 2; mCtx.beginPath();
    mCtx.moveTo(90, 150); mCtx.bezierCurveTo(95, 110, 80, 70, 90, 25); mCtx.stroke();

    mCtx.fillStyle = '#ff3333'; mCtx.beginPath();
    let trackRatio = distanceWalked / totalPathLength;
    mCtx.arc(90 + Math.sin(trackRatio * Math.PI) * 6, 150 - (trackRatio * 125), 4, 0, Math.PI*2); mCtx.fill();

    let remaining = Math.max(0, Math.floor(totalPathLength - distanceWalked));
    distanceTxt.innerText = `NEXT WP: ${remaining}m`;
    if (remaining <= 0) { distanceTxt.innerText = "ARRIVED AT HABITAT 1"; isWalking = false; }

    requestAnimationFrame(renderLoop);
}
renderLoop();
