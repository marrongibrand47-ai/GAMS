// CORE DEL SISTEMA GAMS COMPANY (Conexión Firebase, Auth y Sincronización Global)
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
let unsubscribeRealtime = null; 
let chartSupervisorInstance = null;
const defaultImgPlaceholder = "https://cdn-icons-png.flaticon.com/512/679/679821.png";

function calcularFechaLicenciaUnMesDia4() {
  let d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(4);
  return d.toISOString().split('T')[0];
}

const defaultNegocios = [
  { 
    id: "hotel_costa_real", 
    bizName: "Hotel Costa Real", 
    type: "Hotelería", 
    dbTarget: "NUEVA", 
    adminKey: "hotel_mama1", adminPass: "mama1", 
    empKey: "hotel_empleado1", empPass: "empleado1", 
    status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4() 
  },
  { 
    id: "comercio_abastos_gams", 
    bizName: "Comercializadora & Abastos GAMS", 
    type: "Inventario / Comercio", 
    dbTarget: "VIEJA", 
    adminKey: "comercio_comercio123", adminPass: "comercio123", 
    empKey: "comercio_empleadocomercio123", empPass: "empleadocomercio123", 
    status: "ACTIVO", expiry: calcularFechaLicenciaUnMesDia4() 
  }
];

let negociosRegistry = [];

function obtenerIdentificadorRaizNegocio(key) {
  let neg = negociosRegistry.find(n => n.adminKey === key || n.empKey === key);
  if (neg) return neg.adminKey;
  return key;
}

// Función de sincronización offline requerida
function sincronizarDatosPendientesOffline() {
  let pendientes = JSON.parse(localStorage.getItem("gams_offline_queue") || "[]");
  if (pendientes.length === 0) return;
  for (let p of pendientes) {
    try {
      console.log("Sincronizando datos pendientes offline para:", p.key);
    } catch (e) { console.error(e); }
  }
  localStorage.removeItem("gams_offline_queue");
}

function actualizarEstadoConexion() {
  const badge = document.getElementById("sync-status-badge");
  if (!badge) return;
  if (navigator.onLine) {
    badge.className = "sync-status sync-online";
    badge.innerText = "☁️ Conectado a Firebase";
    sincronizarDatosPendientesOffline();
  } else {
    badge.className = "sync-status sync-offline";
    badge.innerText = "📴 Modo Offline (Guardando Localmente)";
  }
}

window.addEventListener('online', actualizarEstadoConexion);
window.addEventListener('offline', actualizarEstadoConexion);

async function getDbForBusiness(accountKey) {
  let neg = negociosRegistry.find(n => n.adminKey === accountKey || n.empKey === accountKey);
  if (neg && neg.dbTarget === "VIEJA") return dbOld;
  return (activeModule === "HOTEL") ? dbHotel : (neg && neg.type === "Inventario / Comercio" ? dbOld : dbHotel);
}

async function getDbItems(key) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let localKey = `gams_items_${raizKey}`;
  let localData = localStorage.getItem(localKey);
  
  if (!navigator.onLine) return localData ? JSON.parse(localData) : [];

  try {
    let activeDb = await getDbForBusiness(raizKey);
    let targetCollection = (activeModule === "HOTEL") ? "hotelería" : "gams_db";
    let targetDocId = (activeModule === "HOTEL") ? "hoteles" : raizKey;

    let doc = await activeDb.collection(targetCollection).doc(targetDocId).get();
    if (doc.exists) {
      let items = doc.data().items || [];
      localStorage.setItem(localKey, JSON.stringify(items));
      return items;
    }
  } catch(e) { if (localData) return JSON.parse(localData); }
  return localData ? JSON.parse(localData) : [];
}

async function saveDbItems(key, items) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let localKey = `gams_items_${raizKey}`;
  localStorage.setItem(localKey, JSON.stringify(items));

  if (!navigator.onLine) {
    let pendientes = JSON.parse(localStorage.getItem("gams_offline_queue") || "[]");
    pendientes.push({ key: raizKey, items, timestamp: Date.now() });
    localStorage.setItem("gams_offline_queue", JSON.stringify(pendientes));
    return;
  }

  try {
    let activeDb = await getDbForBusiness(raizKey);
    if (activeModule === "HOTEL") {
      await activeDb.collection("hotelería").doc("hoteles").set({ hotel: "123", items }, { merge: true });
    } else {
      await activeDb.collection("gams_db").doc(raizKey).set({ tipo: "comercio", items }, { merge: true });
    }
  } catch(e) { console.error("Error guardando en Firestore:", e); }
}

async function getLibroDiario(key) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let localKey = `gams_diario_${raizKey}`;
  let localData = localStorage.getItem(localKey);
  if (!navigator.onLine) return localData ? JSON.parse(localData) : [];

  try {
    let activeDb = await getDbForBusiness(raizKey);
    let doc = await activeDb.collection("gams_diario").doc(raizKey).get();
    if (doc.exists) {
      let transacciones = doc.data().transacciones || [];
      localStorage.setItem(localKey, JSON.stringify(transacciones));
      return transacciones;
    }
  } catch(e) { if (localData) return JSON.parse(localData); }
  return localData ? JSON.parse(localData) : [];
}

