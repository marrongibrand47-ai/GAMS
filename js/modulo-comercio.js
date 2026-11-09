let cartItems = [];

window.renderModuloComercio = function() {
  const container = document.getElementById("modulo-comercio-container");
  if (!container) return;
  container.innerHTML = `
    <div id="subpage-comercio-inv">
      <h3>📦 Inventario Central y Escáner de Barras</h3>
      <div style="background: #eef5fc; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #007bff;">
        <label style="font-size:13px; font-weight:bold;">🔍 Escanear Código de Barras (Hardware USB / Cámara):</label>
        <input type="text" id="barcode-scanner-input" placeholder="Haz clic aquí y escanea el código del producto..." onkeypress="if(event.key === 'Enter') buscarYAgregarPorEscanner(this.value)">
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead><tr><th>Fecha</th><th>SKU</th><th>Producto</th><th>Stock</th><th>Precio USD</th><th>Acciones</th></tr></thead>
          <tbody id="inventory-comercio-list"></tbody>
        </table>
      </div>

      <div style="margin-top: 30px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ced4da;">
        <h3>📖 Libro Diario de Transacciones</h3>
        <div style="overflow-x: auto;">
          <table>
            <thead><tr><th>Fecha</th><th>Operación</th><th>Detalle</th><th>Monto ($)</th><th>Usuario</th></tr></thead>
            <tbody id="libro-diario-list"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="subpage-comercio-pos" class="hidden">
      <h3>🛒 Caja Registradora (POS Pro con IVA, Doble Moneda $ / Bs y Split Payments)</h3>
      <div style="background:#fff; border: 2px solid #28a745; border-radius: 8px; padding:15px;">
        <div class="grid" style="gap:10px;">
          <div><label><strong>Producto:</strong></label><select id="cart-prod-select"></select></div>
          <div><label><strong>Cantidad:</strong></label><input type="number" id="cart-qty" value="1" min="1"></div>
        </div>
        <button class="btn-success" style="margin-top: 10px;" onclick="agregarAlCarrito()">➕ Agregar al Carrito</button>
        
        <h4 style="margin-top:15px;">Artículos en el Carrito</h4>
        <table>
          <thead><tr><th>Ítem</th><th>Precio ($)</th><th>Cant.</th><th>Subtotal</th><th>Acción</th></tr></thead>
          <tbody id="cart-items-table"></tbody>
        </table>

        <!-- RESUMEN CON IVA Y COBRO EN MONEDA NACIONAL (BS) -->
        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 15px; border: 1px solid #ced4da;">
          <p style="margin:4px 0;">Subtotal: <strong id="cart-subtotal">$0.00 USD</strong> (<span id="cart-subtotal-bs">0.00 Bs</span>)</p>
          <p style="margin:4px 0;">IVA (16%): <strong id="cart-iva">$0.00 USD</strong> (<span id="cart-iva-bs">0.00 Bs</span>)</p>
          <p style="margin:4px 0; font-size: 19px; color: #28a745;">
            <strong>Total a Pagar: <span id="cart-total-usd">$0.00 USD</span></strong> 
            <br>
            <strong style="color: #0056b3; font-size: 17px;">🇻🇪 En Bolívares (Bs): <span id="cart-total-bs">0.00 Bs</span></strong>
          </p>
          
          <hr style="margin: 10px 0;">
          <label style="font-weight:bold; font-size:13px; color:#0056b3;">💳 Método de Pago Fraccionado (Split Payment):</label>
          <div class="grid" style="gap:8px;">
            <div><small>Efectivo ($):</small><input type="number" id="split-efectivo" placeholder="0.00" step="0.01"></div>
            <div><small>Pago Móvil / Banco ($):</small><input type="number" id="split-banco" placeholder="0.00" step="0.01"></div>
            <div><small>Cuentas por Cobrar ($ CxC):</small><input type="number" id="split-cxc" placeholder="0.00" step="0.01" oninput="document.getElementById('split-cxc-cliente').style.display = this.value > 0 ? 'block' : 'none'"></div>
          </div>
          <input type="text" id="split-cxc-cliente" placeholder="Nombre completo del Cliente (CxC)" style="margin-top:6px; display:none;">
          
          <div id="datos-pago-movil-pos" style="background:#eef5fc; padding:8px; border-radius:4px; margin-top:8px; font-size:12px; color:#0056b3;">
            🏦 <strong>Datos Bancarios del Negocio:</strong> Cargando...
          </div>
          <input type="text" id="split-ref-banco" placeholder="Nro. de Referencia Bancaria / Pago Móvil" style="margin-top:8px;">
          
          <button class="btn-success" style="margin-top: 12px;" onclick="procesarVentaCajaRegistradora()">💳 Procesar Venta y Actualizar Caja</button>
        </div>
      </div>
    </div>

    <div id="subpage-comercio-cxc" class="hidden">
      <h3>💳 Cuentas por Cobrar (CxC)</h3>
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ced4da;">
        <label style="font-weight:bold;">Registrar Deuda / Crédito Nuevo:</label>
        <input type="text" id="cxc-cliente" placeholder="Nombre completo del Cliente">
        <input type="number" id="cxc-monto" placeholder="Monto Total Deuda ($ USD)" step="0.01">
        <button class="btn-warning" style="margin-top: 8px;" onclick="registrarCxCDirecta()">💾 Guardar Crédito en Libro CxC</button>
      </div>
      <h4 style="margin-top:20px;">Libro de Cuentas por Cobrar Registradas</h4>
      <table style="margin-top:10px;">
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Monto ($)</th><th>Estado</th><th>Acción</th></tr></thead>
        <tbody id="cxc-table-list"></tbody>
      </table>
    </div>

    <div id="subpage-comercio-album" class="hidden">
      <h3>📸 Galería de Productos</h3>
      <div id="album-comercio-container" class="album-grid"></div>
    </div>

    <div id="subpage-comercio-low" class="hidden">
      <h3>⚠️ Alertas de Stock Bajo</h3>
      <table>
        <thead><tr><th>SKU</th><th>Producto</th><th>Stock Actual</th></tr></thead>
        <tbody id="low-stock-list"></tbody>
      </table>
    </div>
  `;
}

