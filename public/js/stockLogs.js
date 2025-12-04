document.addEventListener("DOMContentLoaded", () => {
  loadStockLogs();
});

async function loadStockLogs() {
  try {
    const res = await fetch("/stock-logs/list");
    const data = await res.json();

    if (!data.success) return;

    renderStockLogs(data.logs);

  } catch (err) {
    console.error("Stock logs load error:", err);
  }
}

function renderStockLogs(logs) {
  const body = document.getElementById("stocklogs-body");
  body.innerHTML = "";

  logs.forEach(log => {
    const img = log.image_path ? `<img src="${log.image_path}" class="product-thumb">` : "—";

    body.innerHTML += `
      <tr>
        <td>${formatAction(log.action)}</td>
        <td>${img}</td>
        <td>${log.product_name}</td>
        <td>${log.qty}</td>
        <td>${log.previous_stock}</td>
        <td>${log.new_stock}</td>
        <td>${log.reason || "—"}</td>
        <td>${log.user_name || "System"}</td>
        <td>${formatDate(log.created_at)}</td>
      </tr>
    `;
  });
}

function formatAction(action) {
  switch (action) {
    case "add": return "<span class='text-success fw-bold'>+ Add</span>";
    case "deduct": return "<span class='text-danger fw-bold'>− Deduct</span>";
    case "sale": return "<span class='text-primary fw-bold'>Sale</span>";
    case "adjustment": return "<span class='text-warning fw-bold'>Adjust</span>";
    case "import": return "<span class='text-info fw-bold'>Import</span>";
    default: return action;
  }
}

function formatDate(dt) {
  return new Date(dt).toLocaleString();
}
