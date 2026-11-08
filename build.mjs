#!/usr/bin/env node
/**
 * build.mjs — genera el sitio estático de un negocio a partir de su contenido (JSON + imágenes)
 * y de las variables de entorno SITIO_*. Sin dependencias npm. Requiere Node >= 20.
 *
 * Uso:
 *   node build.mjs --contenido <dir> --salida <dir> [--env <archivo>]
 *
 * Códigos de salida:
 *   0  sitio generado
 *   1  errores de datos o variables (no se crea ni se modifica la salida)
 *   2  uso incorrecto o archivo/directorio no encontrado
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { cargarVariables } from './src/entorno.mjs';
import { cargarContenido } from './src/contenido.mjs';
import { Resultado, CLAVES_TEMA, validarContenido, validarVariables } from './src/validar.mjs';
import { pagina } from './src/plantillas/pagina.mjs';
import { pagina404, robots, sitemap } from './src/plantillas/extras.mjs';

const DIR_MOTOR = dirname(fileURLToPath(import.meta.url));
const USO = 'Uso: node build.mjs --contenido <dir> --salida <dir> [--env <archivo>]';

/**
 * Termina el proceso con un código y mensajes en stderr.
 * @param {number} codigo
 * @param {string[]} lineas
 * @returns {never}
 */
function salir(codigo, lineas) {
  if (lineas.length) process.stderr.write(lineas.join('\n') + '\n');
  process.exit(codigo);
}

/**
 * Interpreta los argumentos de la línea de comandos.
 * @returns {{contenido: string, salida: string, env: string|undefined}}
 */
function leerArgumentos() {
  let valores;
  try {
    ({ values: valores } = parseArgs({
      options: {
        contenido: { type: 'string' },
        salida: { type: 'string' },
        env: { type: 'string' },
        ayuda: { type: 'boolean', short: 'h' }
      },
      strict: true
    }));
  } catch (e) {
    return salir(2, ['Argumentos incorrectos: ' + e.message, USO]);
  }
  if (valores.ayuda) return salir(0, [USO]);
  if (!valores.contenido || !valores.salida) return salir(2, ['Faltan --contenido y/o --salida.', USO]);
  return valores;
}

/**
 * Comprueba que se pueda usar Node de forma segura.
 */
function comprobarNode() {
  const mayor = Number(process.versions.node.split('.')[0]);
  if (mayor < 20) salir(2, ['Se requiere Node 20 o superior (versión actual: ' + process.versions.node + ').']);
}

/**
 * Impide que --salida borre el contenido, el motor o el directorio de trabajo, o que quede dentro
 * del contenido o del motor (excepto la carpeta `dist/` del propio motor, ignorada por git).
 * @param {string} salida Ruta absoluta.
 * @param {string[]} protegidos Rutas absolutas que no pueden quedar dentro de la salida.
 * @param {string[]} cerrados Rutas absolutas dentro de las cuales tampoco puede estar la salida.
 */
function comprobarSalida(salida, protegidos, cerrados) {
  const raiz = resolve(sep);
  const dentro = (hijo, padre) => hijo === padre || hijo.startsWith(padre + sep);
  if (salida === raiz || protegidos.some((p) => dentro(p, salida)) || cerrados.some((c) => dentro(salida, c) && !(c === DIR_MOTOR && dentro(salida, resolve(c, 'dist'))))) {
    salir(2, ['--salida "' + salida + '" no es segura: contiene o está dentro del contenido, el motor o el directorio de trabajo.']);
  }
  if (existsSync(salida) && !statSync(salida).isDirectory()) salir(2, ['--salida "' + salida + '" existe y no es un directorio.']);
}

/**
 * Extrae viewBox e interior de un SVG para incrustarlo en línea.
 * @param {string} svg
 * @returns {{viewBox: string, interior: string}|null}
 */
function extraerSvg(svg) {
  const m = /<svg[^>]*\sviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/.exec(svg);
  return m ? { viewBox: m[1], interior: m[2].trim() } : null;
}

/**
 * CSS final: paleta del negocio (generada) + hoja de estilos del motor.
 * @param {Record<string, string>} tema
 * @param {string} cssMotor
 * @returns {string}
 */
function construirCss(tema, cssMotor) {
  const lineas = CLAVES_TEMA.map((k) => '  --' + k + ': ' + tema[k] + ';');
  return '/* Paleta generada por build.mjs desde negocio.tema. */\n:root {\n' + lineas.join('\n') + '\n}\n\n' + cssMotor;
}

/**
 * Lista recursivamente los archivos de un directorio (rutas relativas).
 * @param {string} dir
 * @param {string} [base]
 * @returns {string[]}
 */
function listarArchivos(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    return e.isDirectory() ? listarArchivos(ruta, base) : [relative(base, ruta)];
  });
}

/**
 * Escribe la salida en un directorio temporal hermano y la intercambia al final.
 * @param {string} salida
 * @param {(tmp: string) => void} escribir
 */
