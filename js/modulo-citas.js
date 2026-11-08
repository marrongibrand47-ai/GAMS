window.renderModuloCitas = function() {
  const container = document.getElementById("modulo-citas-container");
  if (!container) return;

  let esEmpleado = (window.userRole || "").trim().toUpperCase() === "EMPLEADO" || (window.userRole || "").trim().toUpperCase() === "EMPLEADO_EXTRA";
  let raizNegocio = window.obtenerIdentificadorRaizNegocio ? obtenerIdentificadorRaizNegocio(currentAccountKey) : currentAccountKey;
  let urlPublicaReserva = `${window.location.origin}/reserva-cliente.html?biz=${raizNegocio}`;
  let qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlPublicaReserva)}`;

  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ced4da;">
      <h3>📅 Módulo de Citas y Agendas Multi-Personal</h3>
      
      <!-- PORTAL QR Y LINK PARA EL ADMINISTRADOR -->
      <div class="${esEmpleado ? 'hidden' : ''}" style="background: #eef5fc; padding: 15px; border-radius: 8px; border: 1px solid #007bff; margin-bottom: 20px;">
        <h4 style="margin-top:0; color:#0056b3;">🔗 Portal Web & Código QR para Clientes</h4>
        <p style="font-size:13px; color:#555; margin-bottom:8px;">Comparte este enlace o imprime el Código QR para que tus clientes agenden solos 24/7 sin pedir tus claves del sistema.</p>
        
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <input type="text" id="input-link-publico-reserva" value="${urlPublicaReserva}" readonly style="background: white; font-weight: bold; color: #333; margin:0; flex:1;">
          <button class="btn-success" style="width: auto; margin:0;" onclick="copiarLinkPublicoReservas()">📋 Copiar Link</button>
        </div>

        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px; border: 1px dashed #007bff;">
          <img src="${qrApiUrl}" alt="Código QR de Reserva" style="width: 150px; height: 150px; border-radius: 4px; display:block; margin:auto;">
          <button class="btn-warning" style="width: auto; padding: 6px 15px; margin-top: 8px; font-size:12px;" onclick="descargarQRCreado('${raizNegocio}')">📥 Descargar QR para Imprimir (PNG)</button>
        </div>
      </div>

      <!-- PANEL CREAR PROFESIONAL (SOLO ADMIN) -->
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
        <h4 style="margin-top:0; color:#385723;">⏰ Control de Horarios y Disponibilidad (Estilo Alarma)</h4>
        <div id="resumen-horarios-profesional" style="font-size: 14px;">Selecciona un profesional para ver su jornada.</div>
      </div>

      <div style="background: #eef5fc; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <h4>📝 Registrar Cita Manual</h4>
        <input type="text" id="cita-cliente-nombre" placeholder="Nombre del cliente">
        <input type="text" id="cita-cliente-tel" placeholder="Teléfono / WhatsApp">
        <div class="grid" style="gap: 5px;">
          <div><label><small>Hora de Cita:</small></label><input type="time" id="cita-hora-inicio"></div>
          <div><label><small>Duración (Opcional - min):</small></label><input type="number" id="cita-duracion" placeholder="Ej: 30" value="30"></div>
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

window.copiarLinkPublicoReservas = function() {
  const input = document.getElementById("input-link-publico-reserva");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    alert("📋 ¡Enlace público copiado al portapapeles!");
  });
}

window.descargarQRCreado = function(raizNegocio) {
  let urlPublicaReserva = `${window.location.origin}/reserva-cliente.html?biz=${raizNegocio}`;
  let qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(urlPublicaReserva)}`;
  
  const link = document.createElement('a');
  link.href = qrApiUrl;
  link.download = `QR_Reserva_${raizNegocio}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("📥 ¡Imagen QR de alta resolución descargada con éxito!");
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

  let horasOcupadas = filtradas.map(c => c.hora);
  let listaSlotsHTML = "";
  let horaInicioMinutos = convertirHoraAMinutos(hEntrada);
  let horaFinMinutos = convertirHoraAMinutos(hSalida);

  for (let m = horaInicioMinutos; m < horaFinMinutos; m += 30) {
    let horaStr = convertirMinutosAHoras(m);
    let ocupado = horasOcupadas.includes(horaStr);
    
    listaSlotsHTML += `
      <span style="display: inline-block; padding: 6px 10px; margin: 4px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${ocupado ? '#f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : '#d4edda; color: #155724; border: 1px solid #c3e6cb;'}" title="${ocupado ? 'Horario Ocupado' : 'Horario Disponible'}">
        ${horaStr} ${ocupado ? '❌' : '✅'}
      </span>`;
  }

  resumenBox.innerHTML = `
    👤 <strong>${profActual ? profActual.nombre : 'Profesional'}</strong> | 
    🕒 <strong>Jornada:</strong> ${hEntrada} a ${hSalida}<br>
    <div style="margin-top: 8px;"><strong>Estado de Bloques (Alarma / Agenda):</strong><br>${listaSlotsHTML}</div>
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
        <td>${c.duracion ? c.duracion + ' min' : '30 min'}</td>
        <td><button class="btn-danger" style="padding:4px;" onclick="cancelarCita(${c.id})">Cancelar</button></td>
      </tr>`;
  });
}

function convertirHoraAMinutos(horaStr) {
  let partes = horaStr.split(":");
  return parseInt(partes[0]) * 60 + parseInt(partes[1]);
}

function convertirMinutosAHoras(minTotales) {
  let h = Math.floor(minTotales / 60).toString().padStart(2, '0');
  let m = (minTotales % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

window.agendarNuevaCita = async function() {
  const personalId = document.getElementById("select-agenda-personal").value;
  const fecha = document.getElementById("cita-fecha").value;
  const cliente = document.getElementById("cita-cliente-nombre").value.trim();
  const tel = document.getElementById("cita-cliente-tel").value.trim();
  const hora = document.getElementById("cita-hora-inicio").value;
  const duracion = parseInt(document.getElementById("cita-duracion").value) || 30;

  if (!cliente || !hora) return alert("Ingresa el nombre del cliente y la hora de la cita.");
  
  let citas = await getCitasRegistradas();
  let solapada = citas.some(c => c.personalId === personalId && c.fecha === fecha && c.hora === hora);
  
  if (solapada) {
    return alert("⚠️ Alerta de Sistema: Este horario ya se encuentra ocupado (como una alarma activa). Selecciona otra hora disponible.");
  }

  citas.push({ id: Date.now(), personalId, fecha, cliente, tel, hora, duracion });
  await saveCitasRegistradas(citas);
  
  await registrarTransaccionDiaria(currentAccountKey, "CITA RESERVADA", `Cita agendada para ${cliente} a las ${hora}`, 0);
  window.cargarHorariosDisponibles();
  alert("🎉 Cita agendada correctamente sin solapamiento.");
}

window.cancelarCita = async function(id) {
  let citas = await getCitasRegistradas();
  citas = citas.filter(c => c.id !== id);
  await saveCitasRegistradas(citas);
  window.cargarHorariosDisponibles();
}