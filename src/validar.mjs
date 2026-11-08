/**
 * Validación de variables SITIO_* y de contenido. Acumula todos los errores antes de fallar.
 * Formato de cada error: "archivo › ruta › campo: motivo".
 */
import { esSlug } from './util.mjs';

/** Definición de las variables de entorno (spec §4.1). */
export const VARIABLES = [
  { nombre: 'SITIO_WHATSAPP', obligatoria: true, tipo: 'whatsapp' },
  { nombre: 'SITIO_DOMINIO', obligatoria: true, tipo: 'dominio' },
  { nombre: 'SITIO_CIUDAD', obligatoria: true, tipo: 'texto' },
  { nombre: 'SITIO_DIRECCION', obligatoria: true, tipo: 'texto' },
  { nombre: 'SITIO_HORARIO_LV', obligatoria: true, tipo: 'texto' },
  { nombre: 'SITIO_HORARIO_SAB', obligatoria: true, tipo: 'texto' },
  { nombre: 'SITIO_HORARIO_DOM', obligatoria: true, tipo: 'texto' },
  { nombre: 'SITIO_INSTAGRAM', obligatoria: false, tipo: 'url' },
  { nombre: 'SITIO_FACEBOOK', obligatoria: false, tipo: 'url' },
  { nombre: 'SITIO_TIKTOK', obligatoria: false, tipo: 'url' },
  { nombre: 'SITIO_MAPA_URL', obligatoria: false, tipo: 'mapa' }
];

/** Claves del tema (nombres de variable CSS de SPEC §6.2). */
export const CLAVES_TEMA = [
  'turquesa', 'negro-marca', 'turquesa-profundo', 'turquesa-enlace',
  'turquesa-bruma', 'nude', 'blanco-roto', 'texto'
];

/** Identificadores que no pueden usarse como id de categoría o de grupo de productos. */
const ANCLAS_RESERVADAS = [
  'top', 'contenido', 'inicio', 'lineas', 'servicios', 'depilacion', 'productos',
  'galeria', 'nosotros', 'contacto', 'combos-intima', 'combos-corporal', 'precios-zona', 'tabla-zonas'
];

/** Favicons obligatorios en contenido/favicons/ (se publican en la raíz del sitio). */
export const FAVICONS = ['favicon.svg', 'favicon.ico', 'icon-192.png', 'apple-touch-icon.png'];

