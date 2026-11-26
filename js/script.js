let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let mealManagerInfo = JSON.parse(localStorage.getItem('hallMealManagerInfo')) || null;
let currentFloorFilter = 'all';

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
  { room: 405, floor: 4, beds: ['Bed-1', 'Bed-2'] },
  { room: 406, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] }
];

function isCurrentMealManager(st) {
  if (!mealManagerInfo) return false;
  return (
    String(st.room) === String(mealManagerInfo.room) &&
    String(st.bed).toLowerCase().trim() === String(mealManagerInfo.bed).toLowerCase().trim()
  );
}

function formatNameWithStar(st) {
  return isCurrentMealManager(st)
    ? `${st.name} <span class="badge badge-manager" title="Current Meal Manager"><i data-lucide="star"></i> Manager</span>`
    : st.name;
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
  const password = prompt("Provost Admin Panel-e dhukte Password Din:");
  if (password === "12345") {
    sessionStorage.setItem('hallAdminAuth', 'true');
    window.location.href = 'admin.html';
  } else if (password !== null) {
    alert("Wrong Password! Access Denied.");
  }
}

function goToMealManagerPage() {
  closeNavDrawer();
  if (sessionStorage.getItem('hallMealManagerAuth') === 'true') {
    window.location.href = 'meal-manager.html';
    return;
  }
  const password = prompt("Meal Manager Page-e dhukte Password Din:");
  if (password === "12345") {
    sessionStorage.setItem('hallMealManagerAuth', 'true');
    window.location.href = 'meal-manager.html';
  } else if (password !== null) {
    alert("Wrong Password! Access Denied.");
  }
}

function closeInfoModal() {
  document.getElementById('info-modal').classList.remove('active');
}

function filterFloor(floor) {
  currentFloorFilter = floor;
  document.querySelectorAll('.filter-pills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.floor === String(floor));
  });
  renderRooms();
}

function updateStats() {
  let totalCapacity = 0;
  hallRoomsConfig.forEach(r => totalCapacity += r.beds.length);
  const occupiedCount = students.length;
  const vacantCount = Math.max(0, totalCapacity - occupiedCount);

  const totalEl = document.getElementById('stat-total-seats');
  const occEl = document.getElementById('stat-occupied-seats');
  const vacEl = document.getElementById('stat-vacant-seats');
  const mgrEl = document.getElementById('stat-meal-manager');

  if (totalEl) totalEl.textContent = totalCapacity;
  if (occEl) occEl.textContent = occupiedCount;
  if (vacEl) vacEl.textContent = vacantCount;
  if (mgrEl) {
    mgrEl.textContent = mealManagerInfo ? `${mealManagerInfo.name} (R-${mealManagerInfo.room})` : 'Not Assigned';
  }
}

function renderRooms() {
  const roomList = document.getElementById('room-list');
  if (!roomList) return;
  roomList.innerHTML = '';

  const filteredConfig = currentFloorFilter === 'all'
    ? hallRoomsConfig
    : hallRoomsConfig.filter(r => String(r.floor) === String(currentFloorFilter));

  filteredConfig.forEach(roomInfo => {
    const card = document.createElement('div');
    card.className = 'room-card';

    const roomStudents = students.filter(s => String(s.room) === String(roomInfo.room));
    let bedsHTML = '';

    roomInfo.beds.forEach(bedName => {
      const st = roomStudents.find(s => String(s.bed).toLowerCase().trim() === bedName.toLowerCase().trim());
      if (st) {
        const isMgr = isCurrentMealManager(st);
        const mgrClass = isMgr ? 'has-manager' : '';
        const starIcon = isMgr ? '<i data-lucide="star" style="width:13px;height:13px;color:#d97706;"></i>' : '';
        bedsHTML += `
          <div class="bed-chip occupied ${mgrClass}" onclick="showStudentInfo('${roomInfo.room}', '${bedName}')">
            <div class="bed-chip-left">
              <i data-lucide="user"></i>
              <span>${bedName} &middot; ${st.name}</span>
              ${starIcon}
            </div>
            <span class="bed-chip-badge">Assigned</span>
          </div>
        `;
      } else {
        bedsHTML += `
          <div class="bed-chip empty">
            <div class="bed-chip-left">
              <i data-lucide="bed"></i>
              <span>${bedName}</span>
            </div>
            <span class="bed-chip-badge">Vacant</span>
          </div>
        `;
      }
    });

    card.innerHTML = `
      <div class="room-card-header">
        <div class="room-card-title">
          <i data-lucide="door-open"></i>
          <span>Room ${roomInfo.room}</span>
        </div>
        <span class="room-capacity">Floor ${roomInfo.floor} &middot; ${roomInfo.beds.length} Beds</span>
      </div>
      <div class="bed-container">${bedsHTML}</div>
    `;
    roomList.appendChild(card);
  });

  updateStats();
  if (window.lucide) lucide.createIcons();
}

