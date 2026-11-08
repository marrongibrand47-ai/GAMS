const hotelFirebaseConfig = {
  apiKey: "AIzaSyDRavKFUBrMVE5YZUXTuieTuOkUWz4JWyo",
  authDomain: "gams-hoteleria.firebaseapp.com",
  projectId: "gams-hoteleria",
  storageBucket: "gams-hoteleria.firebasestorage.app",
  messagingSenderId: "503951137385",
  appId: "1:503951137385:web:4a3e12968af81c9078a0f8",
  measurementId: "G-DSKQ9LWB2Y"
};

const oldFirebaseConfig = {
  apiKey: "AIzaSyDRavKFUBrMVE5YZUXTuieTuOkUWz4JWyo",
  authDomain: "gams-hoteleria.firebaseapp.com",
  projectId: "gams-hoteleria", 
  storageBucket: "gams-hoteleria.firebasestorage.app",
  messagingSenderId: "503951137385",
  appId: "1:503951137385:web:4a3e12968af81c9078a0f8",
  measurementId: "G-DSKQ9LWB2Y"
};

const appHotel = firebase.initializeApp(hotelFirebaseConfig, "appHotelInstance");
const appOld = firebase.initializeApp(oldFirebaseConfig, "appOldInstance");
const dbHotel = firebase.firestore(appHotel);
const dbOld = firebase.firestore(appOld);

let userRole = "";
let activeModule = "HOTEL"; 
let currentAccountKey = "hotel_mama1"; 
let negociosRegistry = [];
let chartSupervisorInstance = null;
const defaultImgPlaceholder = "https://cdn-icons-png.flaticon.com/512/679/679821.png";

function calcularFechaLicenciaUnMesDia4() {
  let d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(4);
  return d.toISOString().split('T')[0];
}

const defaultNegocios = [
  { id: "hotel_costa_real", bizName: "Hotel Costa Real", type: "Hotelería", dbTarget: "NUEVA", adminKey: "hotel_mama1", adminPass: "mama1", empKey: "hotel_empleado1", empPass: "empleado1", status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4() },
  { id: "comercio_abastos_gams", bizName: "Comercializadora & Abastos GAMS", type: "Inventario / Comercio", dbTarget: "VIEJA", adminKey: "comercio_comercio123", adminPass: "comercio123", empKey: "comercio_empleadocomercio123", empPass: "empleadocomercio123", status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4() }
];

function obtenerIdentificadorRaizNegocio(key) {
  let neg = negociosRegistry.find(n => n.adminKey === key || n.empKey === key);
  return neg ? neg.adminKey : key;
}

async function getDbForBusiness(accountKey) {
  let neg = negociosRegistry.find(n => n.adminKey === accountKey || n.empKey === accountKey);
  if (neg && neg.dbTarget === "VIEJA") return dbOld;
  return (activeModule === "HOTEL") ? dbHotel : (neg && neg.type === "Inventario / Comercio" ? dbOld : dbHotel);
}

async function getDbItems(key) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let localData = localStorage.getItem(`gams_items_${raizKey}`);
  if (!navigator.onLine) return localData ? JSON.parse(localData) : [];
  try {
    let activeDb = await getDbForBusiness(raizKey);
    let doc = await activeDb.collection((activeModule === "HOTEL") ? "hotelería" : "gams_db").doc((activeModule === "HOTEL") ? "hoteles" : raizKey).get();
    if (doc.exists) return doc.data().items || [];
  } catch(e) { if (localData) return JSON.parse(localData); }
  return localData ? JSON.parse(localData) : [];
}

async function saveDbItems(key, items) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  localStorage.setItem(`gams_items_${raizKey}`, JSON.stringify(items));
  if (!navigator.onLine) return;
  try {
    let activeDb = await getDbForBusiness(raizKey);
    if (activeModule === "HOTEL") {
      await activeDb.collection("hotelería").doc("hoteles").set({ hotel: "123", items }, { merge: true });
    } else {
      await activeDb.collection("gams_db").doc(raizKey).set({ tipo: "comercio", items }, { merge: true });
    }
  } catch(e) { console.error(e); }
}

