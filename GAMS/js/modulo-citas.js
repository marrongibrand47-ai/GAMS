// NUEVO MÓDULO: GESTIÓN DE CITAS Y AGENDAS MULTI-PERSONAL (NOMBRES/BARBEROS)
window.renderModuloCitas = function() {
  const container = document.getElementById("modulo-citas-container");
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>📅 Módulo de Citas y Agendas Multi-Personal</h3>
      <p style="font-size: 14px; color: #555;">Gestiona múltiples agendamientos por profesional o encargado dentro de tu negocio (ej. Barberos, Médicos, Esteticistas).</p>
      
      <!-- GESTIÓN DE PERSONAL / AGENDAS -->
      <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #ddd;">
        <h4 style="margin-top: 0; color: #6f42c1;">➕ Agregar Nueva Agenda / Personal</h4>
        <div class="grid" style="gap: 10px;">
          <div><input type="text" id="agenda-nombre-personal" placeholder="Nombre (Ej: Barbero Carlos)"></div>
          <div><input type="text" id="agenda-especialidad" placeholder="Especialidad / Servicio"></div>
        </div>
        <button class="btn-success" style="margin-top: 8px; width: auto;" onclick="crearAgendaPersonal()">💾 Crear Agenda</button>
      </div>

      <!-- SELECCIÓN Y DISPONIBILIDAD -->
      <div class="grid" style="gap: 15px;">
        <div style="flex: 1;">
          <label><strong>Seleccionar Profesional / Agenda:</strong></label>
          <select id="select-agenda-personal" onchange="cargarHorariosDisponibles()"></select>
        </div>
        <div style="flex: 1;">
          <label><strong>Fecha de Cita:</strong></label>
          <input type="date" id="cita-fecha" onchange="cargarHorariosDisponibles()">
        </div>
      </div>

      <!-- FORMULARIO AGENDAR CITA -->
      <div style="background: #eef5fc; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px dashed #007bff;">
        <h4 style="margin-top:0;">📝 Agendar Cita de Cliente</h4>
        <div class="grid" style="gap: 10px;">
          <div><label><small>Nombre Cliente:</small></label><input type="text" id="cita-cliente-nombre" placeholder="Nombre completo"></div>
          <div><label><small>Teléfono / WhatsApp:</small></label><input type="text" id="cita-cliente-tel" placeholder="0412-0000000"></div>
        </div>
        <div class="grid" style="gap: 10px; margin-top: 5px;">
          <div><label><small>Hora de Inicio:</small></label><input type="time" id="cita-hora-inicio"></div>
          <div><label><small>Tiempo Estimado (Minutos):</small></label><input type="number" id="cita-duracion" value="45" step="15"></div>
          <div><label><small>Costo del Servicio ($):</small></label><input type="number" id="cita-costo" value="15.00" step="0.50"></div>
        </div>
        <button class="btn-success" style="margin-top: 10px;" onclick="agendarNuevaCita()">📅 Confirmar y Reservar Cita</button>
      </div>

      <!-- HORARIOS LIBRES Y CITAS PROGRAMADAS -->
      <h4 style="margin-top: 25px; border-bottom: 2px solid #6f42c1; padding-bottom: 5px;">📋 Citas Programadas para la Fecha</h4>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Personal / Atiende</th>
              <th>Duración Est.</th>
              <th>Monto ($)</th>
              <th>Estado / Acción</th>
            </tr>
          </thead>
          <tbody id="tabla-citas-programadas">
            <tr><td colspan="7" style="text-align:center;">Selecciona una agenda para ver las citas.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Establecer fecha de hoy por defecto
  document.getElementById("cita-fecha").value = new Date().toISOString().split('T')[0];
}

async function getAgendasPersonal() {
  let localData = localStorage.getItem(`gams_agendas_${currentAccountKey}`);
  return localData ? JSON.parse(localData) : [
    { id: "p1", nombre: "Barbero Carlos", especialidad: "Corte y Barba" },
    { id: "p2", nombre: "Barbero Jose", especialidad: "Degradados" }
  ];
}

