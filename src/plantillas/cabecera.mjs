/**
 * <head> del documento y encabezado de la página (barra de marca y menú).
 */
import { esc, escAttr, jsonEnScript } from '../util.mjs';
import { FUENTES, conCiudad } from './comun.mjs';
import { jsonLd } from './jsonld.mjs';

/**
 * Enlaces del menú principal según las secciones presentes.
 * @param {object} ctx
 * @returns {string} <ul> del menú.
 */
export function listaMenu(ctx, clase) {
  const items = [['inicio', 'Inicio'], ['servicios', 'Servicios']];
  if (ctx.depilacion) items.push(['depilacion', 'Depilación']);
  if (ctx.productos) items.push(['productos', 'Productos']);
  if (ctx.galeria.length) items.push(['galeria', 'Galería']);
  items.push(['nosotros', 'Nosotros'], ['contacto', 'Contacto']);
  return '<ul class="' + clase + '">' + items.map(([id, t]) => '<li><a href="#' + id + '">' + t + '</a></li>').join('') + '</ul>';
}

/**
 * Configuración de WhatsApp para main.js (JSON embebido).
 * @param {object} ctx
 * @returns {string}
 */
function configSitio(ctx) {
  const config = { whatsapp: ctx.v.SITIO_WHATSAPP, mensajes: ctx.n.mensajes };
  // Con indentación: evita que el cierre "}}" del JSON se confunda con un marcador sin resolver.
  return '<script type="application/json" id="config-sitio">\n' + jsonEnScript(config, 2) + '\n</script>';
}

/**
 * Documento hasta el cierre de </head>.
 * @param {object} ctx
 * @returns {string}
 */
export function head(ctx) {
  const { n, v } = ctx;
  const seo = n.seo;
  const idioma = n.idioma || 'es-CO';
  const titulo = esc(conCiudad(seo.titulo, ctx));
  const descripcion = escAttr(conCiudad(seo.descripcion, ctx));
  const ogDesc = escAttr(conCiudad(seo.ogDescripcion || seo.descripcion, ctx));
  const twDesc = escAttr(conCiudad(seo.twitterDescripcion || seo.ogDescripcion || seo.descripcion, ctx));
  const dominio = escAttr(v.SITIO_DOMINIO);
  const imagen = dominio + '/' + escAttr(n.ogImagen);
  const tituloAttr = escAttr(conCiudad(seo.titulo, ctx));
  return [
    '<!DOCTYPE html>',
    '<html lang="' + escAttr(idioma) + '">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + titulo + '</title>',
    '<meta name="description" content="' + descripcion + '">',
    '<meta name="theme-color" content="' + escAttr(n.tema.turquesa) + '">',
    '<link rel="canonical" href="' + dominio + '/">',
    '',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="' + escAttr(idioma.replace('-', '_')) + '">',
    '<meta property="og:site_name" content="' + escAttr(n.nombre) + '">',
    '<meta property="og:title" content="' + tituloAttr + '">',
    '<meta property="og:description" content="' + ogDesc + '">',
    '<meta property="og:url" content="' + dominio + '/">',
    '<meta property="og:image" content="' + imagen + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Logo de ' + escAttr(n.nombreCompleto) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + tituloAttr + '">',
    '<meta name="twitter:description" content="' + twDesc + '">',
    '<meta name="twitter:image" content="' + imagen + '">',
    '',
    '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="favicon.ico" sizes="32x32">',
    '<link rel="icon" href="icon-192.png" type="image/png" sizes="192x192">',
    '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
    '',
    ...FUENTES,
    '<link rel="stylesheet" href="css/styles.css">',
    "<script>document.documentElement.classList.add('js');</script>",
    configSitio(ctx),
    '<script defer src="js/main.js"></script>',
    '',
    jsonLd(ctx),
    '</head>'
  ].join('\n');
}

/**
 * Isotipo en línea de la marca (si el negocio define logos.isotipo).
 * @param {object} ctx
 * @returns {string}
 */
function isotipo(ctx) {
  if (!ctx.isotipoSvg) return '';
  const { viewBox, interior } = ctx.isotipoSvg;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + escAttr(viewBox) + '" aria-hidden="true" focusable="false" class="brand__iso">' + interior + '</svg>\n';
}

/**
 * <header> de la página.
 * @param {object} ctx
 * @returns {string}
 */
export function header(ctx) {
  const { n } = ctx;
  const l = n.logos;
  return [
    '<header class="header" id="top">',
    '<div class="contenedor header__fila">',
    '<a class="brand" href="#inicio" aria-label="' + escAttr(n.nombreCompleto) + ', ir al inicio">',
    isotipo(ctx) + '<span class="brand__texto">' + esc(n.nombre) + '</span>',
    '<img class="brand__logo" src="' + escAttr(l.cabecera) + '" width="' + l.ancho + '" height="' + l.alto + '" alt="" loading="lazy" decoding="async">',
    '</a>',
    '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú">',
    '<span class="menu-toggle__barras" aria-hidden="true"></span>',
    '</button>',
    '<nav class="nav" id="menu-principal" aria-label="Principal">',
    listaMenu(ctx, 'nav__lista'),
    '</nav>',
    '</div>',
    '</header>'
  ].join('\n');
}
