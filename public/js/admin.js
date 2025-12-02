// Sidebar collapse toggle
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const panelTitle = document.getElementById('panel-title');
const panelContainer = document.getElementById('panel-container');

// Toggle collapse
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Load panel dynamically
async function loadPanel(panelName) {
  try {
    const res = await fetch(`/admin/panel/${panelName}`);
    const html = await res.text();
    panelContainer.innerHTML = html;
    panelTitle.textContent = panelName.charAt(0).toUpperCase() + panelName.slice(1);
  } catch (err) {
    panelContainer.innerHTML = "<p class='text-danger p-3'>Failed to load panel.</p>";
  }
}

// Sidebar nav buttons
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const panel = btn.getAttribute('data-panel');
    loadPanel(panel);
  });
});

// Load dashboard by default
loadPanel('dashboard');
