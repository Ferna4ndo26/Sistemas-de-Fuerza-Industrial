// ============================================================
// Sistemas de Fuerza Industrial — lógica compartida del sitio
// ============================================================

const SFI = {
  whatsappNumber: "528115712636", // formato internacional sin '+' ni espacios
  email: "soporte.rentas01@sfindustrial.mx",
  phoneDisplay: "81 1571 2636",
};

// ---------- nav móvil ----------
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && typeof closeFicha === "function") closeFicha();
});

// ---------- helpers ----------
function fmtCap(item) {
  if (item.cap_valor == null) return { num: "—", unit: item.cap_unidad || "" };
  const num = Number.isInteger(item.cap_valor) ? item.cap_valor : item.cap_valor.toFixed(1);
  return { num, unit: item.cap_unidad || "" };
}

function nameplateHTML(item, idx) {
  const cap = fmtCap(item);
  const marca = item.marca || "Marca s/ especificar";
  const modelo = item.modelo ? `Modelo ${item.modelo}` : "Modelo genérico";
  const cambios = [];
  if (item.cambio_voltaje) cambios.push("Voltaje ajustable");
  if (item.cambio_frecuencia) cambios.push("Frecuencia ajustable");

  const fichaLabel = {
    "Generador": "este generador",
    "Compresor": "este compresor",
    "Torre de Iluminación": "esta torre de iluminación",
  }[item.tipo] || "este equipo";

  const fichaBtn = item.ficha
    ? `<button type="button" class="btn btn-outline btn-block ficha-btn" onclick="openFicha(${item.economico})">Presiona para más información de ${fichaLabel}</button>`
    : "";

  return `
  <div class="nameplate" data-tipo="${item.tipo}" data-marca="${marca}">
    <div class="nameplate-top">
      <div>
        <div class="nameplate-tipo">${item.tipo}</div>
        <div class="nameplate-marca">${marca}</div>
        <div class="nameplate-modelo">${modelo}</div>
      </div>
      <span class="status-pill"><span class="status-dot"></span>Disponible</span>
    </div>
    <div class="nameplate-cap">${cap.num}<span class="u">${cap.unit}</span></div>
    <div class="nameplate-specs">
      <div>Voltaje<br><b>${item.voltaje || "—"}</b></div>
      <div>Frecuencia<br><b>${item.frecuencia || "—"}</b></div>
      <div>Traslado<br><b>${item.traslado || "—"}</b></div>
      <div>Adaptable<br><b>${cambios.length ? cambios.join(" · ") : "Config. fija"}</b></div>
    </div>
    <a class="btn btn-primary btn-block" href="cotizacion.html?tipo=${encodeURIComponent(item.tipo)}&marca=${encodeURIComponent(marca)}&cap=${encodeURIComponent(cap.num + ' ' + cap.unit)}">
      Cotizar este equipo
    </a>
    ${fichaBtn}
  </div>`;
}

// ---------- ficha técnica modal ----------
function fichaField(label, value, unit) {
  if (value === null || value === undefined || value === "") return "";
  return `<div class="ficha-item"><span>${label}</span><b>${value}${unit ? " " + unit : ""}</b></div>`;
}

function openFicha(economico) {
  const item = (typeof EQUIPOS !== "undefined") ? EQUIPOS.find(e => e.economico === economico) : null;
  if (!item || !item.ficha) return;
  const f = item.ficha;
  const overlay = document.getElementById("ficha-overlay");
  if (!overlay) return;

  document.getElementById("ficha-tipo").textContent = item.tipo;
  document.getElementById("ficha-titulo").textContent = item.marca || "Equipo";
  document.getElementById("ficha-modelo-txt").textContent = item.modelo ? `Modelo ${item.modelo}` : "";

  const motorFields = [
    fichaField("Motor", f.motor_marca),
    fichaField("Modelo de motor", f.motor_modelo),
    fichaField("N° de serie del motor", f.motor_serie),
    fichaField("Marca de generador/alternador", f.generador_marca),
    fichaField("Modelo de generador/alternador", f.generador_modelo),
    fichaField("Amperaje máximo", f.amp_max, "A"),
    fichaField("Selector de voltaje", f.selector_volt),
  ].filter(Boolean).join("");

  const capFields = [
    fichaField("Combustible", f.combustible_lts, "L"),
    fichaField("Aceite", f.aceite_lts, "L"),
    fichaField("Anticongelante", f.anticongelante_lts, "L"),
  ].filter(Boolean).join("");

  const dimFields = [
    fichaField("Largo de remolque", f.largo_remolque, "cm"),
    fichaField("Ancho de remolque", f.ancho_remolque, "cm"),
    fichaField("Alto de remolque", f.alto_remolque, "cm"),
    fichaField("Dimensiones de caseta", f.dimensiones_caseta),
    fichaField("Peso del equipo", f.peso_kg, "kg"),
    fichaField("Cantidad de ejes", f.cantidad_ejes),
    fichaField("Modelo de llanta", f.modelo_llanta),
  ].filter(Boolean).join("");

  const infoFields = [
    fichaField("N° de serie del equipo", f.n_serie_equipo),
    fichaField("Horómetro", f.horometro, "hrs"),
    fichaField("Observaciones", f.observaciones),
  ].filter(Boolean).join("");

  const body = document.getElementById("ficha-body");
  body.innerHTML = `
    <div class="ficha-photo-placeholder">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="14" width="36" height="24" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="26" r="4" stroke="currentColor" stroke-width="2"/><path d="M27 20h9M27 26h9M27 32h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <span>Fotos de este equipo próximamente</span>
    </div>
    ${motorFields ? `<div class="ficha-section"><h4>Motor y generador</h4><div class="ficha-grid">${motorFields}</div></div>` : ""}
    ${capFields ? `<div class="ficha-section"><h4>Capacidades</h4><div class="ficha-grid">${capFields}</div></div>` : ""}
    ${dimFields ? `<div class="ficha-section"><h4>Dimensiones y peso</h4><div class="ficha-grid">${dimFields}</div></div>` : ""}
    ${infoFields ? `<div class="ficha-section"><h4>Información adicional</h4><div class="ficha-grid">${infoFields}</div></div>` : ""}
    ${(!motorFields && !capFields && !dimFields && !infoFields) ? `<p class="ficha-empty">Aún no tenemos ficha técnica completa para esta unidad.</p>` : ""}
  `;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeFicha() {
  const overlay = document.getElementById("ficha-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ---------- WhatsApp link builder (usado en cotizacion.html) ----------
function buildWhatsAppLink(message) {
  return `https://wa.me/${SFI.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildMailtoLink(subject, body) {
  return `mailto:${SFI.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
