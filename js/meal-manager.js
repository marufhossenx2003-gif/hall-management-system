if (sessionStorage.getItem('hallMealManagerAuth') !== 'true') {
  showPasswordPrompt("Meal Manager Page-e dhukte Password Din:", function(pass) {
    if (pass === "12345") {
      sessionStorage.setItem('hallMealManagerAuth', 'true');
    } else {
      if (pass !== null) {
        showAlert("Access Denied!", function() { window.location.href = 'meal.html'; });
      } else {
        window.location.href = 'meal.html';
      }
    }
  });
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
  if (typeof saveHallSettingsCloud === "function") {
    saveHallSettingsCloud();
  }
}

function populateManagerStudentSelect() {
  const sel = document.getElementById('manager-student-select');
  if (!sel) return;
  sel.innerHTML = `<option value="">-- Select Hall Student for Manager Role --</option>`;
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
  showAlert("Meal Manager assignment updated successfully.");
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
  const startInput = document.getElementById('meal-start-date');
  const closeInput = document.getElementById('meal-close-date');
  if (startInput) startInput.value = mealSchedule.startDate || '';
  if (closeInput) closeInput.value = mealSchedule.closeDate || '';

  const datesInfo =
    mealSchedule.startDate || mealSchedule.closeDate
      ? ` &middot; ${mealSchedule.startDate || '?'} &rarr; ${mealSchedule.closeDate || '?'}`
      : '';

  const stateEl = document.getElementById('manager-meal-state');
  if (stateEl) {
    const statusClass = mealSchedule.isOpen ? 'badge-on' : 'badge-off';
    const statusIcon = mealSchedule.isOpen ? 'check-circle-2' : 'x-circle';
    const statusLabel = mealSchedule.isOpen ? 'Dining Active' : 'Dining Closed';
    stateEl.innerHTML = `
      <span class="badge ${statusClass}"><i data-lucide="${statusIcon}"></i> ${statusLabel}</span>
      <span style="font-size:12px; color:var(--text-muted); margin-left:6px;">${datesInfo}</span>
    `;
  }
  if (window.lucide) lucide.createIcons();
}

