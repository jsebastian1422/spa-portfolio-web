# spa-portfolio-web

Motor para generar el sitio web de una sola página de un spa, centro de estética o negocio de bienestar.
Un script de Node **sin dependencias** (`build.mjs`) lee los datos del negocio (archivos JSON + imágenes) y unas
variables de entorno, valida todo y escribe un sitio estático listo para publicar (HTML, CSS y JS sin frameworks).

- Los datos del negocio **no viven en este repositorio**: cada negocio tiene su propio repositorio (privado) con su
  carpeta `contenido/` y usa este motor como submódulo git.
- Este repositorio incluye un negocio ficticio de ejemplo (`ejemplo/`) para probar el motor.
- Versión actual: **1.0.0** (ver `CHANGELOG.md`).

## Requisitos

- Node **20 o superior** (probado con Node 24). No hay `npm install`: no existe `package.json` ni dependencias.
- Git (solo para usar el motor como submódulo).

## Probar el motor con el ejemplo

```bash
node build.mjs --contenido ejemplo/contenido --salida dist --env ejemplo/.env.ejemplo
```

El sitio queda en `dist/` (carpeta ignorada por git). Para verlo en local:

```bash
python3 -m http.server 8000 --directory dist   # y abre http://127.0.0.1:8000
```

## Comando de build

```bash
node build.mjs --contenido <carpeta> --salida <carpeta> [--env <archivo>]
```

| Opción | Qué hace |
|---|---|
| `--contenido` | Carpeta con los JSON y las imágenes del negocio (obligatoria) |
| `--salida` | Carpeta donde se escribe el sitio; se reemplaza por completo (obligatoria) |
| `--env` | Archivo `.env` con las variables `SITIO_*`. Si no se indica y existe `.env` en el directorio actual, se usa ese |

Las variables del entorno del proceso tienen prioridad sobre el archivo (así las entrega Cloudflare Pages).

| Código de salida | Significado |
|---|---|
| `0` | Sitio generado |
| `1` | Hay errores en las variables o en los datos. Se listan **todos** en `stderr` y **no se crea ni se modifica** la salida |
| `2` | Uso incorrecto o no se encontró un archivo/carpeta (por ejemplo `--contenido`, `--env`, o una `--salida` que contenga el contenido o el motor) |

Cada error tiene el formato `archivo › ruta › campo: motivo`, por ejemplo
`contenido/servicios.json › servicios[3] › precio: debe ser entero positivo`.
La salida se escribe primero en una carpeta temporal y se intercambia al final, así nunca queda un sitio a medias.
Los avisos (por ejemplo, texto de "Nosotros" en borrador) se imprimen como `aviso: …` y no detienen el build.

## Variables de entorno (datos del negocio)

| Variable | Obligatoria | Formato | Dónde se usa |
|---|---|---|---|
| `SITIO_WHATSAPP` | Sí | Solo dígitos (10 a 15), con indicativo, sin `+` ni espacios. Ej. `573001234567` | Enlaces de WhatsApp, configuración de `main.js`, teléfono del JSON-LD |
| `SITIO_DOMINIO` | Sí | `https://…` sin barra final | Canónica, Open Graph, sitemap, robots, JSON-LD |
| `SITIO_CIUDAD` | Sí | Texto | Título y descripción (marcador `{ciudad}`), contacto, JSON-LD |
| `SITIO_DIRECCION` | Sí | Texto | Contacto, enlace "Cómo llegar", JSON-LD |
| `SITIO_HORARIO_LV`, `SITIO_HORARIO_SAB`, `SITIO_HORARIO_DOM` | Sí | Texto (ej. `8:00 a. m. - 6:00 p. m.`, `Cerrado`) | Contacto y JSON-LD (`openingHours`) |
| `SITIO_INSTAGRAM`, `SITIO_FACEBOOK`, `SITIO_TIKTOK` | No | `https://…` | Contacto y pie. Si falta, no se muestra ese enlace ni su `sameAs` |
| `SITIO_MAPA_URL` | No | URL de embed de Google Maps (`https://www.google.com/maps/embed?…`) | Mapa en Contacto. Si falta, solo queda el botón "Cómo llegar" |

Ningún valor puede contener `{{` ni `}}`. Un valor vacío cuenta como no definido. Ver `ejemplo/.env.ejemplo`.
El archivo `.env` real **nunca se sube a git** (está en `.gitignore`).

