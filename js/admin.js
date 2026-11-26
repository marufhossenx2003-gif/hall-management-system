if (sessionStorage.getItem('hallAdminAuth') !== 'true') {
  // Replace native prompt with custom modal
  showPrompt('Provost Admin Panel-e dhukte Password Din:', '', function(pass) {
    if (pass === '12345') {
      sessionStorage.setItem('hallAdminAuth', 'true');
    } else if (pass !== null) {
      showAlert('Access Denied!', function() { window.location.href = 'index.html'; });
    }
  });
}

let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let mealManagerInfo = JSON.parse(localStorage.getItem('hallMealManagerInfo')) || null;
let hallFeeTarget = Number(localStorage.getItem('hallFeeTarget')) || 3000;
let hallFeeRecords = JSON.parse(localStorage.getItem('hallFeeRecords')) || {};

const hallRoomsConfig = [
  // Floor 2
  { room: 201, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 202, floor: 2, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 203, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 204, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 205, floor: 2, beds: ['Bed-1'] },
  { room: 206, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 207, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 208, floor: 2, beds: ['Bed-1'] },
  { room: 209, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 210, floor: 2, beds: ['Bed-1'] },
  { room: 211, floor: 2, beds: ['Bed-1', 'Bed-2'] },
  { room: 212, floor: 2, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 213, floor: 2, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },

  // Floor 3
  { room: 301, floor: 3, beds: ['Bed-1', 'Bed-2'] },
  { room: 302, floor: 3, beds: ['Bed-1', 'Bed-2'] },
  { room: 303, floor: 3, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 304, floor: 3, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },

  // Floor 4
  { room: 401, floor: 4, beds: ['Bed-1', 'Bed-2'] },
  { room: 402, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 403, floor: 4, beds: ['Bed-1', 'Bed-2'] },
  { room: 404, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 405, floor: 4, beds: ['Bed-1'] },
  { room: 406, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 407, floor: 4, beds: ['Bed-1'] }
];

let selectedTarget = { floor: 2, room: 201, bed: 'Bed-1' };
let existingImageData = '';

function getSeatKey(st) {
  return `${st.room}_${String(st.bed).trim()}_${String(st.id).trim()}`;
}

