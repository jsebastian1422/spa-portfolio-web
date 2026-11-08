/**
 * spa-portfolio-web — comportamiento de la página (JS vanilla, sin dependencias).
 * Todo el contenido vive en el HTML generado; este archivo solo añade interacción.
 * El número de WhatsApp y las plantillas de mensajes llegan en el bloque
 * <script type="application/json" id="config-sitio"> que genera el build.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ WhatsApp */
  /**
   * Lee la configuración del sitio embebida por el build.
   * @returns {Object|null} Objeto con "whatsapp" (string) y "mensajes" (mapa de plantillas), o null.
   */
  function leerConfig() {
    const el = document.getElementById('config-sitio');
    if (!el) return null;
    try {
      const cfg = JSON.parse(el.textContent);
      return cfg && cfg.whatsapp && cfg.mensajes ? cfg : null;
    } catch (e) {
      return null;
    }
  }

  const CONFIG = leerConfig();

  /**
   * Construye el enlace de WhatsApp con el mensaje codificado.
   * @param {string} mensaje Texto prellenado del chat.
   * @returns {string} URL de wa.me.
   */
  function buildWaUrl(mensaje) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(mensaje);
  }

  /**
   * Devuelve el mensaje según el tipo de enlace (data-wa) y su nombre (data-wa-nombre).
   * @param {string} tipo general | diagnostico | servicio | depilacion | producto
   * @param {string} [nombre] Nombre del servicio o producto.
   * @returns {string|null}
   */
  function mensajeWa(tipo, nombre) {
    const m = CONFIG.mensajes[tipo];
    if (!m) return null;
    if (m.indexOf('{nombre}') === -1) return m;
    return nombre ? m.split('{nombre}').join(nombre) : null;
  }

  /** Reescribe todos los enlaces de WhatsApp con la configuración del sitio (los href del HTML son respaldo). */
  function initWhatsApp() {
    if (!CONFIG) return;
    document.querySelectorAll('a[data-wa]').forEach(function (a) {
      const mensaje = mensajeWa(a.dataset.wa, a.dataset.waNombre);
      if (mensaje) a.href = buildWaUrl(mensaje);
    });
  }

  /* --------------------------------------------------------------------- Menú */
  /** Menú hamburguesa accesible (móvil). */
  function initMenu() {
    const boton = document.querySelector('.menu-toggle');
    const nav = document.getElementById('menu-principal');
    if (!boton || !nav) return;

    function cerrar(devolverFoco) {
      nav.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
      if (devolverFoco) boton.focus();
    }

    boton.addEventListener('click', function () {
      const abierto = nav.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', String(abierto));
      boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) cerrar(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('abierto')) cerrar(true);
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) {
      if (e.matches) cerrar(false);
    });
  }

  /** Reduce el logo del encabezado al hacer scroll (escritorio). */
  function initHeaderCompacto() {
    const header = document.querySelector('.header');
    if (!header) return;
    function actualizar() {
      header.classList.toggle('header--compacto', window.scrollY > 80);
    }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  }

  /* ------------------------------------------------------------------- Filtro */
  /** Filtro de categorías del catálogo (botones con aria-pressed). */
  function initFiltro() {
    const botones = document.querySelectorAll('.filtro[data-filtro]');
    const articulos = document.querySelectorAll('#servicios .servicio');
    const grupos = document.querySelectorAll('#servicios .categoria');
    const anuncio = document.querySelector('[data-anuncio-filtro]');
    if (!botones.length) return;

    /**
     * Muestra solo los servicios de una categoría y oculta los grupos que quedan vacíos.
     * @param {string} cat todos | facial | bienestar | belleza | corporal
     */
    function aplicar(cat) {
      let visibles = 0;
      articulos.forEach(function (art) {
        const coincide = cat === 'todos' || art.dataset.categoria === cat;
        art.hidden = !coincide;
        if (coincide) visibles += 1;
      });
      grupos.forEach(function (g) {
        g.hidden = !g.querySelector('.servicio:not([hidden])');
      });
      botones.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.filtro === cat));
      });
      if (anuncio) anuncio.textContent = 'Mostrando ' + visibles + ' servicios.';
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () { aplicar(b.dataset.filtro); });
    });
    // Enlaces de "Nuestras líneas": aplican el filtro y el ancla hace el scroll.
    document.querySelectorAll('a[data-filtro]').forEach(function (a) {
      a.addEventListener('click', function () { aplicar(a.dataset.filtro); });
    });
  }

  /* ------------------------------------------------------------------- Dialog */
  /** Detalle de servicio con <dialog> nativo: Esc, botón, clic en el fondo; devuelve el foco. */
  function initDialogs() {
    if (typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
    let disparador = null;

    document.querySelectorAll('a[data-abrir]').forEach(function (enlace) {
      const dialogo = document.getElementById(enlace.dataset.abrir);
      if (!dialogo) return;

      enlace.addEventListener('click', function (e) {
        e.preventDefault();
        disparador = enlace;
        dialogo.showModal();
        document.body.classList.add('sin-scroll');
        const cerrar = dialogo.querySelector('[data-cerrar]');
        if (cerrar) cerrar.focus();
        const cuerpo = dialogo.querySelector('.detalle__cuerpo');
        if (cuerpo) cuerpo.scrollTop = 0;
      });

      dialogo.addEventListener('click', function (e) {
        // Clic en el fondo (backdrop): el objetivo es el propio <dialog>.
        if (e.target === dialogo) dialogo.close();
        if (e.target.closest('[data-cerrar]')) dialogo.close();
      });
      dialogo.addEventListener('close', function () {
        document.body.classList.remove('sin-scroll');
        if (disparador) disparador.focus();
      });
    });
  }

  /* ------------------------------------------------------ Toggle Mujer/Hombre */
  /** Alterna la columna de precios de depilación; en Hombre oculta las zonas sin precio. */
  function initToggleDepilacion() {
    const tabla = document.getElementById('tabla-zonas');
    const botones = document.querySelectorAll('.toggle__btn[data-vista]');
    const anuncio = document.querySelector('[data-anuncio-vista]');
    if (!tabla || !botones.length) return;

    /**
     * @param {string} vista mujer | hombre
     * @param {boolean} anunciar Si se debe actualizar la región aria-live.
     */
    function aplicar(vista, anunciar) {
      tabla.dataset.vista = vista;
      let zonas = 0;
      tabla.querySelectorAll('tbody tr').forEach(function (fila) {
        const sinPrecio = vista === 'hombre' && fila.hasAttribute('data-hombre');
        fila.hidden = sinPrecio;
        if (!sinPrecio) zonas += 1;
      });
      botones.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.vista === vista));
      });
      if (anunciar && anuncio) {
        anuncio.textContent = 'Mostrando precios para ' + (vista === 'hombre' ? 'hombre' : 'mujer') + ': ' + zonas + ' zonas.';
      }
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () { aplicar(b.dataset.vista, true); });
    });
    aplicar('mujer', false);
  }

  /* ----------------------------------------------------------------- Lightbox */
  /** Lightbox de la galería (solo si existen enlaces ".galeria a"): flechas, teclado, swipe, Esc y fondo. */
  function initLightbox() {
    const enlaces = Array.prototype.slice.call(document.querySelectorAll('.galeria a'));
    if (!enlaces.length || typeof HTMLDialogElement === 'undefined') return;

    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Galería de fotos');
    dlg.innerHTML =
      '<div class="lightbox__marco">' +
      '<button type="button" class="lightbox__btn lightbox__cerrar" aria-label="Cerrar galería">&times;</button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Foto anterior">&#8249;</button>' +
      '<img class="lightbox__img" alt="">' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="Foto siguiente">&#8250;</button>' +
      '<p class="lightbox__cuenta" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(dlg);

    const img = dlg.querySelector('.lightbox__img');
    const cuenta = dlg.querySelector('.lightbox__cuenta');
    let indice = 0;
    let disparador = null;
    let inicioX = null;

    function mostrar(i) {
      indice = (i + enlaces.length) % enlaces.length;
      const enlace = enlaces[indice];
      const miniatura = enlace.querySelector('img');
      img.src = enlace.getAttribute('href');
      img.alt = miniatura ? miniatura.alt : '';
      cuenta.textContent = (indice + 1) + ' / ' + enlaces.length;
    }

    enlaces.forEach(function (enlace, i) {
      enlace.addEventListener('click', function (e) {
        e.preventDefault();
        disparador = enlace;
        mostrar(i);
        dlg.showModal();
        document.body.classList.add('sin-scroll');
      });
    });

    dlg.addEventListener('click', function (e) {
      if (e.target.closest('.lightbox__cerrar') || e.target === dlg || e.target.classList.contains('lightbox__marco')) dlg.close();
      else if (e.target.closest('.lightbox__prev')) mostrar(indice - 1);
      else if (e.target.closest('.lightbox__next')) mostrar(indice + 1);
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrar(indice - 1);
      if (e.key === 'ArrowRight') mostrar(indice + 1);
    });
    dlg.addEventListener('touchstart', function (e) { inicioX = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (inicioX === null) return;
      const dx = e.changedTouches[0].clientX - inicioX;
      inicioX = null;
      if (Math.abs(dx) > 50) mostrar(indice + (dx < 0 ? 1 : -1));
    }, { passive: true });
    dlg.addEventListener('close', function () {
      document.body.classList.remove('sin-scroll');
      if (disparador) disparador.focus();
    });
  }

  /* ------------------------------------------------------------- Animaciones */
  /** Entrada suave con IntersectionObserver; se desactiva con prefers-reduced-motion. */
  function initAnimaciones() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const objetivos = document.querySelectorAll('.linea, .combo, .producto, .dif, .seccion__cab, .categoria__titulo');
    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    objetivos.forEach(function (el) {
      el.classList.add('anim');
      obs.observe(el);
    });
  }

  /* --------------------------------------------------------------------- Año */
  /** Escribe el año actual en el pie de página. */
  function initAnio() {
    const anio = String(new Date().getFullYear());
    document.querySelectorAll('[data-anio]').forEach(function (el) { el.textContent = anio; });
  }

  /* ------------------------------------------------------------------- Inicio */
  function init() {
    initWhatsApp();
    initMenu();
    initHeaderCompacto();
    initFiltro();
    initDialogs();
    initToggleDepilacion();
    initLightbox();
    initAnimaciones();
    initAnio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
