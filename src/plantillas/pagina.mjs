/**
 * Composición de la página principal.
 */
import { head, header } from './cabecera.mjs';
import { hero, lineas } from './inicio.mjs';
import { catalogo } from './catalogo.mjs';
import { depilacion } from './depilacion.mjs';
import { galeria, productos } from './productos.mjs';
import { contacto, nosotros } from './nosotros.mjs';
import { botonFlotante, pie } from './pie.mjs';

/**
 * Genera el index.html completo.
 * @param {object} ctx Contexto de render (variables, datos, sprite de íconos).
 * @returns {string}
 */
export function pagina(ctx) {
  const secciones = [
    hero(ctx),
    lineas(ctx),
    catalogo(ctx),
    ctx.depilacion ? depilacion(ctx) : null,
    ctx.productos ? productos(ctx) : null,
    ctx.galeria.length ? galeria(ctx) : null,
    nosotros(ctx),
    contacto(ctx)
  ].filter((s) => s !== null);
  return [
    head(ctx),
    '<body>',
    ctx.sprite,
    '<a class="skip-link" href="#contenido">Saltar al contenido</a>',
    '',
    header(ctx),
    '',
    '<main id="contenido">',
    '',
    secciones.join('\n\n'),
    '',
    '</main>',
    '',
    pie(ctx),
    '',
    botonFlotante(ctx),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}