const RE_HEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const RE_URL = /^https:\/\/[^\s"<>]+$/;
const RE_MAPA = /^https:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps[^\s"<>]*$/;

/** Acumulador de errores y avisos. */
export class Resultado {
  constructor() {
    this.errores = [];
    this.avisos = [];
  }

  /**
   * @param {string[]} partes Segmentos de la ubicación (archivo, ruta, campo).
   * @param {string} motivo
   */
  error(partes, motivo) {
    this.errores.push(partes.join(' › ') + ': ' + motivo);
  }

  /**
   * @param {string[]} partes
   * @param {string} motivo
   */
  aviso(partes, motivo) {
    this.avisos.push(partes.join(' › ') + ': ' + motivo);
  }
}

/**
 * Indica si un valor es un texto no vacío.
 * @param {unknown} v
 * @returns {boolean}
 */
const esTexto = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Indica si un valor es un entero positivo.
 * @param {unknown} v
 * @returns {boolean}
 */
const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;

/**
 * Indica si un valor es un objeto plano (no arreglo, no null).
 * @param {unknown} v
 * @returns {boolean}
 */
const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Valida las variables SITIO_*.
 * @param {Record<string, string>} env
 * @param {Resultado} res
 */
export function validarVariables(env, res) {
  for (const def of VARIABLES) {
    const valor = env[def.nombre];
    const donde = ['entorno', def.nombre];
    if (valor === undefined || valor === '') {
      if (def.obligatoria) res.error(donde, 'variable obligatoria sin definir');
      continue;
    }
    if (/\{\{|\}\}/.test(valor)) {
      res.error(donde, 'no puede contener "{{" ni "}}"');
      continue;
    }
    if (/[\r\n\t]/.test(valor)) {
      res.error(donde, 'debe estar en una sola línea');
      continue;
    }
    if (def.tipo === 'whatsapp' && !/^\d{10,15}$/.test(valor)) {
      res.error(donde, 'debe tener solo dígitos (10 a 15), con indicativo y sin "+" ni espacios');
    } else if (def.tipo === 'dominio' && (!RE_URL.test(valor) || valor.endsWith('/'))) {
      res.error(donde, 'debe ser una URL absoluta https:// sin barra final');
    } else if (def.tipo === 'url' && !RE_URL.test(valor)) {
      res.error(donde, 'debe ser una URL https://');
    } else if (def.tipo === 'mapa' && !RE_MAPA.test(valor)) {
      res.error(donde, 'debe ser una URL https:// de Google Maps (https://www.google.com/maps/embed?...)');
    } else if (def.tipo === 'texto' && valor.length > 200) {
      res.error(donde, 'máximo 200 caracteres');
    }
  }
}

/**
 * Recorre un valor JSON y reporta cualquier texto con "{{" o "}}".
 * @param {unknown} valor
 * @param {string[]} ruta
 * @param {Resultado} res
 */
function buscarMarcadores(valor, ruta, res) {
  if (typeof valor === 'string') {
    if (/\{\{|\}\}/.test(valor)) res.error(ruta, 'no puede contener "{{" ni "}}"');
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => buscarMarcadores(v, [...ruta.slice(0, -1), ruta[ruta.length - 1] + '[' + i + ']'], res));
  } else if (esObjeto(valor)) {
    for (const [k, v] of Object.entries(valor)) buscarMarcadores(v, [...ruta, k], res);
  }
}

/**
 * Exige un texto no vacío en obj[clave].
 * @param {Resultado} res
 * @param {string[]} donde
 * @param {any} obj
 * @param {string} clave
 * @param {boolean} [obligatorio]
 * @returns {boolean} true si el campo existe y es válido.
 */
function texto(res, donde, obj, clave, obligatorio = true) {
  const v = obj[clave];
  if (v === undefined || v === null) {
    if (obligatorio) res.error([...donde, clave], 'campo obligatorio');
    return false;
  }
  if (!esTexto(v)) {
    res.error([...donde, clave], 'debe ser un texto no vacío');
    return false;
  }
  return true;
}

/**
 * Valida una lista de textos no vacíos.
 * @param {Resultado} res
 * @param {string[]} donde
 * @param {any} obj
 * @param {string} clave
 * @param {{obligatorio?: boolean, minimo?: number}} [opc]
 */
function listaTextos(res, donde, obj, clave, { obligatorio = false, minimo = 0 } = {}) {
  const v = obj[clave];
  if (v === undefined) {
    if (obligatorio) res.error([...donde, clave], 'campo obligatorio');
    return;
  }
  if (!Array.isArray(v)) {
    res.error([...donde, clave], 'debe ser una lista de textos');
    return;
  }
  if (v.length < minimo) res.error([...donde, clave], 'debe tener al menos ' + minimo + ' elemento(s)');
  v.forEach((t, i) => {
    if (!esTexto(t)) res.error([...donde, clave + '[' + i + ']'], 'debe ser un texto no vacío');
  });
}

/**
 * Valida el archivo negocio.json.
 * @param {any} n
 * @param {{res: Resultado, etiqueta: string, existe: (rel: string) => boolean, leer: (rel: string) => string|null, iconos: Set<string>, slugsServicios: Set<string>}} ctx
 */
function validarNegocio(n, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!esObjeto(n)) {
    res.error([f], 'debe ser un objeto');
    return;
  }
  texto(res, [f], n, 'nombre');
  texto(res, [f], n, 'nombreCompleto');
  if (n.idioma !== undefined && !/^[a-z]{2}-[A-Z]{2}$/.test(n.idioma)) res.error([f, 'idioma'], 'formato es-CO');
  if (n.pais !== undefined && !/^[A-Z]{2}$/.test(n.pais)) res.error([f, 'pais'], 'código de país de 2 letras (ej. CO)');

  if (!esObjeto(n.hero)) {
    res.error([f, 'hero'], 'campo obligatorio (objeto)');
  } else {
    texto(res, [f, 'hero'], n.hero, 'saludo');
    texto(res, [f, 'hero'], n.hero, 'frase');
    texto(res, [f, 'hero'], n.hero, 'cta');
    texto(res, [f, 'hero'], n.hero, 'apoyo', false);
  }

  if (!esObjeto(n.mensajes)) {
    res.error([f, 'mensajes'], 'campo obligatorio (objeto)');
  } else {
    for (const k of ['general', 'diagnostico', 'depilacion', 'servicio', 'producto']) {
      if (texto(res, [f, 'mensajes'], n.mensajes, k) && (k === 'servicio' || k === 'producto') && !n.mensajes[k].includes('{nombre}')) {
        res.error([f, 'mensajes', k], 'debe incluir el marcador {nombre}');
      }
    }
  }

  if (n.servicioDiagnostico !== undefined && !ctx.slugsServicios.has(n.servicioDiagnostico)) {
    res.error([f, 'servicioDiagnostico'], 'el slug "' + n.servicioDiagnostico + '" no existe en servicios');
  }

  if (!esObjeto(n.textoNosotros)) {
    res.error([f, 'textoNosotros'], 'campo obligatorio (objeto)');
  } else {
    listaTextos(res, [f, 'textoNosotros'], n.textoNosotros, 'parrafos', { obligatorio: true, minimo: 1 });
    if (n.textoNosotros.borrador !== undefined && typeof n.textoNosotros.borrador !== 'boolean') {
      res.error([f, 'textoNosotros', 'borrador'], 'debe ser true o false');
    }
    if (n.textoNosotros.borrador === true) {
      res.aviso([f, 'textoNosotros', 'borrador'], 'el texto de "Nosotros" está marcado como borrador (se publica con data-borrador)');
    }
  }

  if (n.diferenciadores !== undefined) {
    if (!Array.isArray(n.diferenciadores)) {
      res.error([f, 'diferenciadores'], 'debe ser una lista');
    } else {
      n.diferenciadores.forEach((d, i) => {
        const donde = [f, 'diferenciadores[' + i + ']'];
        if (!esObjeto(d)) return res.error(donde, 'debe ser un objeto');
        texto(res, donde, d, 'titulo');
        texto(res, donde, d, 'texto');
        validarIcono(d.icono, [...donde, 'icono'], ctx);
      });
    }
  }
  texto(res, [f], n, 'avisoPie');

  if (!esObjeto(n.logos)) {
    res.error([f, 'logos'], 'campo obligatorio (objeto)');
  } else {
    for (const k of ['cabecera', 'portada', 'pie']) {
      if (texto(res, [f, 'logos'], n.logos, k)) validarArchivo(n.logos[k], [f, 'logos', k], ctx);
    }
    for (const k of ['ancho', 'alto']) {
      if (!esEnteroPositivo(n.logos[k])) res.error([f, 'logos', k], 'debe ser un entero positivo (píxeles)');
    }
    if (n.logos.isotipo !== undefined && texto(res, [f, 'logos'], n.logos, 'isotipo') && validarArchivo(n.logos.isotipo, [f, 'logos', 'isotipo'], ctx)) {
      const svg = ctx.leer(n.logos.isotipo) || '';
      if (!/<svg[^>]*\sviewBox="[^"]+"[^>]*>[\s\S]*<\/svg>/.test(svg)) {
        res.error([f, 'logos', 'isotipo'], 'debe ser un SVG con atributo viewBox');
      }
    }
  }
  if (texto(res, [f], n, 'ogImagen')) validarArchivo(n.ogImagen, [f, 'ogImagen'], ctx);

  if (!esObjeto(n.seo)) {
    res.error([f, 'seo'], 'campo obligatorio (objeto)');
  } else {
    texto(res, [f, 'seo'], n.seo, 'titulo');
    texto(res, [f, 'seo'], n.seo, 'descripcion');
    for (const k of ['ogDescripcion', 'twitterDescripcion', 'descripcionJsonld', 'tipoNegocio', 'rangoPrecios']) {
      texto(res, [f, 'seo'], n.seo, k, false);
    }
    for (const k of ['titulo', 'descripcion', 'ogDescripcion', 'twitterDescripcion', 'descripcionJsonld']) {
      const sinTokens = typeof n.seo[k] === 'string' ? n.seo[k].replace(/\{ciudad\}/g, '') : '';
      if (/\{[^}]*\}/.test(sinTokens)) res.error([f, 'seo', k], 'solo se admite el marcador {ciudad}');
    }
  }

  if (!esObjeto(n.tema)) {
    res.error([f, 'tema'], 'campo obligatorio (objeto con ' + CLAVES_TEMA.length + ' colores)');
  } else {
    for (const k of CLAVES_TEMA) {
      if (n.tema[k] === undefined) res.error([f, 'tema', k], 'color obligatorio');
      else if (typeof n.tema[k] !== 'string' || !RE_HEX.test(n.tema[k])) res.error([f, 'tema', k], 'debe ser un color hexadecimal (#RGB o #RRGGBB)');
    }
    for (const k of Object.keys(n.tema)) {
      if (!CLAVES_TEMA.includes(k)) res.error([f, 'tema', k], 'color desconocido');
    }
  }
}

