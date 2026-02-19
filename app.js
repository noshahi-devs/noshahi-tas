/* =============================================
   NOSHAHI TAS — APP.JS
   Employee Desktop Tracker Logic
   ============================================= */

// ============ STATE ============
let isTracking = false;
let timerInterval = null;
let elapsedSeconds = 0;
let sessions = [];
let screenshots = [];
let activityLog = [];
let keystrokes = 0;
let mouseClickCount = 0;
let mouseDistanceTotal = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let screenshotInterval = null;
let activitySampleInterval = null;
let hourlyActivity = new Array(24).fill(0);

// Demo screenshot images (placeholder)
const demoScreenshots = [
    'https://picsum.photos/seed/screen1/800/450',
    'https://picsum.photos/seed/screen2/800/450',
    'https://picsum.photos/seed/screen3/800/450',
    'https://picsum.photos/seed/screen4/800/450',
    'https://picsum.photos/seed/screen5/800/450',
    'https://picsum.photos/seed/screen6/800/450',
    'https://picsum.photos/seed/screen7/800/450',
    'https://picsum.photos/seed/screen8/800/450',
    'https://picsum.photos/seed/screen9/800/450',
    'https://picsum.photos/seed/screen10/800/450',
];

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    setupNavigation();
    setupActivityListeners();
    loadFromStorage();
    renderHourlyChart();
    updateAllStats();

    // Pre-populate some demo data
    if (sessions.length === 0) {
        generateDemoData();
    }
});

// ============ NAVIGATION ============
function setupNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.dataset.view;
            switchView(viewName);
        });
    });

    // Sidebar toggle for mobile
    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });
    }
}

function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const titles = { timer: 'Time Tracker', screenshots: 'Screenshots', activity: 'Activity Levels' };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';

    const viewMap = { timer: 'timerView', screenshots: 'screenshotsView', activity: 'activityView' };
    const viewEl = document.getElementById(viewMap[viewName]);
    if (viewEl) {
        viewEl.classList.add('active');
    }
}

// ============ DATE ============
function updateDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// ============ TIMER ============
function toggleTimer() {
    if (isTracking) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isTracking = true;
    const btn = document.getElementById('timerBtn');
    const icon = document.getElementById('timerIcon');
    const text = document.getElementById('timerBtnText');
    const card = document.querySelector('.timer-card');

    btn.classList.add('running');
    icon.className = 'bi bi-stop-fill';
    text.textContent = 'Stop Working';
    card.classList.add('recording');

    elapsedSeconds = 0;
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);

    // Start screenshot captures (every 30s for demo — normally 5 min)
    screenshotInterval = setInterval(() => captureScreenshot(), 30000);

    // Start activity sampling
    activitySampleInterval = setInterval(() => sampleActivity(), 5000);

    addActivityLogEntry('screenshot', 'Tracking started', 'Session began');
}