async function getLibroDiario(key) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let localData = localStorage.getItem(`gams_diario_${raizKey}`);
  if (!navigator.onLine) return localData ? JSON.parse(localData) : [];
  try {
    let activeDb = await getDbForBusiness(raizKey);
    let doc = await activeDb.collection("gams_diario").doc(raizKey).get();
    if (doc.exists) return doc.data().transacciones || [];
  } catch(e) { if (localData) return JSON.parse(localData); }
  return localData ? JSON.parse(localData) : [];
}

async function registrarTransaccionDiaria(key, tipo, detalle, monto) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let transacciones = await getLibroDiario(raizKey);
  let usuarioActual = userRole === "SUPERVISOR" ? "Supervisor" : (userRole === "ADMIN" ? "Jefe / Administrador" : "Empleado");
  
  transacciones.unshift({ fecha: new Date().toLocaleString(), tipo, detalle, monto, usuario: usuarioActual });
  localStorage.setItem(`gams_diario_${raizKey}`, JSON.stringify(transacciones));
  if (navigator.onLine) {
    try {
      let activeDb = await getDbForBusiness(raizKey);
      await activeDb.collection("gams_diario").doc(raizKey).set({ transacciones });
    } catch(e) { console.error(e); }
  }
}

async function initFirebaseData() {
  let localReg = localStorage.getItem("gams_negocios_registry");
  negociosRegistry = localReg ? JSON.parse(localReg) : defaultNegocios;
  try {
    let doc = await dbHotel.collection("gams_system").doc("registry").get();
    if (doc.exists && doc.data().negocios) negociosRegistry = doc.data().negocios;
    localStorage.setItem("gams_negocios_registry", JSON.stringify(negociosRegistry));
  } catch (e) { console.warn(e); }
}

async function saveNegociosRegistry(list) {
  negociosRegistry = list;
  localStorage.setItem("gams_negocios_registry", JSON.stringify(list));
  if (navigator.onLine) {
    await dbHotel.collection("gams_system").doc("registry").set({ negocios: list });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await initFirebaseData();
  if(window.renderModuloHotel) renderModuloHotel();
  if(window.renderModuloComercio) renderModuloComercio();
  if(window.renderModuloCitas) renderModuloCitas();
  if(window.renderModuloReferidos) renderModuloReferidos();
  if(window.renderChatAI) renderChatAI();

  const savedRole = localStorage.getItem("gams_user_role");
  const savedMod = localStorage.getItem("gams_active_module");
  const savedAcc = localStorage.getItem("gams_current_account");

  poblarSelectoresSupervisores();
  poblarSelectAnalyticsBiz();

  if (savedRole) {
    userRole = savedRole;
    activeModule = savedMod || "HOTEL";
    currentAccountKey = savedAcc || "hotel_mama1";
    document.getElementById("license-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    await cargarTasasEnPantalla();
    applyModuleTheme();
    configUI();
    switchSystemModule(activeModule);
  }
});

function poblarSelectoresSupervisores(filtro = "") {
  const select = document.getElementById("supervisor-target-account");
  if (!select) return;
  select.innerHTML = "";
  let filtrados = negociosRegistry.filter(n => n.bizName.toLowerCase().includes(filtro.toLowerCase()));
  filtrados.forEach(n => {
    select.innerHTML += `<option value="${n.adminKey}">${n.type === "Hotelería" ? "🏨" : "📦"} ${n.bizName}</option>`;
  });
}

function poblarSelectAnalyticsBiz() {
  const sel = document.getElementById("analytics-target-biz");
  if (!sel) return;
  sel.innerHTML = "";
  negociosRegistry.forEach(n => {
    sel.innerHTML += `<option value="${n.adminKey}">${n.type === "Hotelería" ? "🏨" : "📦"} ${n.bizName}</option>`;
  });
}

async function getTasas(key) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let local = localStorage.getItem(`gams_tasas_${raizKey}`);
  if (!navigator.onLine && local) return JSON.parse(local);
  try {
    let activeDb = await getDbForBusiness(raizKey);
    let doc = await activeDb.collection("gams_tasas").doc(raizKey).get();
    if (doc.exists) return doc.data();
  } catch(e) { if (local) return JSON.parse(local); }
  return { dolar: 36.50, euro: 39.20, usdt: 36.85, btc: "$91,400" };
}

