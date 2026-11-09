window.renderModuloHotel = function() {
  const container = document.getElementById("modulo-hotel-container");
  if (!container) return;
  container.innerHTML = `
    <div id="subpage-hotel-rooms">
      <h3>🛏️ Estado de Habitaciones & Cuartos</h3>
      <div id="rooms-grid-container" class="room-grid"></div>
    </div>
    <div id="subpage-hotel-checkin" class="hidden">
      <h3>🛎️ Realizar Check-In con Datos de Contacto</h3>
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ced4da;">
        <label><strong>Seleccionar Cuarto:</strong></label>
        <select id="checkin-room-select" style="font-weight:bold; color:#0056b3;"></select>
        <input type="text" id="checkin-cliente" placeholder="Nombre del Huésped">
        <input type="text" id="checkin-doc" placeholder="Cédula / Pasaporte">
        <input type="text" id="checkin-tel" placeholder="Número de Teléfono / WhatsApp">
        <input type="email" id="checkin-email" placeholder="Correo Electrónico (Gmail)">
        
        <label><strong>Tarifa a Cobrar:</strong></label>
        <select id="checkin-tarifa" style="font-weight:bold;">
          <option value="1h">1 Hora</option>
          <option value="3h">3 Horas</option>
          <option value="noche">Noche</option>
          <option value="dia">Día Completo</option>
          <option value="semana">Semana</option>
        </select>
        <button class="btn-success" style="margin-top: 10px;" onclick="procesarCheckInHotel()">🛎️ Confirmar Check-In y Cobro</button>
      </div>
    </div>
    <div id="subpage-hotel-album" class="hidden">
      <h3>📸 Galería y Tarifas de Cuartos</h3>
      <div id="album-hotel-container" class="album-grid"></div>
    </div>
    <div id="subpage-hotel-occupied" class="hidden">
      <h3>📋 Huéspedes Activos en el Hotel</h3>
      <table>
        <thead><tr><th>Cuarto</th><th>Huésped</th><th>Doc</th><th>Tarifa</th><th>Acción</th></tr></thead>
        <tbody id="occupied-rooms-table"></tbody>
      </table>
    </div>
  `;
}

window.switchHotelTab = function(tab) {
  document.getElementById("subpage-hotel-rooms").classList.add("hidden");
  document.getElementById("subpage-hotel-checkin").classList.add("hidden");
  document.getElementById("subpage-hotel-album").classList.add("hidden");
  document.getElementById("subpage-hotel-occupied").classList.add("hidden");

  document.querySelectorAll("#hotel-nav button").forEach(b => b.classList.remove("active"));

  if (tab === 'rooms') {
    document.getElementById("subpage-hotel-rooms").classList.remove("hidden");
    document.getElementById("h-tab-rooms").classList.add("active");
    renderRoomsGrid();
  } else if (tab === 'checkin') {
    document.getElementById("subpage-hotel-checkin").classList.remove("hidden");
    document.getElementById("h-tab-checkin").classList.add("active");
    poblarSelectCheckin();
  } else if (tab === 'album') {
    document.getElementById("subpage-hotel-album").classList.remove("hidden");
    document.getElementById("h-tab-album").classList.add("active");
    renderAlbumHotel();
  } else if (tab === 'occupied') {
    document.getElementById("subpage-hotel-occupied").classList.remove("hidden");
    document.getElementById("h-tab-occupied").classList.add("active");
    renderOccupiedTable();
  }
}

async function renderRoomsGrid() {
  const container = document.getElementById("rooms-grid-container");
  if (!container) return;
  container.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  if (curr.length === 0) {
    container.innerHTML = "<p>No hay cuartos registrados.</p>";
    return;
  }
  curr.forEach((room, idx) => {
    let ocupado = room.ocupado || false;
    container.innerHTML += `
      <div class="room-card ${ocupado ? 'occupied' : 'available'}">
        <h4>${room.name}</h4>
        <p><small>${room.desc}</small></p>
        <p><strong>Camas:</strong> ${room.camas} | <strong>Baños:</strong> ${room.banos}</p>
        <p><strong>Noche:</strong> $${(room.pNoche||0).toFixed(2)}</p>
        <div style="margin-top: 10px;">
          <span class="badge ${ocupado ? 'bg-danger' : 'bg-success'}">${ocupado ? '🔴 Ocupado' : '🟢 Disponible'}</span>
          <button class="btn-delete" style="float:right;" onclick="delProd(${idx})">🗑️</button>
        </div>
      </div>`;
  });
}

