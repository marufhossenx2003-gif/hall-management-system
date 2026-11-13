// LocalStorage theke data load kora
let students = JSON.parse(localStorage.getItem('hallStudents')) || [];
let isAdmin = false; // Admin Mode tracking variable

// Apnar Hall-er Real Room & Bed Structure Data
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

// Admin Mode Toggle (Login / Logout)
function toggleAdminMode() {
    if (!isAdmin) {
        let password = prompt("Enter Admin Password:");
        if (password === "1234") {
            isAdmin = true;
            document.body.classList.add('admin-mode');
            document.getElementById('admin-btn').innerText = "Exit Admin Mode";
            document.getElementById('admin-btn').style.backgroundColor = "#475569";
            document.getElementById('admin-badge').style.display = "inline-block";
            document.getElementById('admin-hint').style.display = "block";
            renderRooms();
        } else if (password !== null) {
            alert("Wrong Password! Access Denied.");
        }
    } else {
        isAdmin = false;
        document.body.classList.remove('admin-mode');
        document.getElementById('admin-btn').innerText = "Admin Login";
        document.getElementById('admin-btn').style.backgroundColor = "#ef4444";
        document.getElementById('admin-badge').style.display = "none";
        document.getElementById('admin-hint').style.display = "none";
        renderRooms();
    }
}

// Specific Bed-e click korle Form Open hobe (Auto-filled)
function openAddStudentForBed(floor, room, bed) {
    if (!isAdmin) return; // Viewer mode-e kaj korbe na
    
    document.getElementById('add-student-form').reset();
    document.getElementById('st-floor').value = floor;
    document.getElementById('st-room').value = room;
    document.getElementById('st-bed').value = bed;
    
    document.getElementById('admin-modal').style.display = 'flex';
}

function closeAdminPanel() {
    document.getElementById('admin-modal').style.display = 'none';
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// Student Save Function
function saveStudent(event) {
    event.preventDefault();
    const fileInput = document.getElementById('st-image-file');
    const file = fileInput.files[0];
    const defaultImage = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            addStudentObject(imageData);
        };
        reader.readAsDataURL(file);
    } else {
        addStudentObject(defaultImage);
    }
}

function addStudentObject(imageUrl) {
    const newStudent = {
        name: document.getElementById('st-name').value,
        id: document.getElementById('st-id').value,
        dept: document.getElementById('st-dept').value,
        phone: document.getElementById('st-phone').value,
        blood: document.getElementById('st-blood').value,
        district: document.getElementById('st-district').value,
        floor: document.getElementById('st-floor').value,
        room: document.getElementById('st-room').value,
        bed: document.getElementById('st-bed').value,
        fb: document.getElementById('st-fb').value.trim(),
        image: imageUrl
    };
    
    students.push(newStudent);
    localStorage.setItem('hallStudents', JSON.stringify(students));
    alert("Student Added Successfully!");
    document.getElementById('add-student-form').reset();
    closeAdminPanel();
    renderRooms();
    searchStudent(); // Search result thakle update korbe
}

// Student Remove Function (Only for Admin)
function removeStudent(studentId) {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to remove this student from the bed?")) {
        students = students.filter(s => s.id !== studentId);
        localStorage.setItem('hallStudents', JSON.stringify(students));
        closeInfoModal();
        renderRooms();
        searchStudent();
    }
}

// Rooms & Beds Render
function renderRooms() {
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';
    
    hallRoomsConfig.forEach(roomInfo => {
        let card = document.createElement('div');
        card.className = 'room-card';
        let roomStudents = students.filter(s => s.room == roomInfo.room);
        let bedsHTML = '';
        
        roomInfo.beds.forEach(bedName => {
            let st = roomStudents.find(s => s.bed.toLowerCase().trim() === bedName.toLowerCase().trim());
            if (st) {
                bedsHTML += `<div class="bed occupied" onclick="showStudentInfo('${st.id}')">${bedName} (Occupied)</div>`;
            } else {
                if (isAdmin) {
                    bedsHTML += `<div class="bed empty" onclick="openAddStudentForBed(${roomInfo.floor}, ${roomInfo.room}, '${bedName}')">+ ${bedName} (Empty)</div>`;
                } else {
                    bedsHTML += `<div class="bed empty">${bedName} (Empty)</div>`;
                }
            }
        });
        
        card.innerHTML = `
            <h3>Room: ${roomInfo.room} <span style="font-size:12px; color: #94a3b8;">(Floor ${roomInfo.floor})</span></h3>
            <div class="bed-container">${bedsHTML}</div>
        `;
        roomList.appendChild(card);
    });
}

// Student Info Display Modal
function showStudentInfo(studentId) {
    let st = students.find(s => s.id === studentId);
    if (!st) return;
    
    let fbHTML = st.fb 
        ? `<p><strong>Facebook:</strong> <a href="${st.fb}" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:bold;">FB Profile</a></p>` 
        : `<p><strong>Facebook:</strong> Not Provided</p>`;
        
    document.getElementById('student-details').innerHTML = `
        <p><strong>Name:</strong> ${st.name}</p>
        <p><strong>ID:</strong> ${st.id}</p>
        <p><strong>Department:</strong> ${st.dept}</p>
        <p><strong>Phone:</strong> ${st.phone}</p>
        <p><strong>Blood Group:</strong> ${st.blood}</p>
        <p><strong>District:</strong> ${st.district}</p>
        <p><strong>Floor:</strong> ${st.floor}</p>
        <p><strong>Room:</strong> ${st.room} (${st.bed})</p>
        ${fbHTML}
    `;
    
    let imgElement = document.getElementById('st-profile-pic');
    imgElement.src = st.image ? st.image : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    
    // Admin mode-e thakle Delete button dekhabe
    const deleteContainer = document.getElementById('admin-delete-container');
    if (isAdmin) {
        deleteContainer.innerHTML = `<button class="delete-btn" onclick="removeStudent('${st.id}')">Remove Student from Bed</button>`;
    } else {
        deleteContainer.innerHTML = '';
    }
    
    document.getElementById('info-modal').style.display = 'flex';
}

// Instant Search Logic
function searchStudent() {
    let query = document.getElementById('search-input').value.toLowerCase().trim();
    let resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    if (query === '') return;
    
    let matched = students.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.dept.toLowerCase().includes(query) ||
        s.phone.includes(query) ||
        s.district.toLowerCase().includes(query)
    );
    
    if (matched.length === 0) {
        resultsDiv.innerHTML = '<p style="color:#ef4444; margin-top:10px;">No Student Found!</p>';
        return;
    }
    
    matched.forEach(st => {
        let fbSearchHTML = st.fb ? `<a href="${st.fb}" target="_blank" style="color:#2563eb;">FB Profile</a>` : '';
        let cardBg = isAdmin ? '#1e293b' : '#e2e8f0';
        resultsDiv.innerHTML += `
            <div style="background:${cardBg}; padding: 10px; margin-top:8px; border-radius:5px;">
                <strong>${st.name}</strong> (${st.id}) | Dept: ${st.dept} <br>
                <strong>Floor No:</strong> ${st.floor} | <strong>Room No:</strong> ${st.room} (${st.bed}) | ${st.phone} | ${st.blood} 
                <br>${fbSearchHTML}
            </div>
        `;
    });
}

// Initial Load
renderRooms();