/* Herramientas SFI Industrial: dimensionador, renta vs. compra y selector guiado */
(function () {
  'use strict';

  /* ====== CONFIGURACIÓN: edita estos valores ====== */
  var CFG = {
    whatsapp: '52XXXXXXXXXX',          // Tu número con lada país, sin + ni espacios
    cotizacion: 'cotizacion.html',     // Ruta de tu página de Cotización
    moneda: 'MXN'
  };
  var SIZES = [20, 30, 40, 60, 80, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 750, 900, 1000, 1200];

  /* ====== Utilidades ====== */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n, d) { return n.toLocaleString('es-MX', { maximumFractionDigits: d || 0 }); };
  var money = function (n) { return '$' + fmt(n) + ' ' + CFG.moneda; };
  var num = function (sel) { return parseFloat($(sel).value) || 0; };
  var wa = function (msg) { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg); };

  if (!$('#herramientas')) return;

  /* ====== Pestañas ====== */
  var tabs = $$('.sfi-tab'), panels = $$('.sfi-panel');
  function showTab(id) {
    tabs.forEach(function (t) {
      var on = t.id === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('aria-labelledby') !== id;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.id); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      n = (n + tabs.length) % tabs.length;
      tabs[n].focus(); showTab(tabs[n].id);
    });
  });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (!g) return;
    showTab(g.getAttribute('data-goto'));
    $('.sfi-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ====== 1. DIMENSIONADOR ====== */
  var rowsEl = $('#sfi-rows');
  function addRow(tipo) {
    var d = document.createElement('div');
    d.className = 'sfi-row';
    d.innerHTML =
      '<select class="sfi-r-tipo" aria-label="Tipo de carga">' +
        '<option value="motor">Motor o bomba</option>' +
        '<option value="clima">Aire acondicionado</option>' +
        '<option value="luz">Iluminación</option>' +
        '<option value="otro">Equipos electrónicos y otros</option>' +
      '</select>' +
      '<input class="sfi-r-cant" type="number" min="1" value="1" inputmode="numeric" aria-label="Cantidad">' +
      '<input class="sfi-r-pot" type="number" min="0" step="any" inputmode="decimal" placeholder="Potencia" aria-label="Potencia">' +
      '<select class="sfi-r-uni" aria-label="Unidad"><option value="kw">kW</option><option value="hp">HP</option></select>' +
      '<button type="button" class="sfi-r-del" aria-label="Quitar esta carga">×</button>';
    if (tipo) $('.sfi-r-tipo', d).value = tipo;
    $('.sfi-r-del', d).addEventListener('click', function () {
      if (rowsEl.children.length > 1) d.remove();
    });
    rowsEl.appendChild(d);
  }
  addRow('motor');
  addRow('luz');
  $('#sfi-add').addEventListener('click', function () { addRow(); });

  $('#sfi-gen-btn').addEventListener('click', function () {
    var out = $('#sfi-gen-out');
    var arranque = parseFloat($('#sfi-arranque').value);
    var simult = parseFloat($('#sfi-simult').value) / 100;
    var total = 0, maxInc = 0, hay = false;

    $$('.sfi-row', rowsEl).forEach(function (r) {
      var tipo = $('.sfi-r-tipo', r).value;
      var cant = parseFloat($('.sfi-r-cant', r).value) || 0;
      var pot = parseFloat($('.sfi-r-pot', r).value) || 0;
      if (!cant || !pot) return;
      hay = true;
      var kw = $('.sfi-r-uni', r).value === 'hp' ? pot * 0.746 : pot;
      if (tipo === 'motor') kw = kw / 0.9;                 // de potencia mecánica a eléctrica
      var f = tipo === 'motor' ? arranque : tipo === 'clima' ? 2.5 : 1;
      total += kw * cant;
      maxInc = Math.max(maxInc, kw * (f - 1));             // se asume que arranca un equipo a la vez
    });

    if (!hay) {
      out.innerHTML = '<p class="sfi-error">Agrega al menos una carga con su potencia para calcular.</p>';
      return;
    }

    var base = total * simult;
    var pico = base + maxInc;
    var req = Math.max(base * 1.25, pico);                 // 25% de reserva o el pico de arranque
    var size = null;
    for (var i = 0; i < SIZES.length; i++) { if (SIZES[i] >= req) { size = SIZES[i]; break; } }

    var html;
    if (!size) {
      html = '<p class="sfi-verdict">Tu proyecto requiere más de 1,200 kW (≈ ' + fmt(req) + ' kW).</p>' +
             '<p>Para esta capacidad conviene analizar equipos en paralelo. Escríbenos y lo revisamos contigo.</p>';
    } else {
      var carga = base / size * 100;
      html =
        '<div class="sfi-plate"><p class="sfi-plate__k">Generador recomendado</p>' +
        '<p class="sfi-plate__v">' + fmt(size) + ' <span>kW</span></p>' +
        '<p class="sfi-plate__s">≈ ' + fmt(size / 0.8) + ' kVA (factor de potencia 0.8)</p></div>' +
        '<ul class="sfi-facts">' +
        '<li>Carga en operación estimada: <b>' + fmt(base, 1) + ' kW</b> (' + fmt(carga) + '% del generador).</li>' +
        '<li>Pico por arranque del equipo más exigente: <b>' + fmt(pico, 1) + ' kW</b>.</li>' +
        (carga < 30 ? '<li>Con carga tan baja, un generador diésel puede trabajar ineficiente. Cuéntanos tu caso y te sugerimos la mejor opción.</li>' : '') +
        '</ul>';
    }
    var msg = 'Hola, usé el dimensionador del sitio. Mi carga en operación es de ' + fmt(base, 1) +
              ' kW y el pico de arranque de ' + fmt(pico, 1) + ' kW.' +
              (size ? ' Me sugirió un generador de ' + fmt(size) + ' kW.' : '') + ' Quiero cotizar la renta.';
    html += '<div class="sfi-actions"><a class="sfi-btn" target="_blank" rel="noopener" href="' + wa(msg) + '">Cotizar este generador por WhatsApp</a></div>' +
            '<p class="sfi-note">Es una estimación para orientarte. La capacidad final depende de la altitud, la temperatura, el tipo de carga y las condiciones del sitio; nuestro equipo la confirma contigo antes de la renta.</p>';
    out.innerHTML = html;
  });

  /* ====== 2. RENTA VS. COMPRA ====== */
  $('#sfi-cmp-btn').addEventListener('click', function () {
    var out = $('#sfi-cmp-out');
    var dias = num('#sfi-c-dias'), renta = num('#sfi-c-renta'), precio = num('#sfi-c-compra');
    var anios = num('#sfi-c-anios'), mant = num('#sfi-c-mant'), res = num('#sfi-c-resid');

    if (dias <= 0 || dias > 365 || renta <= 0 || precio <= 0 || anios <= 0) {
      out.innerHTML = '<p class="sfi-error">Completa los días de uso (hasta 365), la tarifa de renta, el precio de compra y los años a evaluar.</p>';
      return;
    }

    var rentaT = dias * renta * anios;
    var compraT = precio + precio * (mant / 100) * anios - precio * (res / 100);
    var eq = Math.ceil(compraT / anios / renta);
    var diff = compraT - rentaT;
    var max = Math.max(rentaT, compraT);

    var veredicto = diff > 0
      ? 'Rentar te ahorra ' + money(diff) + ' en ' + fmt(anios) + (anios === 1 ? ' año.' : ' años.')
      : 'Comprar te ahorra ' + money(-diff) + ' en ' + fmt(anios) + (anios === 1 ? ' año.' : ' años.');
    var punto = eq > 365
      ? 'Aun usándolo todo el año, rentar resulta más barato con estos datos.'
      : 'A partir de unos ' + fmt(eq) + ' días de uso al año, comprar empieza a convenir.';

    out.innerHTML =
      '<p class="sfi-verdict">' + veredicto + '</p>' +
      '<div class="sfi-bars">' +
        '<div><div class="sfi-bar__lbl"><span>Rentar</span><span>' + money(rentaT) + '</span></div>' +
        '<div class="sfi-bar__track"><div class="sfi-bar__fill sfi-bar__fill--rent" data-w="' + (rentaT / max * 100) + '"></div></div></div>' +
        '<div><div class="sfi-bar__lbl"><span>Comprar (costo neto)</span><span>' + money(compraT) + '</span></div>' +
        '<div class="sfi-bar__track"><div class="sfi-bar__fill sfi-bar__fill--buy" data-w="' + (compraT / max * 100) + '"></div></div></div>' +
      '</div>' +
      '<p>' + punto + '</p>' +
      '<div class="sfi-actions"><a class="sfi-btn" target="_blank" rel="noopener" href="' +
        wa('Hola, usé el comparador de renta vs. compra del sitio. Lo usaría unos ' + fmt(dias) + ' días al año. Me gustaría conocer su tarifa de renta.') +
      '">Pedir mi tarifa de renta</a></div>' +
      '<p class="sfi-note">No incluye combustible, operador ni costo de financiamiento, que suelen aplicar igual en ambos casos o a favor de la renta. Cambia los porcentajes para ajustarlo a tu situación.</p>';

    requestAnimationFrame(function () {
      $$('.sfi-bar__fill', out).forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; });
    });
  });

  /* ====== 3. SELECTOR GUIADO ====== */
  var STEPS = [
    { k: 'necesidad', q: '¿Qué necesitas?', o: [['Energía eléctrica', 'energia'], ['Aire comprimido', 'aire'], ['Iluminación', 'luz']] },
    { k: 'proyecto', q: '¿Para qué tipo de proyecto?', o: [['Planta o industria', 'planta'], ['Obra o construcción', 'obra'], ['Evento', 'evento'], ['Emergencia o respaldo', 'emergencia']] },
    { k: 'duracion', q: '¿Por cuánto tiempo?', o: [['De 1 a 3 días', 'corta'], ['De 1 a 4 semanas', 'media'], ['Más de un mes', 'larga']] },
    { k: 'urgencia', q: '¿Cuándo lo necesitas?', o: [['Hoy o mañana', 'urgente'], ['Esta semana', 'semana'], ['Lo estoy planeando', 'plan']] }
  ];
  var EQUIPO = {
    energia: { t: 'Generador', d: 'Rentamos generadores de hasta 1,200 kW. Para elegir la capacidad, usa el dimensionador con tus cargas.' },
    aire: { t: 'Compresor Kaeser', d: 'Contamos con compresores Kaeser. Para elegir el modelo necesitamos el caudal (CFM) y la presión que piden tus herramientas.' },
    luz: { t: 'Torre de iluminación', d: 'Las torres de iluminación cubren áreas de trabajo o eventos sin depender de la red eléctrica.' }
  };
  var TIP_PROY = {
    planta: 'En planta, deja margen para el arranque de motores y confirma si necesitas transferencia automática.',
    obra: 'En obra, avísanos el acceso y la superficie donde se instalará el equipo.',
    evento: 'Para eventos, cuéntanos la ubicación y el horario para planear la entrega y el nivel de ruido.',
    emergencia: 'Si es una emergencia, escríbenos por WhatsApp para atención inmediata.'
  };
  var TIP_DUR = {
    corta: 'Para pocos días, la renta suele ser la opción más práctica.',
    media: 'Cotiza el periodo completo en lugar de día por día.',
    larga: 'Para más de un mes, compara renta contra compra antes de decidir.'
  };

  var box = $('#sfi-sel'), ans = {}, step = 0;

  function renderStep(focus) {
    if (step >= STEPS.length) return renderResult();
    var s = STEPS[step];
    var h = '<p class="sfi-prog">Pregunta ' + (step + 1) + ' de ' + STEPS.length + '</p>' +
            '<h3 id="sfi-q" tabindex="-1">' + s.q + '</h3><div class="sfi-opt-grid">';
    s.o.forEach(function (o, i) {
      h += '<button type="button" class="sfi-choice" data-i="' + i + '">' + o[0] + '</button>';
    });
    h += '</div>' + (step > 0 ? '<button type="button" class="sfi-link" id="sfi-back">Volver</button>' : '');
    box.innerHTML = h;
    if (focus) $('#sfi-q').focus();
  }

  function renderResult() {
    var eq = EQUIPO[ans.necesidad[1]];
    var urgente = ans.urgencia[1] === 'urgente';
    var msg = 'Hola, necesito ' + eq.t.toLowerCase() + ' para ' + ans.proyecto[0].toLowerCase() +
              ', por ' + ans.duracion[0].toLowerCase() + '. Lo necesito: ' + ans.urgencia[0].toLowerCase() + '.';
    var extra = '';
    if (ans.necesidad[1] === 'energia') extra += '<button type="button" class="sfi-btn sfi-btn--ghost" data-goto="sfi-t-gen">Dimensionar mi generador</button>';
    if (ans.duracion[1] === 'larga') extra += '<button type="button" class="sfi-btn sfi-btn--ghost" data-goto="sfi-t-cmp">Comparar renta y compra</button>';

    box.innerHTML =
      '<h3 id="sfi-q" tabindex="-1">Te recomendamos: ' + eq.t + '</h3>' +
      '<p class="sfi-lead">' + eq.d + '</p>' +
      '<ul class="sfi-tips"><li>' + TIP_PROY[ans.proyecto[1]] + '</li><li>' + TIP_DUR[ans.duracion[1]] + '</li></ul>' +
      '<div class="sfi-actions">' +
        '<a class="sfi-btn" target="_blank" rel="noopener" href="' + wa(msg) + '">' + (urgente ? 'Escribir por WhatsApp ahora' : 'Cotizar por WhatsApp') + '</a>' +
        '<a class="sfi-btn sfi-btn--ghost" href="' + CFG.cotizacion + '">Ir a la página de cotización</a>' + extra +
      '</div>' +
      '<button type="button" class="sfi-link" id="sfi-reset">Empezar de nuevo</button>';
    $('#sfi-q').focus();
  }

  box.addEventListener('click', function (e) {
    var c = e.target.closest('.sfi-choice');
    if (c) {
      var s = STEPS[step];
      ans[s.k] = s.o[parseInt(c.getAttribute('data-i'), 10)];
      step++; renderStep(true); return;
    }
    if (e.target.id === 'sfi-back') { step--; renderStep(true); return; }
    if (e.target.id === 'sfi-reset') { step = 0; ans = {}; renderStep(true); }
  });
  renderStep(false);
})();
