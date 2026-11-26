let dailyMealLog = JSON.parse(localStorage.getItem('hallDailyMealLog')) || {};

function openNavDrawer() {
  document.getElementById('left-drawer').classList.add('open');
  document.getElementById('nav-overlay').classList.add('active');
}

function closeNavDrawer() {
  document.getElementById('left-drawer').classList.remove('open');
  document.getElementById('nav-overlay').classList.remove('active');
}

function goToAdminPage() {
  closeNavDrawer();
  if (sessionStorage.getItem('hallAdminAuth') === 'true') {
    window.location.href = 'admin.html';
    return;
  }
  const pass = prompt("Provost Admin Panel-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallAdminAuth', 'true');
    window.location.href = 'admin.html';
  } else if (pass !== null) {
    alert("Wrong Password! Access Denied.");
  }
}

function goToMealManagerPage() {
  closeNavDrawer();
  if (sessionStorage.getItem('hallMealManagerAuth') === 'true') {
    window.location.href = 'meal-manager.html';
    return;
  }
  const pass = prompt("Meal Manager Page-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallMealManagerAuth', 'true');
    window.location.href = 'meal-manager.html';
  } else if (pass !== null) {
    alert("Wrong Password! Access Denied.");
  }
}

function renderMealGraph() {
  const sortedDates = Object.keys(dailyMealLog).sort();
  const tbody = document.getElementById('date-meal-tbody');
  tbody.innerHTML = '';

  if (sortedDates.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#64748b;">Ekhono kono date-wise meal data nei. Meal Manager theke meal add korun.</td></tr>`;
  } else {
    sortedDates.forEach(d => {
      tbody.innerHTML += `
        <tr>
          <td>${d}</td>
          <td><strong>${dailyMealLog[d]}</strong></td>
        </tr>
      `;
    });
  }

  const canvas = document.getElementById('meal-date-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 65;
  const plotW = canvas.width - padLeft - padRight;
  const plotH = canvas.height - padTop - padBottom;

  // Axes
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(padLeft + plotW, padTop + plotH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.fillText('Meal Number', 12, padTop - 10);
  ctx.fillText('Date', padLeft + plotW / 2 - 15, canvas.height - 12);

  if (sortedDates.length === 0) return;

  const values = sortedDates.map(d => Number(dailyMealLog[d]) || 0);
  const maxVal = Math.max(10, ...values);
  const stepX = plotW / sortedDates.length;
  const barWidth = Math.min(48, Math.max(16, stepX * 0.5));

  // Horizontal grid lines & Y ticks
  ctx.font = '12px Segoe UI, sans-serif';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((maxVal / ticks) * i);
    const y = padTop + plotH - (val / maxVal) * plotH;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft + 1, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillText(String(val), 18, y + 4);
  }

  // Bars + Line + Date labels
  const points = [];
  sortedDates.forEach((d, idx) => {
    const val = values[idx];
    const centerX = padLeft + stepX * idx + stepX / 2;
    const barH = (val / maxVal) * plotH;
    const y = padTop + plotH - barH;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(centerX - barWidth / 2, y, barWidth, barH);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText(String(val), centerX - 8, y - 6);

    ctx.fillStyle = '#334155';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText(d.slice(5), centerX - 16, padTop + plotH + 18);

    points.push({ x: centerX, y });
  });

  // Trend line connecting points
  if (points.length > 1) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    students = JSON.parse(localStorage.getItem("hallStudents")) || [];
    externalBoarders = JSON.parse(localStorage.getItem("hallExternalMealStudents")) || [];
    mealRecords = JSON.parse(localStorage.getItem("hallMealRecords")) || {};
    bazarCosts = JSON.parse(localStorage.getItem("hallMealBazarCosts")) || [];
    stolenMeals = Number(localStorage.getItem("hallStolenMeals")) || 0;
    dailyMealLog = JSON.parse(localStorage.getItem("hallDailyMealLog")) || {};
    mealSchedule = JSON.parse(localStorage.getItem("hallMealSchedule")) || mealSchedule;
    mealManagerInfo = JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;
  }
  renderMealTable(); // ba apnar page-er main render function
})();
renderMealGraph();