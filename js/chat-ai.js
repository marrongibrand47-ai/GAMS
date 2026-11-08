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
  let tratamiento = "Invitado / Emprendedor";
  
  if (rol === "SUPERVISOR") {
    tratamiento = "Gibrand";
  } else if (rol === "ADMIN") {
    tratamiento = "Jefe";
  } else if (rol === "EMPLEADO") {
    tratamiento = "Empleado";
  }
  
  if (!rol) return;
  
  saludoBox.innerHTML = `¡Hola <strong>${tratamiento}</strong>! Soy Michael, tu asistente interactivo de <strong>GAMS</strong>. ¿En qué puedo ayudarte hoy?`;
}

window.mostrarMensajeBienvenidaReferido = function(refCode) {
  const body = document.getElementById("gams-ai-chat-body");
  if (!body) return;

  const mensajeBienvenida = `
👋 ¡Hola! Te doy la bienvenida a <strong>GAMS Company</strong> (Código de Referido: <code>${refCode}</code>). Soy <strong>Michael</strong>, tu asistente virtual inteligente.

💵 <strong>Precios Oficiales de los Módulos GAMS:</strong>
• 📦 Módulo de Inventario / Comercio: <strong>$15 USD</strong>
• 🏨 Módulo de Hotelería: <strong>$25 USD</strong>
• 📅 Módulo de Citas y Agendas: <strong>$25 USD</strong>

🔑 <strong>¿Cómo funcionan las cuentas y claves en GAMS?</strong>
Al registrar tu negocio, te entregamos <strong>dos claves independientes</strong>:
1. 👑 **Clave de Administrador (Jefe):** Acceso gerencial total. Permite modificar tasas, crear productos/cuartos, ver reportes de ventas y configurar precios.
2. 👨‍💻 **Clave de Empleado:** Acceso operativo. Permite usar el POS, procesar ventas o registrar citas, bloqueando la configuración de tasas y reportes financieros globales.

📞 <strong>Soporte Técnico y Atención Directa:</strong>
¿Tienes dudas o deseas adquirir tu licencia? Escríbenos por WhatsApp o Instagram:
• 👤 <strong>Dueño:</strong> Gibrand Marron
• 📱 <strong>WhatsApp:</strong> <a href="https://wa.me/584242015806" target="_blank" style="color:#007bff; font-weight:bold;">+58 4242015806</a>
• 📸 <strong>Instagram:</strong> <a href="https://instagram.com/gibrand_x" target="_blank" style="color:#007bff; font-weight:bold;">@gibrand_x</a>

📸 <strong>Escanea nuestro Código QR oficial de Instagram:</strong>
<div style="text-align:center; margin-top:10px;">
  <img src="gibrand_x_qr.jpg" alt="QR Instagram gibrand_x" style="width: 130px; height: 130px; border-radius: 8px; border: 2px solid #007bff; object-fit: cover;">
  <p style="font-size:11px; margin-top:4px; color:#555;">@gibrand_x</p>
</div>

Escribe tu consulta o presiona los botones de abajo para comenzar.
  `;

  body.innerHTML = `<div class="gams-ai-msg assistant">${marked.parse(mensajeBienvenida)}</div>`;
  body.scrollTop = body.scrollHeight;
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
  } else if (txt.includes("precio") || txt.includes("costo") || txt.includes("paquete")) {
    respuestaPredeterminada = `💵 <strong>Precios GAMS:</strong> Inventario ($15), Hotelería ($25), Citas ($25). Combos y Full Suite disponibles.`;
  } else if (txt.includes("soporte") || txt.includes("telefono") || txt.includes("contacto") || txt.includes("instagram")) {
    respuestaPredeterminada = `
📞 <strong>Soporte Técnico GAMS - Gibrand Marron:</strong>
Escríbenos por WhatsApp o Instagram:
• 📱 WhatsApp: <a href="https://wa.me/584242015806" target="_blank">+58 4242015806</a>
• 📸 Instagram: <a href="https://instagram.com/gibrand_x" target="_blank">@gibrand_x</a>
    `;
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
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(data.response || "Soporte Técnico (Gibrand Marron - @gibrand_x): +58 4242015806")}</div>`;
  } catch (e) {
    if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">Comunícate con Soporte Técnico (Gibrand Marron): <strong>+58 4242015806</strong> o Instagram <strong>@gibrand_x</strong>.</div>`;
  }
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}