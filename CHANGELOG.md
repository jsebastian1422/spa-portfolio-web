# Changelog

Todos los cambios importantes de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado semántico
([SemVer](https://semver.org/lang/es/)).

## [1.0.0] - 2026-11-07

Primera versión del motor.

### Añadido
- `build.mjs`: genera el sitio estático (HTML, CSS, JS, `404.html`, `robots.txt`, `sitemap.xml`, `_headers`) a partir de `contenido/` (JSON + imágenes) y de variables de entorno `SITIO_*`, sin dependencias npm (Node 20 o superior).
- Validación de variables y datos con errores acumulados (`archivo › ruta › campo: motivo`), códigos de salida 0, 1 y 2, y escritura atómica de la salida (si hay errores no se crea ni modifica nada).
- Plantillas por sección: encabezado, inicio, líneas, catálogo con filtro y detalle, depilación (combos y precios Mujer/Hombre), productos, galería con lightbox, nosotros, contacto, pie, JSON-LD y 404.
- Paleta como datos (`negocio.tema`, mismas variables CSS) y tipografías fijas.
- Negocio de ejemplo ficticio en `ejemplo/` con `.env.ejemplo`.
- `README.md` con el formato de datos, las variables, el comando de build, la configuración de Cloudflare Pages y cómo crear un negocio nuevo.

### Cambiado
- `main.js` ya no contiene datos del negocio: el número de WhatsApp y los mensajes llegan en el bloque `config-sitio` generado por el build.
