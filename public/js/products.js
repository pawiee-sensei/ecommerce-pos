// public/js/products.js
console.log('%cproducts.js (POS operational) loaded', 'color:#06b6d4;font-weight:700');

const PAGE_SIZE = 12; // denser pages for POS style

let PRODUCTS = [];
let STOCKLOGS = [];
let CATEGORIES = [];

let STATE = {
  q: '',
  category_id: '',
  sort: '',
  page: 1
};

// Short DOM helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// When panel is injected, initialize
document.addEventListener('panel-loaded', (ev) => {
  if (!window.currentPanel || window.currentPanel !== 'products') return;
  initProductsPanel();
});

// If already on products panel when script loads
if (window.currentPanel === 'products') {
  setTimeout(initProductsPanel, 50);
}

async function initProductsPanel() {
  bindTopControls();
  await Promise.all([safeFetchCategories(), safeFetchStockLogs()]);
  await loadProducts();
  bindDelegatedActions();
  bindEditImagePreview();
}

// ---------- Fetch / Load ----------
async function loadProducts() {
  try {
    const res = await fetch('/products/list');
    const data = await res.json();
    if (!data.success) { PRODUCTS = []; renderProducts([]); return; }
    PRODUCTS = data.products || [];
    STATE.page = 1;
    applyAndRender();
  } catch (err) {
    console.error('loadProducts error', err);
    alert('Failed to load products (see console).');
  }
}

async function safeFetchCategories() {
  try {
    const res = await fetch('/categories/list');
    const d = await res.json();
    if (d && d.success) CATEGORIES = d.categories || [];
    populateCategorySelects();
  } catch (err) {
    console.warn('categories not available', err);
    CATEGORIES = [];
    populateCategorySelects();
  }
}

async function safeFetchStockLogs() {
  try {
    const res = await fetch('/stocklogs/list');
    const d = await res.json();
    if (d && d.success) STOCKLOGS = d.logs || [];
    renderStockLogs();
  } catch (err) {
    console.warn('stocklogs not available', err);
    STOCKLOGS = [];
    renderStockLogs();
  }
}

// ---------- Bind top controls ----------
function bindTopControls() {
  const elSearch = $('#product-search');
  if (elSearch) {
    elSearch.addEventListener('input', debounce((e) => {
      STATE.q = e.target.value;
      STATE.page = 1;
      applyAndRender();
    }, 300));
  }

  const elCat = $('#product-category');
  if (elCat) {
    elCat.addEventListener('change', (e) => {
      STATE.category_id = e.target.value;
      STATE.page = 1;
      applyAndRender();
    });
  }

  const elSort = $('#product-sort');
  if (elSort) {
    elSort.addEventListener('change', (e) => {
      STATE.sort = e.target.value;
      applyAndRender();
    });
  }

  const btnRefresh = $('#btn-refresh-products');
  if (btnRefresh) btnRefresh.addEventListener('click', loadProducts);

  const btnOpenAdd = $('#btn-open-add-product');
  if (btnOpenAdd) btnOpenAdd.addEventListener('click', () => {
    const modal = new bootstrap.Modal($('#modalAddProduct'));
    modal.show();
  });
}

// ---------- Render pipeline ----------
function applyAndRender() {
  let list = PRODUCTS.slice();

  // search
  const q = (STATE.q || '').trim().toLowerCase();
  if (q) list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));

  // category
  if (STATE.category_id) list = list.filter(p => String(p.category_id) === String(STATE.category_id));

  // sort
  switch (STATE.sort) {
    case 'price_asc': list.sort((a,b)=>a.price-b.price); break;
    case 'price_desc': list.sort((a,b)=>b.price-a.price); break;
    case 'stock_asc': list.sort((a,b)=>a.stock-b.stock); break;
    case 'stock_desc': list.sort((a,b)=>b.stock-a.stock); break;
    default: list.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)); break;
  }

  // pagination
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (STATE.page > pages) STATE.page = pages;
  const start = (STATE.page - 1) * PAGE_SIZE;
  const pageList = list.slice(start, start + PAGE_SIZE);

  renderProducts(pageList);
  renderPager(total, pages);
  updateOverview(list);
}