async function saveTasas(key, tasas) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  localStorage.setItem(`gams_tasas_${raizKey}`, JSON.stringify(tasas));
  if (!navigator.onLine) return;
  try {
    let activeDb = await getDbForBusiness(raizKey);
    await activeDb.collection("gams_tasas").doc(raizKey).set(tasas);
  } catch(e) { console.error(e); }
}

async function cargarTasasEnPantalla() {
  let tasas = await getTasas(currentAccountKey);
  if(document.getElementById("t-dolar")) document.getElementById("t-dolar").innerText = `${tasas.dolar} Bs`;
  if(document.getElementById("t-euro")) document.getElementById("t-euro").innerText = `${tasas.euro} Bs`;
  if(document.getElementById("t-usdt")) document.getElementById("t-usdt").innerText = `${tasas.usdt} Bs`;
  if(document.getElementById("t-btc")) document.getElementById("t-btc").innerText = tasas.btc;

  if(document.getElementById("inp-dolar")) document.getElementById("inp-dolar").value = tasas.dolar;
  if(document.getElementById("inp-euro")) document.getElementById("inp-euro").value = tasas.euro;
  if(document.getElementById("inp-usdt")) document.getElementById("inp-usdt").value = tasas.usdt;
  if(document.getElementById("inp-btc")) document.getElementById("inp-btc").value = tasas.btc;
}

window.toggleEditarTasas = function() {
  document.getElementById("form-editar-tasas").classList.toggle("hidden");
}

window.guardarTasasCuenta = async function() {
  let nuevasTasas = {
    dolar: parseFloat(document.getElementById("inp-dolar").value) || 36.50,
    euro: parseFloat(document.getElementById("inp-euro").value) || 39.20,
    usdt: parseFloat(document.getElementById("inp-usdt").value) || 36.85,
    btc: document.getElementById("inp-btc").value.trim() || "$91,400"
  };
  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey || n.empKey === currentAccountKey);
  if (neg) {
    await saveTasas(neg.adminKey, nuevasTasas);
    await saveTasas(neg.empKey, nuevasTasas);
  } else {
    await saveTasas(currentAccountKey, nuevasTasas);
  }
  await cargarTasasEnPantalla();
  document.getElementById("form-editar-tasas").classList.add("hidden");
  alert(`¡Tasas oficiales guardadas!`);
}

window.validateAuth = function() {
  const inpVal = document.getElementById("license-input").value.trim();
  if (!inpVal) return;

  if (inpVal === "Iryss01" || inpVal === "marrongibrand47@gmail.com") {
    saveAndReload("SUPERVISOR", "HOTEL", "hotel_mama1");
    return;
  }

  let foundNeg = null;
  let matchedRole = "";
  for (let n of negociosRegistry) {
    if (n.status === "SUSPENDIDO") continue;
    if (n.adminPass === inpVal || n.adminKey === inpVal) {
      foundNeg = n;
      matchedRole = "ADMIN";
      currentAccountKey = n.adminKey;
      break;
    } else if (n.empPass === inpVal || n.empKey === inpVal) {
      foundNeg = n;
      matchedRole = "EMPLEADO";
      currentAccountKey = n.empKey;
      break;
    }
  }

  if (foundNeg) {
    let modAsignado = "COMERCIO";
    if (foundNeg.type === "Hotelería") modAsignado = "HOTEL";
    else if (foundNeg.type === "Citas y Agendas") modAsignado = "CITAS";

    saveAndReload(matchedRole, modAsignado, currentAccountKey);
    return;
  }
  document.getElementById("error-msg").innerText = "❌ Clave incorrecta.";
  document.getElementById("error-msg").style.display = "block";
}

