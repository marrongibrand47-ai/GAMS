// MÓDULO DE HOTELERÍA Y CHECK-IN GAMS COMPANY
window.renderModuloHotel = function() {
  const container = document.getElementById("modulo-hotel-container");
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

    <div id="subpage-checkin" class="hidden">
      <h3>🛎️ Módulo Avanzado de Check-In</h3>
      <div style="background: #fdfefe; padding: 15px; border: 1px solid #0056b3; border-radius: 6px;">
        <label><strong>1. Habitación Disponible:</strong></label>
        <select id="ci-room-select" onchange="mostrarTarifasHabitacion()"></select>
        <div id="tarifa-preview-box" style="background: #eef5fc; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 13px;"><em>Selecciona un cuarto.</em></div>
        <div>
          <label><strong>2. Tiempo de Alquiler:</strong></label>
          <select id="ci-tipo-tarifa">
            <option value="1HORA">⏱️ 1 Hora</option><option value="3HORAS">⏱️ 3 Horas</option>
            <option value="NOCHE">🌙 Noche</option><option value="DIA">☀️ Día (24 Horas)</option>
          </select>
        </div>
        <div class="grid" style="gap: 10px; margin-top: 5px;">
          <div><label>Nombres:</label><input type="text" id="ci-nombres"></div>
          <div><label>Apellidos:</label><input type="text" id="ci-apellidos"></div>
        </div>
        <div class="grid" style="gap: 10px;">
          <div><label>Cédula:</label><input type="text" id="ci-doc"></div>
          <div><label>Teléfono:</label><input type="text" id="ci-telefono"></div>
        </div>
        <button class="btn-success" style="margin-top: 15px;" onclick="ejecutarCheckInFormal()">✅ Confirmar Check-In</button>
      </div>
    </div>
  `;
}

window.switchHotelTab = function(tab) {
  document.getElementById("subpage-inventory").classList.add("hidden");
  document.getElementById("subpage-checkin").classList.add("hidden");
  document.getElementById("h-tab-rooms").classList.remove("active");
  document.getElementById("h-tab-checkin").classList.remove("active");

  if (tab === 'rooms') {
    document.getElementById("subpage-inventory").classList.remove("hidden");
    document.getElementById("h-tab-rooms").classList.add("active");
    window.updateTblHotel();
  } else if (tab === 'checkin') {
    document.getElementById("subpage-checkin").classList.remove("hidden");
    document.getElementById("h-tab-checkin").classList.add("active");
    cargarSelectHabitacionesLibres();
  }
}

window.updateTblHotel = async function() {
  const tbody = document.getElementById("inventory-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);

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

async function cargarSelectHabitacionesLibres() {
  const sel = document.getElementById("ci-room-select");
  if (!sel) return;
  sel.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  let libres = curr.filter(i => i.stock === 1);
  libres.forEach(item => {
    sel.innerHTML += `<option value="${curr.indexOf(item)}">[Cuarto ${item.barcode}] ${item.name}</option>`;
  });
}

window.ejecutarCheckInFormal = async function() {
  const idx = document.getElementById("ci-room-select").value;
  const nombres = document.getElementById("ci-nombres").value.trim();
  if (!nombres || idx === "") return alert("Completa los campos.");

  let curr = await getDbItems(currentAccountKey);
  curr[idx].stock = 0;
  curr[idx].guestName = nombres;

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "CHECK-IN HOTEL", `Cuarto ${curr[idx].barcode} - ${nombres}`, curr[idx].pNoche || 35);
  alert("✅ Check-In completado.");
  switchHotelTab('rooms');
}
