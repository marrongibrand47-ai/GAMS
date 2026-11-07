let cartItems = [];

window.renderModuloComercio = function() {
  const container = document.getElementById("modulo-comercio-container");
  if (!container) return;
  container.innerHTML = `
    <div id="subpage-inventory">
      <h3>📦 Inventario Central</h3>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr><th>Fecha</th><th>SKU</th><th>Producto</th><th>Stock</th><th>Precio USD</th><th>Acciones</th></tr>
          </thead>
          <tbody id="inventory-comercio-list"></tbody>
        </table>
      </div>
    </div>
  `;
}

window.switchComercioTab = function(tab) {
  window.updateTblComercio();
}

window.updateTblComercio = async function() {
  const tbody = document.getElementById("inventory-comercio-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);

  if (curr.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Sin productos en inventario.</td></tr>";
    return;
  }

  curr.forEach((item, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><small>${item.date}</small></td>
        <td><code>${item.barcode}</code></td>
        <td>${item.name}</td>
        <td><strong>${item.stock} uds</strong></td>
        <td>$${(item.priceUsd||0).toFixed(2)}</td>
        <td><button class="btn-delete" onclick="delProd(${idx})">🗑️</button></td>
      </tr>`;
  });
}