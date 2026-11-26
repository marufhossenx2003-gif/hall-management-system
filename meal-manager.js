if (sessionStorage.getItem('hallMealManagerAuth') !== 'true') {
  const pass = prompt("Meal Manager Page-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallMealManagerAuth', 'true');
  } else {
    alert("Access Denied!");
    window.location.href = 'meal.html';
  }
}

let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let externalBoarders = JSON.parse(localStorage.getItem('hallExternalMealStudents')) || [];
let mealRecords = JSON.parse(localStorage.getItem('hallMealRecords')) || {};
let bazarCosts = JSON.parse(localStorage.getItem('hallMealBazarCosts')) || [];
let stolenMeals = Number(localStorage.getItem('hallStolenMeals')) || 0;
let dailyMealLog = JSON.parse(localStorage.getItem('hallDailyMealLog')) || {}; // { 'YYYY-MM-DD': number }
let mealSchedule = JSON.parse(localStorage.getItem('hallMealSchedule')) || {
  isOpen: true,
  startDate: '',
  closeDate: ''
};
let mealManagerInfo = JSON.parse(localStorage.getItem('hallMealManagerInfo')) || null;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addToDailyLog(dateStr, deltaMeals) {
  const d = dateStr || todayISO();
  dailyMealLog[d] = Math.max(0, (Number(dailyMealLog[d]) || 0) + deltaMeals);
  localStorage.setItem('hallDailyMealLog', JSON.stringify(dailyMealLog));
}

function getHallStudentKey(st) {
  return `hall_${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`;
}