function escribirAtomico(salida, escribir) {
  const tmp = salida + '.tmp-' + process.pid;
  const viejo = salida + '.old-' + process.pid;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(dirname(salida), { recursive: true });
  mkdirSync(tmp, { recursive: true });
  try {
    escribir(tmp);
    if (existsSync(salida)) {
      renameSync(salida, viejo);
      try {
        renameSync(tmp, salida);
      } catch (e) {
        renameSync(viejo, salida);
        throw e;
      }
      rmSync(viejo, { recursive: true, force: true });
    } else {
      renameSync(tmp, salida);
    }
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

/**
 * Programa principal.
 */
function main() {
  comprobarNode();
  const args = leerArgumentos();
  const cwd = process.cwd();
  const dirContenido = resolve(cwd, args.contenido);
  const salida = resolve(cwd, args.salida);

  if (!existsSync(dirContenido) || !statSync(dirContenido).isDirectory()) {
    salir(2, ['No se encontró el directorio de contenido: ' + args.contenido]);
  }
  let archivoEnv = null;
  if (args.env) {
    archivoEnv = resolve(cwd, args.env);
    if (!existsSync(archivoEnv)) salir(2, ['No se encontró el archivo de variables: ' + args.env]);
  } else if (existsSync(resolve(cwd, '.env'))) {
    archivoEnv = resolve(cwd, '.env');
  }
  comprobarSalida(salida, [dirContenido, DIR_MOTOR, cwd], [dirContenido, DIR_MOTOR]);

  const variables = cargarVariables(archivoEnv, process.env);
  const { datos, etiquetas, errores: erroresLectura } = cargarContenido(dirContenido, cwd);
  etiquetas.favicons = relative(cwd, join(dirContenido, 'favicons')) || 'favicons';

  const sprite = readFileSync(join(DIR_MOTOR, 'src', 'iconos.svg'), 'utf8').trim();
  const iconos = new Set([...sprite.matchAll(/\sid="i-([a-z0-9-]+)"/g)].map((m) => m[1]));

  const res = new Resultado();
  res.errores.push(...erroresLectura);
  validarVariables(variables, res);
  const archivoContenido = (rel) => join(dirContenido, rel);
  validarContenido({
    datos,
    etiquetas,
    existe: (rel) => existsSync(archivoContenido(rel)) && statSync(archivoContenido(rel)).isFile(),
    leer: (rel) => (existsSync(archivoContenido(rel)) ? readFileSync(archivoContenido(rel), 'utf8') : null),
    iconos
  }, res);

  for (const aviso of res.avisos) process.stderr.write('aviso: ' + aviso + '\n');
  if (res.errores.length) {
    salir(1, [...res.errores, 'Build cancelado: ' + res.errores.length + ' error(es). No se generó salida.']);
  }

  const ahora = new Date();
  const ctx = {
    v: variables,
    n: datos.negocio,
    lineas: datos.lineas,
    servicios: datos.servicios,
    depilacion: datos.depilacion || null,
    productos: datos.productos || null,
    galeria: datos.galeria || [],
    sprite,
    isotipoSvg: datos.negocio.logos.isotipo ? extraerSvg(readFileSync(archivoContenido(datos.negocio.logos.isotipo), 'utf8')) : null,
    anio: ahora.getFullYear(),
    fecha: ahora.toISOString().slice(0, 10)
  };

  const generados = {
    'index.html': pagina(ctx),
    '404.html': pagina404(ctx),
    'robots.txt': robots(ctx),
    'sitemap.xml': sitemap(ctx),
    'css/styles.css': construirCss(ctx.n.tema, readFileSync(join(DIR_MOTOR, 'static', 'css', 'styles.css'), 'utf8'))
  };
  const marcadores = Object.entries(generados).filter(([, t]) => /\{\{|\}\}/.test(t)).map(([a]) => a);
  if (marcadores.length) salir(1, [...marcadores.map((a) => a + ': la salida contiene "{{" o "}}"'), 'Build cancelado.']);

  try {
    escribirAtomico(salida, (tmp) => {
      const copiar = { recursive: true, filter: (origen) => !['.gitkeep', '.DS_Store'].includes(basename(origen)) };
      cpSync(join(DIR_MOTOR, 'static'), tmp, copiar);
      if (existsSync(join(dirContenido, 'img'))) cpSync(join(dirContenido, 'img'), join(tmp, 'img'), copiar);
      for (const f of listarArchivos(join(dirContenido, 'favicons'))) cpSync(join(dirContenido, 'favicons', f), join(tmp, f));
      for (const [archivo, texto] of Object.entries(generados)) {
        mkdirSync(dirname(join(tmp, archivo)), { recursive: true });
        writeFileSync(join(tmp, archivo), texto, 'utf8');
      }
    });
  } catch (e) {
    return salir(1, ['Error al escribir la salida: ' + e.message]);
  }
  process.stdout.write('Sitio generado en ' + relative(cwd, salida) + ' (' + listarArchivos(salida).length + ' archivos).\n');
}

main();