function saveAndReload(role, mod, acc) {
  localStorage.setItem("gams_user_role", role);
  localStorage.setItem("gams_active_module", mod);
  localStorage.setItem("gams_current_account", acc);
  location.reload();
}

window.logoutApp = function() {
  localStorage.clear();
  location.reload();
}

window.switchSystemModule = async function(mod) {
  activeModule = mod;
  localStorage.setItem("gams_active_module", mod);
  applyModuleTheme();
  configUI();
  await cargarTasasEnPantalla();

  document.getElementById("modulo-hotel-container").classList.add("hidden");
  document.getElementById("modulo-comercio-container").classList.add("hidden");
  document.getElementById("modulo-citas-container").classList.add("hidden");
  document.getElementById("modulo-referidos-container").classList.add("hidden");
  document.getElementById("subpage-audit").classList.add("hidden");
  document.getElementById("subpage-analytics").classList.add("hidden");
  document.getElementById("subpage-accounts").classList.add("hidden");

  if (mod === "HOTEL") {
    document.getElementById("modulo-hotel-container").classList.remove("hidden");
    if(window.switchHotelTab) switchHotelTab('rooms');
  } else if (mod === "COMERCIO") {
    document.getElementById("modulo-comercio-container").classList.remove("hidden");
    if(window.switchComercioTab) switchComercioTab('inv');
  } else if (mod === "CITAS") {
    document.getElementById("modulo-citas-container").classList.remove("hidden");
    if(window.renderModuloCitas) window.renderModuloCitas();
  } else if (mod === "REFERIDOS") {
    document.getElementById("modulo-referidos-container").classList.remove("hidden");
    if(window.renderModuloReferidos) window.renderModuloReferidos();
  } else if (mod === "AUDIT") mostrarPanelAuditoriaTasas();
  else if (mod === "ANALYTICS") mostrarAnalyticAndRecommendations();
  else if (mod === "ACCOUNTS") mostrarGestionCuentas();
}

