window.renderModuloCitas = function() {
  const container = document.getElementById("modulo-citas-container");
  if (!container) return;

  let esEmpleado = (window.userRole || "").trim().toUpperCase() === "EMPLEADO";

  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>📅 Módulo de Citas y Agendas Multi-Personal</h3>
      
      <div id="panel-crear-agenda" style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 20px;" class="${esEmpleado ? 'hidden' : ''}">
        <h4 style="margin-top: 0; color: #6f42c1;">➕ Crear Nueva Agenda / Profesional</h4>
        <input type="text" id="agenda-nombre-personal" placeholder="Nombre del Profesional (Ej: Carlos)">
        <input type="text" id="agenda-especialidad" placeholder="Especialidad / Servicio">
        <div class="grid" style="gap: 5px; margin-top: 5px;">
          <div><label><small>Hora Entrada:</small></label><input type="time" id="agenda-h-entrada" value="08:00"></div>
          <div><label><small>Hora Salida:</small></label><input type="time" id="agenda-h-salida" value="18:00"></div>
        </div>
        <button class="btn-success" style="margin-top: 8px; width: auto;" onclick="crearAgendaPersonal()">💾 Guardar Profesional</button>
      </div>

      <div class="grid" style="gap: 15px;">
        <div><label><strong>Seleccionar Profesional:</strong></label><select id="select-agenda-personal" onchange="cargarHorariosDisponibles()"></select></div>
        <div><label><strong>Fecha de Cita:</strong></label><input type="date" id="cita-fecha" onchange="cargarHorariosDisponibles()"></div>
      </div>

      <div style="background: #e2f0d9; padding: 12px; border-radius: 8px; margin-top: 15px; border-left: 5px solid #385723;">
        <h4 style="margin-top:0; color:#385723;">⏰ Control de Horarios y Disponibilidad</h4>
        <div id="resumen-horarios-profesional" style="font-size: 14px;">Selecciona un profesional para ver su jornada.</div>
      </div>

      <div style="background: #eef5fc; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <h4>📝 Registrar Cita</h4>
        <input type="text" id="cita-cliente-nombre" placeholder="Nombre del cliente">
        <input type="text" id="cita-cliente-tel" placeholder="Teléfono / WhatsApp">
        <div class="grid" style="gap: 5px;">
          <div><label><small>Hora de Cita:</small></label><input type="time" id="cita-hora-inicio"></div>
          <div><label><small>Duración (Opcional - min):</small></label><input type="number" id="cita-duracion" placeholder="Ej: 30 (Opcional)"></div>
        </div>
        <button class="btn-success" style="margin-top: 10px;" onclick="agendarNuevaCita()">📅 Confirmar Cita</button>
      </div>

      <h4 style="margin-top: 25px;">📋 Citas Programadas</h4>
      <table>
        <thead><tr><th>Hora</th><th>Cliente</th><th>Teléfono</th><th>Profesional</th><th>Duración</th><th>Acción</th></tr></thead>
        <tbody id="tabla-citas-programadas"></tbody>
      </table>
    </div>
  `;
  document.getElementById("cita-fecha").value = new Date().toISOString().split('T')[0];
  window.cargarVistaCitas();
}

function getClaveRaizCitas() {
  return window.obtenerIdentificadorRaizNegocio ? obtenerIdentificadorRaizNegocio(currentAccountKey) : currentAccountKey;
}

async function getAgendasPersonal() {
  let raiz = getClaveRaizCitas();
  let data = localStorage.getItem(`gams_agendas_${raiz}`);
  return data ? JSON.parse(data) : [{ id: "p1", nombre: "Carlos (General)", especialidad: "Servicio", hEntrada: "08:00", hSalida: "18:00" }];
}

async function saveAgendasPersonal(list) {
  let raiz = getClaveRaizCitas();
  localStorage.setItem(`gams_agendas_${raiz}`, JSON.stringify(list));
}

async function getCitasRegistradas() {
  let raiz = getClaveRaizCitas();
  let data = localStorage.getItem(`gams_citas_${raiz}`);
  return data ? JSON.parse(data) : [];
}

async function saveCitasRegistradas(list) {
  let raiz = getClaveRaizCitas();
  localStorage.setItem(`gams_citas_${raiz}`, JSON.stringify(list));
}

window.crearAgendaPersonal = async function() {
  const nombre = document.getElementById("agenda-nombre-personal").value.trim();
  const esp = document.getElementById("agenda-especialidad").value.trim();
  const hEntrada = document.getElementById("agenda-h-entrada").value || "08:00";
  const hSalida = document.getElementById("agenda-h-salida").value || "18:00";

  if (!nombre) return alert("Ingresa el nombre del profesional.");
  let agendas = await getAgendasPersonal();
  agendas.push({ id: "p_" + Date.now(), nombre, especialidad: esp, hEntrada, hSalida });
  await saveAgendasPersonal(agendas);
  window.cargarVistaCitas();
  alert("✅ Profesional y jornada guardados y sincronizados.");
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
  const resumenBox = document.getElementById("resumen-horarios-profesional");
  if (!tbody || !resumenBox) return;

  let agendas = await getAgendasPersonal();
  let profActual = agendas.find(a => a.id === personalId);
  let hEntrada = profActual ? profActual.hEntrada || "08:00" : "08:00";
  let hSalida = profActual ? profActual.hSalida || "18:00" : "18:00";

  let citas = await getCitasRegistradas();
  let filtradas = citas.filter(c => c.personalId === personalId && c.fecha === fecha);

  let horasOcupadasTxt = filtradas.length > 0 ? filtradas.map(c => c.hora).join(", ") : "Ninguna (Todo libre)";
  resumenBox.innerHTML = `
    👤 <strong>${profActual ? profActual.nombre : 'Profesional'}</strong> | 
    🕒 <strong>Jornada:</strong> ${hEntrada} a ${hSalida} | 
    🔴 <strong>Horas ocupadas:</strong> ${horasOcupadasTxt}
  `;

  tbody.innerHTML = "";
  if (filtradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay citas agendadas para el ${fecha}. ¡Horario completamente libre!</td></tr>`;
    return;
  }

  filtradas.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${c.hora}</strong></td>
        <td>${c.cliente}</td>
        <td>${c.tel}</td>
        <td>${profActual ? profActual.nombre : '-'}</td>
        <td>${c.duracion ? c.duracion + ' min' : 'No especificada'}</td>
        <td><button class="btn-danger" style="padding:4px;" onclick="cancelarCita(${c.id})">Cancelar</button></td>
      </tr>`;
  });
}

window.agendarNuevaCita = async function() {
  const personalId = document.getElementById("select-agenda-personal").value;
  const fecha = document.getElementById("cita-fecha").value;
  const cliente = document.getElementById("cita-cliente-nombre").value.trim();
  const tel = document.getElementById("cita-cliente-tel").value.trim();
  const hora = document.getElementById("cita-hora-inicio").value;
  const duracion = parseInt(document.getElementById("cita-duracion").value) || 0;

  if (!cliente || !hora) return alert("Ingresa el nombre del cliente y la hora de la cita.");
  
  let citas = await getCitasRegistradas();
  citas.push({ id: Date.now(), personalId, fecha, cliente, tel, hora, duracion });
  await saveCitasRegistradas(citas);
  
  await registrarTransaccionDiaria(currentAccountKey, "CITA RESERVADA", `Cita agendada para ${cliente} a las ${hora}`, 0);
  window.cargarHorariosDisponibles();
  alert("🎉 Cita agendada correctamente y sincronizada.");
}

window.cancelarCita = async function(id) {
  let citas = await getCitasRegistradas();
  citas = citas.filter(c => c.id !== id);
  await saveCitasRegistradas(citas);
  window.cargarHorariosDisponibles();
}