function isCurrentMealManager(st) {
  if (!mealManagerInfo) return false;
  return (
    String(st.room) === String(mealManagerInfo.room) &&
    String(st.bed).toLowerCase().trim() === String(mealManagerInfo.bed).toLowerCase().trim()
  );
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

function goToMealManagerPage() {
  closeNavDrawer();
  if (sessionStorage.getItem('hallMealManagerAuth') === 'true') {
    window.location.href = 'meal-manager.html';
    return;
  }
  // Replace native prompt
  showPrompt('Meal Manager Page-e dhukte Password Din:', '', function(pass) {
    if (pass === '12345') {
      sessionStorage.setItem('hallMealManagerAuth', 'true');
      window.location.href = 'meal-manager.html';
    } else if (pass !== null) {
      showAlert('Wrong Password!');
    }
  });
}

function logoutAdmin() {
  sessionStorage.removeItem('hallAdminAuth');
  window.location.href = 'index.html';
}

function findStudentAtBed(room, bed) {
  return students.find(
    s => String(s.room) === String(room) && String(s.bed).toLowerCase().trim() === String(bed).toLowerCase().trim()
  );
}

function selectBed(floor, room, bed) {
  selectedTarget = { floor, room, bed };
  const banner = document.getElementById('selected-bed-banner');
  if (banner) {
    banner.innerHTML = `Floor ${floor} &middot; Room ${room} &middot; <strong>${bed}</strong>`;
  }

  const existing = findStudentAtBed(room, bed);
  const vacateBtn = document.getElementById('vacate-btn');

  if (existing) {
    document.getElementById('st-name').value = existing.name || '';
    document.getElementById('st-id').value = existing.id || '';
    document.getElementById('st-dept').value = existing.dept || '';
    document.getElementById('st-phone').value = existing.phone || '';
    document.getElementById('st-blood').value = existing.blood || '';
    document.getElementById('st-district').value = existing.district || '';
    existingImageData = existing.image || '';
    if (vacateBtn) vacateBtn.style.display = 'inline-flex';
  } else {
    document.getElementById('admin-student-form').reset();
    existingImageData = '';
    if (vacateBtn) vacateBtn.style.display = 'none';
  }

  document.getElementById('st-image-file').value = '';
  renderAdminRooms();
}

function saveBedStudent(event) {
  event.preventDefault();

  const fileInput = document.getElementById('st-image-file');
  const file = fileInput.files[0];
  const fallbackImage = existingImageData || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      persistStudent(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    persistStudent(fallbackImage);
  }
}

function persistStudent(imageData) {
  const existing = findStudentAtBed(selectedTarget.room, selectedTarget.bed);
  if (existing) {
    if (typeof deleteHallStudentCloud === "function") {
      deleteHallStudentCloud(existing);
    }
    delete hallFeeRecords[getSeatKey(existing)];
  }

  const newStudent = {
    name: document.getElementById('st-name').value.trim(),
    id: document.getElementById('st-id').value.trim(),
    dept: document.getElementById('st-dept').value.trim(),
    phone: document.getElementById('st-phone').value.trim(),
    blood: document.getElementById('st-blood').value.trim(),
    district: document.getElementById('st-district').value.trim(),
    floor: selectedTarget.floor,
    room: selectedTarget.room,
    bed: selectedTarget.bed,
    image: imageData
  };

  students = students.filter(
    s => !(String(s.room) === String(selectedTarget.room) && String(s.bed).toLowerCase().trim() === selectedTarget.bed.toLowerCase().trim())
  );

  students.push(newStudent);
  localStorage.setItem('hallStudents', JSON.stringify(students));

  const seatKey = getSeatKey(newStudent);
  if (typeof hallFeeRecords[seatKey] !== 'number') {
    hallFeeRecords[seatKey] = 0;
  }
  localStorage.setItem('hallFeeRecords', JSON.stringify(hallFeeRecords));

  if (typeof saveHallStudentCloud === "function") {
    saveHallStudentCloud(newStudent);
  }
  if (typeof saveHallFeeCloud === "function") {
    saveHallFeeCloud(seatKey, hallFeeRecords[seatKey]);
  }

  showAlert(`Boarder successfully assigned to Floor ${selectedTarget.floor}, Room ${selectedTarget.room}, ${selectedTarget.bed}.`, function(){
    existingImageData = imageData;
    const vacateBtn = document.getElementById('vacate-btn');
    if (vacateBtn) vacateBtn.style.display = 'inline-flex';
    renderAdminRooms();
    renderHallFeeList();
  });
}

function vacateSelectedBed() {
  showConfirm(`Are you sure you want to vacate Room ${selectedTarget.room}, ${selectedTarget.bed}?`, function(confirmed) {
    if (!confirmed) return;
    const existing = findStudentAtBed(selectedTarget.room, selectedTarget.bed);
    if (existing) {
      if (typeof deleteHallStudentCloud === "function") {
        deleteHallStudentCloud(existing);
      }
      delete hallFeeRecords[getSeatKey(existing)];
      localStorage.setItem('hallFeeRecords', JSON.stringify(hallFeeRecords));
    }

    students = students.filter(
      s => !(String(s.room) === String(selectedTarget.room) && String(s.bed).toLowerCase().trim() === selectedTarget.bed.toLowerCase().trim())
    );
    localStorage.setItem('hallStudents', JSON.stringify(students));
    document.getElementById('admin-student-form').reset();
    existingImageData = '';
    const vacateBtn = document.getElementById('vacate-btn');
    if (vacateBtn) vacateBtn.style.display = 'none';
    showAlert('Seat vacated successfully.');
    renderAdminRooms();
    renderHallFeeList();
  });
}

function updateHallFeeTarget() {
  const val = Number(document.getElementById('hall-fee-target-input').value);
  if (isNaN(val) || val < 0) {
    showAlert('Please enter a valid target amount.');
    return;
  }
  hallFeeTarget = val;
  localStorage.setItem('hallFeeTarget', String(hallFeeTarget));
  if (typeof saveHallSettingsCloud === "function") {
    saveHallSettingsCloud();
  }
  document.getElementById('hall-fee-target-input').value = '';
  renderHallFeeList();
}

function addHallFeePayment(seatKey) {
  showPrompt('Enter payment collection amount (BDT):', '', function(amtStr) {
    if (amtStr === null || amtStr.trim() === '') return;
    const amt = Number(amtStr);
    if (isNaN(amt) || amt <= 0) {
      showAlert('Please enter a valid positive amount.');
      return;
    }
    hallFeeRecords[seatKey] = (Number(hallFeeRecords[seatKey]) || 0) + amt;
    localStorage.setItem('hallFeeRecords', JSON.stringify(hallFeeRecords));
    if (typeof saveHallFeeCloud === "function") {
      saveHallFeeCloud(seatKey, hallFeeRecords[seatKey]);
    }
    renderHallFeeList();
  });
}

function renderHallFeeList() {
  const targetDisplay = document.getElementById('hall-fee-target-display');
  if (targetDisplay) targetDisplay.textContent = hallFeeTarget;
  const listEl = document.getElementById('hall-fee-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (students.length === 0) {
    listEl.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:16px;">No registered boarders yet.</p>`;
    return;
  }

  students.forEach(st => {
    const key = getSeatKey(st);
    const safeKey = key.replace(/'/g, "\\'");
    const joma = Number(hallFeeRecords[key]) || 0;
    const baki = Math.max(0, hallFeeTarget - joma);
    const isMgr = isCurrentMealManager(st);
    const star = isMgr ? ' <i data-lucide="star" style="width:13px;height:13px;color:#d97706;vertical-align:middle;"></i>' : '';

    listEl.innerHTML += `
      <div class="fee-list-row">
        <div>
          <strong style="color:var(--text-main); font-size:13.5px;">${st.name}${star}</strong>
          <span style="font-size:11.5px; color:var(--text-muted); margin-left:4px;">(R-${st.room}, ${st.bed})</span><br>
          <span style="font-size:12px; color:var(--text-muted);">Paid: <strong style="color:var(--success);">৳${joma}</strong></span> &middot;
          <span style="font-size:12px; color:var(--text-muted);">Due: <strong style="color:${baki > 0 ? 'var(--danger)' : 'var(--success)'};">৳${baki}</strong></span>
        </div>
        <button type="button" class="btn-plus-fee" title="Add Payment" onclick="addHallFeePayment('${safeKey}')">
          <i data-lucide="plus" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function renderAdminRooms() {
  const container = document.getElementById('admin-floor-room-list');
  if (!container) return;
  container.innerHTML = '';

  const floors = [2, 3, 4];

  floors.forEach(floorNo => {
    const floorDiv = document.createElement('div');
    floorDiv.className = 'floor-section';
    floorDiv.innerHTML = `<div class="floor-heading"><i data-lucide="layers"></i> Floor ${floorNo}</div>`;

    const grid = document.createElement('div');
    grid.className = 'admin-room-grid';

    const roomsInFloor = hallRoomsConfig.filter(r => r.floor === floorNo);

    roomsInFloor.forEach(roomObj => {
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.style.padding = '12px';
      card.style.marginBottom = '0';

      let buttonsHTML = `
        <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="door-open" style="width:14px;height:14px;color:var(--primary);"></i> Room ${roomObj.room}
        </div>`;

      roomObj.beds.forEach(bedName => {
        const occ = findStudentAtBed(roomObj.room, bedName);
        const isSelected =
          String(selectedTarget.room) === String(roomObj.room) &&
          String(selectedTarget.bed) === bedName;

        const statusClass = occ ? 'occupied' : 'empty';
        const selectedClass = isSelected ? 'selected' : '';
        const isMgr = occ && isCurrentMealManager(occ);
        const star = isMgr ? ' <i data-lucide="star" style="width:12px;height:12px;color:#d97706;vertical-align:middle;"></i>' : '';
        const label = occ ? `${bedName} &middot; ${occ.name}${star}` : `${bedName} (Vacant)`;

        buttonsHTML += `
          <div class="bed-select-btn ${statusClass} ${selectedClass}" style="margin-bottom:6px;" onclick="selectBed(${floorNo}, ${roomObj.room}, '${bedName}')">
            ${label}
          </div>
        `;
      });

      card.innerHTML = buttonsHTML;
      grid.appendChild(card);
    });

    floorDiv.appendChild(grid);
    container.appendChild(floorDiv);
  });

  if (window.lucide) lucide.createIcons();
}

function reloadAdminLocalData() {
  students = JSON.parse(localStorage.getItem("hallStudents")) || [];
  mealManagerInfo = JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;
  hallFeeTarget = Number(localStorage.getItem("hallFeeTarget")) || 3000;
  hallFeeRecords = JSON.parse(localStorage.getItem("hallFeeRecords")) || {};
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadAdminLocalData();
    renderAdminRooms();
    renderHallFeeList();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadAdminLocalData();
      renderAdminRooms();
      renderHallFeeList();
    });
  }
})();

renderAdminRooms();
renderHallFeeList();
selectBed(2, 201, 'Bed-1');
