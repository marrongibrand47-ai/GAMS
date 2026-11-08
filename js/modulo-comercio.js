let cartItems = [];

window.renderModuloComercio = function() {
  const container = document.getElementById("modulo-comercio-container");
  if (!container) return;
  container.innerHTML = `
    <div id="subpage-comercio-inv">
      <h3>📦 Inventario Central</h3>
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
      <h3>🛒 POS & Carrito de Compras</h3>
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
        <div style="text-align: right; margin-top: 15px;">
          <p><strong>Total USD:</strong> <span id="cart-total-usd" style="color: #28a745; font-size: 20px;">$0.00</span></p>
          <button class="btn-success" style="width: auto;" onclick="procesarCompraCarrito()">💳 Procesar Venta</button>
        </div>
      </div>
    </div>

    <div id="subpage-comercio-cxc" class="hidden">
      <h3>💳 Cuentas por Cobrar (CxC)</h3>
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ced4da;">
        <input type="text" id="cxc-cliente" placeholder="Nombre del Cliente">
        <input type="number" id="cxc-monto" placeholder="Monto Total Deuda ($)">
        <button class="btn-warning" style="margin-top: 5px;" onclick="registrarCxCDirecta()">💾 Guardar Crédito</button>
      </div>
      <table style="margin-top:15px;">
        <thead><tr><th>Cliente</th><th>Monto ($)</th><th>Estado</th></tr></thead>
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
  } else if (tab === 'cxc') {
    document.getElementById("subpage-comercio-cxc").classList.remove("hidden");
    document.getElementById("c-tab-cxc").classList.add("active");
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
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Sin productos.</td></tr>";
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

function renderizarCarrito() {
  const tbody = document.getElementById("cart-items-table");
  if (!tbody) return;
  tbody.innerHTML = "";
  let totalUsd = 0;
  cartItems.forEach((item, idx) => {
    let sub = item.price * item.qty;
    totalUsd += sub;
    tbody.innerHTML += `<tr><td>${item.name}</td><td>$${item.price.toFixed(2)}</td><td>${item.qty}</td><td>$${sub.toFixed(2)}</td><td><button class="btn-delete" onclick="cartItems.splice(${idx},1);renderizarCarrito();">🗑️</button></td></tr>`;
  });
  document.getElementById("cart-total-usd").innerText = `$${totalUsd.toFixed(2)}`;
}

window.procesarCompraCarrito = async function() {
  if (cartItems.length === 0) return alert("El carrito está vacío.");
  let curr = await getDbItems(currentAccountKey);
  
  for (let item of cartItems) {
    let prod = curr[item.originalIndex];
    if (!prod || prod.stock < item.qty) {
      return alert(`❌ Stock insuficiente para el producto: "${item.name}". Stock actual disponible: ${prod ? prod.stock : 0}.`);
    }
  }

  let total = 0;
  for (let item of cartItems) {
    let prod = curr[item.originalIndex];
    prod.stock -= item.qty;
    total += item.price * item.qty;
  }

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "VENTA POS", `Venta de ${cartItems.length} ítems en caja`, total);
  alert(`✅ Venta procesada con éxito. Total cobrado: $${total.toFixed(2)} USD. Inventario actualizado automáticamente.`);
  cartItems = [];
  renderizarCarrito();
  window.updateTblComercio();
}

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