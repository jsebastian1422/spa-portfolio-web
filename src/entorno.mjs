/**
 * Lectura de variables SITIO_* desde un archivo .env opcional y desde el entorno del proceso.
 * El entorno del proceso tiene prioridad (así lo usa Cloudflare Pages).
 */
import { readFileSync } from 'node:fs';

/**
 * Interpreta el texto de un archivo .env (CLAVE=valor, comentarios con #, comillas opcionales).
 * @param {string} texto
 * @returns {Record<string, string>}
 */
export function parsearDotenv(texto) {
  const salida = {};
  for (const bruta of texto.split(/\r?\n/)) {
    const linea = bruta.trim();
    if (!linea || linea.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(linea);
    if (!m) continue;
    let valor = m[2].trim();
    const comilla = valor[0];
    if ((comilla === '"' || comilla === "'") && valor.length >= 2 && valor.endsWith(comilla)) {
      valor = valor.slice(1, -1);
    } else {
      valor = valor.replace(/\s+#.*$/, '').trim();
    }
    salida[m[1]] = valor;
  }
  return salida;
}

/**
 * Reúne las variables SITIO_* (archivo .env primero, entorno del proceso encima).
 * Una variable vacía en el proceso se considera no definida.
 * @param {string|null} archivoEnv Ruta del .env o null.
 * @param {NodeJS.ProcessEnv} entornoProceso
 * @returns {Record<string, string>}
 */
export function cargarVariables(archivoEnv, entornoProceso) {
  const variables = {};
  if (archivoEnv) {
    const delArchivo = parsearDotenv(readFileSync(archivoEnv, 'utf8'));
    for (const [clave, valor] of Object.entries(delArchivo)) {
      if (clave.startsWith('SITIO_') && valor !== '') variables[clave] = valor;
    }
  }
  for (const [clave, valor] of Object.entries(entornoProceso)) {
    if (clave.startsWith('SITIO_') && valor !== undefined && valor !== '') variables[clave] = valor;
  }
  return variables;
}