## Formato del contenido

La carpeta de contenido tiene esta forma:

```
contenido/
├── negocio.json        (obligatorio)
├── lineas.json         (obligatorio)
├── servicios.json      (obligatorio)
├── depilacion.json     (opcional: sin archivo no hay sección)
├── productos.json      (opcional)
├── galeria.json        (opcional: lista vacía o sin archivo = sin sección)
├── img/                (se publica en /img; logos, imagen para redes, galería…)
└── favicons/           (se publican en la raíz: favicon.svg, favicon.ico, icon-192.png, apple-touch-icon.png son obligatorios)
```

Textos "enriquecidos" (descripciones, listas, intros, notas): `**negrita**` y `*cursiva*` producen `<strong>` y `<em>`;
cualquier otro carácter (`<`, `&`, comillas) se escapa. Los nombres y títulos son texto plano. Los precios son
**enteros en pesos** (`95000` se muestra `$95.000`). Los `slug` e `id` usan minúsculas, dígitos y guiones.
Las rutas de imagen empiezan por `img/` y se escriben relativas a `contenido/`.
Los íconos se indican por nombre, sin el prefijo `i-`: `facial`, `bienestar`, `belleza`, `depilacion`, `corporal`,
`cosmetica`, `armonizadores`, `lupa`, `ok`, `reloj`, `pin`, `wa` (definidos en `src/iconos.svg`).

### `negocio.json`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre`, `nombreCompleto` | texto | Nombre corto (marca, Open Graph) y nombre completo (título del hero, logos, pie, JSON-LD) |
| `idioma`, `pais` | texto | Opcionales. Por defecto `es-CO` y `CO` |
| `hero` | objeto | `saludo`, `frase`, `cta` (texto del botón de diagnóstico) y `apoyo` (opcional) |
| `mensajes` | objeto | Mensajes prellenados de WhatsApp: `general`, `diagnostico`, `depilacion`, `servicio` y `producto`. `servicio` y `producto` deben incluir `{nombre}` |
| `servicioDiagnostico` | slug | Opcional. Servicio que usa el mensaje `diagnostico` en vez del de `servicio` |
| `textoNosotros` | objeto | `parrafos` (lista) y `borrador` (`true`/`false`; si es `true` se imprime un aviso y la sección lleva `data-borrador`) |
| `diferenciadores` | lista | Opcional. `{icono, titulo, texto}` |
| `avisoPie` | texto | Aviso legal del pie |
| `logos` | objeto | `cabecera`, `portada`, `pie` (rutas de imagen), `ancho` y `alto` (píxeles, comunes a los tres) e `isotipo` (opcional: SVG con `viewBox` que se incrusta en el encabezado) |
| `ogImagen` | ruta | Imagen para redes (1200 × 630) |
| `seo` | objeto | `titulo` y `descripcion` (admiten `{ciudad}`); opcionales: `ogDescripcion`, `twitterDescripcion`, `descripcionJsonld`, `tipoNegocio` (por defecto `DaySpa`), `rangoPrecios` (por defecto `$$`) |
| `tema` | objeto | 8 colores hexadecimales: `turquesa`, `negro-marca`, `turquesa-profundo`, `turquesa-enlace`, `turquesa-bruma`, `nude`, `blanco-roto`, `texto` (son las variables CSS de la hoja de estilos) |

### `lineas.json`

`{ "intro": "…", "lineas": [ {titulo, texto, icono, destino} ] }`. `destino` es `filtro:<id de categoría>` (aplica el
filtro del catálogo), `#depilacion`, `#productos` o `#<id de un grupo de productos>`.

### `servicios.json`

`{ "intro": "…", "categorias": [ {id, nombre, filtro?} ], "servicios": [ … ] }`. `nombre` es el título del grupo y
`filtro` (opcional) el texto del botón de filtro si debe ser distinto. Cada servicio:

