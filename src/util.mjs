/**
 * Utilidades de texto del motor: escape HTML, inline mínimo, formato COP, WhatsApp y JSON embebido.
 */

/**
 * Escapa texto para usarlo como contenido de un nodo HTML.
 * @param {unknown} valor
 * @returns {string}
 */
export function esc(valor) {
  return String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escapa texto para usarlo dentro de un atributo HTML entre comillas dobles.
 * @param {unknown} valor
 * @returns {string}
 */
export function escAttr(valor) {
  return esc(valor).replace(/"/g, '&quot;');
}

/**
 * Escapa el texto y convierte el inline mínimo: **negrita** y *cursiva*.
 * Es lo único que produce etiquetas a partir de los datos.
 * @param {string} texto
 * @returns {string}
 */
export function inline(texto) {
  return esc(texto)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/**
 * Formatea un entero como pesos colombianos: 95000 -> "$95.000".
 * @param {number} valor
 * @returns {string}
 */
export function cop(valor) {
  return '$' + String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Comprueba si un texto es un slug válido (minúsculas, dígitos y guiones).
 * @param {string} texto
 * @returns {boolean}
 */
export function esSlug(texto) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(texto);
}

/**
 * Rellena el marcador {nombre} de una plantilla de mensaje.
 * @param {string} plantilla
 * @param {string} [nombre]
 * @returns {string}
 */
export function rellenarNombre(plantilla, nombre) {
  return nombre === undefined ? plantilla : plantilla.split('{nombre}').join(nombre);
}

/**
 * Construye la URL de WhatsApp con el mensaje codificado (igual que main.js).
 * @param {string} numero Solo dígitos, con indicativo.
 * @param {string} mensaje
 * @returns {string}
 */
export function waUrl(numero, mensaje) {
  return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensaje);
}

/**
 * Serializa un objeto a JSON seguro para incrustar en un <script> (escapa "</").
 * @param {unknown} objeto
 * @param {number} [indentacion]
 * @returns {string}
 */
export function jsonEnScript(objeto, indentacion) {
  return JSON.stringify(objeto, null, indentacion).replace(/<\//g, '<\\/');
}

/**
 * Convierte texto a la forma de consulta de Google Maps (espacios como "+").
 * @param {string} texto
 * @returns {string}
 */
export function paraConsultaMapa(texto) {
  return encodeURIComponent(texto).replace(/%20/g, '+');
}
