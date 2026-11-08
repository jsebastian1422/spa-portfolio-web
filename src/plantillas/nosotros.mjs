/**
 * Secciones "Nosotros" y "Contacto y ubicación".
 */
import { esc, escAttr, inline, paraConsultaMapa } from '../util.mjs';
import { ORNAMENTO, hrefWa, icono, redes } from './comun.mjs';

/**
 * Sección Nosotros (texto + diferenciadores).
 * @param {object} ctx
 * @returns {string}
 */
export function nosotros(ctx) {
  const { n } = ctx;
  const borrador = n.textoNosotros.borrador === true ? ' data-borrador' : '';
  const difs = (n.diferenciadores || []).map((d) =>
    '<li class="dif">' + icono(d.icono, 'icono icono--grande') + '<h3 class="dif__titulo">' + esc(d.titulo) + '</h3><p>' + inline(d.texto) + '</p></li>');
  return [
    '<section class="seccion seccion--bruma" id="nosotros" aria-labelledby="nosotros-t"' + borrador + '>',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="nosotros-t">Nosotros</h2>',
    ORNAMENTO,
    '</header>',
    '<div class="nosotros__texto">',
    ...n.textoNosotros.parrafos.map((p) => '<p>' + inline(p) + '</p>'),
    '</div>',
    difs.length ? '<ul class="grid grid--difs">' : null,
    ...difs,
    difs.length ? '</ul>' : null,
    '</div>',
    '</section>'
  ].filter((l) => l !== null).join('\n');
}

/**
 * Sección de contacto: dirección, horarios, WhatsApp, redes y mapa.
 * @param {object} ctx
 * @returns {string}
 */
export function contacto(ctx) {
  const { v } = ctx;
  const listaRedes = redes(ctx);
  const bloqueRedes = listaRedes.length
    ? '<li><div class="redes"><strong>Redes</strong>\n' +
      listaRedes.map((r) => '<a class="enlace" href="' + escAttr(r.url) + '" target="_blank" rel="noopener">' + r.nombre + '</a>').join('\n') +
      '</div></li>'
    : null;
  const consulta = paraConsultaMapa(v.SITIO_DIRECCION) + '+' + paraConsultaMapa(v.SITIO_CIUDAD);
  const iframe = v.SITIO_MAPA_URL
    ? '<iframe src="' + escAttr(v.SITIO_MAPA_URL) + '" title="Mapa de ubicación de ' + escAttr(ctx.n.nombre) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>'
    : null;
  return [
    '<section class="seccion" id="contacto" aria-labelledby="contacto-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="contacto-t">Contacto y ubicación</h2>',
    ORNAMENTO,
    '</header>',
    '<div class="contacto">',
    '<ul class="contacto__lista">',
    '<li>' + icono('pin') + '<div><strong>Dirección</strong><br><span>' + esc(v.SITIO_DIRECCION) + ', ' + esc(v.SITIO_CIUDAD) + '</span></div></li>',
    '<li>' + icono('reloj') + '<div><strong>Horarios</strong>',
    '<dl class="horarios"><div><dt>Lunes a viernes</dt><dd>' + esc(v.SITIO_HORARIO_LV) + '</dd></div><div><dt>Sábado</dt><dd>' + esc(v.SITIO_HORARIO_SAB) + '</dd></div><div><dt>Domingo</dt><dd>' + esc(v.SITIO_HORARIO_DOM) + '</dd></div></dl></div></li>',
    '<li>' + icono('wa') + '<div><strong>WhatsApp</strong><br><a class="enlace" href="' + hrefWa(ctx, 'general') + '" target="_blank" rel="noopener" data-wa="general">+' + esc(v.SITIO_WHATSAPP) + '</a></div></li>',
    bloqueRedes,
    '</ul>',
    '<div class="mapa">',
    iframe,
    '<a class="btn btn--prim" href="https://www.google.com/maps/search/?api=1&amp;query=' + escAttr(consulta) + '" target="_blank" rel="noopener">Cómo llegar</a>',
    '</div>',
    '</div>',
    '</div>',
    '</section>'
  ].filter((l) => l !== null).join('\n');
}
