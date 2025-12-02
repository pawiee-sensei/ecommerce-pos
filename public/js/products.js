// Open Add Product Modal
document.addEventListener("click", (e) => {
  if (e.target.id === "btn-open-add-product") {
    const modal = new bootstrap.Modal(document.getElementById("modalAddProduct"));
    modal.show();
  }
});

 

// Placeholder future actions
console.log("%cProducts.js Loaded", "color: green; font-weight: bold");

// Simulated data (until backend ready)
let mockProducts = [];

// Render products table (temporary mock)
function renderProducts() {
  const body = document.getElementById("products-body");
  body.innerHTML = "";

  mockProducts.forEach(p => {
    body.innerHTML += `
      <tr>
        <td><img src="${p.image}" class="product-thumb"></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>₱ ${p.price}</td>
        <td>${p.stock}</td>
        <td>${p.status}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary">Edit</button>
          <button class="btn btn-sm btn-outline-danger">Delete</button>
        </td>
      </tr>
    `;
  });
}

renderProducts();
