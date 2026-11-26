let dailyMealLog = JSON.parse(localStorage.getItem('hallDailyMealLog')) || {};

function openNavDrawer() {
  document.getElementById('left-drawer').classList.add('open');
  document.getElementById('nav-overlay').classList.add('active');
  if (window.lucide) lucide.createIcons();
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
  if (tbody) {
    tbody.innerHTML = '';
    if (sortedDates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--text-muted); padding:24px;">No date-wise meal logs recorded yet.</td></tr>`;
    } else {
      sortedDates.forEach(d => {
        tbody.innerHTML += `
          <tr>
            <td><span style="font-family:monospace; font-size:13px;">${d}</span></td>
            <td><strong style="color:var(--text-main); font-size:14px;">${dailyMealLog[d]}</strong></td>
          </tr>
        `;
      });
    }
  }

  const canvas = document.getElementById('meal-date-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padLeft = 60;
  const padRight = 30;
  const padTop = 36;
  const padBottom = 65;
  const plotW = canvas.width - padLeft - padRight;
  const plotH = canvas.height - padTop - padBottom;

  // Axes
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(padLeft + plotW, padTop + plotH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 12px Montserrat, sans-serif';
  ctx.fillText('MEAL COUNT', 12, padTop - 14);
  ctx.fillText('LOGGED DATES', padLeft + plotW / 2 - 36, canvas.height - 14);

  if (sortedDates.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No meal consumption data logged yet.', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
    return;
  }

  const values = sortedDates.map(d => Number(dailyMealLog[d]) || 0);
  const maxVal = Math.max(10, ...values);
  const stepX = plotW / sortedDates.length;
  const barWidth = Math.min(48, Math.max(16, stepX * 0.45));

  // Horizontal grid lines & Y ticks
  ctx.font = '500 11px Inter, sans-serif';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((maxVal / ticks) * i);
    const y = padTop + plotH - (val / maxVal) * plotH;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft + 1, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(String(val), 20, y + 4);
  }

  // Bars + Line + Date labels
  const points = [];
  sortedDates.forEach((d, idx) => {
    const val = values[idx];
    const centerX = padLeft + stepX * idx + stepX / 2;
    const barH = (val / maxVal) * plotH;
    const y = padTop + plotH - barH;

    // Gradient bar
    const barGrad = ctx.createLinearGradient(0, y, 0, padTop + plotH);
    barGrad.addColorStop(0, '#3b82f6');
    barGrad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(centerX - barWidth / 2, y, barWidth, barH, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 11.5px Inter, sans-serif';
    ctx.fillText(String(val), centerX - 6, y - 6);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(d.slice(5), centerX - 14, padTop + plotH + 20);

    points.push({ x: centerX, y });
  });

  // Trend line connecting points
  if (points.length > 1) {
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Circle indicators
    points.forEach(pt => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  if (window.lucide) lucide.createIcons();
}

function reloadGraphLocalData() {
  dailyMealLog = JSON.parse(localStorage.getItem("hallDailyMealLog")) || {};
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadGraphLocalData();
    renderMealGraph();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadGraphLocalData();
      renderMealGraph();
    });
  }
})();

renderMealGraph();
