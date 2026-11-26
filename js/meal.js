let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let externalBoarders = JSON.parse(localStorage.getItem('hallExternalMealStudents')) || [];
let mealRecords = JSON.parse(localStorage.getItem('hallMealRecords')) || {};
let bazarCosts = JSON.parse(localStorage.getItem('hallMealBazarCosts')) || [];
let stolenMeals = Number(localStorage.getItem('hallStolenMeals')) || 0;
let mealSchedule = JSON.parse(localStorage.getItem('hallMealSchedule')) || {
  isOpen: true,
  startDate: '',
  closeDate: ''
};
let mealManagerInfo = JSON.parse(localStorage.getItem('hallMealManagerInfo')) || null;

function getAllMealMembers() {
  const hallList = students.map(st => ({
    key: `hall_${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`,
    name: st.name,
    id: st.id,
    dept: st.dept,
    room: st.room,
    bed: st.bed,
    isExternal: false,
    seatInfo: `Room ${st.room} (${st.bed})`
  }));

  const extList = externalBoarders.map(ext => ({
    key: ext.key,
    name: ext.name,
    id: ext.id || 'External',
    dept: ext.dept || 'Outside',
    room: null,
    bed: null,
    isExternal: true,
    seatInfo: 'Outside (No Seat)'
  }));

  return [...hallList, ...extList];
}

function isManagerMember(m) {
  if (!mealManagerInfo || m.isExternal) return false;
  return (
    String(m.room) === String(mealManagerInfo.room) &&
    String(m.bed).toLowerCase().trim() === String(mealManagerInfo.bed).toLowerCase().trim()
  );
}

function getMemberMealRecord(member) {
  if (mealRecords[member.key]) return mealRecords[member.key];
  if (!member.isExternal && mealRecords[member.id]) return mealRecords[member.id];
  return { status: 'ON', meals: 0, deposit: 0 };
}

function getTotalBazarCost() {
  return bazarCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function getTotalAllMeals(allMembers) {
  const memberMeals = allMembers.reduce((sum, m) => {
    const rec = getMemberMealRecord(m);
    return sum + (Number(rec.meals) || 0);
  }, 0);
  return memberMeals + (Number(stolenMeals) || 0);
}

function getDynamicMealRate(allMembers) {
  const totalCost = getTotalBazarCost();
  const totalMeals = getTotalAllMeals(allMembers);
  if (totalMeals <= 0) return 0;
  return totalCost / totalMeals;
}

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
  showPasswordPrompt("Provost Admin Panel-e dhukte Password Din:", function(pass) {
    if (pass === "12345") {
      sessionStorage.setItem('hallAdminAuth', 'true');
      window.location.href = 'admin.html';
    } else if (pass !== null) {
      showAlert("Wrong Password! Access Denied.");
    }
  });
}

function goToMealManagerPage() {
  closeNavDrawer();
  if (sessionStorage.getItem('hallMealManagerAuth') === 'true') {
    window.location.href = 'meal-manager.html';
    return;
  }
  showPasswordPrompt("Meal Manager Page-e dhukte Password Din:", function(pass) {
    if (pass === "12345") {
      sessionStorage.setItem('hallMealManagerAuth', 'true');
      window.location.href = 'meal-manager.html';
    } else if (pass !== null) {
      showAlert("Wrong Password! Access Denied.");
    }
  });
}

