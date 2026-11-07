window.renderChatAI = function() {
  const container = document.getElementById("chat-ai-container");
  if (!container) return;
  container.innerHTML = `
    <button class="gams-ai-chat-btn" onclick="toggleGamsAIChat()" title="Asistente GAMS">🤖</button>
    <div id="gams-ai-chat-window" class="gams-ai-chat-window hidden">
      <div class="gams-ai-chat-header">
        <span>🤖 Michael - GAMS</span>
        <button style="background:none; border:none; color:white; font-size:16px; cursor:pointer;" onclick="toggleGamsAIChat()">✖</button>
      </div>
      <div id="gams-ai-chat-body" class="gams-ai-chat-body">
        <div class="gams-ai-msg assistant" id="gams-saludo-inicial">¡Hola! Soy Michael, tu asistente interactivo de <strong>GAMS</strong>. ¿En qué puedo ayudarte hoy?</div>
      </div>
      
      <!-- BOTONES DE ACCESO RÁPIDO -->
      <div style="padding: 6px 10px; background: #e9ecef; display: flex; gap: 4px; flex-wrap: wrap; border-top: 1px solid #ced4da;">
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #007bff;" onclick="preguntaRapida('Ver Precios')">💵 Precios</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #28a745;" onclick="preguntaRapida('Asesoramiento Contable')">📊 Contabilidad</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #ffc107; color: #212529;" onclick="preguntaRapida('Ayuda')">❓ Ayuda</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #dc3545;" onclick="preguntaRapida('Soporte Técnico')">📞 Soporte</button>
      </div>

      <div class="gams-ai-chat-footer" style="padding:10px; display:flex; gap:5px; background:#fff; border-top:1px solid #ccc;">
        <input type="text" id="gams-ai-input" placeholder="Escribe tu consulta..." onkeypress="if(event.key === 'Enter') enviarPreguntaGamsAI()">
        <button class="btn-success" style="width:auto; margin:0;" onclick="enviarPreguntaGamsAI()">Enviar</button>
      </div>
    </div>
  `;
  actualizarSaludoSegunRol();
}

window.toggleGamsAIChat = function() {
  document.getElementById("gams-ai-chat-window").classList.toggle("hidden");
  actualizarSaludoSegunRol();
}

window.preguntaRapida = function(texto) {
  document.getElementById("gams-ai-input").value = texto;
  enviarPreguntaGamsAI();
}

function actualizarSaludoSegunRol() {
  const saludoBox = document.getElementById("gams-saludo-inicial");
  if (!saludoBox) return;
  
  let rol = (window.userRole || "").trim().toUpperCase();
  let tratamiento = "Empleado";
  
  if (rol === "SUPERVISOR") {
    tratamiento = "Gibrand";
  } else if (rol === "ADMIN") {
    tratamiento = "Jefe";
  } else {
    tratamiento = "Empleado";
  }
  
  saludoBox.innerHTML = `¡Hola <strong>${tratamiento}</strong>! Soy Michael, tu asistente interactivo de <strong>GAMS</strong>. ¿En qué puedo ayudarte hoy?`;
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

  let rolActual = (window.userRole || "").trim().toUpperCase();
  let esJefeOAdmin = rolActual === "SUPERVISOR" || rolActual === "ADMIN";

  if (["otra cuenta", "otro negocio", "cuanto vende", "datos de la empresa", "ver comercios"].some(p => txt.includes(p)) && rolActual !== "SUPERVISOR") {
    body.innerHTML += `<div class="gams-ai-msg assistant">⛔ **Acceso Denegado:** Esta información está clasificada o la cuenta no tiene los permisos suficientes.</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  if (rolActual === "EMPLEADO" && ["reporte de ventas", "ganancias totales", "balance general"].some(p => txt.includes(p))) {
    body.innerHTML += `<div class="gams-ai-msg assistant">🔒 **Permiso Insuficiente:** Como empleado, solo tienes acceso a funciones operativas.</div>`;
    body.scrollTop = body.scrollHeight;
    return;
  }

  let respuestaPredeterminada = "";

  if (txt.includes("carrito") || txt.includes("pos") || txt.includes("venta")) {
    respuestaPredeterminada = `
🛒 <strong>Uso del Carrito / POS:</strong>
1. Ve al <strong>Módulo Comercio</strong> > pestaña <strong>"🛒 POS & Carrito"</strong>.
2. Selecciona el producto y la cantidad deseada.
3. Haz clic en <strong>"➕ Agregar al Carrito"</strong>.
4. Presiona <strong>"💳 Procesar Venta"</strong> para descontar stock y registrar el movimiento.
    `;
  } else if (txt.includes("moneda") || txt.includes("dolar") || txt.includes("tasa")) {
    if (!esJefeOAdmin) {
      respuestaPredeterminada = `🔒 **Restringido:** Solo los Jefes y el Supervisor General pueden modificar las tasas de cambio de divisas.`;
    } else {
      respuestaPredeterminada = `
⚙️ <strong>Modificar Tasas de Cambio:</strong>
1. Haz clic en <strong>"⚙️ Establecer Tasas de Cambio del Negocio"</strong> arriba en la pantalla principal.
2. Actualiza los valores de Dólar, Euro o USDT y guarda los cambios.
      `;
    }
  } else if (txt.includes("como agregar") || txt.includes("crear") || txt.includes("pasos") || txt.includes("ayuda")) {
    if (!esJefeOAdmin && (txt.includes("producto") || txt.includes("cuarto"))) {
      respuestaPredeterminada = `🔒 **Restringido:** Los empleados no tienen permisos para crear productos o cuartos (función exclusiva de Jefes).`;
    } else if (txt.includes("producto")) {
      respuestaPredeterminada = `📦 <strong>Crear Producto:</strong> Ve al Módulo Comercio > sección inferior "Registrar Elemento" > Rellena los datos y guarda.`;
    } else if (txt.includes("cuarto")) {
      respuestaPredeterminada = `🏨 <strong>Registrar Cuarto:</strong> Ve al Módulo Hotel > sección inferior "Registrar Elemento" > Completa las tarifas y guarda.`;
    } else {
      respuestaPredeterminada = `❓ Guía rápida: Usa los menús superiores para cambiar de módulo y los formularios inferiores para registrar elementos.`;
    }
  } else if (txt.includes("precio") || txt.includes("costo") || txt.includes("paquete")) {
    respuestaPredeterminada = `💵 <strong>Precios GAMS:</strong> Inventario ($15), Hotelería ($25), Citas ($25). Combos y Full Suite disponibles.`;
  } else if (txt.includes("soporte") || txt.includes("telefono")) {
    respuestaPredeterminada = `📞 <strong>Soporte Técnico GAMS:</strong> Comunícate con <strong>Gibrand Marron</strong> al <strong>+58 4242015806</strong>.`;
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
      body: JSON.stringify({ prompt: `[Rol: ${rolActual}] Consulta: ${textoOriginal}`, device: 'GAMS' })
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