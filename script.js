let students = JSON.parse(localStorage.getItem('hallStudents')) || [];

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
  const password = prompt("Admin Panel Page-e dhukte Password Din:");
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
        bedsHTML += `<div class="bed occupied" onclick="showStudentInfo('${roomInfo.room}', '${bedName}')">${bedName} (Occupied)</div>`;
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

  document.getElementById('student-details').innerHTML = `
    <p><strong>Name:</strong> ${st.name}</p>
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
        <strong>${st.name}</strong> (${st.id}) - Dept: ${st.dept} <br>
        📍 <strong>Floor No:</strong> ${st.floor} | 🚪 <strong>Room No:</strong> ${st.room} (${st.bed}) | 📱 ${st.phone} | 🩸 ${st.blood} | 🏙️ ${st.district}
      </div>
    `;
  });
}

renderRooms();