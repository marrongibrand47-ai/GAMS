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

function sumarUnMesALecha(fechaStr) {
  let d = fechaStr ? new Date(fechaStr) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

const defaultNegocios = [
  { id: "hotel_costa_real", bizName: "Hotel Costa Real", pais: "VE", banco: "Banesco", telefono: "04240000000", rif: "J-00000000-0", modules: ["Hotelería"], precioLicenciaBase: 35, precioLicencia: 35, dbTarget: "NUEVA", adminKey: "hotel_mama1", adminPass: "mama1", empKey: "hotel_empleado1", empPass: "empleado1", status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4(), refCode: "", payMode: "LOCAL", empleadosExtra: [] },
  { id: "comercio_abastos_gams", bizName: "Comercializadora & Abastos GAMS", pais: "VE", banco: "Mercantil", telefono: "04140000000", rif: "J-11111111-1", modules: ["Inventario / Comercio"], precioLicenciaBase: 20, precioLicencia: 20, dbTarget: "VIEJA", adminKey: "comercio_comercio123", adminPass: "comercio123", empKey: "comercio_empleadocomercio123", empPass: "empleadocomercio123", status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4(), refCode: "", payMode: "LOCAL", empleadosExtra: [] }
];

function obtenerIdentificadorRaizNegocio(key) {
  let neg = negociosRegistry.find(n => n.adminKey === key || n.empKey === key || (n.empleadosExtra && n.empleadosExtra.some(e => e.pass === key || e.key === key)));
  return neg ? neg.adminKey : key;
}

async function getDbForBusiness(accountKey) {
  let neg = negociosRegistry.find(n => n.adminKey === accountKey || n.empKey === accountKey || (n.empleadosExtra && n.empleadosExtra.some(e => e.pass === accountKey || e.key === accountKey)));
  if (neg && neg.dbTarget === "VIEJA") return dbOld;
  return (activeModule === "HOTEL") ? dbHotel : (neg && neg.modules && neg.modules.includes("Inventario / Comercio") ? dbOld : dbHotel);
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
  let usuarioActual = userRole === "SUPERVISOR" ? "Supervisor" : (userRole === "ADMIN" ? "Jefe / Administrador" : "Empleado (" + userRole + ")");
  
  transacciones.unshift({ fecha: new Date().toLocaleString(), tipo, detalle, monto, usuario: usuarioActual });
  localStorage.setItem(`gams_diario_${raizKey}`, JSON.stringify(transacciones));
  if (navigator.onLine) {
    try {
      let activeDb = await getDbForBusiness(raizKey);
      await activeDb.collection("gams_diario").doc(raizKey).set({ transacciones });
    } catch(e) { console.error(e); }
  }
}

window.descargarPDFYVaciarLibro = async function(key, nombreNegocio) {
  let transacciones = await getLibroDiario(key);
  if (transacciones.length === 0) return alert("No hay transacciones registradas para exportar.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text(`LIBRO DIARIO DE VENTAS - ${nombreNegocio}`, 14, 20);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha de corte: ${new Date().toLocaleString()} | CI: 32751191`, 14, 27);

  let y = 35;
  transacciones.forEach((t) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${t.fecha} | [${t.tipo}] ${t.detalle} | Monto: $${t.monto.toFixed(2)} USD | User: ${t.usuario}`, 14, y);
    y += 7;
  });

  doc.save(`Libro_Diario_${nombreNegocio.replace(/\s+/g, '_')}.pdf`);

  let raizKey = obtenerIdentificadorRaizNegocio(key);
  localStorage.setItem(`gams_diario_${raizKey}`, JSON.stringify([]));
  
  if (navigator.onLine) {
    try {
      let activeDb = await getDbForBusiness(raizKey);
      await activeDb.collection("gams_diario").doc(raizKey).set({ transacciones: [] });
      alert(`✅ Reporte PDF descargado y libro diario de "${nombreNegocio}" vaciado exitosamente.`);
    } catch(e) {
      alert(`⚠️ PDF descargado y vaciado localmente. Se sincronizará al reconectar.`);
    }
  } else {
    alert(`⚠️ Dispositivo offline: PDF descargado y vaciado localmente.`);
  }

  if(window.switchSystemModule) window.switchSystemModule(activeModule);
};

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

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    localStorage.setItem("gams_ref_active", refCode);
    document.getElementById("license-screen").classList.remove("hidden");
    document.getElementById("app-screen").classList.add("hidden");
    
    setTimeout(() => {
      if(window.toggleGamsAIChat && document.getElementById("gams-ai-chat-window").classList.contains("hidden")) {
        window.toggleGamsAIChat();
      }
      if(window.mostrarMensajeBienvenidaReferido) {
        window.mostrarMensajeBienvenidaReferido(refCode);
      }
    }, 500);
    return;
  }

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
    select.innerHTML += `<option value="${n.adminKey}">🏢 ${n.bizName}</option>`;
  });
}

function poblarSelectAnalyticsBiz() {
  const sel = document.getElementById("analytics-target-biz");
  if (!sel) return;
  sel.innerHTML = "";
  negociosRegistry.forEach(n => {
    sel.innerHTML += `<option value="${n.adminKey}">🏢 ${n.bizName}</option>`;
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
  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey || n.empKey === currentAccountKey || (n.empleadosExtra && n.empleadosExtra.some(e => e.pass === currentAccountKey)));
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
    } else if (n.empleadosExtra && n.empleadosExtra.some(e => e.pass === inpVal)) {
      foundNeg = n;
      matchedRole = "EMPLEADO_EXTRA";
      currentAccountKey = inpVal;
      break;
    }
  }

  if (foundNeg) {
    let listMods = foundNeg.modules || [foundNeg.type || "Inventario / Comercio"];
    let modAsignado = "COMERCIO";
    if (listMods.includes("Hotelería") || listMods.includes("Hotel")) {
      modAsignado = "HOTEL";
    } else if (listMods.includes("Citas y Agendas") || listMods.includes("Citas")) {
      modAsignado = "CITAS";
    } else if (listMods.includes("Inventario / Comercio") || listMods.includes("Comercio")) {
      modAsignado = "COMERCIO";
    }

    let refAsociado = localStorage.getItem("gams_ref_active");
    if (refAsociado && !foundNeg.refCode) {
      foundNeg.refCode = refAsociado;
      registrarPuntoReferidoAutomatico(refAsociado, foundNeg.precioLicencia || 20);
      saveNegociosRegistry(negociosRegistry);
    }

    saveAndReload(matchedRole, modAsignado, currentAccountKey);
    return;
  }

  document.getElementById("error-msg").innerText = "❌ Clave de acceso incorrecta.";
  document.getElementById("error-msg").style.display = "block";
}

function registrarPuntoReferidoAutomatico(codigoRef, precio) {
  let data = localStorage.getItem("gams_promotores_referidos");
  let promotores = data ? JSON.parse(data) : [];
  let promotor = promotores.find(p => p.codigo === codigoRef);

  if (promotor) {
    promotor.traidos = (promotor.traidos || 0) + 1;
    promotor.ventas = (promotor.ventas || 0) + precio;
    promotor.comision = promotor.ventas * 0.50; 
    localStorage.setItem("gams_promotores_referidos", JSON.stringify(promotores));
  }
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

  document.querySelectorAll(".main-system-tabs button").forEach(b => b.classList.remove("active-sys"));
  if(mod === "HOTEL" && document.getElementById("sys-tab-hotel")) document.getElementById("sys-tab-hotel").classList.add("active-sys");
  if(mod === "COMERCIO" && document.getElementById("sys-tab-comercio")) document.getElementById("sys-tab-comercio").classList.add("active-sys");
  if(mod === "CITAS" && document.getElementById("sys-tab-citas")) document.getElementById("sys-tab-citas").classList.add("active-sys");
  if(mod === "REFERIDOS" && document.getElementById("sys-tab-referidos")) document.getElementById("sys-tab-referidos").classList.add("active-sys");
  if(mod === "AUDIT" && document.getElementById("sys-tab-audit")) document.getElementById("sys-tab-audit").classList.add("active-sys");
  if(mod === "ANALYTICS" && document.getElementById("sys-tab-analytics")) document.getElementById("sys-tab-analytics").classList.add("active-sys");
  if(mod === "ACCOUNTS" && document.getElementById("sys-tab-accounts")) document.getElementById("sys-tab-accounts").classList.add("active-sys");
  if(mod === "EMPLEADOS" && document.getElementById("sys-tab-empleados")) document.getElementById("sys-tab-empleados").classList.add("active-sys");

  await cargarTasasEnPantalla();

  document.getElementById("modulo-hotel-container").classList.add("hidden");
  document.getElementById("modulo-comercio-container").classList.add("hidden");
  document.getElementById("modulo-citas-container").classList.add("hidden");
  document.getElementById("modulo-referidos-container").classList.add("hidden");
  document.getElementById("subpage-audit").classList.add("hidden");
  document.getElementById("subpage-analytics").classList.add("hidden");
  document.getElementById("subpage-accounts").classList.add("hidden");
  document.getElementById("subpage-empleados-admin").classList.add("hidden");

  let tituloSys = "Sistema GAMS";
  let iconoSys = "💼";

  if (mod === "HOTEL") {
    document.getElementById("modulo-hotel-container").classList.remove("hidden");
    if(window.switchHotelTab) switchHotelTab('rooms');
    tituloSys = "Sistema de Hotelería"; iconoSys = "🏨";
  } else if (mod === "COMERCIO") {
    document.getElementById("modulo-comercio-container").classList.remove("hidden");
    if(window.switchComercioTab) switchComercioTab('inv');
    tituloSys = "Sistema de Comercio & Inventario"; iconoSys = "📦";
  } else if (mod === "CITAS") {
    document.getElementById("modulo-citas-container").classList.remove("hidden");
    if(window.renderModuloCitas) window.renderModuloCitas();
    tituloSys = "Sistema de Citas y Agendas"; iconoSys = "📅";
  } else if (mod === "REFERIDOS") {
    document.getElementById("modulo-referidos-container").classList.remove("hidden");
    if(window.renderModuloReferidos) window.renderModuloReferidos();
    tituloSys = "Programa de Referidos"; iconoSys = "🤝";
  } else if (mod === "EMPLEADOS") {
    document.getElementById("subpage-empleados-admin").classList.remove("hidden");
    renderizarGestionEmpleadosAdmin();
    tituloSys = "Gestión de Empleados y POS"; iconoSys = "👥";
  } else if (mod === "AUDIT") {
    mostrarPanelAuditoriaTasas();
    tituloSys = "Auditoría General y Ventas"; iconoSys = "📊";
  } else if (mod === "ANALYTICS") {
    mostrarAnalyticAndRecommendations();
    tituloSys = "Análisis de Datos y BI"; iconoSys = "📈";
  } else if (mod === "ACCOUNTS") {
    mostrarGestionCuentas();
    tituloSys = "Gestión y Control de Cuentas"; iconoSys = "⚙️";
  }

  if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = iconoSys;
  if(document.getElementById("system-title")) document.getElementById("system-title").innerText = tituloSys;
}

function applyModuleTheme() {
  const hotelNav = document.getElementById("hotel-nav");
  const comercioNav = document.getElementById("comercio-nav");
  const formHotel = document.getElementById("hotel-dynamic-form");
  const formComercio = document.getElementById("comercio-dynamic-form");

  if (activeModule === "HOTEL") {
    document.body.className = "theme-hotel";
    if(hotelNav) hotelNav.classList.remove("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
    if(formHotel) formHotel.classList.remove("hidden");
    if(formComercio) formComercio.classList.add("hidden");
  } else if (activeModule === "COMERCIO") {
    document.body.className = "theme-comercio";
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.remove("hidden");
    if(formHotel) formHotel.classList.add("hidden");
    if(formComercio) formComercio.classList.remove("hidden");
  } else if (activeModule === "CITAS") {
    document.body.className = "theme-citas";
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

  let matchedNeg = null;
  if (userRole === "SUPERVISOR") {
    cleanBizTxt = "👑 Dueño de GAMS Company";
    statusTxt = "ACTIVO (♾️ Infinito)";
    expiryTxt = "♾️ Perpetua e Ilimitada";
  } else {
    matchedNeg = negociosRegistry.find(n => n.adminKey === currentAccountKey || n.empKey === currentAccountKey || (n.empleadosExtra && n.empleadosExtra.some(e => e.pass === currentAccountKey)));
    if (matchedNeg) {
      cleanRoleTxt = currentAccountKey === matchedNeg.adminKey ? "Jefe / Administrador" : "Empleado Sub-nivel";
      cleanBizTxt = matchedNeg.bizName;
      statusTxt = matchedNeg.status || "ACTIVO";
      expiryTxt = matchedNeg.expiry || "2030-12-04";
    }
  }

  if(document.getElementById("user-role-clean")) document.getElementById("user-role-clean").innerText = cleanRoleTxt;
  if(document.getElementById("user-business-clean")) document.getElementById("user-business-clean").innerText = cleanBizTxt;
  if(document.getElementById("display-account-status")) document.getElementById("display-account-status").innerText = statusTxt;
  if(document.getElementById("display-license-expiry")) document.getElementById("display-license-expiry").innerText = expiryTxt;

  const navContainer = document.getElementById("dynamic-business-nav");
  if (navContainer) {
    navContainer.innerHTML = "";
    if (userRole === "SUPERVISOR") {
      navContainer.innerHTML = `
        <button id="sys-tab-hotel" onclick="switchSystemModule('HOTEL')">🏨 Módulo Hotel</button>
        <button id="sys-tab-comercio" onclick="switchSystemModule('COMERCIO')">📦 Módulo Comercio</button>
        <button id="sys-tab-citas" onclick="switchSystemModule('CITAS')">📅 Módulo Citas</button>
        <button id="sys-tab-referidos" onclick="switchSystemModule('REFERIDOS')">🤝 Referidos</button>
        <button id="sys-tab-audit" onclick="switchSystemModule('AUDIT')">📊 Auditoría</button>
        <button id="sys-tab-analytics" onclick="switchSystemModule('ANALYTICS')">📈 Análisis BI</button>
        <button id="sys-tab-accounts" onclick="switchSystemModule('ACCOUNTS')">⚙️ Cuentas</button>
      `;
    } else if (matchedNeg && matchedNeg.modules) {
      matchedNeg.modules.forEach(modName => {
        if (modName.includes("Hotelería") || modName.includes("Hotel")) {
          navContainer.innerHTML += `<button id="sys-tab-hotel" onclick="switchSystemModule('HOTEL')">🏨 Hotel</button>`;
        }
        if (modName.includes("Inventario") || modName.includes("Comercio")) {
          navContainer.innerHTML += `<button id="sys-tab-comercio" onclick="switchSystemModule('COMERCIO')">📦 Comercio</button>`;
        }
        if (modName.includes("Citas") || modName.includes("Agendas")) {
          navContainer.innerHTML += `<button id="sys-tab-citas" onclick="switchSystemModule('CITAS')">📅 Citas</button>`;
        }
      });
      if (userRole === "ADMIN") {
        navContainer.innerHTML += `<button id="sys-tab-empleados" onclick="switchSystemModule('EMPLEADOS')" style="background-color: #6f42c1;">👥 Empleados & POS</button>`;
      }
    } else {
      navContainer.innerHTML = `<button id="sys-tab-comercio" onclick="switchSystemModule('COMERCIO')">📦 Comercio</button>`;
    }
  }

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

window.calcularCostoAdicionales = function(cantidadAdicionales) {
  if (cantidadAdicionales <= 0) return 0;
  if (cantidadAdicionales === 1) return 10;
  return 10 + (cantidadAdicionales - 1) * 5;
};

window.renderizarGestionEmpleadosAdmin = function() {
  const tbody = document.getElementById("tabla-empleados-admin-list");
  if (!tbody) return;
  tbody.innerHTML = "";
  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey);
  if (!neg) return;

  if (!neg.empleadosExtra) neg.empleadosExtra = [];

  if (neg.empleadosExtra.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay recursos adicionales (empleados o POS físicos) registrados.</td></tr>`;
    return;
  }

  neg.empleadosExtra.forEach((emp, idx) => {
    let tipoTxt = emp.tipo === 'POS' ? '🖥️ POS Físico' : '👤 Empleado';
    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.user || emp.pass}</strong></td>
        <td>${tipoTxt}</td>
        <td><span style="color:green; font-weight:bold;">🟢 Activo</span></td>
        <td><button class="btn-danger" style="padding:4px 10px; font-size:12px;" onclick="eliminarEmpleadoAdmin(${idx})">Eliminar</button></td>
      </tr>`;
  });
};

window.registrarNuevoEmpleadoAdmin = async function() {
  const usuarioEmp = document.getElementById("new-emp-user").value.trim();
  const claveEmp = document.getElementById("new-emp-pass").value.trim();
  const tipoRecurso = document.getElementById("new-emp-tipo").value;
  if (!usuarioEmp || !claveEmp) return alert("Ingresa el identificador y la clave del recurso.");

  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey);
  if (!neg) return;

  if (!neg.empleadosExtra) neg.empleadosExtra = [];
  neg.empleadosExtra.push({ pass: claveEmp, user: usuarioEmp, tipo: tipoRecurso });

  let baseModulos = neg.precioLicenciaBase || 20;
  let extraCount = neg.empleadosExtra.length;
  neg.precioLicencia = baseModulos + calcularCostoAdicionales(extraCount);

  await saveNegociosRegistry(negociosRegistry);
  document.getElementById("new-emp-user").value = "";
  document.getElementById("new-emp-pass").value = "";
  renderizarGestionEmpleadosAdmin();
  alert(`✅ Recurso adicional (${tipoRecurso}) registrado con éxito. Se actualizó la tarifa de licencia.`);
};

window.eliminarEmpleadoAdmin = async function(idx) {
  let neg = negociosRegistry.find(n => n.adminKey === currentAccountKey);
  if (!neg || !neg.empleadosExtra) return;

  neg.empleadosExtra.splice(idx, 1);
  let baseModulos = neg.precioLicenciaBase || 20;
  let extraCount = neg.empleadosExtra.length;
  neg.precioLicencia = extraCount === 0 ? baseModulos : (baseModulos + calcularCostoAdicionales(extraCount));
  
  await saveNegociosRegistry(negociosRegistry);
  renderizarGestionEmpleadosAdmin();
  alert("🗑️ Recurso adicional eliminado.");
};

// CÁLCULO DE COMBOS (COMBO DE 3 MÓDULOS ACTUALIZADO A $75 USD)
window.calcularPrecioNuevoNegocio = function() {
  let p = 0;
  let modulosSel = 0;
  let chkComercio = document.getElementById("mod-chk-comercio")?.checked;
  let chkHotel = document.getElementById("mod-chk-hotel")?.checked;
  let chkCitas = document.getElementById("mod-chk-citas")?.checked;

  if (chkComercio) { p += 20; modulosSel++; }
  if (chkHotel) { p += 35; modulosSel++; }
  if (chkCitas) { p += 30; modulosSel++; }

  if (modulosSel >= 3) {
    p = 75; // Combo de los 3 Módulos = $75 USD
  } else if (modulosSel === 2 && chkComercio && chkCitas) {
    p = 40; // Combo Comercio + Citas = $40 USD
  }

  const lbl = document.getElementById("lbl-precio-estimado");
  if (lbl) lbl.innerText = `💡 Precio estimado con Combos: $${p} USD`;
};

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
        <h4 style="margin-top:0; color:#212529;">${neg.bizName} (${neg.pais || 'VE'})</h4>
        <p style="margin: 6px 0; font-size:12px; color:#555;">Jefe: ${neg.adminPass} | Adicionales: ${(neg.empleadosExtra || []).length}</p>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 13px;">
          💵 Dólar: ${tasas.dolar} Bs | 📊 Movimientos: $${totalVentas.toFixed(2)} | 📦 Registros: ${dbData.length}<br>
          <button class="btn-success" style="margin-top:8px; padding:6px; font-size:12px;" onclick="descargarPDFYVaciarLibro('${neg.adminKey}', '${neg.bizName}')">📥 Descargar PDF y Vaciar Libro</button>
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

  container.innerHTML = `
    <div style="background:#fff; padding:20px; border-radius:8px; border: 1px solid #ced4da;">
      <h4>📈 Reporte de Análisis BI (${selectedNeg.bizName})</h4>
      <p><strong>Recomendación Ejecutiva:</strong> Se sugiere reponer stock y verificar los métodos de pago en horas pico para maximizar la eficiencia.</p>
      <button class="btn-success" style="width:auto; padding: 10px 20px; margin-top: 10px;" onclick="descargarPDFYVaciarLibro('${selectedNeg.adminKey}', '${selectedNeg.bizName}')">📤 Descargar Reporte PDF & Vaciar Libro</button>
    </div>`;
}

function mostrarGestionCuentas() {
  document.getElementById("subpage-accounts").classList.remove("hidden");
  const tbody = document.getElementById("accounts-control-table");
  const selectRef = document.getElementById("new-account-ref-select");
  
  if (selectRef) {
    let promotoresData = localStorage.getItem("gams_promotores_referidos");
    let promotores = promotoresData ? JSON.parse(promotoresData) : [];
    selectRef.innerHTML = `<option value="">-- Sin referido directo --</option>`;
    promotores.forEach(p => {
      selectRef.innerHTML += `<option value="${p.codigo}">🔗 ${p.promotor} (Código: ${p.codigo})</option>`;
    });
  }

  tbody.innerHTML = "";
  negociosRegistry.forEach((neg, idx) => {
    let isSuspended = neg.status === "SUSPENDIDO";
    let listaModulos = (neg.modules || ["Comercio"]).join(", ");
    let precio = neg.precioLicencia || 20;
    let fechaVencimiento = neg.expiry || "2030-12-04";

    tbody.innerHTML += `
      <tr>
        <td><strong>${neg.bizName}</strong><br><small>🌍 País: ${neg.pais || 'VE'} | Banco: ${neg.banco || 'N/A'}</small></td>
        <td>🔑 <strong>Jefe:</strong> ${neg.adminPass}<br>🔑 <strong>Emp:</strong> ${neg.empPass} (+${(neg.empleadosExtra||[]).length} recursos)</td>
        <td><small>${listaModulos}</small><br>⏳ <strong>Vence:</strong> ${fechaVencimiento}</td>
        <td><strong>$${precio} USD</strong></td>
        <td>${isSuspended ? '⛔ SUSPENDIDO' : '🟢 ACTIVA'}</td>
        <td>
          <button class="btn-success" style="padding: 5px; font-size: 11px; margin-bottom: 3px;" onclick="extenderLicenciaNegocio(${idx})">➕ Extender</button><br>
          <button class="${isSuspended ? 'btn-success' : 'btn-warning'}" style="padding: 5px; font-size: 11px; margin-bottom: 3px;" onclick="toggleEstadoNegocio(${idx})">${isSuspended ? 'Reactivar' : 'Suspender'}</button>
          <button class="btn-danger" style="padding: 5px; font-size: 11px;" onclick="eliminarNegocio(${idx})">Eliminar</button>
        </td>
      </tr>`;
  });
}

window.extenderLicenciaNegocio = async function(idx) {
  let neg = negociosRegistry[idx];
  neg.expiry = sumarUnMesALecha(neg.expiry);
  await saveNegociosRegistry(negociosRegistry);
  mostrarGestionCuentas();
  alert(`✅ Licencia de "${neg.bizName}" extendida un mes más.`);
}

window.registrarNuevaCuentaUnificada = async function() {
  const bizName = document.getElementById("new-account-biz").value.trim();
  const pais = document.getElementById("new-account-country").value;
  const banco = document.getElementById("new-account-banco").value.trim();
  const telefono = document.getElementById("new-account-telefono").value.trim();
  const rif = document.getElementById("new-account-rif").value.trim();
  const adminPass = document.getElementById("new-account-pass-admin").value.trim();
  const empPass = document.getElementById("new-account-pass-emp").value.trim();
  const referidoElegido = document.getElementById("new-account-ref-select").value.trim();
  const payMode = document.getElementById("new-account-pay-mode").value;
  
  let modulosSeleccionados = [];
  if (document.getElementById("mod-chk-comercio").checked) modulosSeleccionados.push("Inventario / Comercio");
  if (document.getElementById("mod-chk-hotel").checked) modulosSeleccionados.push("Hotelería");
  if (document.getElementById("mod-chk-citas").checked) modulosSeleccionados.push("Citas y Agendas");

  if (!bizName || !adminPass || !empPass || modulosSeleccionados.length === 0) {
    return alert("Completa todos los campos y selecciona al menos un módulo.");
  }

  let precioTotal = 0;
  let modulosSelCount = 0;
  modulosSeleccionados.forEach(m => {
    if (m === "Inventario / Comercio") { precioTotal += 20; modulosSelCount++; }
    if (m === "Hotelería") { precioTotal += 35; modulosSelCount++; }
    if (m === "Citas y Agendas") { precioTotal += 30; modulosSelCount++; }
  });

  if (modulosSelCount >= 3) precioTotal = 75; // Combo de 3 módulos = $75 USD
  else if (modulosSelCount === 2 && modulosSeleccionados.includes("Inventario / Comercio") && modulosSeleccionados.includes("Citas y Agendas")) precioTotal = 40;

  let id = bizName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random()*1000);
  let adminKey = "biz_" + id + "_admin";
  let empKey = "biz_" + id + "_emp";
  let expiryStr = calcularFechaLicenciaUnMesDia4();
  let codigoRefFinal = referidoElegido || localStorage.getItem("gams_ref_active") || "";

  negociosRegistry.push({ 
    id, bizName, pais, banco, telefono, rif, 
    modules: modulosSeleccionados, precioLicenciaBase: precioTotal, precioLicencia: precioTotal,
    dbTarget: "NUEVA", adminKey, adminPass, empKey, empPass, status: "ACTIVO", 
    expiry: expiryStr, refCode: codigoRefFinal, payMode, empleadosExtra: []
  });

  if (codigoRefFinal) registrarPuntoReferidoAutomatico(codigoRefFinal, precioTotal);

  await saveNegociosRegistry(negociosRegistry);
  mostrarGestionCuentas();
  alert(`🎉 Negocio multimodular "${bizName}" (${pais}) registrado con éxito.`);
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

window.actualizarPreviaUrl = function(url) {
  if (url.trim()) {
    document.getElementById("img-preview-tag").src = url.trim();
    document.getElementById("img-preview-box").style.display = "block";
  }
};

window.limpiarImagenCargada = function() {
  document.getElementById("prod-img").value = "";
  document.getElementById("img-preview-box").style.display = "none";
};

window.calcularConversionBsAUSD = async function(inputBsId, outputSpanId) {
  const inputBs = document.getElementById(inputBsId);
  const spanUsd = document.getElementById(outputSpanId);
  if (!inputBs || !spanUsd) return;

  let montoBs = parseFloat(inputBs.value) || 0;
  let tasas = await getTasas(currentAccountKey);
  let tasaDolar = tasas.dolar || 36.50;
  let montoUsd = tasaDolar > 0 ? (montoBs / tasaDolar) : 0;

  spanUsd.innerText = `$${montoUsd.toFixed(2)} USD`;
};

window.createProd = async function() {
  const barcode = document.getElementById("prod-barcode").value.trim();
  const name = document.getElementById("prod-name").value.trim();
  const img = document.getElementById("prod-img").value.trim() || defaultImgPlaceholder;
  if (!barcode || !name) return alert("Ingresa el código SKU y el nombre del elemento.");

  let curr = await getDbItems(currentAccountKey);
  let tasas = await getTasas(currentAccountKey);
  let tasaDolar = tasas.dolar || 36.50;

  if (activeModule === "HOTEL") {
    let p1hBs = parseFloat(document.getElementById("price-1h-bs").value) || 0;
    let p3hBs = parseFloat(document.getElementById("price-3h-bs").value) || 0;
    let pNocheBs = parseFloat(document.getElementById("price-noche-bs").value) || 0;
    let pDiaBs = parseFloat(document.getElementById("price-dia-bs").value) || 0;
    let pSemanaBs = parseFloat(document.getElementById("price-semana-bs").value) || 0;

    curr.push({
      date: new Date().toLocaleDateString(), barcode, name, img,
      camas: parseInt(document.getElementById("room-camas").value) || 1,
      banos: parseInt(document.getElementById("room-banos").value) || 1,
      desc: document.getElementById("room-desc").value.trim() || "Estándar",
      stock: 1, 
      p1h: p1hBs / tasaDolar, p1hBs,
      p3h: p3hBs / tasaDolar, p3hBs,
      pNoche: pNocheBs / tasaDolar, pNocheBs,
      pDia: pDiaBs / tasaDolar, pDiaBs,
      pSemana: pSemanaBs / tasaDolar, pSemanaBs
    });
  } else {
    let precioBs = parseFloat(document.getElementById("prod-price-bs").value) || 0;
    let priceUsd = tasaDolar > 0 ? (precioBs / tasaDolar) : 0;

    curr.push({
      date: new Date().toLocaleDateString(), barcode, name, img,
      stock: parseInt(document.getElementById("prod-stock").value) || 0,
      priceUsd, precioBs
    });
  }

  await saveDbItems(currentAccountKey, curr);
  await registrarTransaccionDiaria(currentAccountKey, "ALTA", `Nuevo registro: ${name} (SKU: ${barcode})`, 0);
  limpiarImagenCargada();
  
  document.getElementById("prod-barcode").value = "";
  document.getElementById("prod-name").value = "";
  document.getElementById("prod-img").value = "";
  if(document.getElementById("room-camas")) document.getElementById("room-camas").value = "";
  if(document.getElementById("room-banos")) document.getElementById("room-banos").value = "";
  if(document.getElementById("room-desc")) document.getElementById("room-desc").value = "";
  if(document.getElementById("price-1h-bs")) { document.getElementById("price-1h-bs").value = ""; document.getElementById("lbl-conv-1h").innerText = "$0.00 USD"; }
  if(document.getElementById("price-3h-bs")) { document.getElementById("price-3h-bs").value = ""; document.getElementById("lbl-conv-3h").innerText = "$0.00 USD"; }
  if(document.getElementById("price-noche-bs")) { document.getElementById("price-noche-bs").value = ""; document.getElementById("lbl-conv-noche").innerText = "$0.00 USD"; }
  if(document.getElementById("price-dia-bs")) { document.getElementById("price-dia-bs").value = ""; document.getElementById("lbl-conv-dia").innerText = "$0.00 USD"; }
  if(document.getElementById("price-semana-bs")) { document.getElementById("price-semana-bs").value = ""; document.getElementById("lbl-conv-semana").innerText = "$0.00 USD"; }
  if(document.getElementById("prod-stock")) document.getElementById("prod-stock").value = "";
  if(document.getElementById("prod-price-bs")) { document.getElementById("prod-price-bs").value = ""; document.getElementById("lbl-conv-prod").innerText = "$0.00 USD"; }

  alert("¡Elemento guardado con éxito!");
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