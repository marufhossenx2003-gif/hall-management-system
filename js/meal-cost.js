let bazarCosts = JSON.parse(localStorage.getItem('hallMealBazarCosts')) || [];

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
  const pass = prompt("Provost Admin Panel-e dhukte Password Din:");
  if (pass === "12345") {
    sessionStorage.setItem('hallAdminAuth', 'true');
    window.location.href = 'admin.html';
  } else if (pass !== null) {
    alert("Wrong Password! Access Denied.");
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
    alert("Wrong Password! Access Denied.");
  }
}

function renderPublicCosts() {
  const tbody = document.getElementById('public-cost-tbody');
  if (!tbody) return;
  const searchInput = document.getElementById('cost-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  tbody.innerHTML = '';

  let grandTotal = 0;
  bazarCosts.forEach(c => {
    grandTotal += Number(c.amount) || 0;
  });
  const totalDisplay = document.getElementById('public-grand-total');
  if (totalDisplay) totalDisplay.textContent = grandTotal;

  const countDisplay = document.getElementById('public-cost-count');
  if (countDisplay) countDisplay.textContent = bazarCosts.length;

  const filtered = bazarCosts.filter(c =>
    c.item.toLowerCase().includes(query) ||
    String(c.date).toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:24px;">No expense records found.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td><span style="font-family:monospace; font-size:13px;">${c.date}</span></td>
        <td><strong style="color:var(--text-main); font-size:14px;">${c.item}</strong></td>
        <td><strong style="color:var(--text-main); font-size:14px;">৳${c.amount}</strong></td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function reloadCostLocalData() {
  bazarCosts = JSON.parse(localStorage.getItem("hallMealBazarCosts")) || [];
}

(async function initPage() {
  if (typeof syncAllFromSupabase === "function") {
    await syncAllFromSupabase();
    reloadCostLocalData();
    renderPublicCosts();
  }
  if (typeof initSupabaseRealtime === "function") {
    initSupabaseRealtime(() => {
      reloadCostLocalData();
      renderPublicCosts();
    });
  }
})();

renderPublicCosts();