/**
 * Valida que un ícono exista en el sprite.
 * @param {unknown} nombre
 * @param {string[]} donde
 * @param {{res: Resultado, iconos: Set<string>}} ctx
 */
function validarIcono(nombre, donde, ctx) {
  if (!esTexto(nombre)) return ctx.res.error(donde, 'campo obligatorio (nombre de ícono)');
  if (!ctx.iconos.has(nombre)) {
    ctx.res.error(donde, 'el ícono "' + nombre + '" no existe (disponibles: ' + [...ctx.iconos].join(', ') + ')');
  }
}

/**
 * Valida que una ruta (relativa a contenido/) sea segura y exista.
 * @param {unknown} rel
 * @param {string[]} donde
 * @param {{res: Resultado, existe: (rel: string) => boolean}} ctx
 * @returns {boolean}
 */
function validarArchivo(rel, donde, ctx) {
  if (!esTexto(rel)) {
    ctx.res.error(donde, 'debe ser una ruta de archivo');
    return false;
  }
  if (!rel.startsWith('img/') || rel.split('/').includes('..') || /["<>\s]/.test(rel)) {
    ctx.res.error(donde, 'ruta no permitida (debe empezar por "img/", sin espacios ni "..")');
    return false;
  }
  if (!ctx.existe(rel)) {
    ctx.res.error(donde, 'el archivo "' + rel + '" no existe en contenido/');
    return false;
  }
  return true;
}

/**
 * Valida servicios.json y devuelve el conjunto de slugs de categorías.
 * @param {any} s
 * @param {any} ctx
 */
function validarServicios(s, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!esObjeto(s)) return res.error([f], 'debe ser un objeto');
  texto(res, [f], s, 'intro');

  const categorias = new Set();
  if (!Array.isArray(s.categorias) || s.categorias.length === 0) {
    res.error([f, 'categorias'], 'debe ser una lista con al menos una categoría');
  } else {
    s.categorias.forEach((c, i) => {
      const donde = [f, 'categorias[' + i + ']'];
      if (!esObjeto(c)) return res.error(donde, 'debe ser un objeto');
      texto(res, donde, c, 'nombre');
      texto(res, donde, c, 'filtro', false);
      if (!esTexto(c.id) || !esSlug(c.id)) res.error([...donde, 'id'], 'debe ser un slug (minúsculas, dígitos y guiones)');
      else if (c.id === 'todos' || ANCLAS_RESERVADAS.includes(c.id)) res.error([...donde, 'id'], '"' + c.id + '" es un identificador reservado');
      else if (categorias.has(c.id)) res.error([...donde, 'id'], 'id de categoría duplicado: ' + c.id);
      else categorias.add(c.id);
    });
  }

  const slugs = new Set();
  const usadas = new Set();
  if (!Array.isArray(s.servicios) || s.servicios.length === 0) {
    res.error([f, 'servicios'], 'debe ser una lista con al menos un servicio');
  } else {
    s.servicios.forEach((sv, i) => {
      const donde = [f, 'servicios[' + i + ']'];
      if (!esObjeto(sv)) return res.error(donde, 'debe ser un objeto');
      if (!esTexto(sv.slug) || !esSlug(sv.slug)) res.error([...donde, 'slug'], 'debe ser un slug (minúsculas, dígitos y guiones)');
      else if (slugs.has(sv.slug)) res.error([...donde, 'slug'], 'slug duplicado: ' + sv.slug);
      else slugs.add(sv.slug);
      texto(res, donde, sv, 'nombre');
      texto(res, donde, sv, 'resumen');
      if (!esTexto(sv.categoria)) res.error([...donde, 'categoria'], 'campo obligatorio');
      else if (!categorias.has(sv.categoria)) res.error([...donde, 'categoria'], 'la categoría "' + sv.categoria + '" no existe en categorias');
      else usadas.add(sv.categoria);
      validarServicio(sv, donde, ctx);
    });
  }
  for (const c of categorias) {
    if (!usadas.has(c)) res.aviso([f, 'categorias'], 'la categoría "' + c + '" no tiene servicios y no se mostrará');
  }
}

