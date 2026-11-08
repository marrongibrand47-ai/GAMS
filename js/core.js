// Añadir al final de js/core.js o en la inicialización de DOMContentLoaded:
window.addEventListener('DOMContentLoaded', () => {
  // Crear botón flotante de Modo Oscuro si no existe
  if (!document.getElementById("darkModeToggleBtn")) {
    const btnDark = document.createElement("button");
    btnDark.id = "darkModeToggleBtn";
    btnDark.className = "dark-mode-toggle-btn";
    btnDark.innerHTML = "🌙";
    btnDark.title = "Cambiar Modo Oscuro / Claro en este dispositivo";
    btnDark.onclick = toggleDarkModeDevice;
    document.body.appendChild(btnDark);
  }

  // Cargar preferencia guardada en este dispositivo
  let modoOscuroActivo = localStorage.getItem("gams_dark_mode_device") === "true";
  if (modoOscuroActivo) {
    document.body.classList.add("dark-mode");
    document.getElementById("darkModeToggleBtn").innerHTML = "☀️";
  }
});

function toggleDarkModeDevice() {
  let esOscuro = document.body.classList.toggle("dark-mode");
  localStorage.setItem("gams_dark_mode_device", esOscuro);
  const btn = document.getElementById("darkModeToggleBtn");
  if (btn) {
    btn.innerHTML = esOscuro ? "☀️" : "🌙";
  }
}