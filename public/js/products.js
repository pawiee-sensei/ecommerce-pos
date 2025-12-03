console.log("%cproducts.js loaded", "color: #22c55e; font-weight: bold");

// Event delegation for Add Product button
document.addEventListener("click", (e) => {
  if (e.target.id === "btn-open-add-product") {
    const modal = new bootstrap.Modal(document.getElementById("modalAddProduct"));
    modal.show();
  }
});

// Handle "Save Product" button
document.addEventListener("click", async (e) => {
  if (e.target.id === "btn-save-product") {
    await submitAddProduct();
  }
});

// Submit Add Product Form
async function submitAddProduct() {
  const form = document.getElementById("form-add-product");
  const formData = new FormData(form);

  try {
    const res = await fetch("/products/add", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to create product.");
      return;
    }

    // Close modal
    const modalEl = document.getElementById("modalAddProduct");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    form.reset();

    // Reload products
    await loadProductsTable();

  } catch (err) {
    console.error("Add product error:", err);
    alert("Server error.");
  }
}

// Load product table & KPIs
async function loadProductsTable() {
  try {
    const res = await fetch("/products/list");
    const data = await res.json();

    if (!data.success) return;

    const products = data.products;
    renderProducts(products);
    updateKPIs(products);

  } catch (err) {
    console.error("Load products error:", err);
  }
}

// Render products into table
function renderProducts(products) {
  const tbody = document.getElementById("products-body");
  tbody.innerHTML = "";

  products.forEach((p) => {
    const status = getStatus(p.stock);

    tbody.innerHTML += `
      <tr>
        <td><img src="${p.image_path || '/public/img/no-image.png'}" class="product-thumb"></td>
        <td>${p.name}</td>
        <td>${p.category_name || '-'}</td>
        <td>₱ ${Number(p.price).toLocaleString()}</td>
        <td>${p.stock}</td>
        <td>${status}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-id="${p.id}" data-action="edit">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-id="${p.id}" data-action="delete">Delete</button>
        </td>
      </tr>
    `;
  });
}

// Status indicator styling
function getStatus(stock) {
  if (stock <= 0) return '❌ Out';
  if (stock <= 5) return '🔴 Low';
  if (stock <= 20) return '🟡 Medium';
  return '🟢 Good';
}

// Update KPIs
function updateKPIs(products) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outStock = products.filter(p => p.stock <= 0).length;

  document.getElementById("kpi-total-products").textContent = totalProducts;
  document.getElementById("kpi-total-stock").textContent = totalStock;
  document.getElementById("kpi-low-stock").textContent = lowStock;
  document.getElementById("kpi-out-stock").textContent = outStock;

  // Inventory Overview
  document.getElementById("inv-total-skus").textContent = totalProducts;
  document.getElementById("inv-low").textContent = lowStock;
  document.getElementById("inv-out").textContent = outStock;
  document.getElementById("inv-fast").textContent = 0; // placeholder
  document.getElementById("inv-slow").textContent = 0; // placeholder
}

// Auto-load table when products panel opens
document.addEventListener("panel-loaded", () => {
  if (window.currentPanel === "products") loadProductsTable();
});
