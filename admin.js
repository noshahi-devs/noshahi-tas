/* =============================================
   NOSHAHI TAS — ADMIN.JS
   Admin Dashboard Logic
   ============================================= */

// ============ MOCK DATA ============
const employees = [
    { id: 1, name: 'Shahmeer Noshahi', email: 'shahmeer@noshahi.com', dept: 'Development', status: 'online', hoursToday: 6.5, hoursWeek: 32.5, activity: 82, screenshots: 24, lastActive: '2 min ago', avatar: 'SN', color: 'FFB800' },
    { id: 2, name: 'Ahmed Khan', email: 'ahmed@noshahi.com', dept: 'Development', status: 'online', hoursToday: 7.0, hoursWeek: 35.0, activity: 78, screenshots: 28, lastActive: 'Just now', avatar: 'AK', color: 'E63946' },
    { id: 3, name: 'Fatima Ali', email: 'fatima@noshahi.com', dept: 'Design', status: 'online', hoursToday: 5.5, hoursWeek: 27.5, activity: 88, screenshots: 22, lastActive: '5 min ago', avatar: 'FA', color: '4CAF50' },
    { id: 4, name: 'Hassan Raza', email: 'hassan@noshahi.com', dept: 'Marketing', status: 'idle', hoursToday: 4.0, hoursWeek: 28.0, activity: 55, screenshots: 16, lastActive: '15 min ago', avatar: 'HR', color: '7C4DFF' },
    { id: 5, name: 'Sara Malik', email: 'sara@noshahi.com', dept: 'QA Testing', status: 'online', hoursToday: 6.0, hoursWeek: 30.0, activity: 75, screenshots: 20, lastActive: '1 min ago', avatar: 'SM', color: 'FF5722' },
    { id: 6, name: 'Usman Sheikh', email: 'usman@noshahi.com', dept: 'Development', status: 'online', hoursToday: 7.5, hoursWeek: 37.5, activity: 90, screenshots: 30, lastActive: 'Just now', avatar: 'US', color: '2196F3' },
    { id: 7, name: 'Ayesha Rizvi', email: 'ayesha@noshahi.com', dept: 'HR', status: 'idle', hoursToday: 3.5, hoursWeek: 24.5, activity: 48, screenshots: 14, lastActive: '20 min ago', avatar: 'AR', color: 'FF9800' },
    { id: 8, name: 'Bilal Farooq', email: 'bilal@noshahi.com', dept: 'Development', status: 'online', hoursToday: 6.0, hoursWeek: 31.0, activity: 72, screenshots: 21, lastActive: '3 min ago', avatar: 'BF', color: '009688' },
    { id: 9, name: 'Zainab Qureshi', email: 'zainab@noshahi.com', dept: 'Design', status: 'online', hoursToday: 5.0, hoursWeek: 29.0, activity: 80, screenshots: 18, lastActive: '7 min ago', avatar: 'ZQ', color: 'E91E63' },
    { id: 10, name: 'Danish Iqbal', email: 'danish@noshahi.com', dept: 'Support', status: 'offline', hoursToday: 0, hoursWeek: 20.0, activity: 0, screenshots: 0, lastActive: '3 hours ago', avatar: 'DI', color: '795548' },
    { id: 11, name: 'Nimra Shah', email: 'nimra@noshahi.com', dept: 'QA Testing', status: 'online', hoursToday: 5.5, hoursWeek: 27.0, activity: 68, screenshots: 19, lastActive: '4 min ago', avatar: 'NS', color: '3F51B5' },
    { id: 12, name: 'Tariq Mehmood', email: 'tariq@noshahi.com', dept: 'Marketing', status: 'offline', hoursToday: 0, hoursWeek: 18.5, activity: 0, screenshots: 0, lastActive: '5 hours ago', avatar: 'TM', color: '607D8B' },
];

const demoScreenshots = [];
for (let i = 0; i < 30; i++) {
    const emp = employees[i % employees.length];
    demoScreenshots.push({
        url: `https://picsum.photos/seed/admin${i}/800/450`,
        employee: emp.name,
        avatar: emp.avatar,
        color: emp.color,
        time: `${9 + Math.floor(i / 3)}:${String((i * 17) % 60).padStart(2, '0')} ${Math.floor(i / 3) + 9 >= 12 ? 'PM' : 'AM'}`,
        activity: Math.floor(Math.random() * 40) + 50,
    });
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    setupNavigation();
    renderOverviewTable();
    renderFullEmployeeTable();
    renderAdminScreenshots();
    renderTeamHourlyChart();
    renderWeeklyCharts();
    renderReportTable();
    populateEmployeeFilter();
});

// ============ NAVIGATION ============
function setupNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchAdminView(link.dataset.view);
        });
    });

    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });
    }
}

