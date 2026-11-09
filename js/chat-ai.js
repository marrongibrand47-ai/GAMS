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
          ¡Hola! Soy <strong>Michael</strong>, tu asistente virtual en GAMS Company. ¿En qué puedo ayudarte hoy?
        </div>
      </div>
      
      <!-- BOTONES DE MENSAJE RÁPIDO RESTAURADOS -->
      <div style="padding: 6px 10px; background: #f1f3f5; display: flex; gap: 5px; flex-wrap: wrap; border-top: 1px solid #ced4da;">
        <button onclick="enviarMensajeRapido('¿Cuáles son los precios y combos?')" style="font-size:11px; padding:6px 8px; flex:1; min-width:80px; background:#007bff; color:white; border-radius:4px; border:none; cursor:pointer;">💰 Precios</button>
        <button onclick="enviarMensajeRapido('Necesito soporte técnico')" style="font-size:11px; padding:6px 8px; flex:1; min-width:80px; background:#6c757d; color:white; border-radius:4px; border:none; cursor:pointer;">🛠️ Soporte</button>
        <button onclick="enviarMensajeRapido('¿Cómo crear productos?')" style="font-size:11px; padding:6px 8px; flex:1; min-width:80px; background:#28a745; color:white; border-radius:4px; border:none; cursor:pointer;">📦 Crear Prod.</button>
        <button onclick="enviarMensajeRapido('¿Cómo registrar cuartos?')" style="font-size:11px; padding:6px 8px; flex:1; min-width:80px; background:#17a2b8; color:white; border-radius:4px; border:none; cursor:pointer;">🏨 Registrar Cuartos</button>
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

window.enviarMensajeRapido = function(texto) {
  const input = document.getElementById("gams-ai-input");
  if (input) {
    input.value = texto;
    enviarMensajeMichael();
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
    • Módulo de <strong>Análisis BI y Recomendaciones Ejecutivas</strong> para tomar decisiones estratégicas de ventas y stock.<br><br>
    📞 <em>Para más información o contrataciones personalizadas, por favor contacte al soporte técnico oficial de GAMS Company.</em>`;
  }

  if (p.includes("soporte") || p.includes("tecnico") || p.includes("ayuda") || p.includes("contacto")) {
    return `🛠️ <strong>Soporte Técnico GAMS Company:</strong><br>
    Nuestro equipo de soporte técnico está disponible para asistirte con la configuración de tus terminales POS físicos, respaldos en Firebase, sincronización de sucursales y auditorías contables.<br><br>
    📞 <em>Para atención directa y personalizada, por favor contacta al soporte técnico oficial de GAMS Company.</em>`;
  }

  if (p.includes("producto") || p.includes("crear prod") || p.includes("inventario")) {
    return `📦 <strong>Cómo Crear Productos (Inventario / Comercio):</strong><br>
    1. Ve al módulo de <strong>Comercio</strong> y selecciona la pestaña <strong>Inventario</strong>.<br>
    2. Baja al formulario inferior titulado <em>"1. Registrar Elemento en el Sistema"</em>.<br>
    3. Ingresa el código SKU, nombre, stock inicial, precio en Bolívares o Dólares (se convierte automáticamente a USD) y opcionalmente la URL de la imagen.<br>
    4. Haz clic en <strong>Guardar Elemento</strong>.<br><br>
    📞 <em>¿Dudas adicionales? Contacta al soporte técnico de GAMS Company.</em>`;
  }

  if (p.includes("cuarto") || p.includes("hotel") || p.includes("registrar cuartos")) {
    return `🏨 <strong>Cómo Registrar Cuartos (Módulo Hotelería):</strong><br>
    1. Activa el módulo de <strong>Hotelería</strong> desde la barra superior.<br>
    2. Dirígete al formulario inferior de registro.<br>
    3. Ingresa el número o código de cuarto (SKU), nombre, cantidad de camas, baños, comodidades y las tarifas en Bolívares (1h, 3h, Noche, Día, Semana) las cuales el sistema convertirá automáticamente a USD.<br>
    4. Haz clic en <strong>Guardar Elemento</strong>.<br><br>
    📞 <em>¿Necesitas asistencia? Contacta al soporte técnico oficial de GAMS Company.</em>`;
  }

  if (p.includes("contable") || p.includes("asesoramiento") || p.includes("bi") || p.includes("analisis") || p.includes("recomendacion")) {
    return `📈 <strong>Asesoramiento Contable y Análisis BI en GAMS:</strong><br>
    Nuestra plataforma integra herramientas de análisis de datos para evaluar las ventas en tiempo real, generar reportes en PDF, calcular automáticamente impuestos (IVA 16%) y ofrecer recomendaciones ejecutivas personalizadas.<br><br>
    📞 <em>Para consultas contables avanzadas, contacte al soporte técnico oficial de GAMS Company.</em>`;
  }

  return `🤖 ¡Hola! Soy Michael, tu asistente inteligente en GAMS Company. Utiliza los botones de acceso rápido arriba o pregúntame sobre precios ($20-$75), soporte técnico, creación de productos o registro de cuartos.<br><br>
  📞 <em>Para más información o contrataciones personalizadas, contacte al soporte técnico oficial de GAMS Company.</em>`;
}