/**
 * Valida precio, duración y bloques de detalle de un servicio.
 * @param {any} sv
 * @param {string[]} donde
 * @param {any} ctx
 */
function validarServicio(sv, donde, { res }) {
  if (sv.consultar !== undefined && typeof sv.consultar !== 'boolean') res.error([...donde, 'consultar'], 'debe ser true o false');
  const consultar = sv.consultar === true;
  if (consultar) {
    if (sv.precio !== undefined) res.error([...donde, 'precio'], 'un servicio "consultar" no lleva precio');
    return;
  }
  if (!esEnteroPositivo(sv.precio)) res.error([...donde, 'precio'], 'debe ser entero positivo (pesos, sin decimales) o usar "consultar": true');
  texto(res, donde, sv, 'duracion');
  texto(res, donde, sv, 'insignia', false);
  listaTextos(res, donde, sv, 'descripcion', { obligatorio: true, minimo: 1 });
  listaTextos(res, donde, sv, 'incluye');

  if (sv.notas !== undefined) {
    if (!Array.isArray(sv.notas)) res.error([...donde, 'notas'], 'debe ser una lista');
    else {
      sv.notas.forEach((nt, i) => {
        const d = [...donde, 'notas[' + i + ']'];
        if (!esObjeto(nt)) return res.error(d, 'debe ser un objeto');
        texto(res, d, nt, 'titulo');
        texto(res, d, nt, 'texto');
      });
    }
  }
  if (sv.secciones !== undefined) {
    if (!Array.isArray(sv.secciones)) res.error([...donde, 'secciones'], 'debe ser una lista');
    else {
      sv.secciones.forEach((sec, i) => {
        const d = [...donde, 'secciones[' + i + ']'];
        if (!esObjeto(sec)) return res.error(d, 'debe ser un objeto');
        texto(res, d, sec, 'titulo');
        if (sec.estilo !== undefined && sec.estilo !== 'check' && sec.estilo !== 'lista') res.error([...d, 'estilo'], 'debe ser "check" o "lista"');
        listaTextos(res, d, sec, 'items', { obligatorio: true, minimo: 1 });
      });
    }
  }
  if (sv.complementos !== undefined) {
    if (!Array.isArray(sv.complementos)) res.error([...donde, 'complementos'], 'debe ser una lista');
    else {
      sv.complementos.forEach((c, i) => {
        const d = [...donde, 'complementos[' + i + ']'];
        if (!esObjeto(c)) return res.error(d, 'debe ser un objeto');
        texto(res, d, c, 'nombre');
        const tienePrecio = c.precio !== undefined;
        const incluido = c.incluido === true;
        if (tienePrecio === incluido) res.error(d, 'debe tener "precio" (entero positivo) o "incluido": true, no ambos ni ninguno');
        else if (tienePrecio && !esEnteroPositivo(c.precio)) res.error([...d, 'precio'], 'debe ser entero positivo');
      });
    }
  }
}

