/**
 * Carga de los archivos JSON de contenido de un negocio.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Archivos de contenido: clave -> { archivo, obligatorio }. */
export const ARCHIVOS = {
  negocio: { archivo: 'negocio.json', obligatorio: true },
  lineas: { archivo: 'lineas.json', obligatorio: true },
  servicios: { archivo: 'servicios.json', obligatorio: true },
  depilacion: { archivo: 'depilacion.json', obligatorio: false },
  productos: { archivo: 'productos.json', obligatorio: false },
  galeria: { archivo: 'galeria.json', obligatorio: false }
};

/**
 * Lee los JSON de contenido y acumula errores de lectura o de sintaxis.
 * @param {string} dirContenido Ruta absoluta del directorio de contenido.
 * @param {string} dirBase Directorio desde el que se muestran las rutas en los mensajes.
 * @returns {{datos: Record<string, any>, etiquetas: Record<string, string>, errores: string[]}}
 */
export function cargarContenido(dirContenido, dirBase) {
  const datos = {};
  const etiquetas = {};
  const errores = [];
  for (const [clave, { archivo, obligatorio }] of Object.entries(ARCHIVOS)) {
    const ruta = join(dirContenido, archivo);
    etiquetas[clave] = relative(dirBase, ruta) || archivo;
    if (!existsSync(ruta)) {
      if (obligatorio) errores.push(etiquetas[clave] + ': archivo obligatorio no encontrado');
      continue;
    }
    try {
      datos[clave] = JSON.parse(readFileSync(ruta, 'utf8'));
    } catch (e) {
      errores.push(etiquetas[clave] + ': JSON inválido (' + e.message + ')');
    }
  }
  return { datos, etiquetas, errores };
}
