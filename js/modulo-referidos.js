window.renderModuloReferidos = function() {
  const container = document.getElementById("modulo-referidos-container");
  if (!container) return;
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>🤝 Programa Oficial de Referidos GAMS</h3>
      <p>Comparte tu enlace único de afiliado. Cada negocio que adquiera GAMS con tu enlace te genera un <strong>50% de comisión recurrente</strong>.</p>
      
      <div style="background: #eef5fc; padding: 12px; border-radius: 6px; margin: 15px 0; border: 1px solid #007bff;">
        <label><strong>🔗 Tu Enlace Personal de Promotor:</strong></label>
        <div style="display:flex; gap:8px; margin-top:5px;">
          <input type="text" id="input-link-promotor" readonly style="background:white; font-weight:bold; margin:0; flex:1;">
          <button class="btn-success" style="width:auto; margin:0;" onclick="copiarLinkPromotor()">Copiar Link</button>
        </div>
      </div>

      <h4>📊 Resumen de Tus Ganancias</h4>
      <div class="grid" style="gap: 15px; margin-top: 10px;">
        <div style="background:#e2f0d9; padding:15px; border-radius:6px; border:1px solid #385723;">
          <h4 style="margin:0; color:#385723;">Negocios Traídos</h4>
          <p id="ref-stat-traidos" style="font-size:24px; font-weight:bold; margin:5px 0 0 0;">0</p>
        </div>
        <div style="background:#fff2cc; padding:15px; border-radius:6px; border:1px solid #d6b656;">
          <h4 style="margin:0; color:#856404;">Comisión Acumulada (50%)</h4>
          <p id="ref-stat-comision" style="font-size:24px; font-weight:bold; margin:5px 0 0 0;">$0.00 USD</p>
        </div>
      </div>

      <h4 style="margin-top:25px;">➕ Registrar Nuevo Promotor</h4>
      <input type="text" id="promotor-nombre" placeholder="Nombre del Promotor">
      <input type="text" id="promotor-codigo" placeholder="Código Único (Ej: GIBRAND50)">
      <button class="btn-success" style="margin-top:5px; width:auto;" onclick="registrarNuevoPromotor()">Registrar Promotor</button>

      <h4 style="margin-top:25px;">📋 Listado de Promotores Activos</h4>
      <table>
        <thead><tr><th>Promotor</th><th>Código</th><th>Negocios Referidos</th><th>Comisión Ganada</th></tr></thead>
        <tbody id="tabla-promotores-list"></tbody>
      </table>
    </div>
  `;
  actualizarVistaReferidos();
}

function actualizarVistaReferidos() {
  const inpLink = document.getElementById("input-link-promotor");
  const codigoDemo = "GIBRAND2026";
  if (inpLink) {
    inpLink.value = `${window.location.origin}/index.html?ref=${codigoDemo}`;
  }

  let data = localStorage.getItem("gams_promotores_referidos");
  let promotores = data ? JSON.parse(data) : [
    { promotor: "Gibrand Marron", codigo: "GIBRAND2026", traidos: 2, ventas: 50, comision: 25.00 }
  ];
  localStorage.setItem("gams_promotores_referidos", JSON.stringify(promotores));

  let totalTraidos = promotores.reduce((a, b) => a + (b.traidos || 0), 0);
  let totalComision = promotores.reduce((a, b) => a + (b.comision || 0), 0);

  if(document.getElementById("ref-stat-traidos")) document.getElementById("ref-stat-traidos").innerText = totalTraidos;
  if(document.getElementById("ref-stat-comision")) document.getElementById("ref-stat-comision").innerText = `$${totalComision.toFixed(2)} USD`;

  const tbody = document.getElementById("tabla-promotores-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  promotores.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.promotor}</strong></td>
        <td><code>${p.codigo}</code></td>
        <td>${p.traidos || 0} negocios</td>
        <td><strong>$${(p.comision || 0).toFixed(2)} USD</strong></td>
      </tr>`;
  });
}

window.copiarLinkPromotor = function() {
  const input = document.getElementById("input-link-promotor");
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    alert("📋 ¡Enlace de referido copiado al portapapeles!");
  });
}

window.registrarNuevoPromotor = function() {
  const nombre = document.getElementById("promotor-nombre").value.trim();
  const codigo = document.getElementById("promotor-codigo").value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completa el nombre y el código del promotor.");

  let data = localStorage.getItem("gams_promotores_referidos");
  let promotores = data ? JSON.parse(data) : [];
  promotores.push({ promotor: nombre, codigo, traidos: 0, ventas: 0, comision: 0 });
  localStorage.setItem("gams_promotores_referidos", JSON.stringify(promotores));
  document.getElementById("promotor-nombre").value = "";
  document.getElementById("promotor-codigo").value = "";
  actualizarVistaReferidos();
  alert("✅ Promotor registrado con éxito.");
}