/**
 * Sección de productos (consulta por WhatsApp) y galería opcional.
 */
import { esc, escAttr, inline } from '../util.mjs';
import { ORNAMENTO, hrefWa, icono } from './comun.mjs';

/**
 * Tarjeta de un producto.
 * @param {object} ctx
 * @param {{nombre: string, icono: string}} p
 * @returns {string}
 */
function producto(ctx, p) {
  return [
    '<article class="producto" data-producto="' + escAttr(p.nombre) + '">',
    '<div class="producto__img" aria-hidden="true">' + icono(p.icono, 'icono icono--grande') + '</div>',
    '<h4 class="producto__titulo">' + esc(p.nombre) + '</h4>',
    '<a class="btn btn--sec btn--bloque" href="' + hrefWa(ctx, 'producto', p.nombre) + '" target="_blank" rel="noopener" data-wa="producto" data-wa-nombre="' + escAttr(p.nombre) + '" aria-label="Consultar por WhatsApp: ' + escAttr(p.nombre) + '">Consultar por WhatsApp</a>',
    '</article>'
  ].join('\n');
}

/**
 * Sección de productos.
 * @param {object} ctx
 * @returns {string}
 */
export function productos(ctx) {
  const p = ctx.productos;
  const grupos = p.grupos.map((g) => [
    '<div class="grupo-productos" id="' + escAttr(g.id) + '">',
    '<h3 class="subtitulo">' + esc(g.titulo) + '</h3>',
    '<p class="seccion__intro">' + inline(g.intro) + '</p>',
    '<div class="grid grid--productos">',
    ...g.productos.map((pr) => producto(ctx, pr)),
    '</div>',
    '</div>'
  ].join('\n'));
  return [
    '<section class="seccion seccion--nude" id="productos" aria-labelledby="productos-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="productos-t">' + esc(p.titulo) + '</h2>',
    ORNAMENTO,
    '</header>',
    '',
    grupos.join('\n\n'),
    '</div>',
    '</section>'
  ].join('\n');
}

/**
 * Galería de fotos con lightbox (solo si hay fotos).
 * @param {object} ctx
 * @returns {string}
 */
export function galeria(ctx) {
  const items = ctx.galeria.map((f) => {
    const src = escAttr(f.src);
    return '<li><a href="' + src + '" data-lightbox><img src="' + src + '" width="' + (f.ancho || 600) + '" height="' + (f.alto || 600) + '" loading="lazy" alt="' + escAttr(f.alt) + '"></a></li>';
  });
  return [
    '<section class="seccion" id="galeria" aria-labelledby="galeria-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="galeria-t">Galería</h2>',
    '</header>',
    '<ul class="galeria">',
    ...items,
    '</ul>',
    '</div>',
    '</section>'
  ].join('\n');
}
