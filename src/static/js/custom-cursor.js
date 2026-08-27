// config
const speedFactor = 0.12;
const speedFactorCursor = 0.35;
const maxScaleCursor = 2;
const speedThreshold = 0.8;
const maxScale = 50;
const positionSmoothingMs = 16;
const scaleSmoothingMs = 140;
const speedSmoothingMs = 20;       

const circle = document.querySelector('.cursor-circle');
const cursor = document.querySelector('.cursor-dot');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let currentX = mouseX, currentY = mouseY;
let lastX = mouseX, lastY = mouseY;
let lastMoveTime = performance.now();

let rawSpeed = 0;
let smoothedSpeed = 0;

let targetScale = 1, currentScale = 1;
let targetScaleCursor = 1, currentScaleCursor = 1;
let currentOpacity = 0;

circle.style.willChange = 'transform, opacity';
cursor.style.willChange = 'transform';

const baseCircleSize = parseFloat(
    getComputedStyle(document.documentElement)
        .getPropertyValue('--cursor-circle-rad')
) || 12;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const now = performance.now();
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const dt = Math.max(now - lastMoveTime, 1);
    rawSpeed = Math.hypot(dx, dy) / dt;

    lastX = mouseX;
    lastY = mouseY;
    lastMoveTime = now;
}, { passive: true });

let lastFrameTime = performance.now();

// saturating curve: rises smoothly, eases into the max instead of snapping
function saturate(x, max) {
    return max * (1 - Math.exp(-x));
}

function animate(now) {
    const dt = Math.min(now - lastFrameTime, 50);
    lastFrameTime = now;

    // decay raw speed toward 0 if no new mousemove this frame (prevents "stuck fast" reading)
    const elapsedSinceMove = now - lastMoveTime;
    const effectiveRawSpeed = elapsedSinceMove > 32 ? 0 : rawSpeed;

    const speedT = 1 - Math.exp(-dt / speedSmoothingMs);
    smoothedSpeed += (effectiveRawSpeed - smoothedSpeed) * speedT;

    if (smoothedSpeed <= speedThreshold) {
        targetScale = 1;
        targetScaleCursor = 1;
    } else {
        const adjustedSpeed = smoothedSpeed - speedThreshold;
        targetScale = 1 + saturate(adjustedSpeed * speedFactor, maxScale - 1);
        targetScaleCursor = 1 + saturate(adjustedSpeed * speedFactorCursor, maxScaleCursor - 1);
    }

    const posT = 1 - Math.exp(-dt / positionSmoothingMs);
    const scaleT = 1 - Math.exp(-dt / scaleSmoothingMs);

    currentX += (mouseX - currentX) * posT;
    currentY += (mouseY - currentY) * posT;
    currentScale += (targetScale - currentScale) * scaleT;
    currentScaleCursor += (targetScaleCursor - currentScaleCursor) * scaleT;

    const opacityStart = 1.0;
    const opacityEnd = 1.5;
    const scaleProgress = (currentScale - opacityStart) / (opacityEnd - opacityStart);
    const targetOpacity = Math.max(0, Math.min(1, scaleProgress));
    currentOpacity += (targetOpacity - currentOpacity) * scaleT;
    const opacity = currentOpacity * 0.85;

    const rx = Math.round(currentX * 100) / 100;
    const ry = Math.round(currentY * 100) / 100;
    const circleSize = baseCircleSize * currentScale;

    circle.style.width = `${circleSize}px`;
    circle.style.height = `${circleSize}px`;
    circle.style.transform =
        `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`; 

    cursor.style.transform =
        `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${currentScaleCursor})`;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);