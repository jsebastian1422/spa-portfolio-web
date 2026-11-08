/**
 * Bloque JSON-LD (schema.org) del negocio.
 */
import { jsonEnScript } from '../util.mjs';
import { conCiudad, redes } from './comun.mjs';
import { serviciosOrdenados } from './catalogo.mjs';

/**
 * Genera el <script type="application/ld+json"> con la oferta de servicios.
 * @param {object} ctx
 * @returns {string}
 */
export function jsonLd(ctx) {
  const { n, v } = ctx;
  const seo = n.seo;
  const datos = {
    '@context': 'https://schema.org',
    '@type': seo.tipoNegocio || 'DaySpa',
    name: n.nombreCompleto,
    description: conCiudad(seo.descripcionJsonld || seo.descripcion, ctx),
    url: v.SITIO_DOMINIO + '/',
    image: v.SITIO_DOMINIO + '/' + n.ogImagen,
    telephone: '+' + v.SITIO_WHATSAPP,
    priceRange: seo.rangoPrecios || '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: v.SITIO_DIRECCION,
      addressLocality: v.SITIO_CIUDAD,
      addressCountry: n.pais || 'CO'
    },
    openingHours: [
      'Mo-Fr ' + v.SITIO_HORARIO_LV,
      'Sa ' + v.SITIO_HORARIO_SAB,
      'Su ' + v.SITIO_HORARIO_DOM
    ]
  };
  const sameAs = redes(ctx).map((r) => r.url);
  if (sameAs.length) datos.sameAs = sameAs;
  datos.hasOfferCatalog = {
    '@type': 'OfferCatalog',
    name: 'Servicios',
    itemListElement: serviciosOrdenados(ctx)
      .filter((s) => !s.consultar)
      .map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.nombre },
        price: s.precio,
        priceCurrency: 'COP'
      }))
  };
  return '<script type="application/ld+json">\n' + jsonEnScript(datos, 2) + '\n</script>';
}
