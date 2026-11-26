let bazarCosts = JSON.parse(localStorage.getItem('hallMealBazarCosts')) || [];

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

function renderPublicCosts() {
  const tbody = document.getElementById('public-cost-tbody');
  const query = document.getElementById('cost-search').value.toLowerCase().trim();
  tbody.innerHTML = '';

  let grandTotal = 0;
  bazarCosts.forEach(c => {
    grandTotal += Number(c.amount) || 0;
  });
  document.getElementById('public-grand-total').textContent = grandTotal;

  const filtered = bazarCosts.filter(c =>
    c.item.toLowerCase().includes(query) ||
    String(c.date).toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Kono bazar hisab pawa jayni.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.date}</td>
        <td><strong>${c.item}</strong></td>
        <td><strong>৳${c.amount}</strong></td>
      </tr>
    `;
  });
}

renderPublicCosts();