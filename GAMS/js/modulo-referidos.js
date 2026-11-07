// NUEVO MÓDULO: SISTEMA DE CREACIÓN Y TRACKING DE ENLACES DE REFERIDOS (50% COMISIÓN GAMS)
window.renderModuloReferidos = function() {
  const container = document.getElementById("modulo-referidos-container");
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>🤝 Sistema de Referidos & Comisiones (50% Primera Cuenta)</h3>
      <p style="font-size: 14px; color: #555;">Genera enlaces de afiliado para que los clientes inviten nuevos negocios a GAMS Company. Se acredita automáticamente el <strong>50% del primer pago/credencial</strong> del cliente invitado.</p>
      
      <!-- GENERADOR DE ENLACES -->
      <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top:0; color:#b78103;">🔗 Generar Enlace Personal de Referido</h4>
        <div class="grid" style="gap: 10px;">
          <div><label><small>Nombre del Promotor / Cliente:</small></label><input type="text" id="ref-promotor-nombre" placeholder="Ej: Maria Perez"></div>
          <div><label><small>Código Único de Afiliado:</small></label><input type="text" id="ref-promotor-codigo" placeholder="Ej: maria50"></div>
        </div>
        <button class="btn-success" style="margin-top: 10px; width: auto;" onclick="generarEnlaceReferido()">✨ Crear Enlace de Afiliado</button>

        <div id="enlace-generado-box" class="hidden" style="margin-top: 15px; background: white; padding: 12px; border-radius: 6px; border: 1px dashed #ffa000;">
          <p style="margin:0 0 5px 0; font-size: 13px;"><strong>Tu enlace personal para compartir:</strong></p>
          <input type="text" id="ref-url-resultado" readonly style="font-weight:bold; color:#0056b3; background:#f4f4f4;">
          <button class="btn-warning" style="width:auto; padding:6px 15px; margin-top:5px;" onclick="copiarEnlaceReferido()">📋 Copiar Enlace</button>
        </div>
      </div>

      <!-- PANEL DE CONTROL Y BALANCE DE COMISIONES -->
      <h4 style="margin-top: 20px;">📊 Histórico de Referidos & Comisiones Acumuladas</h4>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Código Promotor</th>
              <th>Nombre Promotor</th>
              <th>Clientes Traídos</th>
              <th>Ventas Totales ($)</th>
              <th>Comisión Acumulada (50%)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tabla-referidos-lista">
            <tr><td colspan="6" style="text-align:center;">Cargando datos de referidos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function getPromotoresReferidos() {
  let localData = localStorage.getItem("gams_promotores_referidos");
  return localData ? JSON.parse(localData) : [
    { codigo: "gams_vip", promotor: "Cliente Inicial", traidos: 1, ventas: 100.00, comision: 50.00 }
  ];
}

async function savePromotoresReferidos(list) {
  localStorage.setItem("gams_promotores_referidos", JSON.stringify(list));
}

window.generarEnlaceReferido = async function() {
  const nombre = document.getElementById("ref-promotor-nombre").value.trim();
  let codigo = document.getElementById("ref-promotor-codigo").value.trim().toLowerCase();
  if (!nombre) return alert("Ingresa el nombre del cliente/promotor.");

  if (!codigo) codigo = nombre.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random()*100);

  let promotores = await getPromotoresReferidos();
  let existente = promotores.find(p => p.codigo === codigo);

  if (!existente) {
    promotores.push({ codigo, promotor: nombre, traidos: 0, ventas: 0, comision: 0 });
    await savePromotoresReferidos(promotores);
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${baseUrl}?ref=${codigo}`;

  document.getElementById("ref-url-resultado").value = fullUrl;
  document.getElementById("enlace-generado-box").classList.remove("hidden");
  cargarVistaReferidos();
}

window.copiarEnlaceReferido = function() {
  const copyText = document.getElementById("ref-url-resultado");
  copyText.select();
  document.execCommand("copy");
  alert("📋 ¡Enlace copiado al portapapeles! Envíalo a tus nuevos clientes.");
}

window.cargarVistaReferidos = async function() {
  const tbody = document.getElementById("tabla-referidos-lista");
  if (!tbody) return;
  tbody.innerHTML = "";

  let promotores = await getPromotoresReferidos();

  if (promotores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay promotores o enlaces registrados.</td></tr>`;
    return;
  }

  promotores.forEach((p, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><code>${p.codigo}</code></td>
        <td><strong>${p.promotor}</strong></td>
        <td>${p.traidos} nuevos negocios</td>
        <td>$${p.ventas.toFixed(2)}</td>
        <td><strong style="color:#28a745; font-size:16px;">$${p.comision.toFixed(2)} USD</strong></td>
        <td>
          <button class="btn-success" style="padding: 4px 8px; font-size: 11px;" onclick="pagarComisionReferido(${idx})">💵 Liquidar Pago 50%</button>
        </td>
      </tr>`;
  });
}

// Función ejecutada cuando un cliente compra una cuenta usando un enlace ?ref=CODIGO
window.procesarComisionReferido = async function(codigoRef, nombreNuevoNegocio, montoCuenta = 50.00) {
  let promotores = await getPromotoresReferidos();
  let p = promotores.find(x => x.codigo === codigoRef);

  if (p) {
    let comisionCalculada = montoCuenta * 0.50; // 50% de la primera credencial
    p.traidos += 1;
    p.ventas += montoCuenta;
    p.comision += comisionCalculada;

    await savePromotoresReferidos(promotores);
    await registrarTransaccionDiaria("GLOBAL", "COMISIÓN REFERIDO", `Comisión 50% para ${p.promotor} por nuevo cliente (${nombreNuevoNegocio})`, comisionCalculada);
    console.log(`✅ Se acreditó $${comisionCalculada} a ${p.promotor}`);
  }
}

window.pagarComisionReferido = async function(idx) {
  let promotores = await getPromotoresReferidos();
  let p = promotores[idx];
  if (p.comision <= 0) return alert("El promotor no tiene saldo pendiente por cobrar.");

  if (confirm(`¿Pagar y liquidar la comisión acumulada de $${p.comision.toFixed(2)} a ${p.promotor}?`)) {
    let pago = p.comision;
    p.comision = 0;
    await savePromotoresReferidos(promotores);
    cargarVistaReferidos();
    alert(`✅ Se registró el pago de $${pago.toFixed(2)} a ${p.promotor}.`);
  }
}
