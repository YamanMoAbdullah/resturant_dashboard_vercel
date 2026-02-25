import { getAccessToken, refreshAccessToken } from './authService.js';

let menuItems = [];
let filteredMenuItems = [];
let categories = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentEditingItem = null;

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';

  try {
    // Fetch categories first to populate selects
    await fetchCategories();
    // Then fetch menu items
    let token = getAccessToken();
    let response = await fetch('/admin/get-menu-items', {
       headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      response = await fetch('/admin/get-menu-items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }

    menuItems = result.data;
    filteredMenuItems = menuItems;
    displayMenuItems(filteredMenuItems);
    setupPagination();

    filterSidebar();
  } catch (err) {
    showNotification(`❌ Failed to load menu items: ${err.message}`, 'error');
    console.error(err);
  } finally {
    if (loader) loader.style.display = 'none';
  }
});


// Fetch categories to populate selects
async function fetchCategories() {
  try {
    let token = getAccessToken();
    let response = await fetch('/admin/get-categories', {
       headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      response = await fetch('/admin/get-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    categories = result.data;
    populateCategorySelects();
  } catch (err) {
    showNotification(`❌ Failed to load categories: ${err.message}`, 'error');
    console.error(err);
  }
}

// Populate category selects (modal and filter)
function populateCategorySelects() {
  const modalSelect = document.getElementById('itemCategory');
  const filterSelect = document.getElementById('categoryFilter');

  if (modalSelect) {
    modalSelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category._id;
      option.textContent = category.name;
      modalSelect.appendChild(option);
    });
  }

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category._id;
      option.textContent = category.name;
      filterSelect.appendChild(option);
    });
  }
}