window.switchComercioTab = function(tab) {
  document.getElementById("subpage-comercio-inv").classList.add("hidden");
  document.getElementById("subpage-comercio-pos").classList.add("hidden");
  document.getElementById("subpage-comercio-cxc").classList.add("hidden");
  document.getElementById("subpage-comercio-album").classList.add("hidden");
  document.getElementById("subpage-comercio-low").classList.add("hidden");

  document.querySelectorAll("#comercio-nav button").forEach(b => b.classList.remove("active"));

  if (tab === 'inv') {
    document.getElementById("subpage-comercio-inv").classList.remove("hidden");
    document.getElementById("c-tab-inv").classList.add("active");
    window.updateTblComercio();
    actualizarLibroDiarioEnVista();
  } else if (tab === 'pos') {
    document.getElementById("subpage-comercio-pos").classList.remove("hidden");
    document.getElementById("c-tab-pos").classList.add("active");
    cargarSelectCarrito();
    renderizarCarrito();
    cargarDatosBancariosEnPOS();
  } else if (tab === 'cxc') {
    document.getElementById("subpage-comercio-cxc").classList.remove("hidden");
    document.getElementById("c-tab-cxc").classList.add("active");
    renderizarTablaCxC();
  } else if (tab === 'album') {
    document.getElementById("subpage-comercio-album").classList.remove("hidden");
    document.getElementById("c-tab-album").classList.add("active");
    renderAlbumComercio();
  } else if (tab === 'low') {
    document.getElementById("subpage-comercio-low").classList.remove("hidden");
    document.getElementById("c-tab-low").classList.add("active");
    actualizarAlertasStockComercio();
  }
}