function applyModuleTheme() {
  const hotelNav = document.getElementById("hotel-nav");
  const comercioNav = document.getElementById("comercio-nav");
  const supBar = document.getElementById("supervisor-system-bar");

  if (userRole === "SUPERVISOR") {
    supBar.classList.remove("hidden");
    document.querySelectorAll(".main-system-tabs button").forEach(b => b.classList.remove("active-sys"));
    if(activeModule === "HOTEL" && document.getElementById("sys-tab-hotel")) document.getElementById("sys-tab-hotel").classList.add("active-sys");
    if(activeModule === "COMERCIO" && document.getElementById("sys-tab-comercio")) document.getElementById("sys-tab-comercio").classList.add("active-sys");
    if(activeModule === "CITAS" && document.getElementById("sys-tab-citas")) document.getElementById("sys-tab-citas").classList.add("active-sys");
    if(activeModule === "REFERIDOS" && document.getElementById("sys-tab-referidos")) document.getElementById("sys-tab-referidos").classList.add("active-sys");
    if(activeModule === "AUDIT" && document.getElementById("sys-tab-audit")) document.getElementById("sys-tab-audit").classList.add("active-sys");
    if(activeModule === "ANALYTICS" && document.getElementById("sys-tab-analytics")) document.getElementById("sys-tab-analytics").classList.add("active-sys");
    if(activeModule === "ACCOUNTS" && document.getElementById("sys-tab-accounts")) document.getElementById("sys-tab-accounts").classList.add("active-sys");
  } else {
    supBar.classList.add("hidden");
  }

  const formHotel = document.getElementById("hotel-dynamic-form");
  const formComercio = document.getElementById("comercio-dynamic-form");

  if (activeModule === "HOTEL") {
    document.body.className = "theme-hotel";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "🏨";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Hotelería";
    if(hotelNav) hotelNav.classList.remove("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
    if(formHotel) formHotel.classList.remove("hidden");
    if(formComercio) formComercio.classList.add("hidden");
  } else if (activeModule === "COMERCIO") {
    document.body.className = "theme-comercio";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "📦";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Comercio";
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.remove("hidden");
    if(formHotel) formHotel.classList.add("hidden");
    if(formComercio) formComercio.classList.remove("hidden");
  } else if (activeModule === "CITAS") {
    document.body.className = "theme-citas";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "📅";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Citas y Agendas";
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
    if(formHotel) formHotel.classList.add("hidden");
    if(formComercio) formComercio.classList.add("hidden");
  } else {
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
  }
}

function configUI() {
  let cleanRoleTxt = userRole === "SUPERVISOR" ? "Supervisor General (♾️)" : "Empleado";
  let cleanBizTxt = "Establecimiento GAMS";
  let statusTxt = "ACTIVO";
  let expiryTxt = "2030-12-04";

  if (userRole !== "SUPERVISOR") {
    let matchedNeg = negociosRegistry.find(n => n.adminKey === currentAccountKey || n.empKey === currentAccountKey);
    if (matchedNeg) {
      cleanRoleTxt = currentAccountKey === matchedNeg.adminKey ? "Jefe / Administrador" : "Empleado";
      cleanBizTxt = matchedNeg.bizName;
      statusTxt = matchedNeg.status || "ACTIVO";
      expiryTxt = matchedNeg.expiry || "2030-12-04";
    }
  } else {
    cleanBizTxt = "Plataforma Multinegocio Híbrida";
    statusTxt = "ILIMITADO ♾️";
  }

  if(document.getElementById("user-role-clean")) document.getElementById("user-role-clean").innerText = cleanRoleTxt;
  if(document.getElementById("user-business-clean")) document.getElementById("user-business-clean").innerText = cleanBizTxt;
  if(document.getElementById("display-account-status")) document.getElementById("display-account-status").innerText = statusTxt;
  if(document.getElementById("display-license-expiry")) document.getElementById("display-license-expiry").innerText = expiryTxt;

  const divisaPanel = document.getElementById("divisa-admin-panel");
  const formAction = document.getElementById("container-actions-form");
  if (divisaPanel) {
    if (userRole === "SUPERVISOR" || userRole === "ADMIN") {
      divisaPanel.style.display = "block";
      if(formAction && activeModule !== "CITAS") formAction.style.display = "block";
      else if(formAction) formAction.style.display = "none";
    } else {
      divisaPanel.style.display = "none";
      if(formAction) formAction.style.display = "none";
    }
  }
}

async function mostrarPanelAuditoriaTasas() {
  document.getElementById("subpage-audit").classList.remove("hidden");
  const container = document.getElementById("audit-cards-container");
  container.innerHTML = "";
  let nombresEmpresas = [];
  let totalesVentasEmpresas = [];

  for (let neg of negociosRegistry) {
    let tasas = await getTasas(neg.adminKey);
    let dbData = await getDbItems(neg.adminKey);
    let transacciones = await getLibroDiario(neg.adminKey);
    let totalVentas = transacciones.reduce((acc, t) => acc + (t.monto || 0), 0);

    nombresEmpresas.push(neg.bizName);
    totalesVentasEmpresas.push(totalVentas);

    container.innerHTML += `
      <div style="background: #ffffff; border: 2px solid #212529; padding: 18px; border-radius: 8px;">
        <h4 style="margin-top:0; color:#212529;">${neg.bizName}</h4>
        <p style="margin: 6px 0; font-size:12px; color:#555;">Jefe: ${neg.adminPass} | Emp: ${neg.empPass}</p>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 13px;">
          💵 Dólar: ${tasas.dolar} Bs | 📊 Movimientos: $${totalVentas.toFixed(2)} | 📦 Registros: ${dbData.length}
        </div>
      </div>`;
  }

  const ctx = document.getElementById('graficoVentasSupervisor').getContext('2d');
  if (chartSupervisorInstance) chartSupervisorInstance.destroy();
  chartSupervisorInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels: nombresEmpresas, datasets: [{ label: 'Ventas Totales ($)', data: totalesVentasEmpresas, backgroundColor: '#007bff' }] }
  });
}

