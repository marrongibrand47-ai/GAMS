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

const defaultNegocios = [
  { id: "hotel_costa_real", bizName: "Hotel Costa Real", type: "Hotelería", dbTarget: "NUEVA", adminKey: "hotel_mama1", adminPass: "mama1", empKey: "hotel_empleado1", empPass: "empleado1", status: "ACTIVO", expiry: "2030-12-04" },
  { id: "comercio_abastos_gams", bizName: "Comercializadora & Abastos GAMS", type: "Inventario / Comercio", dbTarget: "VIEJA", adminKey: "comercio_comercio123", adminPass: "comercio123", empKey: "comercio_empleadocomercio123", empPass: "empleadocomercio123", status: "ACTIVO", expiry: "2030-12-04" }
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
  transacciones.unshift({ fecha: new Date().toLocaleString(), tipo, detalle, monto, usuario: userRole === "SUPERVISOR" ? "Supervisor" : "Administrador" });
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
  alert(`¡Tasas oficiales guardadas con éxito!`);
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
      matchedRole = n.type === "Hotelería" ? "ADMIN_HOTEL" : "ADMIN_COMERCIO";
      currentAccountKey = n.adminKey;
      break;
    } else if (n.empPass === inpVal || n.empKey === inpVal) {
      foundNeg = n;
      matchedRole = n.type === "Hotelería" ? "EMPLEADO_HOTEL" : "EMPLEADO_COMERCIO";
      currentAccountKey = n.empKey;
      break;
    }
  }

  if (foundNeg) {
    saveAndReload(matchedRole, foundNeg.type === "Hotelería" ? "HOTEL" : "COMERCIO", currentAccountKey);
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
    if(window.cargarVistaCitas) cargarVistaCitas();
  } else if (mod === "REFERIDOS") {
    document.getElementById("modulo-referidos-container").classList.remove("hidden");
    if(window.renderModuloReferidos) window.renderModuloReferidos();
    if(window.cargarVistaReferidos) cargarVistaReferidos();
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

  if (activeModule === "HOTEL") {
    document.body.className = "theme-hotel";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "🏨";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Hotelería";
    if(hotelNav) hotelNav.classList.remove("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
  } else if (activeModule === "COMERCIO") {
    document.body.className = "theme-comercio";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "📦";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Comercio";
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.remove("hidden");
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
      cleanRoleTxt = currentAccountKey === matchedNeg.adminKey ? "Administrador" : "Empleado";
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

  // Habilitar panel de divisas para SUPERVISOR y ADMINISTRADORES
  const divisaPanel = document.getElementById("divisa-admin-panel");
  const formAction = document.getElementById("container-actions-form");
  if (divisaPanel) {
    if (userRole === "SUPERVISOR" || userRole.includes("ADMIN")) {
      divisaPanel.style.display = "block";
      if(formAction) formAction.style.display = "block";
    } else {
      divisaPanel.style.display = "none";
      if(formAction) formAction.style.display = "none";
    }
  }
}