function renderProducts(arr) {
  const tbody = $('#products-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!arr.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No products.</td></tr>`;
    $('#product-count').textContent = '0 items';
    return;
  }

  $('#product-count').textContent = `${arr.length} / ${PRODUCTS.length}`;

  const logsByProduct = groupLogsByProduct(STOCKLOGS);

  for (const p of arr) {
    const img = p.image_path || '/public/img/no-image.png';
    const status = statusLabel(p.stock);
    const daysLeft = computeDaysLeft(p.id, p.stock, logsByProduct);
    const notes = computeNotes(p.id, p, STOCKLOGS);

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td style="width:72px"><img src="${img}" class="product-thumb" alt=""></td>
        <td class="align-middle"><div class="fw-semibold">${escape(p.name)}</div><div class="text-muted small">${escape(p.sku || '')}</div></td>
        <td>${escape(p.category_name || '-')}</td>
        <td>${Number(p.stock)}</td>
        <td>${status}</td>
        <td>${daysLeft === null ? '-' : daysLeft}</td>
        <td>${notes}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `);
  }
}

// ---------- Pager rendering ----------
function renderPager(total, pages) {
  const container = $('#products-pager');
  const compact = $('#products-pager-compact');
  if (!container) return;

  // left: show total
  container.innerHTML = `<div class="text-muted small">Showing ${Math.min((STATE.page-1)*PAGE_SIZE+1, total)} - ${Math.min(STATE.page*PAGE_SIZE, total)} of ${total}</div>`;

  // right: page controls inside compact
  if (compact) {
    let html = '';
    const prev = STATE.page - 1;
    const next = STATE.page + 1;
    html += `<div class="btn-group btn-group-sm">`;
    html += `<button class="btn btn-outline-secondary" data-page="${prev}" ${prev<1?'disabled':''}>Prev</button>`;
    html += `<button class="btn btn-outline-secondary" data-page="${next}" ${next>pages?'disabled':''}>Next</button>`;
    html += `</div>`;
    compact.innerHTML = html;
    compact.querySelectorAll('button[data-page]').forEach(b => {
      b.addEventListener('click', (ev) => {
        const page = Number(b.getAttribute('data-page'));
        if (!page || page < 1) return;
        STATE.page = page;
        applyAndRender();
      });
    });
  }
}

// ---------- Stock logs ----------
function renderStockLogs() {
  const tbody = $('#stocklogs-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!STOCKLOGS.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center py-3">No activity</td></tr>`;
    return;
  }

  for (const l of STOCKLOGS.slice(0,50)) {
    const img = l.image_path || '/public/img/no-image.png';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escape(l.action)}</td>
        <td style="width:48px"><img src="${img}" class="product-thumb" alt=""></td>
        <td>${escape(l.product_name || '')}</td>
        <td>${l.qty}</td>
        <td>${l.previous_stock}</td>
        <td>${l.new_stock}</td>
        <td>${escape(l.reason || '')}</td>
        <td>${new Date(l.created_at).toLocaleString()}</td>
      </tr>
    `);
  }
}

// ---------- Overview KPIs ----------
function updateOverview(list) {
  $('#inv-total-skus').textContent = list.length;
  const low = list.filter(p=>p.stock>0 && p.stock<=5).length;
  const out = list.filter(p=>p.stock<=0).length;
  const totalStock = list.reduce((s,p)=>s + Number(p.stock || 0), 0);
  $('#inv-low').textContent = low;
  $('#inv-out').textContent = out;
  $('#inv-total-skus').textContent = list.length;
  $('#kpi-total-products') && ($('#kpi-total-products').textContent = PRODUCTS.length);
  $('#kpi-total-stock') && ($('#kpi-total-stock').textContent = totalStock);
  $('#kpi-low-stock') && ($('#kpi-low-stock').textContent = low);
  $('#kpi-out-stock') && ($('#kpi-out-stock').textContent = out);

  // heuristics for fast/slow moving
  const fast = computeFastMoving(list);
  const slow = computeSlowMoving(list);
  $('#inv-fast').textContent = fast;
  $('#inv-slow').textContent = slow;
}

// ---------- Utilities ----------
function statusLabel(stock) {
  const s = Number(stock);
  if (s <= 0) return '❌ OUT';
  if (s <= 5) return '🔴 Low';
  if (s <= 20) return '🟡 Medium';
  return '🟢 Good';
}

function groupLogsByProduct(logs) {
  const map = {};
  for (const l of logs) (map[l.product_id] = map[l.product_id] || []).push(l);
  return map;
}

function computeDaysLeft(productId, currentStock, logsByProduct) {
  try {
    const logs = logsByProduct[productId] || [];
    const now = Date.now();
    const daysWindow = 30 * 24 * 3600 * 1000;
    const saleLogs = logs.filter(l => l.action === 'sale' && (now - new Date(l.created_at).getTime()) <= daysWindow);
    if (!saleLogs.length) return null;
    let totalQty = 0; let earliest = Infinity, latest = 0;
    for (const s of saleLogs) {
      totalQty += Number(s.qty);
      const t = new Date(s.created_at).getTime();
      earliest = Math.min(earliest, t);
      latest = Math.max(latest, t);
    }
    const days = Math.max(1, (latest - earliest)/(24*3600*1000));
    const avgDaily = totalQty / days;
    if (avgDaily <= 0) return null;
    const left = Number((Number(currentStock)/avgDaily).toFixed(1));
    return `${left} days`;
  } catch(e){ return null; }
}

function computeNotes(productId, product, allLogs) {
  try {
    const now = Date.now(); const window14 = 14*24*3600*1000;
    const recentSales = allLogs.filter(l => l.product_id === productId && l.action === 'sale' && (now - new Date(l.created_at).getTime()) <= window14);
    if (product.stock <= 0) return `<span class="badge bg-danger">Emergency</span>`;
    if (recentSales.length >= 5) return `<span class="badge bg-primary">Fast-moving</span>`;
    if (recentSales.length === 0) return `<span class="badge bg-secondary">No recent sales</span>`;
    return `<span class="badge bg-success">Stable</span>`;
  } catch(e){ return ''; }
}

function computeFastMoving(list) {
  // naive: count products with recent sale > 3 in last 14 days
  const now = Date.now(), window14 = 14*24*3600*1000;
  let count = 0;
  for (const p of list) {
    const recent = STOCKLOGS.filter(l => l.product_id === p.id && l.action === 'sale' && (now - new Date(l.created_at).getTime()) <= window14);
    if (recent.length >= 3) count++;
  }
  return count;
}
function computeSlowMoving(list) {
  const now = Date.now(), window30 = 30*24*3600*1000;
  let count = 0;
  for (const p of list) {
    const recent = STOCKLOGS.filter(l => l.product_id === p.id && l.action === 'sale' && (now - new Date(l.created_at).getTime()) <= window30);
    if (recent.length === 0) count++;
  }
  return count;
}

function escape(s){ return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ---------- Edit / Delete flows ----------
function bindDelegatedActions() {
  document.body.addEventListener('click', async (ev) => {
    const t = ev.target;
    if (!t) return;

    // Edit
    if (t.dataset && t.dataset.action === 'edit') {
      const id = t.dataset.id;
      await openEditModal(id);
    }

    // Delete
    if (t.dataset && t.dataset.action === 'delete') {
      const id = t.dataset.id;
      openDeleteConfirm('product', id);
    }
  });
}

// Open edit modal and populate
async function openEditModal(id) {
  try {
    const res = await fetch(`/products/get/${id}`);
    const d = await res.json();
    if (!d.success) return alert('Failed to fetch product');

    const p = d.product;
    $('#edit-id').value = p.id;
    $('#edit-name').value = p.name || '';
    $('#edit-description').value = p.description || '';
    $('#edit-price').value = p.price || 0;
    $('#edit-cost').value = p.cost || 0;
    $('#edit-stock').value = p.stock || 0;
    $('#edit-category').value = p.category_id || '';
    $('#edit-image-preview').src = p.image_path || '/public/img/no-image.png';
    $('#edit-image-preview').setAttribute('data-existing', p.image_path || '');
    $('#edit-add-stock').value = '';
    $('#edit-deduct-stock').value = '';
    $('#edit-reason').value = '';

    const modal = new bootstrap.Modal($('#modalEditProduct'));
    modal.show();
  } catch(err) {
    console.error('openEditModal', err);
    alert('Error opening edit modal');
  }
}

// Preview image in edit modal
function bindEditImagePreview() {
  const input = $('#edit-image');
  if (!input) return;
  input.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    $('#edit-image-preview').src = url;
  });
}

// Submit update (includes image replacement)
async function submitEditProduct() {
  try {
    const id = $('#edit-id').value;
    if (!id) return alert('Missing id');
    const form = $('#form-edit-product');
    const fd = new FormData(form);

    const existing = $('#edit-image-preview').getAttribute('data-existing') || '';
    if (existing) fd.append('existing_image', existing);

    const res = await fetch(`/products/update/${id}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.success) return alert(data.message || 'Update failed');

    // stock adjustments
    const add = Number($('#edit-add-stock').value || 0);
    const ded = Number($('#edit-deduct-stock').value || 0);
    const reason = $('#edit-reason').value || '';

    if (add > 0) await adjustStock(id, add, 'add', reason);
    if (ded > 0) await adjustStock(id, ded, 'deduct', reason);

    const modal = bootstrap.Modal.getInstance($('#modalEditProduct'));
    if (modal) modal.hide();

    await safeFetchStockLogs();
    await loadProducts();
  } catch(err) {
    console.error('submitEditProduct', err);
    alert('Failed to save');
  }
}

