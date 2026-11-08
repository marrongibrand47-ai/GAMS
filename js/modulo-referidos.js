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

const defaultPromotores = [
  { codigo: "gams_vip", promotor: "Cliente Inicial", traidos: 1, ventas: 100, comision: 50 }
];

// Función para obtener los promotores desde Firebase o LocalStorage como respaldo
async function getPromotoresReferidos() {
  let localData = localStorage.getItem("gams_promotores_referidos");
  let promotores = localData ? JSON.parse(localData) : defaultPromotores;
  
  if (!navigator.onLine) return promotores;

  try {
    let doc = await dbHotel.collection("gams_system").doc("referidos_registry").get();
    if (doc.exists && doc.data().promotores) {
      promotores = doc.data().promotores;
      localStorage.setItem("gams_promotores_referidos", JSON.stringify(promotores));
    }
  } catch (e) {
    console.warn("Usando caché local para referidos:", e);
  }
  return promotores;
}

// Función para guardar los promotores tanto en LocalStorage como en Firebase
async function savePromotoresReferidos(list) {
  localStorage.setItem("gams_promotores_referidos", JSON.stringify(list));
  if (navigator.onLine) {
    try {
      await dbHotel.collection("gams_system").doc("referidos_registry").set({ promotores: list });
    } catch (e) {
      console.error("Error al sincronizar referidos en Firebase:", e);
    }
  }
}

window.generarEnlaceReferido = async function() {
  const nombre = document.getElementById("ref-promotor-nombre").value.trim();
  let codigo = document.getElementById("ref-promotor-codigo").value.trim().toLowerCase();
  if (!nombre) return alert("Ingresa el nombre del promotor.");
  if (!codigo) codigo = nombre.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random()*100);

  let promotores = await getPromotoresReferidos();
  if (!promotores.find(p => p.codigo === codigo)) {
    promotores.push({ codigo, promotor: nombre, traidos: 0, ventas: 0, comision: 0 });
    await savePromotoresReferidos(promotores);
  }
  
  document.getElementById("ref-url-resultado").value = `${window.location.origin}${window.location.pathname}?ref=${codigo}`;
  document.getElementById("enlace-generado-box").classList.remove("hidden");
  window.cargarVistaReferidos();
  alert(`✨ Enlace de referido generado para "${nombre}" y guardado con éxito.`);
}

window.copiarEnlaceReferido = function() {
  const campoUrl = document.getElementById("ref-url-resultado");
  campoUrl.select();
  campoUrl.setSelectionRange(0, 99999); // Para dispositivos móviles
  navigator.clipboard.writeText(campoUrl.value).then(() => {
    alert("📋 ¡Enlace copiado al portapapeles!");
  }).catch(() => {
    document.execCommand("copy");
    alert("📋 ¡Enlace copiado!");
  });
}

window.cargarVistaReferidos = async function() {
  const tbody = document.getElementById("tabla-referidos-lista");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  let promotores = await getPromotoresReferidos();
  
  if (promotores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay promotores registrados todavía.</td></tr>`;
    return;
  }

  promotores.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><code>${p.codigo}</code></td>
        <td><strong>${p.promotor}</strong></td>
        <td>${p.traidos || 0}</td>
        <td>$${(p.ventas || 0).toFixed(2)}</td>
        <td><strong style="color:#28a745;">$${(p.comision || 0).toFixed(2)} USD</strong></td>
      </tr>`;
  });
}