// Display menu items in table
function displayMenuItems(itemsToShow) {
  const tbody = document.getElementById("menuItemsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = itemsToShow.slice(startIndex, endIndex);

  paginatedItems.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
      </td>
      <td>${item.name}</td>
      <td>${item.description}</td>
      <td><span class="status">${item.category?.name || 'Uncategorized'}</span></td>
      <td>$${Number(item.price).toFixed(2)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="editMenuItem('${item.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Setup pagination controls
function setupPagination() {
  const paginationControls = document.getElementById("paginationControls");
  if (!paginationControls) return;

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);

  paginationControls.innerHTML = `
    <button class="btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span class="page-indicator">Page ${currentPage} of ${totalPages}</span>
    <button class="btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
  `;
}

// Change page for pagination
function changePage(newPage) {
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayMenuItems(filteredMenuItems);
    setupPagination();
  }
}
window.changePage = changePage;
// Open menu item modal
function openMenuItemModal(itemId = null) {
  const modal = document.getElementById("menuItemModal");
  const modalTitle = document.getElementById("menuItemModalTitle");
  const form = document.getElementById("menuItemForm");
  const imagePreview = document.getElementById("imagePreview");

  if (itemId) {
    currentEditingItem = menuItems.find((item) => item.id === itemId);
    modalTitle.textContent = "Edit Menu Item";

    document.getElementById("itemName").value = currentEditingItem.name;
    document.getElementById("itemCategory").value = currentEditingItem.category?._id || '';
    document.getElementById("itemDescription").value = currentEditingItem.description;
    document.getElementById("itemPrice").value = currentEditingItem.price;

    if (currentEditingItem.image) {
      imagePreview.style.backgroundImage = `url(${currentEditingItem.image})`;
      imagePreview.classList.add("has-image");
      imagePreview.innerHTML = "";
    } else {
      imagePreview.style.backgroundImage = "";
      imagePreview.classList.remove("has-image");
      imagePreview.innerHTML = '<i class="fas fa-image"></i>';
    }
  } else {
    currentEditingItem = null;
    modalTitle.textContent = "Add Menu Item";
    form.reset();
    imagePreview.style.backgroundImage = "";
    imagePreview.classList.remove("has-image");
    imagePreview.innerHTML = '<i class="fas fa-image"></i>';
  }

  modal.classList.add("show");
}
window.openMenuItemModal = openMenuItemModal;
// Close menu item modal
function closeMenuItemModal() {
  const modal = document.getElementById("menuItemModal");
  modal.classList.remove("show");
  currentEditingItem = null;
}
window.closeMenuItemModal = closeMenuItemModal;

// Preview image before upload
function previewImage(input) {
  const preview = document.getElementById("imagePreview");

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.style.backgroundImage = `url(${e.target.result})`;
      preview.classList.add("has-image");
      preview.innerHTML = "";
    };
    reader.readAsDataURL(input.files[0]);
  }
}
window.previewImage = previewImage;
// Edit menu item
function editMenuItem(itemId) {
  openMenuItemModal(itemId);
}
window.editMenuItem = editMenuItem;
// Delete menu item
async function deleteMenuItem(itemId) {
  if (!confirm("Are you sure you want to delete this menu item?")) return;

  try {
    let token = getAccessToken();
    let response = await fetch(`/admin/delete-menu-item/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      response = await fetch(`/admin/delete-menu-item/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    const data = await response.json();

    if (!response.ok) {
      showNotification(`❌ Error: ${data.message}`, 'error');
      return;
    }

    showNotification('✅ Menu item deleted successfully!', 'success');

    // Refresh menu items
    const responseItems = await fetch('/admin/get-menu-items', {
       headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await responseItems.json();
    if (responseItems.ok) {
      menuItems = result.data;
      filteredMenuItems = menuItems;
      currentPage = 1;
      displayMenuItems(filteredMenuItems);
      setupPagination();
    }
  } catch (err) {
    showNotification('❌ Something went wrong while deleting the menu item.', 'error');
    console.error(err);
  }
}
window.deleteMenuItem = deleteMenuItem;
// Search menu items
function searchMenuItems(query) {
  filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );
  currentPage = 1;
  displayMenuItems(filteredMenuItems);
  setupPagination();
}
window.searchMenuItems = searchMenuItems;
// Filter by category
function filterByCategory(categoryId) {
  filteredMenuItems = categoryId
    ? menuItems.filter(item => item.category?._id === categoryId)
    : menuItems;
  currentPage = 1;
  displayMenuItems(filteredMenuItems);
  setupPagination();
}
window.filterByCategory = filterByCategory;
// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('menuItemForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true; 

    const formData = new FormData(form);
    try {
      const url = currentEditingItem ? `/admin/menu-items/update/${currentEditingItem.id}` : '/admin/menu-items/create';
      const method = currentEditingItem ? 'PATCH' : 'POST';

      let token = getAccessToken();
      let response = await fetch(url, {
        method: method,
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                window.location.href = '/admin/login';
                return;
            }
            token = getAccessToken();
            response = await fetch(url, {
              method: method,
              body: formData,
              headers: { 'Authorization': `Bearer ${token}` }
            });
      }

      const data = await response.json();

      if (!response.ok) {
        showNotification(`❌ Error: ${data.message}`, 'error');
        submitButton.disabled = false; 
        return;
      }

      showNotification(`✅ Menu item ${currentEditingItem ? 'updated' : 'added'} successfully!`, 'success');
      closeMenuItemModal();
      form.reset();
      document.getElementById('imagePreview').innerHTML = '<i class="fas fa-image"></i>';
      document.getElementById('imagePreview').style.backgroundImage = '';
      document.getElementById('imagePreview').classList.remove('has-image');

      // Refresh menu items
      const responseItems = await fetch('/admin/get-menu-items', {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await responseItems.json();
      if (responseItems.ok) {
        menuItems = result.data;
        filteredMenuItems = menuItems;
        currentPage = 1;
        displayMenuItems(filteredMenuItems);
        setupPagination();
      }
    } catch (err) {
      showNotification(`❌ Something went wrong while ${currentEditingItem ? 'updating' : 'submitting'} the form.`, 'error');
      console.error(err);
    } finally {
      submitButton.disabled = false; 
    }
  });
});

// Notification function
function showNotification(message, type = "success") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };
  notification.innerHTML = `
    <i class="${icons[type] || icons.info}"></i>
    <span style="margin-left: 10px;">${message}</span>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
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