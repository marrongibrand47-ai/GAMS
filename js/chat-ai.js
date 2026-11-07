window.renderChatAI = function() {
  const container = document.getElementById("chat-ai-container");
  if (!container) return;
  container.innerHTML = `
    <button class="gams-ai-chat-btn" onclick="toggleGamsAIChat()" title="Asistente Michael GAMS">🤖</button>
    <div id="gams-ai-chat-window" class="gams-ai-chat-window hidden">
      <div class="gams-ai-chat-header">
        <span>🤖 Michael - GAMS</span>
        <button style="background:none; border:none; color:white; font-size:16px; cursor:pointer;" onclick="toggleGamsAIChat()">✖</button>
      </div>
      <div id="gams-ai-chat-body" class="gams-ai-chat-body">
        <div class="gams-ai-msg assistant">¡Hola! Soy Michael, tu asistente interactivo de <strong>GAMS Company</strong>. ¿En qué puedo ayudarte hoy?</div>
      </div>
      <div style="padding: 6px 10px; background: #e9ecef; display: flex; gap: 4px; flex-wrap: wrap; border-top: 1px solid #ced4da;">
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #007bff;" onclick="preguntaRapida('Ver Precios y Paquetes')">💵 Precios</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #28a745;" onclick="preguntaRapida('Asesoramiento Contable')">📊 Contabilidad</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #ffc107; color: #212529;" onclick="preguntaRapida('Instrucciones de Uso')">❓ Ayuda/Pasos</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #dc3545;" onclick="preguntaRapida('Soporte Técnico')">📞 Soporte</button>
      </div>
      <div class="gams-ai-chat-footer" style="padding:10px; display:flex; gap:5px; background:#fff; border-top:1px solid #ccc;">
        <input type="text" id="gams-ai-input" placeholder="Escribe tu consulta..." onkeypress="if(event.key === 'Enter') enviarPreguntaGamsAI()">
        <button class="btn-success" style="width:auto; margin:0;" onclick="enviarPreguntaGamsAI()">Enviar</button>
      </div>
    </div>
  `;
}

window.toggleGamsAIChat = function() {
  document.getElementById("gams-ai-chat-window").classList.toggle("hidden");
}

window.preguntaRapida = function(texto) {
  document.getElementById("gams-ai-input").value = texto;
  enviarPreguntaGamsAI();
}

window.enviarPreguntaGamsAI = async function() {
  const inp = document.getElementById("gams-ai-input");
  const body = document.getElementById("gams-ai-chat-body");
  const textoOriginal = inp.value.trim();
  const txt = textoOriginal.toLowerCase();
  if (!textoOriginal) return;

  body.innerHTML += `<div class="gams-ai-msg user">${escapeHtml(textoOriginal)}</div>`;
  inp.value = "";
  body.scrollTop = body.scrollHeight;

  let rolActual = window.userRole || "EMPLEADO"; 

  // Restricción de cuentas ajenas
  if (["otra cuenta", "otro negocio", "cuanto vende", "datos de la empresa", "ver comercios"].some(p => txt.includes(p)) && rolActual !== "SUPERVISOR") {
    body.innerHTML += `<div class="gams-ai-msg assistant">⛔ **Acceso Denegado:** Esta información está clasificada o la cuenta no tiene los permisos suficientes.</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  // Restricción de reportes gerenciales para empleados
  if (rolActual.includes("EMPLEADO") && ["reporte de ventas", "ganancias totales", "balance general"].some(p => txt.includes(p))) {
    body.innerHTML += `<div class="gams-ai-msg assistant">🔒 **Permiso Insuficiente:** Como empleado, solo tienes acceso a funciones operativas.</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  let respuestaPredeterminada = "";
  if (txt.includes("precio") || txt.includes("costo") || txt.includes("paquete")) {
    respuestaPredeterminada = `💵 <strong>Precios GAMS:</strong> Inventario ($15), Hotelería ($25), Agendas ($25). Combos: 2 módulos ($35-$40), Full Suite ($50). Incluye análisis BI (máx. 1 vez por semana).`;
  } else if (txt.includes("contab") || txt.includes("asesoram")) {
    respuestaPredeterminada = `💼 <strong>Asesoramiento Contable:</strong> Disponible para inventario. Precio negociable según el establecimiento y volumen de operaciones.`;
  } else if (txt.includes("como agregar") || txt.includes("crear") || txt.includes("pasos")) {
    if (rolActual.includes("EMPLEADO")) {
      respuestaPredeterminada = `🔒 **Restringido:** Los empleados no tienen permisos para crear productos o cuartos. Función exclusiva de Administradores.`;
    } else if (txt.includes("producto")) {
      respuestaPredeterminada = `📦 <strong>Agregar Producto:</strong> Ve a Módulo Comercio > Formulario inferior ("Registrar Elemento") > Rellena los datos y guarda.`;
    } else if (txt.includes("cuarto")) {
      respuestaPredeterminada = `🏨 <strong>Registrar Cuarto:</strong> Ve a Módulo Hotel > Sección final > Ingresa código, tarifas y guarda.`;
    } else {
      respuestaPredeterminada = `📅 <strong>Agendar Cita:</strong> Ve a Módulo Citas > Selecciona barbero y fecha > Completa datos y confirma.`;
    }
  } else if (txt.includes("soporte") || txt.includes("telefono")) {
    respuestaPredeterminada = `📞 <strong>Soporte Técnico GAMS:</strong> Comunícate con Gibrand Marron al <strong>+58 4242015806</strong>.`;
  }

  if (respuestaPredeterminada) {
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(respuestaPredeterminada)}</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  const loadingId = "ai-load-" + Date.now();
  body.innerHTML += `<div id="${loadingId}" class="gams-ai-msg assistant"><em>Michael está procesando...</em></div>`;
  body.scrollTop = body.scrollHeight;

  try {
    const res = await fetch('https://gibrand-digital-cores.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `[Rol: ${rolActual}] Consulta: ${textoOriginal}`, device: 'GAMS Netlify' })
    });
    const data = await res.json();
    document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(data.response || "Soporte Técnico (Gibrand Marron): +58 4242015806")}</div>`;
  } catch (e) {
    if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">Contacta a Soporte Técnico (Gibrand Marron): <strong>+58 4242015806</strong>.</div>`;
  }
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}