function switchAdminView(viewName) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`[data-view="${viewName}"]`);
    if (navLink) navLink.classList.add('active');

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const titles = {
        overview: 'Dashboard Overview',
        employees: 'Employee Management',
        screenshots: 'Team Screenshots',
        reports: 'Activity Reports'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';

    const viewMap = {
        overview: 'overviewView',
        employees: 'employeesView',
        screenshots: 'screenshotsView',
        reports: 'reportsView'
    };
    const viewEl = document.getElementById(viewMap[viewName]);
    if (viewEl) viewEl.classList.add('active');
}

// ============ DATE ============
function updateDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// ============ EMPLOYEE TABLES ============
function getAvatarUrl(emp) {
    return `https://ui-avatars.com/api/?name=${emp.avatar}&background=${emp.color}&color=fff&bold=true&size=80`;
}

function renderEmployeeRow(emp, includeActions) {
    const actClass = emp.activity >= 70 ? 'bg-success' : emp.activity >= 40 ? 'bg-warning' : 'bg-danger';

    let actionsCol = '';
    if (includeActions) {
        actionsCol = `<td>
            <div class="d-flex gap-1">
                <button class="action-btn" title="View Details" onclick="alert('View details for ${emp.name}')"><i class="bi bi-eye"></i></button>
                <button class="action-btn" title="Screenshots" onclick="switchAdminView('screenshots')"><i class="bi bi-camera"></i></button>
            </div>
        </td>`;
    }

    return `<tr class="employee-row">
        <td>
            <div class="employee-info">
                <img src="${getAvatarUrl(emp)}" alt="${emp.name}" class="employee-avatar">
                <div>
                    <div class="employee-name">${emp.name}</div>
                    <div class="employee-email">${emp.email}</div>
                </div>
            </div>
        </td>
        ${includeActions ? `<td>${emp.dept}</td>` : ''}
        <td><span class="status-badge ${emp.status}"><span class="dot"></span>${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}</span></td>
        <td><strong>${emp.hoursToday}h</strong></td>
        ${includeActions ? `<td>${emp.hoursWeek}h</td>` : ''}
        <td>
            <div class="d-flex align-items-center gap-2">
                <div class="progress flex-grow-1" style="height:6px;max-width:80px;background:var(--surface);">
                    <div class="progress-bar ${actClass}" style="width:${emp.activity}%"></div>
                </div>
                <small>${emp.activity}%</small>
            </div>
        </td>
        <td>${emp.screenshots}</td>
        ${includeActions ? '' : `<td class="text-muted" style="font-size:0.8rem;">${emp.lastActive}</td>`}
        ${actionsCol}
    </tr>`;
}

function renderOverviewTable() {
    document.getElementById('overviewEmployeeTable').innerHTML = employees.slice(0, 6).map(e => renderEmployeeRow(e, false)).join('');
}

function renderFullEmployeeTable(filter) {
    let filtered = employees;
    if (filter) {
        const search = (document.getElementById('employeeSearch')?.value || '').toLowerCase();
        const status = document.getElementById('statusFilter')?.value || 'all';

        if (search) {
            filtered = filtered.filter(e => e.name.toLowerCase().includes(search) || e.email.toLowerCase().includes(search) || e.dept.toLowerCase().includes(search));
        }
        if (status !== 'all') {
            filtered = filtered.filter(e => e.status === status);
        }
    }

    document.getElementById('fullEmployeeTable').innerHTML = filtered.map(e => renderEmployeeRow(e, true)).join('');
}

function filterEmployees() {
    renderFullEmployeeTable(true);
}

