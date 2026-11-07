// WIDGET FLOTANTE DE CHAT DE IA MICHAEL GAMS COMPANY (Con Restricción de Roles)
window.renderChatAI = function() {
  const container = document.getElementById("chat-ai-container");
  container.innerHTML = `
    <button class="gams-ai-chat-btn" onclick="toggleGamsAIChat()" title="Asistente Michael GAMS">🤖</button>
    <div id="gams-ai-chat-window" class="gams-ai-chat-window hidden">
      <div class="gams-ai-chat-header">
        <span>🤖 Michael - GAMS</span>
        <button style="background:none; border:none; color:white; font-size:16px; cursor:pointer;" onclick="toggleGamsAIChat()">✖</button>
      </div>
      <div id="gams-ai-chat-body" class="gams-ai-chat-body">
        <div class="gams-ai-msg assistant">
          ¡Hola! Soy Michael, tu asistente interactivo de <strong>GAMS Company</strong>. ¿En qué puedo ayudarte hoy?
        </div>
      </div>
      
      <!-- BOTONES DE ACCESO RÁPIDO -->
      <div style="padding: 6px 10px; background: #e9ecef; display: flex; gap: 4px; flex-wrap: wrap; border-top: 1px solid #ced4da;">
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #007bff;" onclick="preguntaRapida('Ver Precios y Paquetes')">💵 Precios</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #28a745;" onclick="preguntaRapida('Asesoramiento Contable')">📊 Contabilidad</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #ffc107; color: #212529;" onclick="preguntaRapida('Instrucciones de Uso')">❓ Ayuda/Pasos</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #dc3545;" onclick="preguntaRapida('Soporte Técnico')">📞 Soporte</button>
      </div>

      <div class="gams-ai-chat-footer" style="padding:10px; display:flex; gap:5px; background:#fff; border-top:1px solid #ccc;">
        <input type="text" id="gams-ai-input" placeholder="Escribe tu consulta aquí..." onkeypress="if(event.key === 'Enter') enviarPreguntaGamsAI()">
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

  // =========================================================================
  // CONTROL DE PERMISOS Y SEGURIDAD POR ROLES (RBAC)
  // =========================================================================
  // userRole global viene de core.js ("SUPERVISOR", "ADMIN_HOTEL", "EMPLEADO_HOTEL", etc.)
  let rolActual = window.userRole || "EMPLEADO"; 

  // Detectar si intentan espiar o pedir información de OTRA cuenta o datos globales sin ser Supervisor
  const palabrasPreguntaAjena = ["otra cuenta", "otro negocio", "cuanto vende el hotel", "cuantas ventas tiene", "datos de la empresa", "ver comercios", "todas las cuentas"];
  const esIntentoEspionaje = palabrasPreguntaAjena.some(p => txt.includes(p));

  if (esIntentoEspionaje && rolActual !== "SUPERVISOR") {
    let respuestaRestringida = "⛔ **Acceso Denegado:** Esta información está clasificada o la cuenta no tiene los permisos suficientes para pedir esa información.";
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(respuestaRestringida)}</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  // Si un empleado intenta pedir métricas generales o financieras avanzadas del negocio
  const esPreguntaAdminOGlobal = ["cuantos clientes ve", "reporte de ventas", "ganancias totales", "balance general", "auditoria"];
  const esEmpleado = rolActual.includes("EMPLEADO");

  if (esEmpleado && esPreguntaAdminOGlobal.some(p => txt.includes(p))) {
    let respuestaEmpleado = "🔒 **Permiso Insuficiente:** Como empleado, solo tienes acceso a las funciones operativas de tu puesto (inventario, check-in, citas). No estás autorizado para visualizar métricas globales o reportes comerciales.";
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(respuestaEmpleado)}</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  // =========================================================================
  // RESPUESTAS PREDETERMINADAS LOCALES (PRECIOS, CONTABILIDAD, PASOS)
  // =========================================================================
  let respuestaPredeterminada = "";

  if (txt.includes("precio") || txt.includes("cuanto cuesta") || txt.includes("costo") || txt.includes("paquete")) {
    respuestaPredeterminada = `
💵 <strong>Precios y Paquetes Oficiales de GAMS Company:</strong>
• 📦 Inventario/Comercio: $15/mes | 🏨 Hotelería: $25/mes | 📅 Citas: $25/mes
• 🎁 <strong>Combos:</strong> 2 Módulos ($35-$40) | Full Suite (Los 3): $50/mes
• 📈 Incluye Análisis BI (Límite: 1 solicitud por semana).
    `;
  } else if (txt.includes("contab") || txt.includes("asesoram") || txt.includes("seguimiento")) {
    respuestaPredeterminada = `
💼 <strong>Asesoramiento Contable:</strong> Disponible para el módulo de inventario. Precio negociable según el establecimiento, volumen de operaciones y cantidad de productos.
    `;
  } else if (txt.includes("como agregar") || txt.includes("crear") || txt.includes("pasos") || txt.includes("como hago")) {
    if (txt.includes("producto") || txt.includes("inventario")) {
      respuestaPredeterminada = `📦 <strong>Agregar Producto:</strong> Ve a Módulo Comercio > Formulario inferior ("Registrar Elemento") > Ingresa SKU, Nombre, Stock, Precio y haz clic en Guardar.`;
    } else if (txt.includes("cuarto") || txt.includes("habitacion")) {
      respuestaPredeterminada = `🏨 <strong>Registrar Cuarto:</strong> Ve a Módulo Hotel > Sección final > Ingresa código del cuarto, comodidades, tarifas y guarda el elemento.`;
    } else if (txt.includes("cita")) {
      respuestaPredeterminada = `📅 <strong>Agendar Cita:</strong> Ve a Módulo Citas > Selecciona barbero y fecha > Rellena datos del cliente y hora > Haz clic en Confirmar Cita.`;
    } else {
      respuestaPredeterminada = `❓ Guía rápida: Utiliza los menús superiores para cambiar entre módulos y los formularios inferiores para registrar elementos.`;
    }
  } else if (txt.includes("soporte") || txt.includes("telefono") || txt.includes("contacto")) {
    respuestaPredeterminada = `📞 <strong>Soporte Técnico GAMS:</strong> Comunícate al <strong>+58 4242015806</strong> (Gibrand Marrero).`;
  }

  if (respuestaPredeterminada) {
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(respuestaPredeterminada)}</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  // =========================================================================
  // CONSULTA A LA IA CON RESTRICCIONES DE RANGO EN EL PROMPT
  // =========================================================================
  const loadingId = "ai-load-" + Date.now();
  body.innerHTML += `<div id="${loadingId}" class="gams-ai-msg assistant"><em>Michael está procesando...</em></div>`;
  body.scrollTop = body.scrollHeight;

  const promptContexto = `
[CONTROL DE SEGURIDAD GAMS]:
- Rol del usuario actual: ${rolActual}
- REGLA ESTRICTA: Si el rol es EMPLEADO, no puede dar información de finanzas globales o métricas de clientes totales. Si el rol es ADMIN, solo puede responder sobre su cuenta asignada y jamás sobre otros negocios o cuentas ajenas. Si intentan indagar en cuentas ajenas o datos prohibidos, responde exactamente: "Esta información está clasificada o la cuenta no tiene los permisos suficientes para pedir esa información."

Consulta: ${textoOriginal}
  `;

  try {
    const res = await fetch('https://gibrand-digital-cores.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptContexto, device: 'GAMS Netlify Widget' })
    });
    const data = await res.json();
    document.getElementById(loadingId).remove();

    if (data.error) {
      body.innerHTML += `<div class="gams-ai-msg assistant">Para asistencia directa contacta a Soporte Técnico: <strong>+58 4242015806</strong>.</div>`;
    } else {
      body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(data.response)}</div>`;
    }
  } catch (e) {
    if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">Error de conexión. Contacta a Soporte Técnico: <strong>+58 4242015806</strong>.</div>`;
  }
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}