async function saveAgendasPersonal(list) {
  localStorage.setItem(`gams_agendas_${currentAccountKey}`, JSON.stringify(list));
}

async function getCitasRegistradas() {
  let localData = localStorage.getItem(`gams_citas_${currentAccountKey}`);
  return localData ? JSON.parse(localData) : [];
}

async function saveCitasRegistradas(list) {
  localStorage.setItem(`gams_citas_${currentAccountKey}`, JSON.stringify(list));
}

window.crearAgendaPersonal = async function() {
  const nombre = document.getElementById("agenda-nombre-personal").value.trim();
  const esp = document.getElementById("agenda-especialidad").value.trim();
  if (!nombre) return alert("Ingresa el nombre del personal.");

  let agendas = await getAgendasPersonal();
  agendas.push({ id: "p_" + Date.now(), nombre: nombre, especialidad: esp });
  await saveAgendasPersonal(agendas);
  document.getElementById("agenda-nombre-personal").value = "";
  document.getElementById("agenda-especialidad").value = "";
  cargarVistaCitas();
  alert(`✅ Agenda para "${nombre}" creada con éxito.`);
}

window.cargarVistaCitas = async function() {
  const sel = document.getElementById("select-agenda-personal");
  if (!sel) return;
  sel.innerHTML = "";
  let agendas = await getAgendasPersonal();
  
  agendas.forEach(a => {
    sel.innerHTML += `<option value="${a.id}">${a.nombre} (${a.especialidad || 'General'})</option>`;
  });

  cargarHorariosDisponibles();
}

window.cargarHorariosDisponibles = async function() {
  const personalId = document.getElementById("select-agenda-personal").value;
  const fecha = document.getElementById("cita-fecha").value;
  const tbody = document.getElementById("tabla-citas-programadas");
  if (!tbody) return;
  tbody.innerHTML = "";

  let citas = await getCitasRegistradas();
  let agendas = await getAgendasPersonal();
  let personalObj = agendas.find(a => a.id === personalId);

  let filtradas = citas.filter(c => c.personalId === personalId && c.fecha === fecha);

  if (filtradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay citas agendadas para el ${fecha} con ${personalObj ? personalObj.nombre : 'este personal'}. 🎉 ¡Horario completamente libre!</td></tr>`;
    return;
  }

  filtradas.forEach((c, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>⏱️ ${c.hora}</strong></td>
        <td>${c.cliente}</td>
        <td>${c.tel}</td>
        <td>${personalObj ? personalObj.nombre : 'Personal'}</td>
        <td>${c.duracion} min</td>
        <td>$${parseFloat(c.costo).toFixed(2)}</td>
        <td>
          <button class="btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="cancelarCita(${c.id})">Cancelar</button>
        </td>
      </tr>`;
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

  if (!cliente || !hora || !fecha) return alert("Por favor ingresa fecha, cliente y hora.");

  let citas = await getCitasRegistradas();

  // Validar solapamiento de horario para el mismo personal
  let choque = citas.find(c => c.personalId === personalId && c.fecha === fecha && c.hora === hora);
  if (choque) return alert(`⚠️ El barbero/personal ya tiene una cita reservada a las ${hora}. Elige otro horario.`);

  let nueva = { id: Date.now(), personalId, fecha, cliente, tel, hora, duracion, costo };
  citas.push(nueva);
  await saveCitasRegistradas(citas);

  await registrarTransaccionDiaria(currentAccountKey, "CITA RESERVADA", `Cita agendada para ${cliente} (${hora})`, costo);

  document.getElementById("cita-cliente-nombre").value = "";
  document.getElementById("cita-cliente-tel").value = "";
  cargarHorariosDisponibles();
  alert("🎉 Cita agendada con éxito.");
}

window.cancelarCita = async function(citaId) {
  if (confirm("¿Deseas cancelar esta cita agendada?")) {
    let citas = await getCitasRegistradas();
    citas = citas.filter(c => c.id !== citaId);
    await saveCitasRegistradas(citas);
    cargarHorariosDisponibles();
  }
}
