// public/js/admin.js
// Admin shell: sidebar toggle + dynamic panel loader
// This version dispatches a 'panel-loaded' event so panel-specific JS can initialize.

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const panelTitle = document.getElementById('panel-title');
const panelContainer = document.getElementById('panel-container');

// Toggle collapse
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Helper: load panel by name and dispatch event
async function loadPanel(panelName) {
  try {
    // show a tiny loading state (optional)
    panelContainer.innerHTML = `<div class="p-4 text-center text-muted">Loading ${panelName}…</div>`;
    const res = await fetch(`/admin/panel/${panelName}`);
    if (!res.ok) {
      panelContainer.innerHTML = `<div class="p-4 text-danger">Failed to load panel: ${panelName}</div>`;
      return;
    }
    const html = await res.text();
    panelContainer.innerHTML = html;

    // set global currentPanel so other scripts can check it
    window.currentPanel = panelName;

    // update title
    panelTitle.textContent = panelName.charAt(0).toUpperCase() + panelName.slice(1);

    // Dispatch event so panel scripts can initialize
    const ev = new CustomEvent('panel-loaded', { detail: { panel: panelName } });
    document.dispatchEvent(ev);

  } catch (err) {
    console.error('Panel load error:', err);
    panelContainer.innerHTML = `<div class="p-4 text-danger">Error loading panel.</div>`;
  }
}

// Attach click handlers to nav buttons (delegation)
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    // remove active class
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const panel = btn.getAttribute('data-panel');
    loadPanel(panel);
  });
});

// Load dashboard by default on initial page load
document.addEventListener('DOMContentLoaded', () => {
  // find active nav button (if none, pick dashboard)
  const active = document.querySelector('.nav-link.active');
  const initial = active ? active.getAttribute('data-panel') : 'dashboard';
  loadPanel(initial);
});
