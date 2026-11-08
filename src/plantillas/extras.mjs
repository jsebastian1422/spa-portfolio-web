/**
 * Archivos generados además del index: 404.html, robots.txt y sitemap.xml.
 */
import { esc, escAttr } from '../util.mjs';
import { FUENTES } from './comun.mjs';

/**
 * Página de error 404.
 * @param {object} ctx
 * @returns {string}
 */
export function pagina404(ctx) {
  const { n } = ctx;
  return [
    '<!DOCTYPE html>',
    '<html lang="' + escAttr(n.idioma || 'es-CO') + '">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex">',
    '<title>Página no encontrada | ' + esc(n.nombre) + '</title>',
    '<meta name="theme-color" content="' + escAttr(n.tema.turquesa) + '">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    ...FUENTES,
    '<link rel="stylesheet" href="/css/styles.css">',
    '</head>',
    '<body>',
    '<main class="seccion" id="contenido">',
    '<div class="contenedor seccion__cab">',
    '<img src="/' + escAttr(n.logos.cabecera) + '" width="' + n.logos.ancho + '" height="' + n.logos.alto + '" alt="' + escAttr(n.nombreCompleto) + '" style="width:180px;margin:0 auto 1rem">',
    '<h1 class="seccion__titulo">Esta página no existe</h1>',
    '<p class="seccion__intro">Es posible que el enlace haya cambiado o que la dirección esté mal escrita.</p>',
    '<a class="btn btn--prim" href="/">Volver al inicio</a>',
    '</div>',
    '</main>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

/**
 * robots.txt con la ubicación del sitemap.
 * @param {object} ctx
 * @returns {string}
 */
export function robots(ctx) {
  return 'User-agent: *\nAllow: /\n\nSitemap: ' + ctx.v.SITIO_DOMINIO + '/sitemap.xml\n';
}

/**
 * sitemap.xml con la portada.
 * @param {object} ctx
 * @returns {string}
 */
export function sitemap(ctx) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    '    <loc>' + esc(ctx.v.SITIO_DOMINIO) + '/</loc>',
    '    <lastmod>' + ctx.fecha + '</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    ''
  ].join('\n');
}