function changeStolenMeals(delta) {
  const prev = stolenMeals;
  stolenMeals = Math.max(0, stolenMeals + delta);
  const actualDiff = stolenMeals - prev;
  if (actualDiff !== 0) {
    addToDailyLog(todayISO(), actualDiff);
    if (typeof saveDailyMealLogCloud === "function") {
      saveDailyMealLogCloud(todayISO(), dailyMealLog[todayISO()]);
    }
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
    if (typeof saveDailyMealLogCloud === "function") {
      saveDailyMealLogCloud(todayISO(), dailyMealLog[todayISO()]);
    }
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
  const newExt = {
    key: newKey,
    name: nameVal,
    id: idVal,
    dept: deptVal
  };
  externalBoarders.push(newExt);

  ensureMealRecord(newKey);
  saveMealData();

  if (typeof saveExternalStudentCloud === "function") {
    saveExternalStudentCloud(newExt);
  }
  if (typeof saveMealRecordCloud === "function") {
    saveMealRecordCloud(newKey, mealRecords[newKey]);
  }

  document.getElementById('ext-st-name').value = '';
  document.getElementById('ext-st-id').value = '';
  document.getElementById('ext-st-dept').value = '';
  renderManagerTable();
}

function removeExternalMealStudent(extKey) {
  showConfirm("Are you sure you want to remove this external diner?", function(confirmed) {
    if (!confirmed) return;
    externalBoarders = externalBoarders.filter(e => e.key !== extKey);
    delete mealRecords[extKey];
    saveMealData();
    if (typeof deleteExternalStudentCloud === "function") {
      deleteExternalStudentCloud(extKey);
    }
    renderManagerTable();
  });
}

function toggleMealStatus(memberKey) {
  const rec = ensureMealRecord(memberKey);
  rec.status = rec.status === 'ON' ? 'OFF' : 'ON';
  saveMealData();
  if (typeof saveMealRecordCloud === "function") {
    saveMealRecordCloud(memberKey, rec);
  }
  renderManagerTable();
}

function changeMealCount(memberKey, delta) {
  const rec = ensureMealRecord(memberKey);
  const prev = rec.meals;
  rec.meals = Math.max(0, rec.meals + delta);
  const actualDiff = rec.meals - prev;
  if (actualDiff !== 0) {
    addToDailyLog(todayISO(), actualDiff);
    if (typeof saveDailyMealLogCloud === "function") {
      saveDailyMealLogCloud(todayISO(), dailyMealLog[todayISO()]);
    }
  }
  saveMealData();
  if (typeof saveMealRecordCloud === "function") {
    saveMealRecordCloud(memberKey, rec);
  }
  renderManagerTable();
}

function addDeposit(memberKey) {
  showPrompt("Enter deposit amount to add (use negative e.g. -500 to deduct):", "", function(amountStr) {
    if (amountStr === null || amountStr.trim() === '') return;
    const amount = Number(amountStr);
    if (isNaN(amount)) {
      showAlert("Please enter a valid amount.");
      return;
    }
    const rec = ensureMealRecord(memberKey);
    rec.deposit = (Number(rec.deposit) || 0) + amount;
    saveMealData();
    if (typeof saveMealRecordCloud === "function") {
      saveMealRecordCloud(memberKey, rec);
    }
    renderManagerTable();
  });
}

function resetMeals(memberKey) {
  showConfirm("Reset meal count for this student to 0?", function(confirmed) {
    if (!confirmed) return;
    const rec = ensureMealRecord(memberKey);
    const prev = rec.meals;
    rec.meals = 0;
    if (prev > 0) {
      addToDailyLog(todayISO(), -prev);
      if (typeof saveDailyMealLogCloud === "function") {
        saveDailyMealLogCloud(todayISO(), dailyMealLog[todayISO()]);
      }
    }
    saveMealData();
    if (typeof saveMealRecordCloud === "function") {
      saveMealRecordCloud(memberKey, rec);
    }
    renderManagerTable();
  });
}

function addAllActiveMeals() {
  function performAdd() {
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
      if (typeof saveDailyMealLogCloud === "function") {
        saveDailyMealLogCloud(todayISO(), dailyMealLog[todayISO()]);
      }
    }
    saveMealData();
    if (typeof saveAllMealRecordsCloud === "function") {
      saveAllMealRecordsCloud(mealRecords);
    }
    renderManagerTable();
  }

  if (!mealSchedule.isOpen) {
    showConfirm("Dining is currently marked as closed. Do you still want to add +1 meal for all ON boarders?", function(confirmed) {
      if (confirmed) performAdd();
    });
  } else {
    performAdd();
  }
}

