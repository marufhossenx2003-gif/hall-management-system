import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let students = []; 
let isAdmin = false;

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

window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};

window.closeInfoModal = function() {
    document.getElementById('info-modal').style.display = 'none';
};

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

window.openEditStudent = function(studentId) {
    let st = students.find(s => s.id === studentId);
    if (!st) return;
    
    closeInfoModal();
    
    document.getElementById('edit-st-original-id').value = st.id;
    document.getElementById('edit-st-name').value = st.name;
    document.getElementById('edit-st-id').value = st.id;
    document.getElementById('edit-st-dept').value = st.dept;
    document.getElementById('edit-st-phone').value = st.phone;
    document.getElementById('edit-st-blood').value = st.blood;
    document.getElementById('edit-st-district').value = st.district;
    document.getElementById('edit-st-floor').value = st.floor;
    document.getElementById('edit-st-room').value = st.room;
    document.getElementById('edit-st-bed').value = st.bed;
    
    document.getElementById('edit-modal').style.display = 'flex';
};

window.updateStudent = function(event) {
    event.preventDefault();
    let originalId = document.getElementById('edit-st-original-id').value;
    let newId = document.getElementById('edit-st-id').value.trim();
    
    let existingStudent = students.find(s => s.id === originalId);
    if (!existingStudent) return;
    
    const updatedStudent = {
        name: document.getElementById('edit-st-name').value,
        id: newId,
        dept: document.getElementById('edit-st-dept').value,
        phone: document.getElementById('edit-st-phone').value,
        blood: document.getElementById('edit-st-blood').value,
        district: document.getElementById('edit-st-district').value,
        floor: document.getElementById('edit-st-floor').value,
        room: document.getElementById('edit-st-room').value,
        bed: document.getElementById('edit-st-bed').value,
        image: existingStudent.image
    };

    if (originalId !== newId) {
        remove(ref(db, 'hallStudents/' + originalId));
    }

    set(ref(db, 'hallStudents/' + newId), updatedStudent)
        .then(() => {
            alert("Student Information Updated Successfully!");
            closeEditModal();
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
};

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

function renderRooms() {
    const roomList = document.getElementById('room-list');
    if (!roomList) return;
    roomList.innerHTML = '';
    
    hallRoomsConfig.forEach(roomInfo => {
        let card = document.createElement('div');
        card.className = 'room-card';
        let roomStudents = students.filter(s => String(s.room) === String(roomInfo.room));
        let bedsHTML = '';
        
        roomInfo.beds.forEach(bedName => {
            let st = roomStudents.find(s => s.bed.toLowerCase().trim() === bedName.toLowerCase().trim());
            
            if (st) {
                bedsHTML += `<div class="bed occupied" onclick="showStudentInfo('${st.id}')">${bedName} (${st.name})</div>`;
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

window.showStudentInfo = function(studentId) {
    let st = students.find(s => s.id === studentId);
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
    
    const actionsContainer = document.getElementById('admin-actions-container');
    if (isAdmin) {
        actionsContainer.innerHTML = `
            <button class="edit-btn" onclick="openEditStudent('${st.id}')">Edit Info</button>
            <button class="delete-btn" onclick="removeStudent('${st.id}')">Remove Student</button>
        `;
    } else {
        actionsContainer.innerHTML = '';
    }
    
    document.getElementById('info-modal').style.display = 'flex';
};

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
        let cardBg = isAdmin ? '#1e293b' : '#e2e8f0';
        resultsDiv.innerHTML += `
            <div style="background:${cardBg}; padding: 10px; margin-top:8px; border-radius:5px;">
                <strong>${st.name}</strong> (${st.id}) | Dept: ${st.dept} <br>
                <strong>Floor No:</strong> ${st.floor} | <strong>Room No:</strong> ${st.room} (${st.bed}) | ${st.phone} | ${st.blood} 
            </div>
        `;
    });
};