| Campo | Descripción |
|---|---|
| `slug`, `nombre`, `categoria`, `resumen` | Obligatorios. `categoria` debe existir en `categorias` y el `slug` no puede repetirse |
| `consultar: true` | Tarjeta "Consultar por WhatsApp" sin precio ni detalle (no lleva `precio`, `duracion` ni descripción) |
| `precio`, `duracion` | Entero positivo y texto (`1 h 30 min`). Obligatorios si no es `consultar` |
| `insignia` | Opcional. Marca la tarjeta como destacada con ese texto |
| `descripcion` | Lista de párrafos (obligatoria si no es `consultar`) |
| `notas` | Opcional. `{titulo, texto}` |
| `incluye` | Opcional. Lista con el título "Incluye" |
| `secciones` | Opcional. `{titulo, items[], estilo?}`; `estilo: "check"` usa viñetas de verificación en vez de la lista simple |
| `complementos` | Opcional. `{nombre, precio}` o `{nombre, incluido: true}` |

El detalle se muestra siempre en este orden: descripción, notas, incluye, secciones, complementos.

### `depilacion.json`

`{ "intro": ["párrafo", …], "combos": { "intima": [ {nombre, incluye[], precio} ], "corporal": [ … ] }, "zonas": [ {zona, mujer, hombre} ] }`.
`hombre: null` indica que esa zona no tiene precio para hombre (se oculta en la vista Hombre).

### `productos.json`

`{ "titulo": "…", "grupos": [ {id, titulo, intro, productos: [ {nombre, icono} ]} ] }`. El `id` de cada grupo es su ancla
(`#id`) y puede usarse como `destino` de una línea.

### `galeria.json`

Lista `[ {src, alt, ancho?, alto?} ]` (600 × 600 por defecto). Abre el lightbox al tocar una foto.

## Crear el sitio de un negocio nuevo

1. Crea un repositorio **privado** para el negocio y, dentro, la carpeta `contenido/` copiando la de `ejemplo/contenido/`.
2. Edita los JSON, cambia los logos, los favicons y la imagen para redes, y ajusta los colores en `negocio.json › tema`.
3. Agrega el motor como submódulo fijado a una versión:
   ```bash
   git submodule add <URL de este repositorio> motor
   git -C motor checkout v1.0.0
   git add motor && git commit -m "chore: agrega el motor v1.0.0"
   ```
4. Copia `ejemplo/.env.ejemplo` a `.env` (no se versiona) con los datos reales y construye:
   ```bash
   node motor/build.mjs --contenido contenido --salida dist --env .env
   ```
5. Agrega a `.gitignore` del repositorio del negocio: `dist/`, `.env` y `.DS_Store`.

Para **actualizar el motor**: `git -C motor fetch --tags && git -C motor checkout vX.Y.Z` y luego commit del cambio de `motor`.
Quien clone el repositorio del negocio debe usar `git clone --recurse-submodules <url>` (o `git submodule update --init`).

## Cloudflare Pages

Crea el proyecto conectando el **repositorio del negocio** (no este) y configura:

| Ajuste | Valor |
|---|---|
| Framework preset | Ninguno |
| Build command | `node motor/build.mjs --contenido contenido --salida dist` |
| Build output directory | `dist` |
| Variable `NODE_VERSION` | `22` (cualquier versión 20 o superior) |
| Variables `SITIO_*` | Las de la tabla de arriba (Settings › Variables and Secrets) |

Cloudflare solo puede clonar el submódulo si el repositorio del motor es **público** (o si se le da acceso). Si el build falla
por un dato inválido o una variable faltante, el despliegue no se publica y la última versión sigue en línea.

## Estructura del motor

```
build.mjs                 CLI: carga variables y contenido, valida, renderiza y escribe la salida
src/entorno.mjs           Lectura de .env y variables SITIO_*
src/contenido.mjs         Lectura de los JSON de contenido
src/validar.mjs           Validación de variables y contenido (errores acumulados)
src/util.mjs              Escape HTML, **negrita**/*cursiva*, formato COP, URL de WhatsApp
src/iconos.svg            Sprite de íconos disponibles por nombre
src/plantillas/*.mjs      Una función por sección (cabecera, inicio, catálogo, depilación, productos, nosotros, contacto, pie, JSON-LD, 404…)
static/                   CSS, JS y _headers que se copian tal cual a la salida
ejemplo/                  Negocio ficticio de demostración (contenido + .env.ejemplo)
```

El navegador recibe solo HTML, CSS y JS estáticos. `main.js` no contiene datos del negocio: lee el número de WhatsApp y los
mensajes de un bloque `<script type="application/json" id="config-sitio">` que genera el build (los `href` de WhatsApp
también salen ya escritos en el HTML, así que los enlaces funcionan sin JavaScript).

## Licencia

Este repositorio todavía no declara licencia.