// Adjust stock call
async function adjustStock(id, qty, type, reason) {
  try {
    const body = new URLSearchParams();
    body.append('qty', qty);
    body.append('type', type);
    body.append('reason', reason || '');

    const res = await fetch(`/products/stock/${id}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.message || 'Stock adjust failed');
  } catch (err) {
    console.error('adjustStock', err);
    alert('Stock adjust failed');
  }
}

// Delete confirm open
function openDeleteConfirm(type, id) {
  $('#delete-item-id').value = id;
  $('#delete-item-type').textContent = type || 'item';
  const modal = new bootstrap.Modal($('#modalDeleteConfirm'));
  modal.show();
}

// Confirm delete
async function confirmDelete() {
  try {
    const id = $('#delete-item-id').value;
    if (!id) return;
    const res = await fetch(`/products/delete/${id}`, { method: 'POST' });
    const d = await res.json();
    if (!d.success) return alert(d.message || 'Delete failed');
    const modal = bootstrap.Modal.getInstance($('#modalDeleteConfirm'));
    if (modal) modal.hide();
    await safeFetchStockLogs();
    await loadProducts();
  } catch (err) {
    console.error('confirmDelete', err);
    alert('Delete failed');
  }
}
document.getElementById && (document.getElementById('btn-confirm-delete') && document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete));

// ---------- Helpers ----------
function debounce(fn, wait=250){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }
function escape(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function groupLogsByProduct(logs){ const map={}; for(const l of logs) (map[l.product_id]=map[l.product_id]||[]).push(l); return map; }

// ---------- Populate category select elements ----------
function populateCategorySelects() {
  const filterSelect = document.getElementById('product-category');
  const editSelect   = document.getElementById('edit-category');
  const addSelect    = document.getElementById('add-category');

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="">All Categories</option>`;
    CATEGORIES.forEach(c => {
      filterSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${c.id}">${escape(c.name)}</option>`
      );
    });
  }

  if (editSelect) {
    editSelect.innerHTML = `<option value="">Select Category</option>`;
    CATEGORIES.forEach(c => {
      editSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${c.id}">${escape(c.name)}</option>`
      );
    });
  }

  if (addSelect) {
    addSelect.innerHTML = `<option value="">Select Category</option>`;
    CATEGORIES.forEach(c => {
      addSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${c.id}">${escape(c.name)}</option>`
      );
    });
  }
}

