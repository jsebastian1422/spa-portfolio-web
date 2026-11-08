/**
 * Fragmentos HTML compartidos por las plantillas.
 */
import { esc, escAttr, waUrl, rellenarNombre } from '../util.mjs';

/** Ornamento decorativo (hilo + olivo) bajo los títulos de sección. */
export const ORNAMENTO = '<div class="ornamento" aria-hidden="true"><svg class="ornamento__hilo" viewBox="0 0 100 12" preserveAspectRatio="none"><use href="#hilo"/></svg><svg class="ornamento__olivo"><use href="#olivo"/></svg><svg class="ornamento__hilo" viewBox="0 0 100 12" preserveAspectRatio="none"><use href="#hilo"/></svg></div>';

/** Hojas de estilo de Google Fonts (tipografías fijas del motor). */
export const FUENTES = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&amp;family=Nunito+Sans:wght@400;600;700&amp;display=swap">'
];

/**
 * Ícono del sprite por nombre de dato (sin el prefijo "i-").
 * @param {string} nombre
 * @param {string} [clases]
 * @returns {string}
 */
export function icono(nombre, clases = 'icono') {
  return '<svg class="' + clases + '" aria-hidden="true" focusable="false"><use href="#i-' + esc(nombre) + '"/></svg>';
}

/**
 * Enlace de WhatsApp: href de respaldo generado aquí; main.js lo reescribe con la config del sitio.
 * @param {object} ctx Contexto de render.
 * @param {string} tipo general | diagnostico | servicio | depilacion | producto
 * @param {string} [nombre] Nombre del servicio o producto (para tipos con {nombre}).
 * @returns {string} Valor del atributo href (ya escapado para atributo).
 */
export function hrefWa(ctx, tipo, nombre) {
  return escAttr(waUrl(ctx.v.SITIO_WHATSAPP, rellenarNombre(ctx.n.mensajes[tipo], nombre)));
}

/**
 * Nombre de contacto de redes presentes, en orden fijo.
 * @param {object} ctx
 * @returns {{nombre: string, url: string}[]}
 */
export function redes(ctx) {
  return [
    { nombre: 'Instagram', url: ctx.v.SITIO_INSTAGRAM },
    { nombre: 'Facebook', url: ctx.v.SITIO_FACEBOOK },
    { nombre: 'TikTok', url: ctx.v.SITIO_TIKTOK }
  ].filter((r) => r.url);
}

/**
 * Sustituye el marcador {ciudad} en los textos de SEO.
 * @param {string} texto
 * @param {object} ctx
 * @returns {string}
 */
export function conCiudad(texto, ctx) {
  return texto.split('{ciudad}').join(ctx.v.SITIO_CIUDAD);
}