function renderManagerTable() {
  const allMembers = getAllMealMembers();
  const totalCost = getTotalBazarCost();
  const totalMeals = getTotalMealsAll(allMembers);
  const rate = getDynamicRate(allMembers);

  const rateEl = document.getElementById('current-rate-display');
  if (rateEl) rateEl.textContent = rate.toFixed(2);
  const costEl = document.getElementById('summary-total-cost');
  if (costEl) costEl.textContent = totalCost;
  const mealsEl = document.getElementById('summary-total-meals');
  if (mealsEl) mealsEl.textContent = totalMeals;
  const stolenEl = document.getElementById('stolen-meals-count');
  if (stolenEl) stolenEl.textContent = stolenMeals;

  const tbody = document.getElementById('meal-manager-tbody');
  if (!tbody) return;
  const searchInput = document.getElementById('meal-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  tbody.innerHTML = '';

  if (allMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">No diners found.</td></tr>`;
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
      ? `<span class="badge badge-on"><i data-lucide="check"></i> ON</span>`
      : `<span class="badge badge-off"><i data-lucide="minus"></i> OFF</span>`;

    const isMgr = isManagerMember(m);
    const starMark = isMgr
      ? ` <span class="badge badge-manager"><i data-lucide="star"></i> Manager</span>`
      : '';

    const extBadge = m.isExternal
      ? `<span class="badge badge-ext"><i data-lucide="external-link"></i> External</span>`
      : '';

    const removeExtBtn = m.isExternal
      ? `<button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="removeExternalMealStudent('${safeKey}')"><i data-lucide="trash-2"></i></button>`
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
          <div style="font-size:11.5px; color:var(--text-subtle);">Deposit: ৳${deposit} &middot; Cost: ৳${costForStudent.toFixed(2)}</div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm ${rec.status === 'ON' ? 'btn-outline' : 'btn-primary'}" onclick="toggleMealStatus('${safeKey}')">
              <i data-lucide="power"></i> ${rec.status === 'ON' ? 'Turn OFF' : 'Turn ON'}
            </button>
            <button class="btn btn-sm btn-outline" onclick="changeMealCount('${safeKey}', 1)"><i data-lucide="plus"></i> 1</button>
            <button class="btn btn-sm btn-outline" onclick="changeMealCount('${safeKey}', -1)"><i data-lucide="minus"></i> 1</button>
            <button class="btn btn-sm btn-outline" onclick="addDeposit('${safeKey}')"><i data-lucide="wallet"></i> +Deposit</button>
            <button class="btn btn-sm btn-ghost" onclick="resetMeals('${safeKey}')" title="Reset Meals to 0"><i data-lucide="rotate-ccw"></i></button>
            ${removeExtBtn}
          </div>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function addBazarCost(event) {
  event.preventDefault();
  const dateVal = document.getElementById('bazar-date').value;
  const itemVal = document.getElementById('bazar-item').value.trim();
  const amountVal = Number(document.getElementById('bazar-amount').value);

  if (!dateVal || !itemVal || !amountVal || amountVal <= 0) return;

  const newCost = {
    id: Date.now(),
    date: dateVal,
    item: itemVal,
    amount: amountVal
  };

  bazarCosts.unshift(newCost);
  localStorage.setItem('hallMealBazarCosts', JSON.stringify(bazarCosts));
  if (typeof addBazarCostCloud === "function") {
    addBazarCostCloud(newCost);
  }

  document.getElementById('bazar-item').value = '';
  document.getElementById('bazar-amount').value = '';
  renderManagerBazar();
  renderManagerTable();
}

function deleteBazarCost(costId) {
  showConfirm("Are you sure you want to delete this bazar expenditure entry?", function(confirmed) {
    if (!confirmed) return;
    bazarCosts = bazarCosts.filter(c => c.id !== costId);
    localStorage.setItem('hallMealBazarCosts', JSON.stringify(bazarCosts));
    if (typeof deleteBazarCostCloud === "function") {
      deleteBazarCostCloud(costId);
    }
    renderManagerBazar();
    renderManagerTable();
  });
}

function renderManagerBazar() {
  const tbody = document.getElementById('manager-bazar-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const grandTotal = getTotalBazarCost();
  const totalDisplay = document.getElementById('manager-grand-total');
  if (totalDisplay) totalDisplay.textContent = grandTotal;

  if (bazarCosts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:24px;">No bazar expenditures recorded yet.</td></tr>`;
    return;
  }

  bazarCosts.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td><span style="font-family:monospace; font-size:13px;">${c.date}</span></td>
        <td><strong style="color:var(--text-main); font-size:13.5px;">${c.item}</strong></td>
        <td><strong style="color:var(--text-main); font-size:14px;">৳${c.amount}</strong></td>
        <td>
          <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="deleteBazarCost(${c.id})">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function reloadManagerLocalData() {
  students = JSON.parse(localStorage.getItem("hallStudents")) || [];
  externalBoarders = JSON.parse(localStorage.getItem("hallExternalMealStudents")) || [];
  mealRecords = JSON.parse(localStorage.getItem("hallMealRecords")) || {};
  bazarCosts = JSON.parse(localStorage.getItem("hallMealBazarCosts")) || [];
  stolenMeals = Number(localStorage.getItem("hallStolenMeals")) || 0;
  dailyMealLog = JSON.parse(localStorage.getItem("hallDailyMealLog")) || {};
  mealSchedule = JSON.parse(localStorage.getItem("hallMealSchedule")) || mealSchedule;
  mealManagerInfo = JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadManagerLocalData();
    populateManagerStudentSelect();
    renderScheduleStatus();
    renderManagerTable();
    renderManagerBazar();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadManagerLocalData();
      populateManagerStudentSelect();
      renderScheduleStatus();
      renderManagerTable();
      renderManagerBazar();
    });
  }
})();

document.getElementById('bazar-date').value = todayISO();
populateManagerStudentSelect();
renderScheduleStatus();
renderManagerTable();
renderManagerBazar();