async function mostrarAnalyticAndRecommendations() {
  document.getElementById("subpage-analytics").classList.remove("hidden");
  const container = document.getElementById("analytics-content-container");
  const selectedBizKey = document.getElementById("analytics-target-biz").value || negociosRegistry[0].adminKey;
  let selectedNeg = negociosRegistry.find(n => n.adminKey === selectedBizKey) || negociosRegistry[0];
  let recomendacionTexto = `Se vendieron productos de alta demanda en ${selectedNeg.bizName}. Se sugiere reponer stock y colocar ofertas visibles para incrementar las conversiones semanales.`;

  container.innerHTML = `
    <div style="background:#fff; padding:20px; border-radius:8px; border: 1px solid #ced4da;">
      <h4>📈 Reporte de Análisis BI (${selectedNeg.bizName})</h4>
      <p><strong>Recomendación Ejecutiva:</strong> ${recomendacionTexto}</p>
      <button class="btn-success" style="width:auto; padding: 10px 20px; margin-top: 10px;" onclick="enviarReporteBIPDF('${selectedNeg.bizName}', '${recomendacionTexto}')">📤 Descargar Reporte PDF</button>
    </div>`;
}

window.enviarReporteBIPDF = function(nombreNegocio, recomendacion) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(`REPORTE EJECUTIVO DE INTELIGENCIA BI`, 14, 20);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Caracas, Venezuela | Fecha: ${new Date().toLocaleString()}`, 14, 27);
  doc.text(`Negocio: ${nombreNegocio} | Emisor: Gibrand Marron (CI: 32751191)`, 14, 34);
  doc.text(recomendacion, 14, 50, { maxWidth: 180 });
  doc.save(`Analisis_BI_${nombreNegocio.replace(/\s+/g, '_')}.pdf`);
  alert("✅ Reporte PDF descargado.");
}

function mostrarGestionCuentas() {
  document.getElementById("subpage-accounts").classList.remove("hidden");
  const tbody = document.getElementById("accounts-control-table");
  tbody.innerHTML = "";

  negociosRegistry.forEach((neg, idx) => {
    let isSuspended = neg.status === "SUSPENDIDO";
    tbody.innerHTML += `
      <tr>
        <td><strong>${neg.bizName}</strong></td>
        <td>🔑 <strong>Jefe:</strong> ${neg.adminPass}<br>🔑 <strong>Emp:</strong> ${neg.empPass}</td>
        <td>${neg.type}</td>
        <td>Standard</td>
        <td>${isSuspended ? '⛔ SUSPENDIDO' : '🟢 ACTIVA'}</td>
        <td>${neg.expiry || '2030-12-04'}</td>
        <td>
          <button class="${isSuspended ? 'btn-success' : 'btn-warning'}" style="padding: 6px; font-size: 11px;" onclick="toggleEstadoNegocio(${idx})">${isSuspended ? 'Reactivar' : 'Suspender'}</button>
          <button class="btn-danger" style="padding: 6px; font-size: 11px;" onclick="eliminarNegocio(${idx})">Eliminar</button>
        </td>
      </tr>`;
  });
}

window.registrarNuevaCuentaUnificada = async function() {
  const bizName = document.getElementById("new-account-biz").value.trim();
  const type = document.getElementById("new-account-type").value;
  const adminPass = document.getElementById("new-account-pass-admin").value.trim();
  const empPass = document.getElementById("new-account-pass-emp").value.trim();
  if (!bizName || !adminPass || !empPass) return alert("Completa todos los campos.");

  let id = bizName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random()*1000);
  let adminKey = "biz_" + id + "_admin";
  let empKey = "biz_" + id + "_emp";
  let expiryStr = calcularFechaLicenciaUnMesDia4();

  negociosRegistry.push({ id, bizName, type, dbTarget: "NUEVA", adminKey, adminPass, empKey, empPass, status: "ACTIVO", expiry: expiryStr });
  await saveNegociosRegistry(negociosRegistry);
  mostrarGestionCuentas();
  alert(`🎉 Negocio "${bizName}" registrado con éxito.`);
}

window.toggleEstadoNegocio = async function(idx) {
  negociosRegistry[idx].status = negociosRegistry[idx].status === "SUSPENDIDO" ? "ACTIVO" : "SUSPENDIDO";
  await saveNegociosRegistry(negociosRegistry);
  mostrarGestionCuentas();
}

window.eliminarNegocio = async function(idx) {
  if (confirm("¿Eliminar negocio?")) {
    negociosRegistry.splice(idx, 1);
    await saveNegociosRegistry(negociosRegistry);
    mostrarGestionCuentas();
  }
}

let imagenBase64Procesada = "";
window.procesarImagenSeleccionada = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    imagenBase64Procesada = e.target.result;
    document.getElementById("img-preview-tag").src = imagenBase64Procesada;
    document.getElementById("img-preview-box").style.display = "block";
  };
  reader.readAsDataURL(file);
};

window.actualizarPreviaUrl = function(url) {
  if (url.trim()) {
    imagenBase64Procesada = "";
    document.getElementById("img-preview-tag").src = url.trim();
    document.getElementById("img-preview-box").style.display = "block";
  }
};

window.limpiarImagenCargada = function() {
  imagenBase64Procesada = "";
  document.getElementById("prod-img").value = "";
  document.getElementById("img-preview-box").style.display = "none";
};

window.createProd = async function() {
  const barcode = document.getElementById("prod-barcode").value.trim() || "SKU-999";
  const name = document.getElementById("prod-name").value.trim();
  const img = imagenBase64Procesada || document.getElementById("prod-img").value.trim() || defaultImgPlaceholder;
  if (!name) return alert("Ingresa un nombre.");

  let curr = await getDbItems(currentAccountKey);
  if (activeModule === "HOTEL") {
    curr.push({
      date: new Date().toLocaleDateString(), barcode, name, img,
      camas: parseInt(document.getElementById("room-camas").value) || 1,
      banos: parseInt(document.getElementById("room-banos").value) || 1,
      desc: document.getElementById("room-desc").value.trim() || "Estándar",
      stock: 1, p1h: parseFloat(document.getElementById("price-1h").value) || 8.00,
      pNoche: parseFloat(document.getElementById("price-noche").value) || 35.00
    });
  } else {
    curr.push({
      date: new Date().toLocaleDateString(), barcode, name, img,
      stock: parseInt(document.getElementById("prod-stock").value) || 0,
      priceUsd: parseFloat(document.getElementById("prod-price-usd").value) || 0
    });
  }

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "ALTA", `Nuevo ítem: ${name}`, 0);
  limpiarImagenCargada();
  alert("¡Elemento guardado!");
  if(activeModule === "HOTEL") switchHotelTab('rooms');
  else switchComercioTab('inv');
}

window.delProd = async function(idx) {
  if (confirm("¿Eliminar elemento?")) {
    let curr = await getDbItems(currentAccountKey);
    curr.splice(idx, 1);
    await saveDbItems(currentAccountKey, curr);
    if(activeModule === "HOTEL") switchHotelTab('rooms');
    else switchComercioTab('inv');
  }
}