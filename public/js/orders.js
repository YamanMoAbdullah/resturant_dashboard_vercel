import { getAccessToken, refreshAccessToken } from './authService.js';

let orders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 5;

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        await fetchOrders();
        filterSidebar();
    } catch (err) {
        showNotification(`❌ Failed to load orders: ${err.message}`, 'error');
        console.error(err);
    } finally {
        if (loader) loader.style.display = 'none';
    }
});

// Fetch all orders from the backend
async function fetchOrders() {
    try {
        let token = getAccessToken();
        let response = await fetch('/admin/get-orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                window.location.href = '/admin/login';
                return;
            }
            token = getAccessToken();
            response = await fetch('/admin/get-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        const result = await response.json();
        console.log(result);
        if (!response.ok) {
            throw new Error(result.message);
        }
        orders = result.orders;
        filteredOrders = orders;
        currentPage = 1;
        displayOrders(filteredOrders);
        setupPagination();
    } catch (err) {
        throw new Error(`Failed to fetch orders: ${err.message}`);
    }
}

// Display orders in table
function displayOrders(ordersToShow) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = ordersToShow.slice(startIndex, endIndex);

    paginatedOrders.forEach((order) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order._id}</td>
            <td>${order.user?.name || 'Unknown'}</td>
            <td>${order.items.length} items</td>
            <td>$${Number(order.total_price).toFixed(2)}</td>
            <td>
                <select class="form-control status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetails('${order._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Search orders
function searchOrders(query) {
    filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(query.toLowerCase()) ||
        (order.user?.name || '').toLowerCase().includes(query.toLowerCase())
    );
    currentPage = 1;
    displayOrders(filteredOrders);
    setupPagination();
}

// Filter by status
function filterByStatus(status) {
    filteredOrders = status
        ? orders.filter(order => order.status === status)
        : orders;
    currentPage = 1;
    displayOrders(filteredOrders);
    setupPagination();
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        let token = getAccessToken();
        let response = await fetch(`/admin/order-status/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.status === 401 || response.status === 403) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                window.location.href = '/admin/login';
                return;
            }
            token = getAccessToken();
            response = await fetch(`/admin/order-status/${orderId}`, {
                method: 'PATCH',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        showNotification('✅ Order status updated successfully!', 'success');

        // Refresh orders
        await fetchOrders();
    } catch (err) {
        showNotification(`❌ Failed to update order status: ${err.message}`, 'error');
        console.error(err);
    }
}

// View order details
function viewOrderDetails(orderId) {
    try {
        const order = orders.find(o => o._id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const modalContent = document.getElementById('orderDetailsContent');
        modalContent.innerHTML = `
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Customer:</strong> ${order.user?.name || 'Unknown'}</p>
            <p><strong>Total Price:</strong> $${Number(order.total_price).toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <h3>Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.menu_item?.name || 'Unknown'}</td>
                            <td>${item.quantity}</td>
                            <td>$${Number(item.unit_price).toFixed(2)}</td>
                            <td>$${Number(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const modal = document.getElementById('orderModal');
        modal.classList.add('show');
    } catch (err) {
        showNotification(`❌ Failed to load order details: ${err.message}`, 'error');
        console.error(err);
    }
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('show');
}

// Setup pagination controls
function setupPagination() {
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) return;

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    paginationControls.innerHTML = `
        <button class="btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <span class="page-indicator">Page ${currentPage} of ${totalPages}</span>
        <button class="btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

// Change page for pagination
function changePage(newPage) {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayOrders(filteredOrders);
        setupPagination();
    }
}

// Notification function
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
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

window.changePage = changePage;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.searchOrders = searchOrders;
window.closeOrderModal = closeOrderModal;
window.filterByStatus = filterByStatus;

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

// Refresh orders (called by the refresh button)
async function refreshOrders() {
    const loaderButton = document.getElementById('loadar_orders');
    if (loaderButton) {
        loaderButton.disabled = true; 
        loaderButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`; 
    }

    try {
        await fetchOrders();
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

window.refreshOrders = refreshOrders;
