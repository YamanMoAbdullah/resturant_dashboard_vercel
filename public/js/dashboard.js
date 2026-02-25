import { getAccessToken, refreshAccessToken } from './authService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';

  try {
    filterSidebar();
    await loadDashboardStats(); 
  } catch (err) {
    showNotification(`❌ Failed to load dashboard data: ${err.message}`, 'error');
    console.error(err);
  } finally {
    if (loader) loader.style.display = 'none';
  }
});

async function loadDashboardStats() {
  try {
    let token = getAccessToken();

    let res = await fetch("/admin/stats", {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        window.location.href = '/admin/login';
        return;
      }
      token = getAccessToken();
      res = await fetch("/admin/stats", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const result = await res.json();
    if (res.ok) {
      displayDashboardStats(result);
    } else {
      showNotification(result.message || "Failed to fetch stats", "error");
    }
  } catch (err) {
    showNotification("Error fetching dashboard stats", "error");
  }
}

function displayDashboardStats(data) {
  // DOM elements
  const totalOrdersEl = document.getElementById("totalOrders");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalMenuItemsEl = document.getElementById("totalMenuItems");
  const totalUsersEl = document.getElementById("totalUsers");

  if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrdersToday ?? 0;
  if (totalRevenueEl) totalRevenueEl.textContent = `$${(data.totalRevenue ?? 0).toFixed(2)}`;
  if (totalMenuItemsEl) totalMenuItemsEl.textContent = data.totalMenuItems ?? 0;
  if (totalUsersEl) totalUsersEl.textContent = data.totalCustomers ?? 0; 
}


function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle'
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