// ============ ADMIN SCREENSHOTS ============
function renderAdminScreenshots() {
    const grid = document.getElementById('adminScreenshotGrid');
    grid.innerHTML = demoScreenshots.map((ss, i) => {
        const actColor = ss.activity >= 70 ? '#4CAF50' : ss.activity >= 40 ? '#FFB800' : '#E63946';
        return `<div class="col-6 col-md-4 col-lg-3">
            <div class="admin-screenshot-card" onclick="openAdminScreenshot(${i})">
                <img src="${ss.url}" alt="Screenshot" loading="lazy">
                <div class="card-body">
                    <div class="admin-screenshot-meta">
                        <div class="admin-screenshot-user">
                            <img src="https://ui-avatars.com/api/?name=${ss.avatar}&background=${ss.color}&color=fff&size=48" alt="${ss.employee}">
                            <span>${ss.employee.split(' ')[0]}</span>
                        </div>
                        <span class="screenshot-activity-badge" style="background:${actColor}">${ss.activity}%</span>
                    </div>
                    <div class="screenshot-time mt-1"><i class="bi bi-clock"></i> ${ss.time}</div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openAdminScreenshot(index) {
    const ss = demoScreenshots[index];
    document.getElementById('ssModalImg').src = ss.url;
    document.getElementById('ssModalTitle').textContent = `${ss.employee} — ${ss.time}`;
    document.getElementById('ssModalInfo').textContent = `Employee: ${ss.employee} · Time: ${ss.time} · Activity: ${ss.activity}%`;
    new bootstrap.Modal(document.getElementById('screenshotModal')).show();
}

function populateEmployeeFilter() {
    const select = document.getElementById('screenshotEmployeeFilter');
    employees.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = e.name;
        select.appendChild(opt);
    });
}

function filterScreenshots() {
    const empFilter = document.getElementById('screenshotEmployeeFilter').value;
    const grid = document.getElementById('adminScreenshotGrid');
    const cards = grid.querySelectorAll('.col-6');

    cards.forEach((card, i) => {
        if (empFilter === 'all' || demoScreenshots[i].employee === empFilter) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ============ TEAM HOURLY CHART ============
function renderTeamHourlyChart() {
    const chart = document.getElementById('teamHourlyChart');
    const labels = document.getElementById('teamHourlyLabels');

    const hourlyData = [0, 0, 0, 0, 0, 0, 25, 45, 65, 78, 82, 70, 55, 62, 80, 85, 75, 60, 30, 0, 0, 0, 0, 0];
    const startHour = 6;
    const endHour = 19;

    let barsHtml = '';
    let labelsHtml = '';

    for (let h = startHour; h <= endHour; h++) {
        const val = hourlyData[h];
        const height = Math.max(4, (val / 100) * 170);

        let color = 'var(--border-color)';
        if (val > 0) {
            if (val >= 70) color = 'linear-gradient(to top, #4CAF50, #66BB6A)';
            else if (val >= 40) color = 'linear-gradient(to top, #FFB800, #FFD54F)';
            else color = 'linear-gradient(to top, #E63946, #EF5350)';
        }

        barsHtml += `<div class="hourly-bar" style="height:${height}px;background:${color};">
            <div class="tooltip-text">${h}:00 — ${val}% avg</div>
        </div>`;

        const label = h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
        labelsHtml += `<span>${label}</span>`;
    }

    chart.innerHTML = barsHtml;
    labels.innerHTML = labelsHtml;
}

// ============ WEEKLY CHARTS ============
function renderWeeklyCharts() {
    const hoursChart = document.getElementById('weeklyHoursChart');
    const activityChart = document.getElementById('weeklyActivityChart');

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hoursData = [82, 88, 75, 90, 86.5];
    const activityData = [68, 74, 70, 78, 72];
    const maxHours = Math.max(...hoursData);

    // Hours bar chart
    hoursChart.innerHTML = `<div class="weekly-bar-chart">
        ${days.map((day, i) => {
        const height = Math.max(8, (hoursData[i] / maxHours) * 180);
        return `<div class="weekly-bar-group">
                <div class="weekly-bar-value">${hoursData[i]}h</div>
                <div class="weekly-bar" style="height:${height}px;background:linear-gradient(to top, var(--primary), var(--primary-dark));width:100%;"></div>
                <div class="weekly-bar-label">${day}</div>
            </div>`;
    }).join('')}
    </div>`;

    // Activity trend circles
    activityChart.innerHTML = `<div class="activity-trend">
        ${days.map((day, i) => {
        const val = activityData[i];
        let bg = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
        if (val < 40) bg = 'linear-gradient(135deg, #E63946, #C62828)';
        else if (val < 70) bg = 'linear-gradient(135deg, #FFB800, #FF8C00)';

        return `<div class="trend-day">
                <div class="trend-circle" style="background:${bg};">${val}%</div>
                <div class="trend-label">${day}</div>
                <div class="trend-hours">${hoursData[i]}h tracked</div>
            </div>`;
    }).join('')}
    </div>`;
}

// ============ REPORT TABLE ============
function renderReportTable() {
    const tbody = document.getElementById('reportTable');

    tbody.innerHTML = employees.map(emp => {
        const dailyHours = [
            (Math.random() * 4 + 4).toFixed(1),
            (Math.random() * 4 + 4).toFixed(1),
            (Math.random() * 4 + 4).toFixed(1),
            (Math.random() * 4 + 4).toFixed(1),
            (Math.random() * 4 + 3).toFixed(1),
        ];

        if (emp.status === 'offline' && emp.hoursToday === 0) {
            dailyHours[4] = '0.0';
        }

        const total = dailyHours.reduce((s, v) => s + parseFloat(v), 0).toFixed(1);
        const avgActivity = emp.status === 'offline' ? Math.floor(Math.random() * 20 + 30) : emp.activity;
        const actClass = avgActivity >= 70 ? 'text-success' : avgActivity >= 40 ? 'text-warning' : 'text-danger';

        return `<tr>
            <td>
                <div class="employee-info">
                    <img src="${getAvatarUrl(emp)}" alt="${emp.name}" class="employee-avatar" style="width:30px;height:30px;">
                    <div>
                        <div class="employee-name" style="font-size:0.82rem;">${emp.name}</div>
                    </div>
                </div>
            </td>
            ${dailyHours.map(h => `<td style="font-size:0.85rem;">${h}h</td>`).join('')}
            <td><strong style="color:var(--primary);">${total}h</strong></td>
            <td class="${actClass}" style="font-weight:600;">${avgActivity}%</td>
        </tr>`;
    }).join('');
}
