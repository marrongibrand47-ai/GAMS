// MÓDULO DE INVENTARIO, POS Y CARRITO GAMS COMPANY
let cartItems = [];

window.renderModuloComercio = function() {
  const container = document.getElementById("modulo-comercio-container");
  container.innerHTML = `
    <div id="subpage-pos">
      <h3>🛒 POS & Carrito de Compras</h3>
      <div class="cart-container">
        <div class="grid" style="gap: 10px;">
          <div><label><strong>Producto / Servicio:</strong></label><select id="cart-prod-select"></select></div>
          <div><label><strong>Cantidad:</strong></label><input type="number" id="cart-qty" value="1" min="1"></div>
        </div>
        <button class="btn-success" style="margin-top: 10px;" onclick="agregarAlCarrito()">➕ Agregar al Carrito</button>
        <h4 style="margin-top: 20px;">Artículos en el Carrito</h4>
        <table>
          <thead><tr><th>Ítem</th><th>Precio ($)</th><th>Cant.</th><th>Subtotal ($)</th><th>Acción</th></tr></thead>
          <tbody id="cart-items-table"><tr><td colspan="5" style="text-align:center;">El carrito está vacío.</td></tr></tbody>
        </table>
        <div style="text-align: right; margin-top: 15px;">
          <p><strong>Total USD:</strong> <span id="cart-total-usd" style="color: #28a745; font-size: 20px;">$0.00</span></p>
          <button class="btn-success" style="width: auto;" onclick="procesarCompraCarrito()">💳 Procesar Venta</button>
        </div>
      </div>
    </div>
  `;
}

window.switchComercioTab = function(tab) {
  if (tab === 'pos') {
    cargarSelectCarrito();
    renderizarCarrito();
  }
}

async function cargarSelectCarrito() {
  const sel = document.getElementById("cart-prod-select");
  if (!sel) return;
  sel.innerHTML = "";
  let curr = await getDbItems(currentAccountKey);
  curr.forEach((item, idx) => {
    sel.innerHTML += `<option value="${idx}">[${item.barcode}] ${item.name} - $${(item.priceUsd||0).toFixed(2)}</option>`;
  });
}

window.agregarAlCarrito = async function() {
  const selIdx = document.getElementById("cart-prod-select").value;
  const qty = parseInt(document.getElementById("cart-qty").value) || 1;
  if (selIdx === "") return;

  let curr = await getDbItems(currentAccountKey);
  let prod = curr[selIdx];
  cartItems.push({ barcode: prod.barcode, name: prod.name, price: prod.priceUsd || 0, qty: qty, originalIndex: selIdx });
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
  let total = 0;

  for (let item of cartItems) {
    let prod = curr[item.originalIndex];
    if (prod && prod.stock >= item.qty) {
      prod.stock -= item.qty;
      total += item.price * item.qty;
    }
  }

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "VENTA POS", `Venta de ${cartItems.length} productos`, total);
  alert("✅ Venta completada con éxito.");
  cartItems = [];
  renderizarCarrito();
}
