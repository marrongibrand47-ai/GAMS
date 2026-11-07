window.renderModuloCitas = function() {
  const container = document.getElementById("modulo-citas-container");
  if (!container) return;
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>📅 Módulo de Citas y Agendas Multi-Personal</h3>
      <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #6f42c1;">➕ Crear Nueva Agenda / Personal</h4>
        <input type="text" id="agenda-nombre-personal" placeholder="Nombre (Ej: Barbero Carlos)">
        <input type="text" id="agenda-especialidad" placeholder="Especialidad / Servicio">
        <button class="btn-success" style="margin-top: 8px; width: auto;" onclick="crearAgendaPersonal()">💾 Crear Agenda</button>
      </div>

      <div class="grid" style="gap: 15px;">
        <div><label><strong>Seleccionar Profesional:</strong></label><select id="select-agenda-personal" onchange="cargarHorariosDisponibles()"></select></div>
        <div><label><strong>Fecha de Cita:</strong></label><input type="date" id="cita-fecha" onchange="cargarHorariosDisponibles()"></div>
      </div>

      <div style="background: #eef5fc; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <h4>📝 Agendar Cita</h4>
        <input type="text" id="cita-cliente-nombre" placeholder="Nombre del cliente">
        <input type="text" id="cita-cliente-tel" placeholder="Teléfono / WhatsApp">
        <input type="time" id="cita-hora-inicio">
        <input type="number" id="cita-duracion" value="45" placeholder="Duración (min)">
        <input type="number" id="cita-costo" value="15.00" placeholder="Costo ($)">
        <button class="btn-success" style="margin-top: 10px;" onclick="agendarNuevaCita()">📅 Confirmar Cita</button>
      </div>

      <h4 style="margin-top: 25px;">📋 Citas Programadas</h4>
      <table>
        <thead><tr><th>Hora</th><th>Cliente</th><th>Teléfono</th><th>Atiende</th><th>Duración</th><th>Monto</th><th>Acción</th></tr></thead>
        <tbody id="tabla-citas-programadas"></tbody>
      </table>
    </div>
  `;
  document.getElementById("cita-fecha").value = new Date().toISOString().split('T')[0];
  window.cargarVistaCitas();
}

async function getAgendasPersonal() {
  let data = localStorage.getItem(`gams_agendas_${currentAccountKey}`);
  return data ? JSON.parse(data) : [{ id: "p1", nombre: "Barbero Carlos", especialidad: "Corte" }];
}

async function saveAgendasPersonal(list) {
  localStorage.setItem(`gams_agendas_${currentAccountKey}`, JSON.stringify(list));
}

async function getCitasRegistradas() {
  let data = localStorage.getItem(`gams_citas_${currentAccountKey}`);
  return data ? JSON.parse(data) : [];
}

async function saveCitasRegistradas(list) {
  localStorage.setItem(`gams_citas_${currentAccountKey}`, JSON.stringify(list));
}

window.crearAgendaPersonal = async function() {
  const nombre = document.getElementById("agenda-nombre-personal").value.trim();
  const esp = document.getElementById("agenda-especialidad").value.trim();
  if (!nombre) return alert("Ingresa el nombre.");
  let agendas = await getAgendasPersonal();
  agendas.push({ id: "p_" + Date.now(), nombre, especialidad: esp });
  await saveAgendasPersonal(agendas);
  window.cargarVistaCitas();
  alert("✅ Agenda creada.");
}

window.cargarVistaCitas = async function() {
  const sel = document.getElementById("select-agenda-personal");
  if (!sel) return;
  sel.innerHTML = "";
  let agendas = await getAgendasPersonal();
  agendas.forEach(a => sel.innerHTML += `<option value="${a.id}">${a.nombre} (${a.especialidad})</option>`);
  window.cargarHorariosDisponibles();
}

window.cargarHorariosDisponibles = async function() {
  const personalId = document.getElementById("select-agenda-personal")?.value;
  const fecha = document.getElementById("cita-fecha")?.value;
  const tbody = document.getElementById("tabla-citas-programadas");
  if (!tbody) return;
  tbody.innerHTML = "";
  let citas = await getCitasRegistradas();
  let filtradas = citas.filter(c => c.personalId === personalId && c.fecha === fecha);

  if (filtradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay citas agendadas para el ${fecha}. ¡Horario libre!</td></tr>`;
    return;
  }
  filtradas.forEach(c => {
    tbody.innerHTML += `<tr><td><strong>${c.hora}</strong></td><td>${c.cliente}</td><td>${c.tel}</td><td>Personal</td><td>${c.duracion} min</td><td>$${c.costo.toFixed(2)}</td><td><button class="btn-danger" style="padding:4px;" onclick="cancelarCita(${c.id})">Cancelar</button></td></tr>`;
  });
}

window.agendarNuevaCita = async function() {
  const personalId = document.getElementById("select-agenda-personal").value;
  const fecha = document.getElementById("cita-fecha").value;
  const cliente = document.getElementById("cita-cliente-nombre").value.trim();
  const tel = document.getElementById("cita-cliente-tel").value.trim();
  const hora = document.getElementById("cita-hora-inicio").value;
  const duracion = parseInt(document.getElementById("cita-duracion").value) || 30;
  const costo = parseFloat(document.getElementById("cita-costo").value) || 0;

  if (!cliente || !hora) return alert("Completa los datos de la cita.");
  let citas = await getCitasRegistradas();
  citas.push({ id: Date.now(), personalId, fecha, cliente, tel, hora, duracion, costo });
  await saveCitasRegistradas(citas);
  await registrarTransaccionDiaria(currentAccountKey, "CITA RESERVADA", `Cita para ${cliente} (${hora})`, costo);
  window.cargarHorariosDisponibles();
  alert("🎉 Cita agendada.");
}

window.cancelarCita = async function(id) {
  let citas = await getCitasRegistradas();
  citas = citas.filter(c => c.id !== id);
  await saveCitasRegistradas(citas);
  window.cargarHorariosDisponibles();
}