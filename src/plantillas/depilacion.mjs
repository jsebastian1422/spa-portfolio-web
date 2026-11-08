/**
 * Sección de depilación con cera: combos y precios por zona (Mujer / Hombre).
 */
import { cop, esc, inline } from '../util.mjs';
import { ORNAMENTO, hrefWa } from './comun.mjs';

/**
 * Cuadrícula de combos de un grupo.
 * @param {string} id Ancla del subtítulo.
 * @param {string} titulo
 * @param {object[]} combos
 * @returns {string}
 */
function combos(id, titulo, lista) {
  if (!lista || !lista.length) return '';
  const clase = lista.length === 3 ? 'grid grid--combos grid--combos3' : 'grid grid--combos';
  return [
    '<h3 class="subtitulo" id="' + id + '">' + titulo + '</h3>',
    '<div class="' + clase + '">',
    ...lista.map((c) => [
      '<article class="combo">',
      '<h4 class="combo__titulo">' + esc(c.nombre) + '</h4>',
      '<ul class="lista-check">' + c.incluye.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>',
      '<p class="combo__precio"><strong class="precio">' + cop(c.precio) + '</strong></p>',
      '</article>'
    ].join('\n')),
    '</div>',
    ''
  ].join('\n');
}

/**
 * Sección completa de depilación.
 * @param {object} ctx
 * @returns {string}
 */
export function depilacion(ctx) {
  const d = ctx.depilacion;
  const href = hrefWa(ctx, 'depilacion');
  const filas = d.zonas.map((z) => {
    const sinHombre = z.hombre === null ? ' data-hombre=""' : '';
    return '<tr' + sinHombre + '><th scope="row">' + esc(z.zona) + '</th><td class="col-mujer">' + cop(z.mujer) + '</td><td class="col-hombre">' + (z.hombre === null ? '—' : cop(z.hombre)) + '</td></tr>';
  });
  return [
    '<section class="seccion" id="depilacion" aria-labelledby="depilacion-t">',
    '<div class="contenedor">',
    '<header class="seccion__cab">',
    '<h2 class="seccion__titulo" id="depilacion-t">Depilación con cera</h2>',
    ORNAMENTO,
    ...d.intro.map((p) => '<p class="seccion__intro">' + inline(p) + '</p>'),
    '<a class="btn btn--prim" href="' + href + '" target="_blank" rel="noopener" data-wa="depilacion">Reservar depilación</a>',
    '</header>',
    '',
    combos('combos-intima', 'Combos de depilación íntima', d.combos.intima),
    combos('combos-corporal', 'Combos de depilación corporal', d.combos.corporal),
    '<h3 class="subtitulo" id="precios-zona">Precios por zona</h3>',
    '<div class="toggle" role="group" aria-label="Ver precios para">',
    '<button type="button" class="toggle__btn" data-vista="mujer" aria-pressed="true">Mujer</button>',
    '<button type="button" class="toggle__btn" data-vista="hombre" aria-pressed="false">Hombre</button>',
    '</div>',
    '<p class="sr-only" aria-live="polite" data-anuncio-vista></p>',
    '<div class="tabla-caja">',
    '<table class="tabla-zonas" id="tabla-zonas"><caption>Precios de depilación con cera por zona</caption><thead><tr><th scope="col">Zona</th><th scope="col" class="col-mujer">Mujer</th><th scope="col" class="col-hombre">Hombre</th></tr></thead><tbody>',
    ...filas,
    '</tbody></table>',
    '</div>',
    '<div class="centrado"><a class="btn btn--prim" href="' + href + '" target="_blank" rel="noopener" data-wa="depilacion">Reservar depilación</a></div>',
    '</div>',
    '</section>'
  ].filter((l) => l !== '').join('\n');
}
