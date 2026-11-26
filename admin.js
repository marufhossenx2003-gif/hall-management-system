if (sessionStorage.getItem('hallAdminAuth') !== 'true') {
  const pass = prompt("Admin Panel-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallAdminAuth', 'true');
  } else {
    alert("Access Denied!");
    window.location.href = 'index.html';
  }
}

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
  { room: 405, floor: 4, beds: ['Bed-1'] },
  { room: 406, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
  { room: 407, floor: 4, beds: ['Bed-1'] }
];

let selectedTarget = { floor: 2, room: 201, bed: 'Bed-1' };
let existingImageData = '';

function openNavDrawer() {
  document.getElementById('left-drawer').classList.add('open');
  document.getElementById('nav-overlay').classList.add('active');
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
  const pass = prompt("Meal Manager Page-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallMealManagerAuth', 'true');
    window.location.href = 'meal-manager.html';
  } else if (pass !== null) {
    alert("Wrong Password!");
  }
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
  document.getElementById('selected-bed-banner').innerHTML =
    `Selected: <strong>Floor ${floor} | Room ${room} | ${bed}</strong>`;

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
    vacateBtn.style.display = 'block';
  } else {
    document.getElementById('admin-student-form').reset();
    existingImageData = '';
    vacateBtn.style.display = 'none';
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

  alert(`Saved to Floor ${selectedTarget.floor}, Room ${selectedTarget.room}, ${selectedTarget.bed}!`);
  existingImageData = imageData;
  document.getElementById('vacate-btn').style.display = 'block';
  renderAdminRooms();
}

function vacateSelectedBed() {
  students = students.filter(
    s => !(String(s.room) === String(selectedTarget.room) && String(s.bed).toLowerCase().trim() === selectedTarget.bed.toLowerCase().trim())
  );
  localStorage.setItem('hallStudents', JSON.stringify(students));
  document.getElementById('admin-student-form').reset();
  existingImageData = '';
  document.getElementById('vacate-btn').style.display = 'none';
  alert("Bed vacated!");
  renderAdminRooms();
}

function renderAdminRooms() {
  const container = document.getElementById('admin-floor-room-list');
  container.innerHTML = '';

  const floors = [2, 3, 4];

  floors.forEach(floorNo => {
    const floorDiv = document.createElement('div');
    floorDiv.className = 'floor-group';
    floorDiv.innerHTML = `<div class="floor-title">🏢 Floor ${floorNo}</div>`;

    const grid = document.createElement('div');
    grid.className = 'admin-room-grid';

    const roomsInFloor = hallRoomsConfig.filter(r => r.floor === floorNo);

    roomsInFloor.forEach(roomObj => {
      const card = document.createElement('div');
      card.className = 'admin-room-card';

      let buttonsHTML = `<h4>🚪 Room ${roomObj.room}</h4>`;
      roomObj.beds.forEach(bedName => {
        const occ = findStudentAtBed(roomObj.room, bedName);
        const isSelected =
          String(selectedTarget.room) === String(roomObj.room) &&
          String(selectedTarget.bed) === bedName;

        const statusClass = occ ? 'occupied' : 'empty';
        const selectedClass = isSelected ? 'selected' : '';
        const label = occ ? `${bedName} — ${occ.name}` : `${bedName} — Empty`;

        buttonsHTML += `
          <button type="button" class="bed-select-btn ${statusClass} ${selectedClass}" onclick="selectBed(${floorNo}, ${roomObj.room}, '${bedName}')">
            ${label}
          </button>
        `;
      });

      card.innerHTML = buttonsHTML;
      grid.appendChild(card);
    });

    floorDiv.appendChild(grid);
    container.appendChild(floorDiv);
  });
}

renderAdminRooms();
selectBed(2, 201, 'Bed-1');