/**
 * Valida lineas.json.
 * @param {any} l
 * @param {any} ctx
 */
function validarLineas(l, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!esObjeto(l)) return res.error([f], 'debe ser un objeto');
  texto(res, [f], l, 'intro');
  if (!Array.isArray(l.lineas) || l.lineas.length === 0) return res.error([f, 'lineas'], 'debe ser una lista con al menos una línea');
  l.lineas.forEach((ln, i) => {
    const donde = [f, 'lineas[' + i + ']'];
    if (!esObjeto(ln)) return res.error(donde, 'debe ser un objeto');
    texto(res, donde, ln, 'titulo');
    texto(res, donde, ln, 'texto');
    validarIcono(ln.icono, [...donde, 'icono'], ctx);
    if (!esTexto(ln.destino)) return res.error([...donde, 'destino'], 'campo obligatorio');
    const d = ln.destino;
    if (d.startsWith('filtro:')) {
      const cat = d.slice(7);
      if (!ctx.categorias.has(cat)) res.error([...donde, 'destino'], 'la categoría "' + cat + '" no existe en servicios.json');
    } else if (d.startsWith('#')) {
      if (!ctx.anclasDestino.has(d.slice(1))) {
        res.error([...donde, 'destino'], 'el ancla "' + d + '" no existe (válidas: ' + [...ctx.anclasDestino].map((a) => '#' + a).join(', ') + ')');
      }
    } else {
      res.error([...donde, 'destino'], 'debe ser "filtro:<categoria>" o "#<ancla>"');
    }
  });
}

