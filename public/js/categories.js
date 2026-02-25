import { getAccessToken, refreshAccessToken } from './authService.js';

let currentEditingCategory = null;

// DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';

  if (window.location.pathname.includes("categories")) {
    try {
      await fetchCategories();
      filterSidebar();
    } catch (err) {
      showNotification("Error fetching categories", "error");
      console.error(err);
    } finally {
      if (loader) loader.style.display = 'none';
    }
  }

  const categoryForm = document.getElementById("categoryForm");
  if (categoryForm) {
    categoryForm.addEventListener("submit", (event) => {
      saveCategory(event);
    });
  }
});

// Fetch all categories
async function fetchCategories() {
  try {
    let token = getAccessToken();
    let res = await fetch("/admin/get-categories", {
       headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      res = await fetch("/admin/get-categories", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const result = await res.json();
    if (result.success) {
      displayCategories(result.data);
    } else {
      showNotification(result.message || "Failed to fetch categories", "error");
    }
  } catch (err) {
    console.log(err);
    showNotification("Error fetching categories", "error");
  }
}
window.fetchCategories = fetchCategories;

// Display categories in grid
function displayCategories(categories) {
  const grid = document.getElementById("categoriesGrid");
  grid.innerHTML = "";

  categories.forEach((category) => {
    const categoryCard = document.createElement("div");
    categoryCard.className = "category-card";
    categoryCard.innerHTML = `
      <div class="category-card-header">
        <div style="display: flex; align-items: center; gap: 15px;">
          <i class="fas fa-tags" style="font-size: 2rem;"></i>
          <div>
            <h3>${category.name}</h3>
            <p style="margin: 0; opacity: 0.9;">${category.description}</p>
          </div>
        </div>
      </div>
      <div class="category-card-body">
        <div class="category-stats">
          <div class="category-stat">
            <h4>${category.itemCount || 0}</h4>
            <p>Menu Items</p>
          </div>
          <div class="category-stat">
            <h4>${formatDate(category.createdAt)}</h4>
            <p>Created</p>
          </div>
        </div>
        <div class="btn-group" style="margin-top: 15px; justify-content: center;">
          <button class="btn btn-sm btn-primary" onclick="editCategory('${category._id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category._id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    grid.appendChild(categoryCard);
  });
}
window.displayCategories = displayCategories;

// Open Modal
async function openCategoryModal(categoryId = null) {
  const modal = document.getElementById("categoryModal");
  const modalTitle = document.getElementById("categoryModalTitle");
  const form = document.getElementById("categoryForm");

  clearFormErrors();

  if (categoryId) {
    try {
      let token = getAccessToken();
      let res = await fetch(`/admin/get-category/${categoryId}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          window.location.href = '/admin/login';
          return;
        }
        token = getAccessToken();
        res = await fetch(`/admin/get-category/${categoryId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      const result = await res.json();
      if (result.success) {
        currentEditingCategory = result.data;
        modalTitle.textContent = "Edit Category";
        document.getElementById("categoryName").value = result.data.name;
        document.getElementById("categoryDescription").value = result.data.description;
      } else {
        showNotification(result.message || "Failed to load category", "error");
        return;
      }
    } catch (err) {
      showNotification("Error loading category", "error");
      return;
    }
  } else {
    currentEditingCategory = null;
    modalTitle.textContent = "Add Category";
    form.reset();
  }

  modal.classList.add("show");
}
window.openCategoryModal = openCategoryModal;

// Close Modal
function closeCategoryModal() {
  document.getElementById("categoryModal").classList.remove("show");
  currentEditingCategory = null;
  clearFormErrors();
}
window.closeCategoryModal = closeCategoryModal;

// Save Category
async function saveCategory(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("saveCategoryBtn");
  if (saveBtn.disabled) return; 
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  const nameInput = document.getElementById("categoryName");
  const descInput = document.getElementById("categoryDescription");

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name || !description) {
    showNotification("Please fill in all fields", "error");
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Category';
    return;
  }

  const payload = { name, description };

  try {
    let res;
    let token = getAccessToken();
    if (currentEditingCategory) {
      res = await fetch(`/admin/update-category/${currentEditingCategory._id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401 || res.status === 403) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          window.location.href = '/admin/login';
          return;
        }
        token = getAccessToken();
        res = await fetch(`/admin/update-category/${currentEditingCategory._id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
    } else {
      res = await fetch("/admin/create-category", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401 || res.status === 403) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          window.location.href = '/admin/login';
          return;
        }
        token = getAccessToken();
        res = await fetch("/admin/create-category", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
    }

    const result = await res.json();

    if (result.success) {
      showNotification(`Category ${currentEditingCategory ? 'updated' : 'created'} successfully!`, "success");
      await fetchCategories();
      closeCategoryModal();
    } else {
      if (result.message && result.message.includes('validation failed')) {
        const errors = result.message.split(': ').slice(1).map(error => {
          const [field, ...messageParts] = error.split(', ');
          const message = messageParts.join(', ').trim() || 'Invalid input';
          return `${field}: ${message}`;
        });
        displayFormErrors(errors);
      } else {
        showNotification(result.message || "Operation failed", "error");
      }
    }
  } catch (err) {
    showNotification("Error saving category: " + err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Category';
  }
}
window.saveCategory = saveCategory;

// Delete
async function deleteCategory(categoryId) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  try {
    let token = getAccessToken();
    let res = await fetch(`/admin/delete-category/${categoryId}`, { 
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      res = await fetch(`/admin/delete-category/${categoryId}`, { 
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const result = await res.json();
    if (result.success) {
      showNotification(result.message || "Category deleted", "success");
      await fetchCategories();
    } else {
      showNotification(result.message || "Delete failed", "error");
    }
  } catch (err) {
    showNotification("Error deleting category", "error");
  }
}
window.deleteCategory = deleteCategory;

// Helpers
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}
window.formatDate = formatDate;

function showNotification(message, type = "success") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach(n => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle"
  };
  notification.innerHTML = `<i class="${icons[type] || icons.info}"></i><span style="margin-left: 10px;">${message}</span>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}
window.showNotification = showNotification;

function displayFormErrors(errors) {
  clearFormErrors();
  errors.forEach(error => {
    const [field, message] = error.split(': ');
    const errorEl = document.getElementById(`${field.toLowerCase()}Error`);
    const inputEl = document.getElementById(`category${capitalize(field)}`);
    if (errorEl && inputEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      inputEl.classList.add('error');
    } else {
      showNotification(`Validation error: ${message}`, "error");
    }
  });
}
window.displayFormErrors = displayFormErrors;

function clearFormErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  const inputElements = document.querySelectorAll('.form-control');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  inputElements.forEach(el => el.classList.remove('error'));
}
window.clearFormErrors = clearFormErrors;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
window.capitalize = capitalize;

function editCategory(itemId) {
  openCategoryModal(itemId);
}
window.editCategory = editCategory; // حطها مباشرة بعد تعريف الدالة

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