let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let mealManagerInfo = JSON.parse(localStorage.getItem('hallMealManagerInfo')) || null;

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
  { room: 405, floor: 4, beds: ['Bed-1', 'Bed-2',] },
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
    ? `${st.name} <span class="star-badge" title="Current Meal Manager">⭐</span>`
    : st.name;
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
  document.getElementById('info-modal').style.display = 'none';
}

function renderRooms() {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';

  hallRoomsConfig.forEach(roomInfo => {
    let card = document.createElement('div');
    card.className = 'room-card';

    let roomStudents = students.filter(s => String(s.room) === String(roomInfo.room));
    let bedsHTML = '';

    roomInfo.beds.forEach(bedName => {
      let st = roomStudents.find(s => String(s.bed).toLowerCase().trim() === bedName.toLowerCase().trim());
      if (st) {
        const starText = isCurrentMealManager(st) ? ' ⭐' : '';
        bedsHTML += `<div class="bed occupied" onclick="showStudentInfo('${roomInfo.room}', '${bedName}')">${bedName} (${st.name}${starText})</div>`;
      } else {
        bedsHTML += `<div class="bed empty">${bedName} (Empty)</div>`;
      }
    });

    card.innerHTML = `
      <h3>🚪 Room: ${roomInfo.room} <span style="font-size:12px; color:#64748b;">(Floor ${roomInfo.floor})</span></h3>
      <div class="bed-container">${bedsHTML}</div>
    `;
    roomList.appendChild(card);
  });
}

function showStudentInfo(roomNo, bedName) {
  let st = students.find(
    s => String(s.room) === String(roomNo) && String(s.bed).toLowerCase().trim() === String(bedName).toLowerCase().trim()
  );
  if (!st) return;

  const managerNote = isCurrentMealManager(st)
    ? `<p><strong>Role:</strong> Meal Manager ⭐</p>`
    : '';

  document.getElementById('student-details').innerHTML = `
    <p><strong>Name:</strong> ${formatNameWithStar(st)}</p>
    ${managerNote}
    <p><strong>ID:</strong> ${st.id}</p>
    <p><strong>Department:</strong> ${st.dept}</p>
    <p><strong>Phone:</strong> ${st.phone}</p>
    <p><strong>Blood Group:</strong> ${st.blood}</p>
    <p><strong>District:</strong> ${st.district}</p>
    <p><strong>Floor:</strong> ${st.floor}</p>
    <p><strong>Room:</strong> ${st.room} (${st.bed})</p>
  `;

  let imgElement = document.getElementById('st-profile-pic');
  imgElement.src = st.image ? st.image : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  document.getElementById('info-modal').style.display = 'flex';
}

function searchStudent() {
  let query = document.getElementById('search-input').value.toLowerCase().trim();
  let resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';

  if (query === '') return;

  let matched = students.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.id.toLowerCase().includes(query) ||
    s.dept.toLowerCase().includes(query) ||
    s.phone.toLowerCase().includes(query) ||
    s.district.toLowerCase().includes(query)
  );

  if (matched.length === 0) {
    resultsDiv.innerHTML = '<p style="color:red; margin-top:10px;">No Student Found!</p>';
    return;
  }

  matched.forEach(st => {
    resultsDiv.innerHTML += `
      <div style="background:#e2e8f0; padding:10px; margin-top:8px; border-radius:5px;">
        <strong>${formatNameWithStar(st)}</strong> (${st.id}) - Dept: ${st.dept} <br>
        📍 <strong>Floor No:</strong> ${st.floor} | 🚪 <strong>Room No:</strong> ${st.room} (${st.bed}) | 📱 ${st.phone} | 🩸 ${st.blood} | 🏙️ ${st.district}
      </div>
    `;
  });
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

renderRooms();