function stopTimer() {
    isTracking = false;
    const btn = document.getElementById('timerBtn');
    const icon = document.getElementById('timerIcon');
    const text = document.getElementById('timerBtnText');
    const card = document.querySelector('.timer-card');

    btn.classList.remove('running');
    icon.className = 'bi bi-play-fill';
    text.textContent = 'Start Working';
    card.classList.remove('recording');

    clearInterval(timerInterval);
    clearInterval(screenshotInterval);
    clearInterval(activitySampleInterval);

    // Save session
    if (elapsedSeconds > 0) {
        const project = document.getElementById('projectSelect').value;
        const now = new Date();
        const startTime = new Date(now.getTime() - elapsedSeconds * 1000);
        const activity = Math.floor(Math.random() * 40) + 50; // 50-90%

        sessions.push({
            project: project,
            startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            endTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: formatDuration(elapsedSeconds),
            durationSeconds: elapsedSeconds,
            activity: activity
        });

        renderSessions();
        updateAllStats();
        saveToStorage();
    }

    addActivityLogEntry('screenshot', 'Tracking stopped', `Worked for ${formatDuration(elapsedSeconds)}`);
    elapsedSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${h}:${m}:${s}`;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// ============ SESSIONS ============
function renderSessions() {
    const tbody = document.getElementById('sessionHistory');
    if (sessions.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="5" class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted mt-2 mb-0">No sessions yet today. Click Start to begin!</p></td></tr>`;
        return;
    }

    tbody.innerHTML = sessions.map(s => {
        const actClass = s.activity >= 70 ? 'bg-success' : s.activity >= 40 ? 'bg-warning' : 'bg-danger';
        return `<tr>
            <td><strong>${s.project}</strong></td>
            <td>${s.startTime}</td>
            <td>${s.endTime}</td>
            <td><span class="badge bg-accent">${s.duration}</span></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height:6px;background:var(--surface);">
                        <div class="progress-bar ${actClass}" style="width:${s.activity}%"></div>
                    </div>
                    <small>${s.activity}%</small>
                </div>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('sessionCount').textContent = `${sessions.length} session${sessions.length > 1 ? 's' : ''}`;
}

// ============ SCREENSHOTS ============
function captureScreenshot() {
    if (!isTracking) return;

    const now = new Date();
    const imgUrl = demoScreenshots[screenshots.length % demoScreenshots.length];
    const activity = Math.floor(Math.random() * 50) + 40;

    screenshots.push({
        url: imgUrl,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: now.toLocaleDateString(),
        activity: activity
    });

    renderScreenshots();
    updateAllStats();
    addActivityLogEntry('screenshot', 'Screenshot captured', `Activity: ${activity}%`);
    saveToStorage();
}

function renderScreenshots() {
    const grid = document.getElementById('screenshotGrid');
    const noScreenshots = document.getElementById('noScreenshots');

    if (screenshots.length === 0) {
        grid.innerHTML = '';
        noScreenshots.style.display = 'block';
        return;
    }

    noScreenshots.style.display = 'none';
    grid.innerHTML = screenshots.slice().reverse().map((ss, i) => {
        const actColor = ss.activity >= 70 ? '#4CAF50' : ss.activity >= 40 ? '#FFB800' : '#E63946';
        return `<div class="col-6 col-md-4 col-lg-3">
            <div class="screenshot-item" onclick="openScreenshot(${screenshots.length - 1 - i})">
                <div class="screenshot-thumb">
                    <img src="${ss.url}" alt="Screenshot" loading="lazy">
                    <div class="overlay">
                        <span class="screenshot-activity-badge" style="background:${actColor}">${ss.activity}% active</span>
                    </div>
                </div>
                <div class="screenshot-time">
                    <i class="bi bi-clock"></i> ${ss.time}
                </div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('totalCaptures').textContent = screenshots.length;
}

function openScreenshot(index) {
    const ss = screenshots[index];
    document.getElementById('screenshotModalImg').src = ss.url;
    document.getElementById('screenshotModalTitle').textContent = `Screenshot — ${ss.time}`;
    document.getElementById('screenshotModalTime').textContent = `Captured at ${ss.time} · Activity: ${ss.activity}%`;
    new bootstrap.Modal(document.getElementById('screenshotModal')).show();
}

// ============ ACTIVITY TRACKING ============
function setupActivityListeners() {
    // Keyboard
    document.addEventListener('keydown', () => {
        if (!isTracking) return;
        keystrokes++;
        updateActivityDisplay();
    });

    // Mouse click
    document.addEventListener('click', () => {
        if (!isTracking) return;
        mouseClickCount++;
        updateActivityDisplay();
    });

    // Mouse move
    document.addEventListener('mousemove', (e) => {
        if (!isTracking) return;
        if (lastMouseX && lastMouseY) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            mouseDistanceTotal += Math.sqrt(dx * dx + dy * dy);
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        updateActivityDisplay();
    });
}

function sampleActivity() {
    if (!isTracking) return;
    const hour = new Date().getHours();
    const activity = calculateOverallActivity();
    hourlyActivity[hour] = Math.max(hourlyActivity[hour], activity);
    renderHourlyChart();

    if (keystrokes > 10) {
        addActivityLogEntry('keyboard', 'Keyboard burst', `${keystrokes} keystrokes detected`);
    }
    if (mouseClickCount > 5) {
        addActivityLogEntry('mouse', 'Mouse activity', `${mouseClickCount} clicks, ${Math.round(mouseDistanceTotal)}px moved`);
    }
}

function calculateOverallActivity() {
    // Simple simulation: based on events count
    const kbActivity = Math.min(100, keystrokes * 2);
    const mouseActivity = Math.min(100, mouseClickCount * 5 + mouseDistanceTotal / 100);
    return Math.round((kbActivity + mouseActivity) / 2);
}

function updateActivityDisplay() {
    const kbPercent = Math.min(100, keystrokes * 2);
    const mousePercent = Math.min(100, mouseClickCount * 5 + Math.min(50, mouseDistanceTotal / 200));
    const overall = Math.round((kbPercent + mousePercent) / 2);

    // Update gauges
    document.getElementById('keyboardBar').style.width = kbPercent + '%';
    document.getElementById('keyboardValue').textContent = Math.round(kbPercent) + '%';
    document.getElementById('keystrokes').textContent = keystrokes;

    document.getElementById('mouseBar').style.width = mousePercent + '%';
    document.getElementById('mouseValue').textContent = Math.round(mousePercent) + '%';
    document.getElementById('mouseClicks').textContent = mouseClickCount;
    document.getElementById('mouseDistance').textContent = Math.round(mouseDistanceTotal);

    // Overall gauge ring
    const circle = document.getElementById('gaugeCircle');
    if (circle) {
        const circumference = 326.7;
        const offset = circumference - (circumference * overall / 100);
        circle.style.strokeDashoffset = offset;
    }
    document.getElementById('gaugeValue').textContent = overall + '%';

    // Update stat card
    document.getElementById('statActivity').textContent = overall + '%';
}

// ============ HOURLY CHART ============
function renderHourlyChart() {
    const chart = document.getElementById('hourlyChart');
    const labels = document.getElementById('hourlyLabels');
    const currentHour = new Date().getHours();

    // Show work hours 6AM - 11PM
    const startHour = 6;
    const endHour = 23;

    let barsHtml = '';
    let labelsHtml = '';

    for (let h = startHour; h <= endHour; h++) {
        const val = hourlyActivity[h] || 0;
        const height = Math.max(4, (val / 100) * 170);
        const isCurrent = h === currentHour;

        let color = 'var(--border-color)';
        if (val > 0) {
            if (val >= 70) color = 'linear-gradient(to top, #4CAF50, #66BB6A)';
            else if (val >= 40) color = 'linear-gradient(to top, #FFB800, #FFD54F)';
            else color = 'linear-gradient(to top, #E63946, #EF5350)';
        }

        barsHtml += `<div class="hourly-bar${isCurrent ? ' current' : ''}" style="height:${height}px;background:${color};${isCurrent ? 'border:1px solid var(--primary);' : ''}">
            <div class="tooltip-text">${h}:00 — ${val}%</div>
        </div>`;

        const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
        labelsHtml += `<span${isCurrent ? ' style="color:var(--primary);font-weight:600;"' : ''}>${label}</span>`;
    }

    chart.innerHTML = barsHtml;
    labels.innerHTML = labelsHtml;
}

// ============ ACTIVITY LOG ============
function addActivityLogEntry(type, title, detail) {
    const now = new Date();
    activityLog.unshift({
        type: type,
        title: title,
        detail: detail,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Keep only last 50
    if (activityLog.length > 50) activityLog = activityLog.slice(0, 50);

    renderActivityLog();
}

function renderActivityLog() {
    const container = document.getElementById('activityLog');
    document.getElementById('activityLogCount').textContent = `${activityLog.length} events`;

    if (activityLog.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-muted">
            <i class="bi bi-activity" style="font-size: 2rem;"></i>
            <p class="mt-2 mb-0">Activity will appear here when tracking starts</p></div>`;
        return;
    }

    container.innerHTML = activityLog.map(log => `<div class="log-item">
        <div class="log-icon ${log.type}">
            <i class="bi bi-${log.type === 'keyboard' ? 'keyboard' : log.type === 'mouse' ? 'mouse' : 'camera'}"></i>
        </div>
        <div class="log-text"><strong>${log.title}</strong> — ${log.detail}</div>
        <div class="log-time">${log.time}</div>
    </div>`).join('');
}

// ============ STATS ============
function updateAllStats() {
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const totalFormatted = formatHoursMinutes(totalSeconds);

    document.getElementById('todayTotal').textContent = totalFormatted;
    document.getElementById('weekTotal').textContent = totalFormatted; // Same for demo
    document.getElementById('statToday').textContent = totalFormatted;
    document.getElementById('statScreenshots').textContent = screenshots.length;
    document.getElementById('statSessions').textContent = sessions.length;
}

function formatHoursMinutes(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

// ============ DEMO DATA ============
function generateDemoData() {
    // Pre-populate some sessions
    const demoSessions = [
        { project: 'Noshahi TAS — Development', startTime: '09:00 AM', endTime: '11:30 AM', duration: '2h 30m', durationSeconds: 9000, activity: 78 },
        { project: 'Client Website Redesign', startTime: '11:45 AM', endTime: '01:15 PM', duration: '1h 30m', durationSeconds: 5400, activity: 65 },
        { project: 'Noshahi TAS — Development', startTime: '02:00 PM', endTime: '04:45 PM', duration: '2h 45m', durationSeconds: 9900, activity: 82 },
    ];

    sessions = demoSessions;

    // Pre-populate screenshots
    for (let i = 0; i < 6; i++) {
        screenshots.push({
            url: demoScreenshots[i],
            time: `${9 + Math.floor(i * 1.5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`,
            date: new Date().toLocaleDateString(),
            activity: Math.floor(Math.random() * 40) + 50
        });
    }

    // Pre-populate hourly activity
    hourlyActivity[9] = 75;
    hourlyActivity[10] = 82;
    hourlyActivity[11] = 68;
    hourlyActivity[12] = 45;
    hourlyActivity[13] = 60;
    hourlyActivity[14] = 85;
    hourlyActivity[15] = 78;
    hourlyActivity[16] = 72;

    // Pre-populate activity metrics
    keystrokes = 2450;
    mouseClickCount = 340;
    mouseDistanceTotal = 48500;

    renderSessions();
    renderScreenshots();
    renderHourlyChart();
    updateActivityDisplay();
    updateAllStats();
    saveToStorage();
}

// ============ LOCAL STORAGE ============
function saveToStorage() {
    try {
        localStorage.setItem('noshahi_sessions', JSON.stringify(sessions));
        localStorage.setItem('noshahi_screenshots', JSON.stringify(screenshots));
        localStorage.setItem('noshahi_hourly', JSON.stringify(hourlyActivity));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const savedSessions = localStorage.getItem('noshahi_sessions');
        const savedScreenshots = localStorage.getItem('noshahi_screenshots');
        const savedHourly = localStorage.getItem('noshahi_hourly');

        if (savedSessions) sessions = JSON.parse(savedSessions);
        if (savedScreenshots) screenshots = JSON.parse(savedScreenshots);
        if (savedHourly) hourlyActivity = JSON.parse(savedHourly);

        renderSessions();
        renderScreenshots();
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}
