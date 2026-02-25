import { getAccessToken, refreshAccessToken } from './authService.js';

let users = [];
let filteredUsers = [];
let currentEditingUser = null;
let currentPage = 1;
const itemsPerPage = 5;

let accessToken = getAccessToken();
let isSubmitting = false;

const verifyAuth = async () => {
  return accessToken !== null;
};

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';

  if (window.location.pathname.includes("users")) {
    try {
      await initializeUsersPage();
    } catch (err) {
      showNotification(`❌ Failed to load users: ${err.message}`, "error");
      console.error(err);
    } finally {
      if (loader) loader.style.display = 'none';
    }
  }
  // Removed addEventListener for submit, as it's already handled inline in HTML
});

async function initializeUsersPage() {
  const isAuthenticated = await verifyAuth();
  if (!isAuthenticated) {
    showNotification("❌ You are not authenticated, please login.", "error");
    return;
  }

  await fetchUsers();
  filterSidebar();
}

async function fetchUsers() {
  try {
    if (!accessToken) throw new Error("Access token missing");

    let response = await fetch('/admin/get-users', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      accessToken = getAccessToken();
      response = await fetch('/admin/get-users', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch users');
    }

    users = result.users;
    filteredUsers = users;
    currentPage = 1;
    displayUsers(filteredUsers);
    setupPagination();
  } catch (error) {
    showNotification(`❌ Failed to fetch users: ${error.message}`, "error");
    console.error(error);
  }
}

function filterSidebar() {
  const permissions = JSON.parse(localStorage.getItem('permissions')) || [];
  const sidebarItems = document.querySelectorAll('.sidebar-menu li');

  sidebarItems.forEach((li) => {
    const a = li.querySelector('a');
    if (a) {
      const href = a.getAttribute('href');
      if (href !== '#' && !permissions.includes(href)) {
        li.style.display = 'none';
      }
    }
  });
}

function displayUsers(usersToShow) {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = usersToShow.slice(startIndex, endIndex);

  paginatedUsers.forEach((user) => {
    const row = document.createElement("tr");

    let actions = '';
    if (user.role !== 'superAdmin') {
      actions = `
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    } else {
      actions = 'Protected';
    }

    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div><strong>${user.name}</strong></div>
        </div>
      </td>
      <td>${user.email}</td>
      <td><span class="role-badge ${user.role}">${user.role}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(row);
  });
}

function searchUsers(query) {
  filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) || 
      user.email.toLowerCase().includes(query.toLowerCase())
  );
  currentPage = 1;
  displayUsers(filteredUsers);
  setupPagination();
}

function filterByRole(role) {
  filteredUsers = role === "" ? users : users.filter((user) => user.role === role);
  currentPage = 1;
  displayUsers(filteredUsers);
  setupPagination();
}

function openUserModal(userId = null) {
  const modal = document.getElementById("userModal");
  const modalTitle = document.getElementById("userModalTitle");
  const form = document.getElementById("userForm");

  if (userId) {
    currentEditingUser = users.find((user) => user._id === userId);
    if (currentEditingUser.role === 'superAdmin') {
      showNotification("❌ Cannot edit Super Admin users", "error");
      return;
    }
    modalTitle.textContent = "Edit User";
    document.getElementById("userName").value = currentEditingUser.name;
    document.getElementById("userEmail").value = currentEditingUser.email;
    document.getElementById("userRole").value = currentEditingUser.role;
    document.getElementById("userPassword").value = "";
    // Set page access checkboxes
    const checkboxes = document.querySelectorAll(".page-access-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = currentEditingUser.allowedPages ? currentEditingUser.allowedPages.includes(checkbox.dataset.page) : false;
    });
  } else {
    currentEditingUser = null;
    modalTitle.textContent = "Add User";
    form.reset();
    // Reset checkboxes to default (checked)
    const checkboxes = document.querySelectorAll(".page-access-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
    });
  }

  modal.classList.add("show");
}

function closeUserModal() {
  const modal = document.getElementById("userModal");
  modal.classList.remove("show");
  currentEditingUser = null;
}

async function saveUser(event) {
  event.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const userName = document.getElementById("userName").value.trim();
  const userEmail = document.getElementById("userEmail").value.trim();
  const userRole = document.getElementById("userRole").value;
  const userPassword = document.getElementById("userPassword").value;

  if (!userName || !userEmail) {
    showNotification("❌ Name and Email are required", "error");
    submitButton.disabled = false;
    isSubmitting = false;
    return;
  }

  if (!currentEditingUser && !userPassword) {
    showNotification("❌ Password is required for new users!", "error");
    submitButton.disabled = false;
    isSubmitting = false;
    return;
  }

  if (currentEditingUser && currentEditingUser.role === 'superAdmin') {
    showNotification("❌ Cannot update Super Admin users", "error");
    submitButton.disabled = false;
    isSubmitting = false;
    return;
  }

  const userData = { name: userName, email: userEmail, role: userRole };
  if (userPassword) userData.password = userPassword;

  // Collect allowed pages
  const allowedPages = Array.from(document.querySelectorAll('.page-access-checkbox:checked'))
    .map(checkbox => checkbox.dataset.page);
  userData.permissions = allowedPages;

  try {
    if (!accessToken) throw new Error("Access token missing");
    const url = currentEditingUser ? `/admin/update-user/${currentEditingUser._id}` : '/admin/create-user';
    const method = currentEditingUser ? 'PATCH' : 'POST';

    let response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify(userData)
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        isSubmitting = false;
        return;
      }
      accessToken = getAccessToken();
      response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify(userData)
      });
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to save user');

    showNotification(`✅ User ${currentEditingUser ? 'updated' : 'created'} successfully!`, "success");
    closeUserModal();
    await fetchUsers();
  } catch (error) {
    showNotification(`❌ Failed to save user: ${error.message}`, "error");
    console.error(error);
  } finally {
    submitButton.disabled = false;
    isSubmitting = false;
  }
}

function editUser(userId) { openUserModal(userId); }

async function deleteUser(userId) {
  const user = users.find((u) => u._id === userId);
  if (!user) return;

  if (user.role === 'superAdmin') {
    showNotification("❌ Cannot delete Super Admin users", "error");
    return;
  }

  if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;

  try {
    if (!accessToken) throw new Error("Access token missing");

    let response = await fetch(`/admin/delete-user/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      accessToken = getAccessToken();
      response = await fetch(`/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete user');

    showNotification("✅ User deleted successfully!", "success");
    await fetchUsers();
  } catch (error) {
    showNotification(`❌ Failed to delete user: ${error.message}`, "error");
    console.error(error);
  }
}

function setupPagination() {
  const paginationControls = document.getElementById('paginationControls');
  if (!paginationControls) return;

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  paginationControls.innerHTML = `
    <button class="btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span class="page-indicator">Page ${currentPage} of ${totalPages}</span>
    <button class="btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
  `;
}

function changePage(newPage) {
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayUsers(filteredUsers);
    setupPagination();
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function showNotification(message, type = "success") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icons = { success: "fas fa-check-circle", error: "fas fa-exclamation-circle", info: "fas fa-info-circle" };
  notification.innerHTML = `<i class="${icons[type] || icons.info}"></i><span style="margin-left: 10px;">${message}</span>`;

  document.body.appendChild(notification);
  setTimeout(() => { if (notification.parentNode) notification.remove(); }, 4000);
}


async function refreshOrders() {
    const loaderButton = document.getElementById('loadar_orders');
    if (loaderButton) {
        loaderButton.disabled = true; 
        loaderButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`; 
    }

    try {
        await fetchUsers();
        showNotification('🔄 Orders refreshed successfully!', 'success');
    } catch (err) {
        showNotification(`❌ Failed to refresh orders: ${err.message}`, 'error');
        console.error(err);
    } finally {
        if (loaderButton) {
            loaderButton.disabled = false;
            loaderButton.innerHTML = `<i class="fas fa-sync-alt"></i>`; 
        }
    }
}


// Global functions
window.refreshOrders = refreshOrders;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.changePage = changePage;
window.searchUsers = searchUsers;
window.filterByRole = filterByRole;
window.closeUserModal = closeUserModal;
window.openUserModal = openUserModal;
window.saveUser = saveUser;
window.setupPagination = setupPagination;
window.formatDate = formatDate;
window.showNotification = showNotification;
window.initializeUsersPage = initializeUsersPage;
window.fetchUsers = fetchUsers;
window.verifyAuth = verifyAuth;