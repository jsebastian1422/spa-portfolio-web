/**
 * Pie de página y botón flotante de WhatsApp.
 */
import { esc, escAttr, inline } from '../util.mjs';
import { hrefWa, icono, redes } from './comun.mjs';
import { listaMenu } from './cabecera.mjs';

/**
 * <footer> con navegación, redes y aviso legal.
 * @param {object} ctx
 * @returns {string}
 */
export function pie(ctx) {
  const { n } = ctx;
  const listaRedes = redes(ctx);
  return [
    '<footer class="footer">',
    '<div class="contenedor footer__fila">',
    '<div class="footer__marca">',
    '<img class="footer__logo" src="' + escAttr(n.logos.pie) + '" width="' + n.logos.ancho + '" height="' + n.logos.alto + '" alt="' + escAttr(n.nombreCompleto) + '" loading="lazy" decoding="async">',
    '</div>',
    '<nav class="footer__nav" aria-label="Pie de página">',
    listaMenu(ctx, 'footer__lista'),
    '</nav>',
    listaRedes.length ? '<ul class="footer__redes">' : null,
    ...listaRedes.map((r) => '<li><a href="' + escAttr(r.url) + '" target="_blank" rel="noopener">' + r.nombre + '</a></li>'),
    listaRedes.length ? '</ul>' : null,
    '</div>',
    '<div class="contenedor footer__legal">',
    '<p class="footer__aviso">' + inline(n.avisoPie) + '</p>',
    '<p>© <span data-anio>' + ctx.anio + '</span> ' + esc(n.nombreCompleto) + '</p>',
    '</div>',
    '</footer>'
  ].filter((l) => l !== null).join('\n');
}

/**
 * Botón flotante de WhatsApp.
 * @param {object} ctx
 * @returns {string}
 */
export function botonFlotante(ctx) {
  return '<a class="wa-flotante" href="' + hrefWa(ctx, 'general') + '" target="_blank" rel="noopener" data-wa="general" aria-label="Escríbenos por WhatsApp">' + icono('wa', 'wa-flotante__icono') + '</a>';
}