function getAllMealMembers() {
  const hallList = students.map(st => ({
    key: getHallStudentKey(st),
    legacyId: st.id,
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
    legacyId: null,
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

function ensureMealRecord(key, legacyId = null) {
  if (!mealRecords[key] && legacyId && mealRecords[legacyId]) {
    mealRecords[key] = {
      status: mealRecords[legacyId].status || 'ON',
      meals: Number(mealRecords[legacyId].meals) || 0,
      deposit: Number(mealRecords[legacyId].deposit) || 0
    };
  }
  if (!mealRecords[key]) {
    mealRecords[key] = { status: 'ON', meals: 0, deposit: 0 };
  }
  if (typeof mealRecords[key].deposit !== 'number') {
    mealRecords[key].deposit = 0;
  }
  return mealRecords[key];
}

function getTotalBazarCost() {
  return bazarCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
}

function getTotalMealsAll(allMembers) {
  const memberMeals = allMembers.reduce((sum, m) => {
    const rec = ensureMealRecord(m.key, m.legacyId);
    return sum + (Number(rec.meals) || 0);
  }, 0);
  return memberMeals + (Number(stolenMeals) || 0);
}

function getDynamicRate(allMembers) {
  const totalCost = getTotalBazarCost();
  const totalMeals = getTotalMealsAll(allMembers);
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

function logoutMealManager() {
  sessionStorage.removeItem('hallMealManagerAuth');
  window.location.href = 'meal.html';
}

function saveMealData() {
  localStorage.setItem('hallMealRecords', JSON.stringify(mealRecords));
  localStorage.setItem('hallExternalMealStudents', JSON.stringify(externalBoarders));
  localStorage.setItem('hallStolenMeals', String(stolenMeals));
  localStorage.setItem('hallMealSchedule', JSON.stringify(mealSchedule));
  localStorage.setItem('hallMealManagerInfo', JSON.stringify(mealManagerInfo));
}

function populateManagerStudentSelect() {
  const sel = document.getElementById('manager-student-select');
  sel.innerHTML = `<option value="">-- Select Hall Student for ⭐ --</option>`;
  students.forEach((st, idx) => {
    const selected =
      mealManagerInfo &&
      String(mealManagerInfo.room) === String(st.room) &&
      String(mealManagerInfo.bed).toLowerCase().trim() === String(st.bed).toLowerCase().trim()
        ? 'selected'
        : '';
    sel.innerHTML += `<option value="${idx}" ${selected}>${st.name} (Room ${st.room}, ${st.bed})</option>`;
  });
}

function saveMealManagerStudent() {
  const idxVal = document.getElementById('manager-student-select').value;
  if (idxVal === '') {
    mealManagerInfo = null;
  } else {
    const st = students[Number(idxVal)];
    mealManagerInfo = {
      name: st.name,
      id: st.id,
      room: st.room,
      bed: st.bed
    };
  }
  saveMealData();
  alert("Meal Manager ⭐ updated!");
  renderManagerTable();
}

function setMealWindowState(isOpen) {
  mealSchedule.startDate = document.getElementById('meal-start-date').value;
  mealSchedule.closeDate = document.getElementById('meal-close-date').value;
  mealSchedule.isOpen = isOpen;
  saveMealData();
  renderScheduleStatus();
}

function renderScheduleStatus() {
  document.getElementById('meal-start-date').value = mealSchedule.startDate || '';
  document.getElementById('meal-close-date').value = mealSchedule.closeDate || '';
  const datesInfo =
    mealSchedule.startDate || mealSchedule.closeDate
      ? ` [${mealSchedule.startDate || '?'} → ${mealSchedule.closeDate || '?'}]`
      : '';
  document.getElementById('manager-meal-state').textContent =
    (mealSchedule.isOpen ? '🟢 Open' : '🔴 Closed') + datesInfo;
}

function changeStolenMeals(delta) {
  const prev = stolenMeals;
  stolenMeals = Math.max(0, stolenMeals + delta);
  const actualDiff = stolenMeals - prev;
  if (actualDiff !== 0) {
    addToDailyLog(todayISO(), actualDiff);
  }
  saveMealData();
  renderManagerTable();
}

function setStolenMealsDirect() {
  const val = Number(document.getElementById('stolen-meals-set').value);
  if (isNaN(val) || val < 0) return;
  const diff = val - stolenMeals;
  stolenMeals = val;
  if (diff !== 0) {
    addToDailyLog(todayISO(), diff);
  }
  document.getElementById('stolen-meals-set').value = '';
  saveMealData();
  renderManagerTable();
}

function addExternalMealStudent(event) {
  event.preventDefault();
  const nameVal = document.getElementById('ext-st-name').value.trim();
  const idVal = document.getElementById('ext-st-id').value.trim() || 'External';
  const deptVal = document.getElementById('ext-st-dept').value.trim() || 'Outside';

  if (!nameVal) return;

  const newKey = `ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  externalBoarders.push({
    key: newKey,
    name: nameVal,
    id: idVal,
    dept: deptVal
  });

  ensureMealRecord(newKey);
  saveMealData();

  document.getElementById('ext-st-name').value = '';
  document.getElementById('ext-st-id').value = '';
  document.getElementById('ext-st-dept').value = '';
  renderManagerTable();
}

function removeExternalMealStudent(extKey) {
  if (!confirm("Ei external meal student-ke list theke remove korte chan?")) return;
  externalBoarders = externalBoarders.filter(e => e.key !== extKey);
  delete mealRecords[extKey];
  saveMealData();
  renderManagerTable();
}

function toggleMealStatus(memberKey) {
  const rec = ensureMealRecord(memberKey);
  rec.status = rec.status === 'ON' ? 'OFF' : 'ON';
  saveMealData();
  renderManagerTable();
}

function changeMealCount(memberKey, delta) {
  const rec = ensureMealRecord(memberKey);
  const prev = rec.meals;
  rec.meals = Math.max(0, rec.meals + delta);
  const actualDiff = rec.meals - prev;
  if (actualDiff !== 0) {
    addToDailyLog(todayISO(), actualDiff);
  }
  saveMealData();
  renderManagerTable();
}

function addDeposit(memberKey) {
  const amountStr = prompt("Koto taka deposit (joma) add korben? (Subtract korte '-' din, e.g. -500):");
  if (amountStr === null || amountStr.trim() === '') return;
  const amount = Number(amountStr);
  if (isNaN(amount)) {
    alert("Valid number din!");
    return;
  }
  const rec = ensureMealRecord(memberKey);
  rec.deposit = (Number(rec.deposit) || 0) + amount;
  saveMealData();
  renderManagerTable();
}

function resetMeals(memberKey) {
  if (!confirm("Ei student-er meal count 0 korte chan?")) return;
  const rec = ensureMealRecord(memberKey);
  const prev = rec.meals;
  rec.meals = 0;
  if (prev > 0) {
    addToDailyLog(todayISO(), -prev);
  }
  saveMealData();
  renderManagerTable();
}

function addAllActiveMeals() {
  if (!mealSchedule.isOpen) {
    if (!confirm("Meal ekhon Closed state-e ache. Tobuo +1 All ON Meals add korte chan?")) return;
  }
  const allMembers = getAllMealMembers();
  let addedCount = 0;
  allMembers.forEach(m => {
    const rec = ensureMealRecord(m.key, m.legacyId);
    if (rec.status === 'ON') {
      rec.meals += 1;
      addedCount += 1;
    }
  });
  if (addedCount > 0) {
    addToDailyLog(todayISO(), addedCount);
  }
  saveMealData();
  renderManagerTable();
}

function renderManagerTable() {
  const allMembers = getAllMealMembers();
  const totalCost = getTotalBazarCost();
  const totalMeals = getTotalMealsAll(allMembers);
  const rate = getDynamicRate(allMembers);

  document.getElementById('current-rate-display').textContent = rate.toFixed(2);
  document.getElementById('summary-total-cost').textContent = totalCost;
  document.getElementById('summary-total-meals').textContent = totalMeals;
  document.getElementById('stolen-meals-count').textContent = stolenMeals;

  const tbody = document.getElementById('meal-manager-tbody');
  const query = document.getElementById('meal-search').value.toLowerCase().trim();
  tbody.innerHTML = '';

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">Kono student pawa jayni.</td></tr>`;
    return;
  }

  const filtered = allMembers.filter(m =>
    m.name.toLowerCase().includes(query) ||
    String(m.id).toLowerCase().includes(query) ||
    String(m.dept).toLowerCase().includes(query) ||
    m.seatInfo.toLowerCase().includes(query)
  );

  filtered.forEach(m => {
    const safeKey = m.key.replace(/'/g, "\\'");
    const rec = ensureMealRecord(m.key, m.legacyId);
    const deposit = Number(rec.deposit) || 0;
    const costForStudent = rec.meals * rate;
    const balance = deposit - costForStudent;

    const statusBadge = rec.status === 'ON'
      ? `<span class="badge-on">ON</span>`
      : `<span class="badge-off">OFF</span>`;

    const starMark = isManagerMember(m)
      ? ` <span class="star-badge" title="Current Meal Manager">⭐</span>`
      : '';

    const extBadge = m.isExternal
      ? `<br><span class="badge-ext">External / No Seat</span>`
      : '';

    const removeExtBtn = m.isExternal
      ? `<button class="btn-sm btn-minus" onclick="removeExternalMealStudent('${safeKey}')">Remove</button>`
      : '';

    const balClass = balance >= 0 ? 'bal-positive' : 'bal-negative';
    const balPrefix = balance < 0 ? `-৳${Math.abs(balance).toFixed(2)}` : `৳${balance.toFixed(2)}`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}${starMark}</strong><br><span style="font-size:12px; color:#64748b;">${m.dept}</span>${extBadge}</td>
        <td>ID: ${m.id}<br><span style="font-size:12px; color:#64748b;">${m.seatInfo}</span></td>
        <td>${statusBadge}</td>
        <td><strong>${rec.meals}</strong></td>
        <td class="${balClass}">
          ${balPrefix}
          <br><span style="font-size:11px; color:#64748b; font-weight:normal;">Joma: ৳${deposit} | Cost: ৳${costForStudent.toFixed(2)}</span>
        </td>
        <td>
          <button class="btn-sm btn-toggle" onclick="toggleMealStatus('${safeKey}')">ON/OFF</button>
          <button class="btn-sm btn-plus" onclick="changeMealCount('${safeKey}', 1)">+1</button>
          <button class="btn-sm btn-minus" onclick="changeMealCount('${safeKey}', -1)">-1</button>
          <button class="btn-sm btn-deposit" onclick="addDeposit('${safeKey}')">+ Taka</button>
          <button class="btn-sm btn-reset" onclick="resetMeals('${safeKey}')">Reset</button>
          ${removeExtBtn}
        </td>
      </tr>
    `;
  });
}

function addBazarCost(event) {
  event.preventDefault();
  const dateVal = document.getElementById('bazar-date').value;
  const itemVal = document.getElementById('bazar-item').value.trim();
  const amountVal = Number(document.getElementById('bazar-amount').value);

  if (!dateVal || !itemVal || !amountVal || amountVal <= 0) return;

  bazarCosts.unshift({
    id: Date.now(),
    date: dateVal,
    item: itemVal,
    amount: amountVal
  });

  localStorage.setItem('hallMealBazarCosts', JSON.stringify(bazarCosts));
  document.getElementById('bazar-item').value = '';
  document.getElementById('bazar-amount').value = '';
  renderManagerBazar();
  renderManagerTable();
}

function deleteBazarCost(costId) {
  if (!confirm("Ei khoroch-ta delete korte chan?")) return;
  bazarCosts = bazarCosts.filter(c => c.id !== costId);
  localStorage.setItem('hallMealBazarCosts', JSON.stringify(bazarCosts));
  renderManagerBazar();
  renderManagerTable();
}

function renderManagerBazar() {
  const tbody = document.getElementById('manager-bazar-tbody');
  tbody.innerHTML = '';

  const grandTotal = getTotalBazarCost();
  document.getElementById('manager-grand-total').textContent = grandTotal;

  if (bazarCosts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">Ekhono kono bazar khoroch add kora hoyni.</td></tr>`;
    return;
  }

  bazarCosts.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.date}</td>
        <td><strong>${c.item}</strong></td>
        <td>৳${c.amount}</td>
        <td>
          <button class="btn-sm btn-minus" onclick="deleteBazarCost(${c.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

document.getElementById('bazar-date').value = todayISO();
populateManagerStudentSelect();
renderScheduleStatus();
renderManagerTable();
renderManagerBazar();