async function poblarSelectCheckin() {
  const sel = document.getElementById("checkin-room-select");
  if (!sel) return;
  sel.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach((room, idx) => {
    if (!room.ocupado) {
      sel.innerHTML += `<option value="${idx}">${room.name} - Noche: $${(room.pNoche||0).toFixed(2)}</option>`;
    }
  });
}

window.procesarCheckInHotel = async function() {
  const idx = document.getElementById("checkin-room-select").value;
  const cliente = document.getElementById("checkin-cliente").value.trim();
  const doc = document.getElementById("checkin-doc").value.trim();
  const tel = document.getElementById("checkin-tel").value.trim();
  const email = document.getElementById("checkin-email").value.trim();
  const tarifa = document.getElementById("checkin-tarifa").value;

  if (!cliente || idx === "") return alert("Completa todos los datos obligatorios del Check-In.");

  let curr = await getDbItems(currentAccountKey);
  let room = curr[idx];
  let montoBase = tarifa === '1h' ? (room.p1h || 8) : (tarifa === '3h' ? (room.p3h || 18) : (room.pNoche || 35));
  let montoConIva = montoBase * 1.16; // Incluyendo 16% IVA

  room.ocupado = true;
  room.huesped = cliente;
  room.documento = doc;
  room.telefono = tel;
  room.email = email;
  room.tarifaTipo = tarifa;

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "CHECK-IN", `Huésped ${cliente} (${tel}) en ${room.name}`, montoConIva);
  alert(`✅ Check-In exitoso en ${room.name}. Cobrado con IVA: $${montoConIva.toFixed(2)} USD`);
  
  document.getElementById("checkin-cliente").value = "";
  document.getElementById("checkin-doc").value = "";
  document.getElementById("checkin-tel").value = "";
  document.getElementById("checkin-email").value = "";
  switchHotelTab('rooms');
}

async function renderAlbumHotel() {
  const container = document.getElementById("album-hotel-container");
  if (!container) return;
  container.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach(room => {
    container.innerHTML += `
      <div class="sticker-card">
        <img src="${room.img || defaultImgPlaceholder}" class="sticker-img">
        <div class="sticker-title">${room.name}</div>
        <small>${room.desc}</small><br>
        <div class="sticker-badge ok">1h: $${room.p1h||0} | Noche: $${room.pNoche||0}</div>
      </div>`;
  });
}

async function renderOccupiedTable() {
  const tbody = document.getElementById("occupied-rooms-table");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  let activos = curr.filter(r => r.ocupado);
  if (activos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay huéspedes activos en este momento.</td></tr>";
    return;
  }
  activos.forEach(room => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${room.name}</strong></td>
        <td>${room.huesped}</td>
        <td>${room.documento || 'N/A'} (${room.telefono || 'Sin tel'})</td>
        <td>${room.tarifaTipo.toUpperCase()}</td>
        <td><button class="btn-success" style="padding:4px;" onclick="liberarCuartoHotel('${room.barcode}')">Liberar / Check-Out</button></td>
      </tr>`;
  });
}

window.liberarCuartoHotel = async function(barcode) {
  let curr = await getDbItems(currentAccountKey);
  let room = curr.find(r => r.barcode === barcode);
  if (room) {
    room.ocupado = false;
    room.huesped = "";
    room.documento = "";
    room.telefono = "";
    room.email = "";
    room.tarifaTipo = "";
    await saveDbItems(currentAccountKey, curr);
    await registrarTransaccionDiaria(currentAccountKey, "CHECK-OUT", `Liberación de ${room.name}`, 0);
    alert(`🚪 Cuarto ${room.name} liberado con éxito.`);
    renderOccupiedTable();
  }
}