function renderMealTable() {
  const allMembers = getAllMealMembers();
  const rate = getDynamicMealRate(allMembers);
  const totalCost = getTotalBazarCost();
  const totalMeals = getTotalAllMeals(allMembers);

  const rateDisplay = document.getElementById('current-rate-display');
  if (rateDisplay) rateDisplay.textContent = rate.toFixed(2);

  const costDisplay = document.getElementById('summary-total-cost');
  if (costDisplay) costDisplay.textContent = totalCost;

  const mealsDisplay = document.getElementById('summary-total-meals');
  if (mealsDisplay) mealsDisplay.textContent = totalMeals;

  const rangeText =
    mealSchedule.startDate || mealSchedule.closeDate
      ? ` &middot; ${mealSchedule.startDate || 'Start'} &rarr; ${mealSchedule.closeDate || 'Ongoing'}`
      : '';

  const statusWrap = document.getElementById('meal-window-status');
  if (statusWrap) {
    const statusClass = mealSchedule.isOpen ? 'badge-on' : 'badge-off';
    const statusIcon = mealSchedule.isOpen ? 'check-circle-2' : 'x-circle';
    const statusLabel = mealSchedule.isOpen ? 'Dining Active' : 'Dining Closed';
    statusWrap.innerHTML = `
      <span class="badge ${statusClass}">
        <i data-lucide="${statusIcon}"></i> ${statusLabel}
      </span>
      <span style="font-size:12px; color:var(--text-muted); margin-left:6px;">${rangeText}</span>
    `;
  }

  const tbody = document.getElementById('meal-table-body');
  if (!tbody) return;
  const searchInput = document.getElementById('meal-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  tbody.innerHTML = '';

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:24px;">No registered dining members found.</td></tr>`;
    return;
  }

  const filtered = allMembers.filter(m =>
    m.name.toLowerCase().includes(query) ||
    String(m.id).toLowerCase().includes(query) ||
    String(m.dept).toLowerCase().includes(query) ||
    m.seatInfo.toLowerCase().includes(query) ||
    (m.isExternal && ('external'.includes(query) || 'outside'.includes(query)))
  );

  filtered.forEach(m => {
    const rec = getMemberMealRecord(m);
    const deposit = Number(rec.deposit) || 0;
    const studentCost = rec.meals * rate;
    const balance = deposit - studentCost;

    const statusBadge = rec.status === 'ON'
      ? `<span class="badge badge-on"><i data-lucide="check"></i> ON</span>`
      : `<span class="badge badge-off"><i data-lucide="minus"></i> OFF</span>`;

    const isMgr = isManagerMember(m);
    const starMark = isMgr
      ? ` <span class="badge badge-manager"><i data-lucide="star"></i> Manager</span>`
      : '';

    const extBadge = m.isExternal
      ? `<span class="badge badge-ext"><i data-lucide="external-link"></i> External</span>`
      : '';

    const balClass = balance >= 0 ? 'balance-positive' : 'balance-negative';
    const balPrefix = balance < 0 ? `-৳${Math.abs(balance).toFixed(2)}` : `৳${balance.toFixed(2)}`;

    tbody.innerHTML += `
      <tr>
        <td>
          <div style="font-weight:600; color:var(--text-main); font-size:14px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>${m.name}</span>
            ${starMark}
            ${extBadge}
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Dept: ${m.dept}</div>
        </td>
        <td>
          <div style="font-family:monospace; font-weight:600; font-size:13px;">${m.id}</div>
          <div style="font-size:12px; color:var(--text-muted);">${m.seatInfo}</div>
        </td>
        <td>${statusBadge}</td>
        <td><strong style="font-size:14px;">${rec.meals}</strong></td>
        <td>
          <div class="${balClass}" style="font-size:14px;">${balPrefix}</div>
          <div style="font-size:11.5px; color:var(--text-subtle);">Deposit: ৳${deposit}</div>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function reloadMealLocalData() {
  students = JSON.parse(localStorage.getItem("hallStudents")) || [];
  externalBoarders = JSON.parse(localStorage.getItem("hallExternalMealStudents")) || [];
  mealRecords = JSON.parse(localStorage.getItem("hallMealRecords")) || {};
  bazarCosts = JSON.parse(localStorage.getItem("hallMealBazarCosts")) || [];
  stolenMeals = Number(localStorage.getItem("hallStolenMeals")) || 0;
  mealSchedule = JSON.parse(localStorage.getItem("hallMealSchedule")) || mealSchedule;
  mealManagerInfo = JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadMealLocalData();
    renderMealTable();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadMealLocalData();
      renderMealTable();
    });
  }
})();

renderMealTable();
