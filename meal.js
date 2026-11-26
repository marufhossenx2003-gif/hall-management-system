let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let externalBoarders = JSON.parse(localStorage.getItem('hallExternalMealStudents')) || [];
let mealRecords = JSON.parse(localStorage.getItem('hallMealRecords')) || {};
let mealRate = Number(localStorage.getItem('hallMealRate')) || 60;

function getAllMealMembers() {
  const hallList = students.map(st => ({
    key: `hall_${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`,
    name: st.name,
    id: st.id,
    dept: st.dept,
    isExternal: false,
    seatInfo: `Room ${st.room} (${st.bed})`
  }));

  const extList = externalBoarders.map(ext => ({
    key: ext.key,
    name: ext.name,
    id: ext.id || 'External',
    dept: ext.dept || 'Outside',
    isExternal: true,
    seatInfo: 'Outside (No Seat)'
  }));

  return [...hallList, ...extList];
}

function getMemberMealRecord(member) {
  if (mealRecords[member.key]) return mealRecords[member.key];
  if (!member.isExternal && mealRecords[member.id]) return mealRecords[member.id];
  return { status: 'ON', meals: 0, deposit: 0 };
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
  const pass = prompt("Admin Panel Page-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallAdminAuth', 'true');
    window.location.href = 'admin.html';
  } else if (pass !== null) {
    alert("Wrong Password!");
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
    alert("Wrong Password!");
  }
}

function renderMealTable() {
  document.getElementById('current-rate-display').textContent = mealRate;
  const tbody = document.getElementById('meal-table-body');
  const query = document.getElementById('meal-search').value.toLowerCase().trim();
  tbody.innerHTML = '';

  const allMembers = getAllMealMembers();

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">Kono student pawa jayni. Admin Panel ba Meal Manager theke student add korun.</td></tr>`;
    return;
  }

  const filtered = allMembers.filter(m =>
    m.name.toLowerCase().includes(query) ||
    String(m.id).toLowerCase().includes(query) ||
    String(m.dept).toLowerCase().includes(query) ||
    m.seatInfo.toLowerCase().includes(query) ||
    (m.isExternal && ('external'.includes(query) || 'outside'.includes(query) || 'baire'.includes(query)))
  );

  filtered.forEach(m => {
    const rec = getMemberMealRecord(m);
    const deposit = Number(rec.deposit) || 0;
    const totalCost = rec.meals * mealRate;
    const balance = deposit - totalCost;

    const statusBadge = rec.status === 'ON'
      ? `<span class="badge-on">ON</span>`
      : `<span class="badge-off">OFF</span>`;

    const extBadge = m.isExternal
      ? `<br><span class="badge-ext">External / No Seat</span>`
      : '';

    const balClass = balance >= 0 ? 'bal-positive' : 'bal-negative';
    const balPrefix = balance < 0 ? `-৳${Math.abs(balance)}` : `৳${balance}`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}</strong><br><span style="font-size:12px; color:#64748b;">${m.dept}</span>${extBadge}</td>
        <td>ID: ${m.id}<br><span style="font-size:12px; color:#64748b;">${m.seatInfo}</span></td>
        <td>${statusBadge}</td>
        <td><strong>${rec.meals}</strong></td>
        <td class="${balClass}">${balPrefix} <br><span style="font-size:11px; color:#64748b; font-weight:normal;">(Joma: ৳${deposit})</span></td>
      </tr>
    `;
  });
}

renderMealTable();