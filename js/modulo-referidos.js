window.renderModuloReferidos = function() {
  const container = document.getElementById("modulo-referidos-container");
  if (!container) return;
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>🤝 Programa de Referidos & Comisiones (50%)</h3>
      <div style="background: #fff8e1; padding: 15px; border-radius: 8px;">
        <h4>🔗 Generar Enlace Personal</h4>
        <input type="text" id="ref-promotor-nombre" placeholder="Nombre del Promotor">
        <input type="text" id="ref-promotor-codigo" placeholder="Código Único (Ej: juan50)">
        <button class="btn-success" style="margin-top: 10px; width: auto;" onclick="generarEnlaceReferido()">✨ Crear Enlace</button>
        <div id="enlace-generado-box" class="hidden" style="margin-top: 15px; background: white; padding: 12px;">
          <input type="text" id="ref-url-resultado" readonly style="font-weight:bold; color:#0056b3;">
          <button class="btn-warning" style="width:auto;" onclick="copiarEnlaceReferido()">📋 Copiar</button>
        </div>
      </div>
      <h4 style="margin-top: 20px;">📊 Comisiones Acumuladas</h4>
      <table>
        <thead><tr><th>Código</th><th>Promotor</th><th>Traídos</th><th>Ventas ($)</th><th>Comisión (50%)</th></tr></thead>
        <tbody id="tabla-referidos-lista"></tbody>
      </table>
    </div>
  `;
  window.cargarVistaReferidos();
}

async function getPromotoresReferidos() {
  let data = localStorage.getItem("gams_promotores_referidos");
  return data ? JSON.parse(data) : [{ codigo: "gams_vip", promotor: "Cliente Inicial", traidos: 1, ventas: 100, comision: 50 }];
}

async function savePromotoresReferidos(list) {
  localStorage.setItem("gams_promotores_referidos", JSON.stringify(list));
}

window.generarEnlaceReferido = async function() {
  const nombre = document.getElementById("ref-promotor-nombre").value.trim();
  let codigo = document.getElementById("ref-promotor-codigo").value.trim().toLowerCase();
  if (!nombre) return alert("Ingresa el nombre.");
  if (!codigo) codigo = nombre.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random()*100);

  let promotores = await getPromotoresReferidos();
  if (!promotores.find(p => p.codigo === codigo)) {
    promotores.push({ codigo, promotor: nombre, traidos: 0, ventas: 0, comision: 0 });
    await savePromotoresReferidos(promotores);
  }
  document.getElementById("ref-url-resultado").value = `${window.location.origin}${window.location.pathname}?ref=${codigo}`;
  document.getElementById("enlace-generado-box").classList.remove("hidden");
  window.cargarVistaReferidos();
}

window.copiarEnlaceReferido = function() {
  document.getElementById("ref-url-resultado").select();
  document.execCommand("copy");
  alert("📋 ¡Enlace copiado!");
}

window.cargarVistaReferidos = async function() {
  const tbody = document.getElementById("tabla-referidos-lista");
  if (!tbody) return;
  tbody.innerHTML = "";
  let promotores = await getPromotoresReferidos();
  promotores.forEach(p => {
    tbody.innerHTML += `<tr><td><code>${p.codigo}</code></td><td><strong>${p.promotor}</strong></td><td>${p.traidos}</td><td>$${p.ventas.toFixed(2)}</td><td><strong style="color:#28a745;">$${p.comision.toFixed(2)} USD</strong></td></tr>`;
  });
}