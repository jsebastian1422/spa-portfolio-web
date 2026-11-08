/**
 * Hero y sección "Nuestras líneas".
 */
import { esc, escAttr, inline } from '../util.mjs';
import { ORNAMENTO, hrefWa, icono } from './comun.mjs';

/**
 * Sección hero (inicio).
 * @param {object} ctx
 * @returns {string}
 */
export function hero(ctx) {
  const { n } = ctx;
  const h = n.hero;
  return [
    '<section class="hero" id="inicio" aria-labelledby="hero-titulo">',
    '<div class="contenedor hero__fila">',
    '<div class="hero__texto">',
    '<h1 class="hero__titulo" id="hero-titulo">' + esc(h.saludo) + ' <span class="hero__nombre">' + esc(n.nombreCompleto) + '</span></h1>',
    '<p class="hero__frase">' + inline(h.frase) + '</p>',
    '<div class="hero__acciones">',
    '<a class="btn btn--oscuro" href="' + hrefWa(ctx, 'diagnostico') + '" target="_blank" rel="noopener" data-wa="diagnostico">' + esc(h.cta) + '</a>',
    '<a class="btn btn--sec" href="#servicios">Ver servicios</a>',
    '</div>',
    h.apoyo ? '<p class="hero__apoyo">' + inline(h.apoyo) + '</p>' : null,
    '</div>',
    '<img class="hero__logo" src="' + escAttr(n.logos.portada) + '" width="' + n.logos.ancho + '" height="' + n.logos.alto + '" alt="Logo de ' + escAttr(n.nombreCompleto) + '" fetchpriority="high" decoding="async">',
    '</div>',
    '</section>'
  ].filter((l) => l !== null).join('\n');
}

/**
 * Enlace "Ver servicios" de una línea según su destino.
 * @param {{titulo: string, destino: string}} linea
 * @returns {string}
 */
function enlaceLinea(linea) {
  const destino = linea.destino;
  const esFiltro = destino.startsWith('filtro:');
  const href = esFiltro ? '#servicios' : destino;
  const filtro = esFiltro ? ' data-filtro="' + escAttr(destino.slice(7)) + '"' : '';
  return '<a class="enlace-flecha" href="' + escAttr(href) + '"' + filtro + '>Ver servicios<span class="sr-only"> de ' + esc(linea.titulo) + '</span> <span aria-hidden="true">→</span></a>';
}

/**
 * Sección de líneas de servicio.
 * @param {object} ctx
 * @returns {string}
 */
export function lineas(ctx) {
  const articulos = ctx.lineas.lineas.map((l) => [
    '<article class="linea">',
    icono(l.icono, 'icono icono--grande'),
    '<h3 class="linea__titulo">' + esc(l.titulo) + '</h3>',
    '<p>' + inline(l.texto) + '</p>',
    enlaceLinea(l),
    '</article>'
  ].join('\n'));
  return [
    '<section class="seccion" id="lineas" aria-labelledby="lineas-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="lineas-t">Nuestras líneas</h2>',
    ORNAMENTO,
    '<p class="seccion__intro">' + inline(ctx.lineas.intro) + '</p>',
    '</header>',
    '<div class="grid grid--lineas">',
    ...articulos,
    '</div>',
    '</div>',
    '</section>'
  ].join('\n');
}