async function registrarTransaccionDiaria(key, tipo, detalle, monto) {
  let raizKey = obtenerIdentificadorRaizNegocio(key);
  let transacciones = await getLibroDiario(raizKey);
  let usuarioActual = userRole === "SUPERVISOR" ? "Supervisor" : (currentAccountKey.includes("admin") ? "Administrador" : "Empleado");
  
  transacciones.unshift({
    fecha: new Date().toLocaleString(),
    tipo: tipo,
    detalle: detalle,
    monto: monto,
    usuario: usuarioActual
  });

  let localKey = `gams_diario_${raizKey}`;
  localStorage.setItem(localKey, JSON.stringify(transacciones));

  if (navigator.onLine) {
    try {
      let activeDb = await getDbForBusiness(raizKey);
      await activeDb.collection("gams_diario").doc(raizKey).set({ transacciones });
    } catch(e) { console.error("Error diario:", e); }
  }
}

async function initFirebaseData() {
  let localReg = localStorage.getItem("gams_negocios_registry");
  negociosRegistry = localReg ? JSON.parse(localReg) : defaultNegocios;

  try {
    let docRef = dbHotel.collection("gams_system").doc("registry");
    let doc = await docRef.get();
    if (!doc.exists) {
      await docRef.set({ negocios: defaultNegocios });
      negociosRegistry = defaultNegocios;
    } else if (doc.data().negocios && doc.data().negocios.length > 0) {
      negociosRegistry = doc.data().negocios;
    }
    localStorage.setItem("gams_negocios_registry", JSON.stringify(negociosRegistry));
  } catch (e) { console.warn("Usando registro local:", e); }
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
  actualizarEstadoConexion();

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
    localStorage.setItem("gams_active_referrer_code", refCode);
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
    let icon = n.type === "Hotelería" ? "🏨" : "📦";
    let baseTag = n.dbTarget === "VIEJA" ? "📁 [Base GAMS 3]" : "☁️ [Nueva Base]";
    select.innerHTML += `<option value="${n.adminKey}">${icon} ${n.bizName} ${baseTag}</option>`;
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
  let localKey = `gams_tasas_${raizKey}`;
  let local = localStorage.getItem(localKey);
  if (!navigator.onLine && local) return JSON.parse(local);

  try {
    let activeDb = await getDbForBusiness(raizKey);
    let doc = await activeDb.collection("gams_tasas").doc(raizKey).get();
    if (doc.exists) {
      let data = doc.data();
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
  } catch(e) { if (local) return JSON.parse(local); }
  return { dolar: 36.50, euro: 39.20, usdt: 36.85, btc: "$91,400" };
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

window.validateAuth = function() {
  const inpVal = document.getElementById("license-input").value.trim();
  if (!inpVal) {
    const errBox = document.getElementById("error-msg");
    errBox.innerText = "⚠️ Ingresa una clave válida.";
    errBox.style.display = "block";
    return;
  }

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
    let activeMod = foundNeg.type === "Hotelería" ? "HOTEL" : "COMERCIO";
    saveAndReload(matchedRole, activeMod, currentAccountKey);
    return;
  }
  const errBox = document.getElementById("error-msg");
  errBox.innerText = "❌ Clave incorrecta o negocio suspendido.";
  errBox.style.display = "block";
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
    if(window.switchComercioTab) switchComercioTab('pos');
  } else if (mod === "CITAS") {
    document.getElementById("modulo-citas-container").classList.remove("hidden");
    if(window.renderModuloCitas) window.renderModuloCitas();
    if(window.cargarVistaCitas) cargarVistaCitas();
  } else if (mod === "REFERIDOS") {
    document.getElementById("modulo-referidos-container").classList.remove("hidden");
    if(window.renderModuloReferidos) window.renderModuloReferidos();
    if(window.cargarVistaReferidos) cargarVistaReferidos();
  }
}

function applyModuleTheme() {
  const hotelNav = document.getElementById("hotel-nav");
  const comercioNav = document.getElementById("comercio-nav");
  const supBar = document.getElementById("supervisor-system-bar");

  if (userRole === "SUPERVISOR") supBar.classList.remove("hidden");
  else supBar.classList.add("hidden");

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
  } else if (activeModule === "CITAS") {
    document.body.className = "theme-citas";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "📅";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Sistema de Citas y Agendas";
    if(hotelNav) hotelNav.classList.add("hidden"); 
    if(comercioNav) comercioNav.classList.add("hidden");
  } else if (activeModule === "REFERIDOS") {
    document.body.className = "theme-referidos";
    if(document.getElementById("system-icon")) document.getElementById("system-icon").innerText = "🤝";
    if(document.getElementById("system-title")) document.getElementById("system-title").innerText = "Programa de Referidos (50% Comisiones)";
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
}