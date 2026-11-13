// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArSC1l1bqi8SYxbGm8iLIapdDpfXIP5SA",
  authDomain: "hall-management-system-677.firebaseapp.com",
  databaseURL: "https://hall-management-system-677-default-rtdb.firebaseio.com",
  projectId: "hall-management-system-677",
  storageBucket: "hall-management-system-677.firebasestorage.app",
  messagingSenderId: "1093765703596",
  appId: "1:1093765703596:web:c5c88b5e3b47f53dc4bc09",
  measurementId: "G-DT0ETMN81N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let students = []; 
let isAdmin = false;

// Hall Room & Bed Structure
const hallRoomsConfig = [
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
    { room: 301, floor: 3, beds: ['Bed-1', 'Bed-2'] },
    { room: 302, floor: 3, beds: ['Bed-1', 'Bed-2'] },
    { room: 303, floor: 3, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
    { room: 304, floor: 3, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
    { room: 401, floor: 4, beds: ['Bed-1', 'Bed-2'] },
    { room: 402, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
    { room: 403, floor: 4, beds: ['Bed-1', 'Bed-2'] },
    { room: 404, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] },
    { room: 405, floor: 4, beds: ['Bed-1', 'Bed-2'] },
    { room: 406, floor: 4, beds: ['Bed-1', 'Bed-2', 'Bed-3'] }
];

// Real-time Database Data Sync
const studentsRef = ref(db, 'hallStudents');
onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        students = Object.values(data);
    } else {
        students = [];
    }
    renderRooms();
    searchStudent();
});

// Admin Mode Toggle
window.toggleAdminMode = function() {
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
};

window.openAddStudentForBed = function(floor, room, bed) {
    if (!isAdmin) return;
    document.getElementById('add-student-form').reset();
    document.getElementById('st-floor').value = floor;
    document.getElementById('st-room').value = room;
    document.getElementById('st-bed').value = bed;
    document.getElementById('admin-modal').style.display = 'flex';
};

window.closeAdminPanel = function() {
    document.getElementById('admin-modal').style.display = 'none';
};

window.closeInfoModal = function() {
    document.getElementById('info-modal').style.display = 'none';
};

// Save Student to Firebase
window.saveStudent = function(event) {
    event.preventDefault();
    const fileInput = document.getElementById('st-image-file');
    const file = fileInput.files[0];
    const defaultImage = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            addStudentObject(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        addStudentObject(defaultImage);
    }
};

function addStudentObject(imageUrl) {
    const studentId = document.getElementById('st-id').value.trim();
    const newStudent = {
        name: document.getElementById('st-name').value,
        id: studentId,
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
    
    set(ref(db, 'hallStudents/' + studentId), newStudent)
        .then(() => {
            alert("Student Added Successfully!");
            document.getElementById('add-student-form').reset();
            closeAdminPanel();
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
}

// Remove Student
window.removeStudent = function(studentId) {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to remove this student from the bed?")) {
        remove(ref(db, 'hallStudents/' + studentId))
            .then(() => {
                alert("Student Removed Successfully!");
                closeInfoModal();
            })
            .catch((error) => {
                alert("Error: " + error.message);
            });
    }
};

// Rooms & Beds Render (Fixed for both View & Admin mode)
function renderRooms() {
    const roomList = document.getElementById('room-list');
    if (!roomList) return;
    roomList.innerHTML = '';
    
    hallRoomsConfig.forEach(roomInfo => {
        let card = document.createElement('div');
        card.className = 'room-card';
        // Match room numbers properly (handling both string and number)
        let roomStudents = students.filter(s => String(s.room) === String(roomInfo.room));
        let bedsHTML = '';
        
        roomInfo.beds.forEach(bedName => {
            let st = roomStudents.find(s => s.bed.toLowerCase().trim() === bedName.toLowerCase().trim());
            
            if (st) {
                // Occupied Bed (Works in both View & Admin mode)
                bedsHTML += `<div class="bed occupied" onclick="showStudentInfo('${st.id}')">${bedName} (${st.name})</div>`;
            } else {
                // Empty Bed
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
window.showStudentInfo = function(studentId) {
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
    
    const deleteContainer = document.getElementById('admin-delete-container');
    if (isAdmin) {
        deleteContainer.innerHTML = `<button class="delete-btn" onclick="removeStudent('${st.id}')">Remove Student from Bed</button>`;
    } else {
        deleteContainer.innerHTML = '';
    }
    
    document.getElementById('info-modal').style.display = 'flex';
};

// Instant Search Logic
window.searchStudent = function() {
    let searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    let query = searchInput.value.toLowerCase().trim();
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
        let fbSearchHTML = st.fb ? `<a href="${st.fb}" target="_blank" style="color:#38bdf8;">FB Profile</a>` : '';
        let cardBg = isAdmin ? '#1e293b' : '#e2e8f0';
        resultsDiv.innerHTML += `
            <div style="background:${cardBg}; padding: 10px; margin-top:8px; border-radius:5px;">
                <strong>${st.name}</strong> (${st.id}) | Dept: ${st.dept} <br>
                <strong>Floor No:</strong> ${st.floor} | <strong>Room No:</strong> ${st.room} (${st.bed}) | ${st.phone} | ${st.blood} 
                <br>${fbSearchHTML}
            </div>
        `;
    });
};