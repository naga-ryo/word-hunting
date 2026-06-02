let startTime;
let intervalId;
let elapsed = 0;

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function updateDisplay() {
    const now = Date.now();
    const diff = now - startTime + elapsed;
    document.getElementById('timer').textContent = formatTime(diff);
}

function startTimer() {
    if (!intervalId) {
    startTime = Date.now();
    intervalId = setInterval(updateDisplay, 100);
    }
}

function stopTimer() {
    if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    elapsed += Date.now() - startTime;
    }
    return formatTime(elapsed);
}