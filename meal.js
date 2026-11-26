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

function renderMealTable() {
  const allMembers = getAllMealMembers();
  const rate = getDynamicMealRate(allMembers);
  document.getElementById('current-rate-display').textContent = rate.toFixed(2);

  const rangeText =
    mealSchedule.startDate || mealSchedule.closeDate
      ? ` (${mealSchedule.startDate || 'Start'} to ${mealSchedule.closeDate || 'Ongoing'})`
      : '';
  document.getElementById('meal-window-status').textContent =
    (mealSchedule.isOpen ? '🟢 Open' : '🔴 Closed') + rangeText;

  const tbody = document.getElementById('meal-table-body');
  const query = document.getElementById('meal-search').value.toLowerCase().trim();
  tbody.innerHTML = '';

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">Kono student pawa jayni.</td></tr>`;
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
    const totalCost = rec.meals * rate;
    const balance = deposit - totalCost;

    const statusBadge = rec.status === 'ON'
      ? `<span class="badge-on">ON</span>`
      : `<span class="badge-off">OFF</span>`;

    const starMark = isManagerMember(m)
      ? ` <span class="star-badge" title="Current Meal Manager">⭐</span>`
      : '';

    const extBadge = m.isExternal
      ? `<br><span class="badge-ext">External / No Seat</span>`
      : '';

    const balClass = balance >= 0 ? 'bal-positive' : 'bal-negative';
    const balPrefix = balance < 0 ? `-৳${Math.abs(balance).toFixed(2)}` : `৳${balance.toFixed(2)}`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}${starMark}</strong><br><span style="font-size:12px; color:#64748b;">${m.dept}</span>${extBadge}</td>
        <td>ID: ${m.id}<br><span style="font-size:12px; color:#64748b;">${m.seatInfo}</span></td>
        <td>${statusBadge}</td>
        <td><strong>${rec.meals}</strong></td>
        <td class="${balClass}">${balPrefix} <br><span style="font-size:11px; color:#64748b; font-weight:normal;">(Joma: ৳${deposit})</span></td>
      </tr>
    `;
  });
}

renderMealTable();