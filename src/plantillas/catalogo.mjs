/**
 * Catálogo de servicios: filtro, tarjetas y ventanas de detalle.
 */
import { cop, esc, escAttr, inline } from '../util.mjs';
import { ORNAMENTO, hrefWa, icono } from './comun.mjs';

/**
 * Servicios en el orden de publicación: por categoría (orden de categorias) y, dentro, el del archivo.
 * @param {object} ctx
 * @returns {object[]}
 */
export function serviciosOrdenados(ctx) {
  return ctx.servicios.categorias.flatMap((c) => ctx.servicios.servicios.filter((s) => s.categoria === c.id));
}

/**
 * Indica si un servicio es el de diagnóstico (usa el mensaje "diagnostico").
 * @param {object} ctx
 * @param {object} s
 * @returns {boolean}
 */
const esDiagnostico = (ctx, s) => ctx.n.servicioDiagnostico === s.slug;

/**
 * Atributos data-wa de un enlace de reserva.
 * @param {object} ctx
 * @param {object} s
 * @returns {{href: string, attrs: string}}
 */
function reserva(ctx, s) {
  if (esDiagnostico(ctx, s)) return { href: hrefWa(ctx, 'diagnostico'), attrs: 'data-wa="diagnostico"' };
  return { href: hrefWa(ctx, 'servicio', s.nombre), attrs: 'data-wa="servicio" data-wa-nombre="' + escAttr(s.nombre) + '"' };
}

/**
 * Línea de duración y precio.
 * @param {object} s
 * @param {boolean} detalle true para la versión de la ventana de detalle.
 * @returns {string}
 */
function meta(s, detalle) {
  const dur = '<svg class="icono" aria-hidden="true" focusable="false"><use href="#i-reloj"/></svg> ' + esc(s.duracion);
  const precio = '<strong class="precio">' + cop(s.precio) + '</strong>';
  return detalle
    ? '<p class="detalle__meta"><span>' + dur + '</span> ' + precio + '</p>'
    : '<p class="tarjeta__meta"><span class="duracion">' + dur + '</span> ' + precio + '</p>';
}

/**
 * Cuerpo de la ventana de detalle (orden fijo: descripción, notas, incluye, secciones, complementos).
 * @param {object} s
 * @returns {string[]}
 */
