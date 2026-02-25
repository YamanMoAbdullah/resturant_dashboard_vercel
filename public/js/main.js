
// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.classList.remove("show");
      }
    });
  });

  // Close dropdown when clicking outside
  window.addEventListener("click", (event) => {
    if (!event.target.closest(".user-menu")) {
      const dropdown = document.getElementById("userDropdown");
      if (dropdown) {
        dropdown.classList.remove("show");
      }
    }
  });
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
}

// Toggle user menu
function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown");
  dropdown.classList.toggle("show");
}
