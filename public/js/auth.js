// Handle login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginBtn = document.getElementById("loginBtn");

  if (!email || !password) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  try {
    // Disable login button & show spinner
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

    // Call backend login endpoint
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // إرسال الكوكيز (refreshToken) مع الطلب
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Login failed");
    }

    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('permissions', JSON.stringify(result.permissions));
    localStorage.setItem('userName', result.name);
    
    showNotification("Successful login! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "/admin/dashboard";
    }, 1200);
  } catch (error) {
    showNotification(error.message || "Login failed. Please try again.", "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
}

// Handle logout
async function handleLogout() {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {

      const response = await fetch('/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include', 
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to logout from server');
      }
    }
  } catch (error) {
    console.error('Logout failed:', error);
    showNotification(`Logout failed: ${error.message}. Clearing local session.`, 'error');
  } finally {

    localStorage.removeItem('accessToken');
    localStorage.removeItem('permissions')
  
    showNotification('Logged out successfully', 'success');

    setTimeout(() => {
      window.location.href = '/admin/login';
    }, 1000);
  }
}

// Notification UI
function showNotification(message, type = "success") {
  // Remove existing
  document.querySelectorAll(".notification").forEach(el => el.remove());

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
    notification.remove();
  }, 4000);
}

// 👁️ Toggle password visibility
document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;

      // غير شكل الأيقونة
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }
});
