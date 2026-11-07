window.renderModuloHotel = function() {
  const container = document.getElementById("modulo-hotel-container");
  if (!container) return;
  container.innerHTML = `
    <div id="subpage-inventory">
      <h3 id="table-title">📋 Habitaciones</h3>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Cuarto</th><th>Nombre</th><th>Estado</th><th>Tarifa Noche</th><th>Acciones</th></tr>
          </thead>
          <tbody id="inventory-list"></tbody>
        </table>
      </div>
    </div>
  `;
}

window.switchHotelTab = function(tab) {
  window.updateTblHotel();
}

window.updateTblHotel = async function() {
  const tbody = document.getElementById("inventory-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);

  if (curr.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Sin registros de habitaciones.</td></tr>";
    return;
  }

  curr.forEach((item, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><small>${item.date}</small></td>
        <td><code>${item.barcode}</code></td>
        <td>${item.name}</td>
        <td><strong>${item.stock > 0 ? "🟢 Libre" : "🔴 Ocupado"}</strong></td>
        <td>$${(item.pNoche||0).toFixed(2)}</td>
        <td><button class="btn-delete" onclick="delProd(${idx})">🗑️</button></td>
      </tr>`;
  });
}