/**
 * Valida depilacion.json.
 * @param {any} d
 * @param {any} ctx
 */
function validarDepilacion(d, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!esObjeto(d)) return res.error([f], 'debe ser un objeto');
  listaTextos(res, [f], d, 'intro', { obligatorio: true, minimo: 1 });
  if (!esObjeto(d.combos)) {
    res.error([f, 'combos'], 'campo obligatorio (objeto con "intima" y "corporal")');
  } else {
    for (const grupo of ['intima', 'corporal']) {
      const lista = d.combos[grupo];
      if (lista === undefined) continue;
      if (!Array.isArray(lista)) {
        res.error([f, 'combos', grupo], 'debe ser una lista');
        continue;
      }
      lista.forEach((c, i) => {
        const donde = [f, 'combos', grupo + '[' + i + ']'];
        if (!esObjeto(c)) return res.error(donde, 'debe ser un objeto');
        texto(res, donde, c, 'nombre');
        listaTextos(res, donde, c, 'incluye', { obligatorio: true, minimo: 1 });
        if (!esEnteroPositivo(c.precio)) res.error([...donde, 'precio'], 'debe ser entero positivo');
      });
    }
  }
  if (!Array.isArray(d.zonas) || d.zonas.length === 0) return res.error([f, 'zonas'], 'debe ser una lista con al menos una zona');
  d.zonas.forEach((z, i) => {
    const donde = [f, 'zonas[' + i + ']'];
    if (!esObjeto(z)) return res.error(donde, 'debe ser un objeto');
    texto(res, donde, z, 'zona');
    if (!esEnteroPositivo(z.mujer)) res.error([...donde, 'mujer'], 'debe ser entero positivo');
    if (z.hombre !== null && !esEnteroPositivo(z.hombre)) res.error([...donde, 'hombre'], 'debe ser entero positivo o null (sin precio para hombre)');
  });
}

/**
 * Valida productos.json.
 * @param {any} p
 * @param {any} ctx
 */