window.updateTblComercio = async function() {
  const tbody = document.getElementById("inventory-comercio-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);

  if (curr.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Sin productos registrados.</td></tr>";
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

async function actualizarLibroDiarioEnVista() {
  const tbody = document.getElementById("libro-diario-list");
  if (!tbody) return;
  let transacciones = await getLibroDiario(currentAccountKey);
  tbody.innerHTML = "";
  if (transacciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Sin transacciones.</td></tr>';
    return;
  }
  transacciones.forEach(t => {
    tbody.innerHTML += `<tr><td><small>${t.fecha}</small></td><td><strong>${t.tipo}</strong></td><td>${t.detalle}</td><td>$${t.monto.toFixed(2)}</td><td><small>${t.usuario}</small></td></tr>`;
  });
}

async function cargarSelectCarrito() {
  const sel = document.getElementById("cart-prod-select");
  if (!sel) return;
  sel.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach((item, idx) => {
    sel.innerHTML += `<option value="${idx}">[${item.barcode}] ${item.name} - Stock: ${item.stock} - $${(item.priceUsd||0).toFixed(2)}</option>`;
  });
}

window.agregarAlCarrito = async function() {
  const selIdx = document.getElementById("cart-prod-select").value;
  const qty = parseInt(document.getElementById("cart-qty").value) || 1;
  if (selIdx === "") return;
  let curr = await getDbItems(currentAccountKey);
  let prod = curr[selIdx];
  cartItems.push({ barcode: prod.barcode, name: prod.name, price: prod.priceUsd || 0, qty, originalIndex: selIdx });
  renderizarCarrito();
}

window.buscarYAgregarPorEscanner = async function(barcode) {
  let curr = await getDbItems(currentAccountKey);
  let idx = curr.findIndex(i => i.barcode === barcode);
  if (idx !== -1) {
    cartItems.push({ barcode: curr[idx].barcode, name: curr[idx].name, price: curr[idx].priceUsd || 0, qty: 1, originalIndex: idx });
    document.getElementById("barcode-scanner-input").value = "";
    switchComercioTab('pos');
    alert(`✅ Producto escaneado: ${curr[idx].name}`);
  } else {
    alert(`❌ Producto con código SKU "${barcode}" no encontrado.`);
  }
};

async function renderizarCarrito() {
  const tbody = document.getElementById("cart-items-table");
  if (!tbody) return;
  tbody.innerHTML = "";
  let subtotalUsd = 0;
  
  cartItems.forEach((item, idx) => {
    let sub = item.price * item.qty;
    subtotalUsd += sub;
    tbody.innerHTML += `<tr><td>${item.name}</td><td>$${item.price.toFixed(2)}</td><td>${item.qty}</td><td>$${sub.toFixed(2)}</td><td><button class="btn-delete" onclick="cartItems.splice(${idx},1);renderizarCarrito();">🗑️</button></td></tr>`;
  });

  let tasas = await getTasas(currentAccountKey);
  let tasaBs = tasas.dolar || 36.50;

  let ivaUsd = subtotalUsd * 0.16; // 16% IVA
  let totalUsd = subtotalUsd + ivaUsd;

  let subtotalBs = subtotalUsd * tasaBs;
  let ivaBs = ivaUsd * tasaBs;
  let totalBs = totalUsd * tasaBs;

  document.getElementById("cart-subtotal").innerText = `$${subtotalUsd.toFixed(2)} USD`;
  document.getElementById("cart-subtotal-bs").innerText = `${subtotalBs.toFixed(2)} Bs`;

  document.getElementById("cart-iva").innerText = `$${ivaUsd.toFixed(2)} USD`;
  document.getElementById("cart-iva-bs").innerText = `${ivaBs.toFixed(2)} Bs`;

  document.getElementById("cart-total-usd").innerText = `$${totalUsd.toFixed(2)} USD`;
  document.getElementById("cart-total-bs").innerText = `${totalBs.toFixed(2)} Bs`;
}

async function cargarDatosBancariosEnPOS() {
  const box = document.getElementById("datos-pago-movil-pos");
  if (!box) return;
  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey || n.empKey === currentAccountKey);
  if (neg && neg.banco) {
    box.innerHTML = `🏦 <strong>Banco:</strong> ${neg.banco} | 📱 <strong>Teléfono/Cuenta:</strong> ${neg.telefono} | 📄 <strong>RIF/ID:</strong> ${neg.rif}`;
  } else {
    box.innerHTML = `🏦 <strong>Datos Bancarios:</strong> Banesco / Pago Móvil predeterminado.`;
  }
}

window.procesarVentaCajaRegistradora = async function() {
  if (cartItems.length === 0) return alert("El carrito está vacío.");
  let subtotal = cartItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
  let iva = subtotal * 0.16;
  let totalPagar = subtotal + iva;

  let efec = parseFloat(document.getElementById("split-efectivo").value) || 0;
  let banco = parseFloat(document.getElementById("split-banco").value) || 0;
  let cxc = parseFloat(document.getElementById("split-cxc").value) || 0;
  let clienteCxC = document.getElementById("split-cxc-cliente").value.trim() || "Cliente POS";

  let sumaPagos = efec + banco + cxc;
  if (Math.abs(sumaPagos - totalPagar) > 0.05) {
    return alert(`⚠️ La suma de los pagos fraccionados ($${sumaPagos.toFixed(2)}) no coincide con el total ($${totalPagar.toFixed(2)}).`);
  }

  let curr = await getDbItems(currentAccountKey);
  for (let item of cartItems) {
    let prod = curr[item.originalIndex];
    if (!prod || prod.stock < item.qty) {
      return alert(`❌ Stock insuficiente para "${item.name}". Stock actual: ${prod ? prod.stock : 0}`);
    }
  }

  for (let item of cartItems) {
    let prod = curr[item.originalIndex];
    prod.stock -= item.qty;
  }

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "VENTA POS", `Venta de ${cartItems.length} productos (Efec: $${efec}, Banco: $${banco}, CxC: $${cxc})`, totalPagar);

  if (cxc > 0) {
    let creditos = JSON.parse(localStorage.getItem(`gams_cxc_${currentAccountKey}`) || "[]");
    creditos.push({
      fecha: new Date().toLocaleDateString(),
      cliente: clienteCxC,
      monto: cxc,
      estado: "PENDIENTE"
    });
    localStorage.setItem(`gams_cxc_${currentAccountKey}`, JSON.stringify(creditos));
  }

  alert(`✅ Venta procesada con éxito. Total cobrado: $${totalPagar.toFixed(2)} USD (Incluye IVA). Inventario y Libro Diario actualizados.`);
  cartItems = [];
  document.getElementById("split-efectivo").value = "";
  document.getElementById("split-banco").value = "";
  document.getElementById("split-cxc").value = "";
  document.getElementById("split-cxc-cliente").value = "";
  document.getElementById("split-cxc-cliente").style.display = "none";
  renderizarCarrito();
  window.updateTblComercio();
};

window.registrarCxCDirecta = async function() {
  const cliente = document.getElementById("cxc-cliente").value.trim();
  const monto = parseFloat(document.getElementById("cxc-monto").value) || 0;

  if (!cliente || monto <= 0) {
    return alert("Ingresa el nombre del cliente y un monto de deuda válido mayor a $0 USD.");
  }

  let creditos = JSON.parse(localStorage.getItem(`gams_cxc_${currentAccountKey}`) || "[]");
  creditos.push({
    fecha: new Date().toLocaleDateString(),
    cliente: cliente,
    monto: monto,
    estado: "PENDIENTE"
  });

  localStorage.setItem(`gams_cxc_${currentAccountKey}`, JSON.stringify(creditos));
  await registrarTransaccionDiaria(currentAccountKey, "CRÉDITO / CXC", `Crédito otorgado a ${cliente}`, monto);

  document.getElementById("cxc-cliente").value = "";
  document.getElementById("cxc-monto").value = "";
  renderizarTablaCxC();
  alert(`✅ Crédito de $${monto.toFixed(2)} USD registrado a nombre de "${cliente}" en el Libro de CxC.`);
};

function renderizarTablaCxC() {
  const tbody = document.getElementById("cxc-table-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let creditos = JSON.parse(localStorage.getItem(`gams_cxc_${currentAccountKey}`) || "[]");

  if (creditos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay cuentas por cobrar pendientes.</td></tr>";
    return;
  }

  creditos.forEach((c, idx) => {
    let esPagado = c.estado === "PAGADO";
    tbody.innerHTML += `
      <tr>
        <td><small>${c.fecha || '-'}</small></td>
        <td><strong>${c.cliente}</strong></td>
        <td>$${c.monto.toFixed(2)} USD</td>
        <td><span class="badge ${esPagado ? 'btn-success' : 'btn-warning'}">${c.estado}</span></td>
        <td>
          ${!esPagado ? `<button class="btn-success" style="padding:4px 8px; font-size:12px;" onclick="marcarCxCPagada(${idx})">Saldar Deuda</button>` : '🟢 Saldado'}
        </td>
      </tr>`;
  });
}

window.marcarCxCPagada = async function(idx) {
  let creditos = JSON.parse(localStorage.getItem(`gams_cxc_${currentAccountKey}`) || "[]");
  let c = creditos[idx];
  c.estado = "PAGADO";
  localStorage.setItem(`gams_cxc_${currentAccountKey}`, JSON.stringify(creditos));
  await registrarTransaccionDiaria(currentAccountKey, "COBRO CXC", `Pago de deuda recibido de ${c.cliente}`, c.monto);
  renderizarTablaCxC();
  alert(`✅ La deuda de ${c.cliente} fue marcada como saldada.`);
};

async function renderAlbumComercio() {
  const container = document.getElementById("album-comercio-container");
  if (!container) return;
  container.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach(item => {
    container.innerHTML += `
      <div class="sticker-card">
        <img src="${item.img || defaultImgPlaceholder}" class="sticker-img">
        <div class="sticker-title">${item.name}</div>
        <small>SKU: ${item.barcode}</small><br>
        <div class="sticker-badge ok">Stock: ${item.stock}</div>
      </div>`;
  });
}

async function actualizarAlertasStockComercio() {
  const tbody = document.getElementById("low-stock-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  let criticos = curr.filter(i => i.stock <= 5);
  criticos.forEach(item => {
    tbody.innerHTML += `<tr><td><code>${item.barcode}</code></td><td>${item.name}</td><td><strong style="color:red;">${item.stock} uds</strong></td></tr>`;
  });
}