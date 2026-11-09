let chatOpen = false;

window.renderChatAI = function() {
  const container = document.getElementById("chat-ai-container");
  if (!container) return;
  container.innerHTML = `
    <button class="gams-ai-chat-btn" onclick="toggleGamsAIChat()" title="Asistente IA Michael">🤖</button>
    <div id="gams-ai-chat-window" class="gams-ai-chat-window hidden">
      <div class="gams-ai-chat-header">
        <span>🤖 Asistente IA - Michael (GAMS)</span>
        <button onclick="toggleGamsAIChat()" style="background:none; border:none; color:white; font-size:16px; cursor:pointer;">✕</button>
      </div>
      <div id="gams-ai-chat-body" class="gams-ai-chat-body">
        <div class="gams-ai-msg assistant">
          ¡Hola! Soy <strong>Michael</strong>, tu asistente de inteligencia artificial en GAMS Company. ¿En qué puedo ayudarte hoy sobre nuestros módulos, precios, combos, soporte contable o recomendaciones BI?
        </div>
      </div>
      <div style="padding: 10px; background: white; border-top: 1px solid #ced4da; display: flex; gap: 6px;">
        <input type="text" id="gams-ai-input" placeholder="Escribe tu consulta a Michael..." onkeypress="if(event.key === 'Enter') enviarMensajeMichael()" style="margin:0; flex:1; font-size:14px;">
        <button onclick="enviarMensajeMichael()" style="width: auto; padding: 0 14px; font-size: 14px;">Enviar</button>
      </div>
    </div>
  `;
}

window.toggleGamsAIChat = function() {
  chatOpen = !chatOpen;
  const win = document.getElementById("gams-ai-chat-window");
  if (win) {
    if (chatOpen) win.classList.remove("hidden");
    else win.classList.add("hidden");
  }
}

window.enviarMensajeMichael = async function() {
  const input = document.getElementById("gams-ai-input");
  const body = document.getElementById("gams-ai-chat-body");
  if (!input || !body) return;
  const txt = input.value.trim();
  if (!txt) return;

  body.innerHTML += `<div class="gams-ai-msg user">${txt}</div>`;
  input.value = "";
  body.scrollTop = body.scrollHeight;

  let respuesta = generarRespuestaMichael(txt);
  
  setTimeout(() => {
    body.innerHTML += `<div class="gams-ai-msg assistant">${respuesta}</div>`;
    body.scrollTop = body.scrollHeight;
  }, 400);
}

function generarRespuestaMichael(pregunta) {
  const p = pregunta.toLowerCase();

  if (p.includes("precio") || p.includes("costo") || p.includes("cuanto") || p.includes("combo") || p.includes("plan") || p.includes("modul")) {
    return `💰 <strong>Estructura de Precios y Combos Oficiales de GAMS Company:</strong><br>
    <ul>
      <li>📦 <strong>Módulo de Comercio / Inventario:</strong> $20 USD / mes.</li>
      <li>📅 <strong>Módulo de Citas y Agendas:</strong> $30 USD / mes.</li>
      <li>🏨 <strong>Módulo de Hotelería:</strong> $35 USD / mes.</li>
      <li>🔗 <strong>Combo Comercio + Citas:</strong> $40 USD / mes.</li>
      <li>🚀 <strong>Combo Completo (3 Módulos):</strong> $75 USD / mes.</li>
      <li>👥 <strong>Recursos Adicionales (Empleados / POS Físicos):</strong> El 1.º adicional cuesta $10 USD/mes y los siguientes $5 USD/mes cada uno.</li>
    </ul>
    📊 <strong>Servicios Especiales y Asesoramiento Incluidos:</strong><br>
    • Asesoramiento contable automatizado con cálculo de IVA (16%) y Cuentas por Cobrar (CxC).<br>
    • Módulo de <strong>Análisis BI y Recomendaciones Ejecutivas</strong> para tomar decisiones estratégicas de ventas y stock.<br>
    • Programa de referidos con 50% de comisión para promotores.<br><br>
    📞 <em>Para más información, contrataciones personalizadas o soporte técnico oficial, por favor contacte al soporte técnico de GAMS Company.</em>`;
  }

  if (p.includes("contable") || p.includes("asesoramiento") || p.includes("bi") || p.includes("analisis") || p.includes("recomendacion")) {
    return `📈 <strong>Asesoramiento Contable y Análisis BI en GAMS:</strong><br>
    Nuestra plataforma integra herramientas de análisis de datos para evaluar las ventas en tiempo real, generar reportes en PDF, calcular automáticamente impuestos (IVA 16%) y ofrecer recomendaciones ejecutivas personalizadas para impulsar la rentabilidad de tu negocio.<br><br>
    📞 <em>Para consultas contables avanzadas o configuración de reportes, por favor contacte al soporte técnico oficial de GAMS Company.</em>`;
  }

  return `🤖 ¡Hola! Soy Michael, tu asistente inteligente en GAMS Company. Puedo asesorarte sobre nuestros módulos ($20 Comercio, $30 Citas, $35 Hotel, Combo 2 Módulos $40, Combo Completo $75), la gestión contable con IVA/CxC y nuestro sistema BI.<br><br>
  📞 <em>Para más información o contrataciones personalizadas, por favor contacte al soporte técnico oficial de GAMS Company.</em>`;
}