function validarProductos(p, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!esObjeto(p)) return res.error([f], 'debe ser un objeto');
  texto(res, [f], p, 'titulo');
  if (!Array.isArray(p.grupos) || p.grupos.length === 0) return res.error([f, 'grupos'], 'debe ser una lista con al menos un grupo');
  const ids = new Set();
  p.grupos.forEach((g, i) => {
    const donde = [f, 'grupos[' + i + ']'];
    if (!esObjeto(g)) return res.error(donde, 'debe ser un objeto');
    texto(res, donde, g, 'titulo');
    texto(res, donde, g, 'intro');
    if (!esTexto(g.id) || !esSlug(g.id)) res.error([...donde, 'id'], 'debe ser un slug (minúsculas, dígitos y guiones)');
    else if (ANCLAS_RESERVADAS.includes(g.id) || /^(?:cat|detalle)-/.test(g.id)) res.error([...donde, 'id'], '"' + g.id + '" es un identificador reservado');
    else if (ids.has(g.id)) res.error([...donde, 'id'], 'id de grupo duplicado: ' + g.id);
    else ids.add(g.id);
    if (!Array.isArray(g.productos) || g.productos.length === 0) return res.error([...donde, 'productos'], 'debe ser una lista con al menos un producto');
    g.productos.forEach((pr, j) => {
      const d = [...donde, 'productos[' + j + ']'];
      if (!esObjeto(pr)) return res.error(d, 'debe ser un objeto');
      texto(res, d, pr, 'nombre');
      validarIcono(pr.icono, [...d, 'icono'], ctx);
    });
  });
}

/**
 * Valida galeria.json (lista opcional de fotos).
 * @param {any} g
 * @param {any} ctx
 */
function validarGaleria(g, ctx) {
  const { res, etiqueta: f } = ctx;
  if (!Array.isArray(g)) return res.error([f], 'debe ser una lista de {src, alt}');
  g.forEach((foto, i) => {
    const donde = [f, '[' + i + ']'];
    if (!esObjeto(foto)) return res.error(donde, 'debe ser un objeto');
    texto(res, donde, foto, 'alt');
    if (texto(res, donde, foto, 'src')) validarArchivo(foto.src, [...donde, 'src'], ctx);
    for (const k of ['ancho', 'alto']) {
      if (foto[k] !== undefined && !esEnteroPositivo(foto[k])) res.error([...donde, k], 'debe ser un entero positivo');
    }
  });
}

/**
 * Valida el contenido completo y los archivos referenciados.
 * @param {{datos: Record<string, any>, etiquetas: Record<string, string>, existe: (rel: string) => boolean, leer: (rel: string) => string|null, iconos: Set<string>}} entrada
 * @param {Resultado} res
 */
export function validarContenido({ datos, etiquetas, existe, leer, iconos }, res) {
  const ctx = { res, existe, leer, iconos, slugsServicios: new Set(), categorias: new Set(), anclasDestino: new Set(), etiqueta: '' };

  for (const nombre of FAVICONS) {
    if (!existe('favicons/' + nombre)) res.error([etiquetas.favicons, nombre], 'archivo obligatorio no encontrado');
  }

  for (const [clave, valor] of Object.entries(datos)) buscarMarcadores(valor, [etiquetas[clave]], res);

  if (datos.servicios !== undefined) validarServicios(datos.servicios, { ...ctx, etiqueta: etiquetas.servicios });
  // Slugs y categorías (aunque haya errores) para validar referencias cruzadas en los demás archivos.
  const lista = (v) => (Array.isArray(v) ? v : []);
  const catIds = new Set(lista(datos.servicios?.categorias).filter(esObjeto).map((c) => c.id));
  ctx.categorias = catIds;
  ctx.slugsServicios = new Set(lista(datos.servicios?.servicios).filter(esObjeto).map((s) => s.slug));

  if (datos.depilacion !== undefined) ctx.anclasDestino.add('depilacion');
  if (datos.productos !== undefined) {
    ctx.anclasDestino.add('productos');
    for (const g of lista(datos.productos?.grupos)) if (esObjeto(g) && esTexto(g.id)) ctx.anclasDestino.add(g.id);
  }

  if (datos.negocio !== undefined) validarNegocio(datos.negocio, { ...ctx, etiqueta: etiquetas.negocio });
  if (datos.lineas !== undefined) validarLineas(datos.lineas, { ...ctx, etiqueta: etiquetas.lineas });
  if (datos.depilacion !== undefined) validarDepilacion(datos.depilacion, { ...ctx, etiqueta: etiquetas.depilacion });
  if (datos.productos !== undefined) validarProductos(datos.productos, { ...ctx, etiqueta: etiquetas.productos });
  if (datos.galeria !== undefined) validarGaleria(datos.galeria, { ...ctx, etiqueta: etiquetas.galeria });
}