function cuerpoDetalle(s) {
  const l = [meta(s, true)];
  for (const p of s.descripcion || []) l.push('<p>' + inline(p) + '</p>');
  for (const nt of s.notas || []) {
    l.push('<aside class="nota" role="note"><p class="nota__titulo">' + esc(nt.titulo) + '</p><p>' + inline(nt.texto) + '</p></aside>');
  }
  if (s.incluye && s.incluye.length) {
    l.push('<h5>Incluye</h5><ul class="lista-check">' + s.incluye.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>');
  }
  for (const sec of s.secciones || []) {
    l.push('<h5>' + esc(sec.titulo) + '</h5><ul class="' + (sec.estilo === 'check' ? 'lista-check' : 'lista-sub') + '">' + sec.items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>');
  }
  if (s.complementos && s.complementos.length) {
    const filas = s.complementos
      .map((c) => '<tr><th scope="row">' + esc(c.nombre) + '</th><td>' + (c.incluido ? 'Incluido' : cop(c.precio)) + '</td></tr>')
      .join('');
    l.push(
      '<h5>Complementos opcionales</h5><table class="tabla-comp"><caption class="sr-only">Complementos opcionales de ' + esc(s.nombre) +
      '</caption><thead><tr><th scope="col">Complemento</th><th scope="col">Precio</th></tr></thead><tbody>' + filas + '</tbody></table>'
    );
  }
  return l;
}

/**
 * Tarjeta y ventana de detalle de un servicio.
 * @param {object} ctx
 * @param {object} s
 * @returns {string}
 */
function servicio(ctx, s) {
  const r = reserva(ctx, s);
  const destacado = s.insignia ? ' servicio--destacado' : '';
  const consultar = s.consultar ? ' data-consultar' : '';
  const nombre = esc(s.nombre);
  const nombreAttr = escAttr(s.nombre);
  const abre = '<article class="servicio' + destacado + '" data-categoria="' + escAttr(s.categoria) + '" data-servicio="' + escAttr(s.slug) + '"' + consultar + '>';
  const insignia = s.insignia ? '<p class="tarjeta__insignia">' + esc(s.insignia) + '</p>' : '';
  const tarjeta = [
    '<div class="tarjeta">',
    insignia + '<h3 class="tarjeta__titulo">' + nombre + '</h3>',
    '<p class="tarjeta__resumen">' + inline(s.resumen) + '</p>'
  ];
  if (s.consultar) {
    tarjeta.push(
      '<div class="tarjeta__acciones">',
      '<a class="btn btn--prim" href="' + r.href + '" target="_blank" rel="noopener" ' + r.attrs + ' aria-label="Consultar por WhatsApp: ' + nombreAttr + '">Consultar por WhatsApp</a>',
      '</div>',
      '</div>'
    );
    return [abre, ...tarjeta, '</article>'].join('\n');
  }
  const id = 'detalle-' + escAttr(s.slug);
  tarjeta.push(
    meta(s, false),
    '<div class="tarjeta__acciones">',
    '<a class="btn btn--sec" href="#' + id + '" data-abrir="' + id + '" aria-label="Ver detalle: ' + nombreAttr + '">Ver detalle</a>',
    '<a class="btn btn--prim" href="' + r.href + '" target="_blank" rel="noopener" ' + r.attrs + ' aria-label="Reservar: ' + nombreAttr + '">Reservar</a>',
    '</div>',
    '</div>'
  );
  const dialogo = [
    '<dialog class="detalle" id="' + id + '" aria-labelledby="' + id + '-t">',
    '<div class="detalle__panel">',
    '<header class="detalle__cab"><h4 class="detalle__titulo" id="' + id + '-t">' + nombre + '</h4><button type="button" class="detalle__cerrar" data-cerrar aria-label="Cerrar detalle"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>',
    '<div class="detalle__cuerpo">',
    ...cuerpoDetalle(s),
    '</div>',
    '<footer class="detalle__pie"><a class="btn btn--prim" href="' + r.href + '" target="_blank" rel="noopener" ' + r.attrs + '>Reservar este servicio</a></footer>',
    '</div></dialog>'
  ];
  return [abre, ...tarjeta, ...dialogo, '</article>'].join('\n');
}

/**
 * Sección completa del catálogo.
 * @param {object} ctx
 * @returns {string}
 */
export function catalogo(ctx) {
  const { categorias, servicios, intro } = ctx.servicios;
  const conServicios = categorias.filter((c) => servicios.some((s) => s.categoria === c.id));
  const botones = ['<button type="button" class="filtro" data-filtro="todos" aria-pressed="true">Todos</button>']
    .concat(conServicios.map((c) => '<button type="button" class="filtro" data-filtro="' + escAttr(c.id) + '" aria-pressed="false">' + esc(c.filtro || c.nombre) + '</button>'));
  const grupos = conServicios.map((c) => [
    '<div class="categoria" data-categoria-grupo="' + escAttr(c.id) + '">',
    '<h2 class="categoria__titulo" id="cat-' + escAttr(c.id) + '">' + esc(c.nombre) + '</h2>',
    '<div class="grid grid--servicios">',
    ...servicios.filter((s) => s.categoria === c.id).map((s) => servicio(ctx, s)),
    '</div>',
    '</div>'
  ].join('\n'));
  return [
    '<section class="seccion seccion--bruma" id="servicios" aria-labelledby="servicios-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<p class="seccion__titulo" id="servicios-t">Catálogo de servicios</p>',
    ORNAMENTO,
    '<p class="seccion__intro">' + inline(intro) + '</p>',
    '</header>',
    '<div class="filtros" role="group" aria-label="Filtrar servicios por categoría">' + botones.join('') + '</div>',
    '<p class="sr-only" aria-live="polite" data-anuncio-filtro></p>',
    ...grupos,
    '</div>',
    '</section>'
  ].join('\n');
}