function showStudentInfo(roomNo, bedName) {
  const st = students.find(
    s => String(s.room) === String(roomNo) && String(s.bed).toLowerCase().trim() === String(bedName).toLowerCase().trim()
  );
  if (!st) return;

  const managerBadge = isCurrentMealManager(st)
    ? `<div style="margin-bottom:12px;"><span class="badge badge-manager"><i data-lucide="star"></i> Current Meal Manager</span></div>`
    : '';

  document.getElementById('student-details').innerHTML = `
    ${managerBadge}
    <div style="display:flex; flex-direction:column; gap:8px; font-size:13.5px;">
      <div><strong style="color:var(--text-muted);">Name:</strong> <span style="font-weight:600; color:var(--text-main);">${st.name}</span></div>
      <div><strong style="color:var(--text-muted);">Student ID:</strong> <span style="font-family:monospace; font-weight:600;">${st.id}</span></div>
      <div><strong style="color:var(--text-muted);">Department:</strong> <span>${st.dept}</span></div>
      <div><strong style="color:var(--text-muted);">Room & Bed:</strong> <span>Room ${st.room} (${st.bed}), Floor ${st.floor}</span></div>
      <div><strong style="color:var(--text-muted);">Phone:</strong> <a href="tel:${st.phone}" style="color:var(--primary); font-weight:500;">${st.phone}</a></div>
      <div><strong style="color:var(--text-muted);">Blood Group:</strong> <span class="badge" style="background:#fee2e2; color:#991b1b; font-weight:700;">${st.blood}</span></div>
      <div><strong style="color:var(--text-muted);">Home District:</strong> <span>${st.district}</span></div>
    </div>
  `;

  const imgElement = document.getElementById('st-profile-pic');
  imgElement.src = st.image ? st.image : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  document.getElementById('info-modal').classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function searchStudent() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';

  if (query === '') return;

  const matched = students.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.id.toLowerCase().includes(query) ||
    s.dept.toLowerCase().includes(query) ||
    s.phone.toLowerCase().includes(query) ||
    s.district.toLowerCase().includes(query)
  );

  if (matched.length === 0) {
    resultsDiv.innerHTML = `
      <div style="padding:14px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-muted); font-size:13px; text-align:center;">
        No boarders found matching "${query}".
      </div>
    `;
    return;
  }

  matched.forEach(st => {
    resultsDiv.innerHTML += `
      <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 16px; margin-top:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div>
          <strong style="color:var(--text-main); font-size:14px;">${formatNameWithStar(st)}</strong>
          <span style="color:var(--text-muted); font-size:12px; margin-left:6px;">ID: ${st.id} &middot; Dept: ${st.dept}</span>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; display:flex; gap:12px; flex-wrap:wrap;">
            <span><i data-lucide="door-open" style="width:12px; height:12px; vertical-align:middle;"></i> Room ${st.room} (${st.bed})</span>
            <span><i data-lucide="layers" style="width:12px; height:12px; vertical-align:middle;"></i> Floor ${st.floor}</span>
            <span><i data-lucide="phone" style="width:12px; height:12px; vertical-align:middle;"></i> ${st.phone}</span>
            <span><i data-lucide="droplet" style="width:12px; height:12px; vertical-align:middle; color:#e11d48;"></i> ${st.blood}</span>
            <span><i data-lucide="map-pin" style="width:12px; height:12px; vertical-align:middle;"></i> ${st.district}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-outline" style="color:var(--text-main); border-color:var(--border);" onclick="showStudentInfo('${st.room}', '${st.bed}')">
          <i data-lucide="eye"></i> View Profile
        </button>
      </div>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function reloadScriptLocalData() {
  students = JSON.parse(localStorage.getItem("hallStudents")) || [];
  mealManagerInfo = JSON.parse(localStorage.getItem("hallMealManagerInfo")) || null;
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadScriptLocalData();
    renderRooms();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadScriptLocalData();
      renderRooms();
    });
  }
})();

renderRooms();
