window.renderModuloHotel = function() {
  const container = document.getElementById("modulo-hotel-container");
  if (!container) return;
  container.innerHTML = `
    <!-- PESTAÑA CUARTOS -->
    <div id="subpage-inventory">
      <h3 id="table-title">📋 Habitaciones</h3>
      <div style="overflow-x: auto;">
        <table>
          <thead><tr><th>Fecha</th><th>Cuarto</th><th>Nombre</th><th>Estado</th><th>Tarifa Noche</th><th>Acciones</th></tr></thead>
          <tbody id="inventory-list"></tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA CHECK-IN -->
    <div id="subpage-checkin" class="hidden">
      <h3>🛎️ Módulo Avanzado de Check-In</h3>
      <div style="background: #fdfefe; padding: 15px; border: 1px solid #0056b3; border-radius: 6px;">
        <label><strong>1. Habitación Disponible:</strong></label>
        <select id="ci-room-select"></select>
        <div class="grid" style="gap: 10px; margin-top: 5px;">
          <input type="text" id="ci-nombres" placeholder="Nombres del Huésped">
          <input type="text" id="ci-apellidos" placeholder="Apellidos">
        </div>
        <div class="grid" style="gap: 10px; margin-top: 5px;">
          <input type="text" id="ci-doc" placeholder="Cédula / Pasaporte">
          <input type="text" id="ci-telefono" placeholder="Teléfono">
        </div>
        <button class="btn-success" style="margin-top: 15px;" onclick="ejecutarCheckInFormal()">✅ Confirmar Check-In</button>
      </div>
    </div>

    <!-- PESTAÑA ÁLBUM -->
    <div id="subpage-album" class="hidden">
      <h3>🖼️ Catálogo de Habitaciones</h3>
      <div id="album-container" class="album-grid"></div>
    </div>

    <!-- PESTAÑA HUÉSPEDES ACTIVOS -->
    <div id="subpage-lowstock" class="hidden">
      <h3>📋 Huéspedes Activos</h3>
      <div style="overflow-x: auto;">
        <table>
          <thead><tr><th>Cuarto</th><th>Huésped</th><th>Cédula</th><th>Teléfono</th><th>Acción</th></tr></thead>
          <tbody id="huespedes-activos-list"></tbody>
        </table>
      </div>
    </div>
  `;
}

window.switchHotelTab = function(tab) {
  document.getElementById("subpage-inventory").classList.add("hidden");
  document.getElementById("subpage-checkin").classList.add("hidden");
  document.getElementById("subpage-album").classList.add("hidden");
  document.getElementById("subpage-lowstock").classList.add("hidden");

  document.querySelectorAll("#hotel-nav button").forEach(b => b.classList.remove("active"));

  if (tab === 'rooms') {
    document.getElementById("subpage-inventory").classList.remove("hidden");
    document.getElementById("h-tab-rooms").classList.add("active");
    window.updateTblHotel();
  } else if (tab === 'checkin') {
    document.getElementById("subpage-checkin").classList.remove("hidden");
    document.getElementById("h-tab-checkin").classList.add("active");
    cargarSelectHabitacionesLibres();
  } else if (tab === 'album') {
    document.getElementById("subpage-album").classList.remove("hidden");
    document.getElementById("h-tab-album").classList.add("active");
    renderAlbumHotel();
  } else if (tab === 'occupied') {
    document.getElementById("subpage-lowstock").classList.remove("hidden");
    document.getElementById("h-tab-occupied").classList.add("active");
    actualizarHuespedesActivos();
  }
}

window.updateTblHotel = async function() {
  const tbody = document.getElementById("inventory-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);

  if (curr.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Sin registros.</td></tr>";
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
  const doc = document.getElementById("ci-doc").value.trim();
  const tel = document.getElementById("ci-telefono").value.trim();
  if (!nombres || idx === "") return alert("Ingresa datos.");

  let curr = await getDbItems(currentAccountKey);
  curr[idx].stock = 0;
  curr[idx].guestName = nombres;
  curr[idx].guestDoc = doc;
  curr[idx].guestPhone = tel;

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "CHECK-IN", `Cuarto ${curr[idx].barcode} - ${nombres}`, curr[idx].pNoche || 35);
  alert("✅ Check-In completado.");
  switchHotelTab('rooms');
}

async function renderAlbumHotel() {
  const container = document.getElementById("album-container");
  if (!container) return;
  container.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach(item => {
    container.innerHTML += `
      <div class="sticker-card">
        <img src="${item.img || defaultImgPlaceholder}" class="sticker-img">
        <div class="sticker-title">${item.name}</div>
        <small>Cuarto: ${item.barcode}</small><br>
        <div class="${item.stock > 0 ? 'sticker-badge ok' : 'sticker-badge low'}">${item.stock > 0 ? 'Disponible' : 'Ocupado'}</div>
      </div>`;
  });
}

async function actualizarHuespedesActivos() {
  const tbody = document.getElementById("huespedes-activos-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  let ocupadas = curr.filter(i => i.stock === 0);

  if (ocupadas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Sin huéspedes activos.</td></tr>";
    return;
  }
  ocupadas.forEach(item => {
    let idx = curr.indexOf(item);
    tbody.innerHTML += `
      <tr>
        <td>Cuarto ${item.barcode}</td>
        <td><strong>${item.guestName || 'Huésped'}</strong></td>
        <td>${item.guestDoc || '-'}</td>
        <td>${item.guestPhone || '-'}</td>
        <td><button class="btn-success" style="padding: 6px;" onclick="liberarCheckOut(${idx})">Check-Out</button></td>
      </tr>`;
  });
}

window.liberarCheckOut = async function(idx) {
  let curr = await getDbItems(currentAccountKey);
  curr[idx].stock = 1;
  curr[idx].guestName = "";
  await saveDbItems(currentAccountKey, curr);
  actualizarHuespedesActivos();
}