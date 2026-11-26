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
let mealRate = Number(localStorage.getItem('hallMealRate')) || 60;
let bazarCosts = JSON.parse(localStorage.getItem('hallMealBazarCosts')) || [];

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
    isExternal: false,
    seatInfo: `Room ${st.room} (${st.bed})`
  }));

  const extList = externalBoarders.map(ext => ({
    key: ext.key,
    legacyId: null,
    name: ext.name,
    id: ext.id || 'External',
    dept: ext.dept || 'Outside',
    isExternal: true,
    seatInfo: 'Outside (No Seat)'
  }));

  return [...hallList, ...extList];
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

function logoutMealManager() {
  sessionStorage.removeItem('hallMealManagerAuth');
  window.location.href = 'meal.html';
}

function saveMealData() {
  localStorage.setItem('hallMealRecords', JSON.stringify(mealRecords));
  localStorage.setItem('hallMealRate', String(mealRate));
  localStorage.setItem('hallExternalMealStudents', JSON.stringify(externalBoarders));
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

function updateMealRate() {
  const val = Number(document.getElementById('meal-rate-input').value);
  if (!val || val <= 0) {
    alert("Valid meal rate din!");
    return;
  }
  mealRate = val;
  saveMealData();
  document.getElementById('meal-rate-input').value = '';
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
  rec.meals = Math.max(0, rec.meals + delta);
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
  rec.meals = 0;
  saveMealData();
  renderManagerTable();
}

function addAllActiveMeals() {
  const allMembers = getAllMealMembers();
  allMembers.forEach(m => {
    const rec = ensureMealRecord(m.key, m.legacyId);
    if (rec.status === 'ON') {
      rec.meals += 1;
    }
  });
  saveMealData();
  renderManagerTable();
}

function renderManagerTable() {
  document.getElementById('current-rate-display').textContent = mealRate;
  const tbody = document.getElementById('meal-manager-tbody');
  const query = document.getElementById('meal-search').value.toLowerCase().trim();
  tbody.innerHTML = '';

  const allMembers = getAllMealMembers();

  let onCount = 0;
  let totalMeals = 0;
  allMembers.forEach(m => {
    const rec = ensureMealRecord(m.key, m.legacyId);
    if (rec.status === 'ON') onCount++;
    totalMeals += rec.meals;
  });
  document.getElementById('active-on-count').textContent = onCount;
  document.getElementById('total-meals-count').textContent = totalMeals;

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">Kono student pawa jayni. Age Admin Panel theke student add korun ba upore external meal student add korun.</td></tr>`;
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
    const totalCost = rec.meals * mealRate;
    const balance = deposit - totalCost;

    const statusBadge = rec.status === 'ON'
      ? `<span class="badge-on">ON</span>`
      : `<span class="badge-off">OFF</span>`;

    const extBadge = m.isExternal
      ? `<br><span class="badge-ext">External / No Seat</span>`
      : '';

    const removeExtBtn = m.isExternal
      ? `<button class="btn-sm btn-minus" onclick="removeExternalMealStudent('${safeKey}')">Remove</button>`
      : '';

    const balClass = balance >= 0 ? 'bal-positive' : 'bal-negative';
    const balPrefix = balance < 0 ? `-৳${Math.abs(balance)}` : `৳${balance}`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}</strong><br><span style="font-size:12px; color:#64748b;">${m.dept}</span>${extBadge}</td>
        <td>ID: ${m.id}<br><span style="font-size:12px; color:#64748b;">${m.seatInfo}</span></td>
        <td>${statusBadge}</td>
        <td><strong>${rec.meals}</strong></td>
        <td class="${balClass}">
          ${balPrefix}
          <br><span style="font-size:11px; color:#64748b; font-weight:normal;">Joma: ৳${deposit} | Cost: ৳${totalCost}</span>
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
}

function deleteBazarCost(costId) {
  if (!confirm("Ei khoroch-ta delete korte chan?")) return;
  bazarCosts = bazarCosts.filter(c => c.id !== costId);
  localStorage.setItem('hallMealBazarCosts', JSON.stringify(bazarCosts));
  renderManagerBazar();
}

function renderManagerBazar() {
  const tbody = document.getElementById('manager-bazar-tbody');
  tbody.innerHTML = '';

  let grandTotal = 0;
  bazarCosts.forEach(c => {
    grandTotal += Number(c.amount) || 0;
  });
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

document.getElementById('bazar-date').valueAsDate = new Date();

renderManagerTable();
renderManagerBazar();