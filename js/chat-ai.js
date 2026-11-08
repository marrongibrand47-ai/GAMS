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
      
      <div style="padding: 6px 10px; background: #e9ecef; display: flex; gap: 4px; flex-wrap: wrap; border-top: 1px solid #ced4da;">
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #007bff;" onclick="preguntaRapida('Cómo crear un producto')">📦 Crear Producto</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #28a745;" onclick="preguntaRapida('Cómo registrar un cuarto')">🛏️ Registrar Cuarto</button>
        <button type="button" style="padding: 4px 8px; font-size: 11px; width: auto; margin: 0; background: #ffc107; color: #212529;" onclick="preguntaRapida('Precios')">💵 Precios</button>
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
  if (rol === "SUPERVISOR") tratamiento = "Gibrand";
  else if (rol === "ADMIN") tratamiento = "Jefe";
  else if (rol === "EMPLEADO" || rol === "EMPLEADO_EXTRA") tratamiento = "Empleado";
  
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

  let respuestaPredeterminada = "";

  if (txt.includes("producto") || txt.includes("inventario") || txt.includes("crear producto")) {
    respuestaPredeterminada = `
📦 <strong>Cómo registrar un nuevo producto en Comercio:</strong>
1. Desliza hacia abajo en la pantalla hasta la sección <strong>"Registrar Elemento en el Sistema"</strong>.
2. Rellena los cuadros vacíos (que inician limpios con sus textos guía):
   • <strong>Código / SKU / ID único:</strong> (Puedes registrar varios productos con el mismo nombre pero diferente SKU).
   • <strong>Nombre / Descripción:</strong> El nombre del artículo.
   • <strong>Stock Inicial:</strong> Unidades disponibles.
   • <strong>Precio en Bolívares (Bs):</strong> Ingresa el precio en moneda nacional; el sistema calculará automáticamente el equivalente en dólares en el recuadro inferior.
3. Haz clic en <strong>Guardar Elemento</strong>.
    `;
  } else if (txt.includes("cuarto") || txt.includes("hotel") || txt.includes("habitacion")) {
    respuestaPredeterminada = `
🛏️ <strong>Cómo registrar un nuevo cuarto en Hotelería:</strong>
1. Desliza hacia abajo hasta la sección <strong>"Registrar Elemento en el Sistema"</strong>.
2. Rellena los campos vacíos:
   • <strong>Código / SKU / ID único:</strong> Número o identificador del cuarto.
   • <strong>Nombre / Descripción:</strong> Ejemplo: "Habitación Doble VIP".
   • <strong>Camas y Baños:</strong> Cantidad de camas y baños.
   • <strong>Tarifas en Bolívares (Bs):</strong> Ingresa las tarifas por hora, noche o día en moneda nacional. El sistema calculará el equivalente en dólares en tiempo real.
3. Haz clic en <strong>Guardar Elemento</strong>.
    `;
  } else if (txt.includes("precio") || txt.includes("costo") || txt.includes("combo")) {
    respuestaPredeterminada = `💵 <strong>Precios GAMS:</strong> Primer mes gratis. Comercio ($20), Hotelería ($35), Citas ($30 con Portal QR). Empleado extra (+$5). Combo Comercio+Citas ($40) y Plan VIP Total ($65).`;
  } else if (txt.includes("soporte") || txt.includes("telefono") || txt.includes("instagram")) {
    respuestaPredeterminada = `
📞 <strong>Soporte Técnico GAMS - Gibrand Marron:</strong>
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
      body: JSON.stringify({ prompt: `Consulta: ${textoOriginal}`, device: 'GAMS' })
    });
    const data = await res.json();
    document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">${marked.parse(data.response || "Comunícate con Soporte Técnico (Gibrand Marron - @gibrand_x): +58 4242015806")}</div>`;
  } catch (e) {
    if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
    body.innerHTML += `<div class="gams-ai-msg assistant">Comunícate con Soporte Técnico (Gibrand Marron): <strong>+58 4242015806</strong> o Instagram <strong>@gibrand_x</strong>.</div>`;
  }
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}