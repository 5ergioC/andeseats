const fs = require('fs');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');

const BASE_URL = (process.env.SITEMAP_BASE_URL || 'https://www.andeseats.co').replace(
  /\/+$/,
  ''
);

const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml');

// Update this array whenever you expose nuevas paginas publicas.
const baseRoutes = [
  {
    url: '/',
    changefreq: 'monthly',
    priority: 1.0
  }
];

const readExtraRoutes = () => {
  const configPath = path.resolve(__dirname, 'sitemap.routes.json');

  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!Array.isArray(parsed)) {
      console.warn(
        '[sitemap] sitemap.routes.json debe exportar un array. Ignorando contenido.'
      );
      return [];
    }

    return parsed;
  } catch (error) {
    console.warn('[sitemap] No se pudo leer sitemap.routes.json:', error);
    return [];
  }
};

const normalizeRoute = (route) => {
  if (typeof route === 'string') {
    return { url: route };
  }

  if (!route || typeof route !== 'object') {
    return null;
  }

  const { url, changefreq, priority, lastmod } = route;
  if (!url) {
    return null;
  }

  return {
    url,
    changefreq,
    priority,
    lastmod
  };
};

const toRelativeUrl = (value) => {
  if (!value) {
    return '/';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const withoutBase = value.replace(BASE_URL, '');
    return withoutBase.startsWith('/') ? withoutBase : `/${withoutBase}`;
  }

  return value.startsWith('/') ? value : `/${value}`;
};

async function generate() {
  const routes = [...baseRoutes, ...readExtraRoutes()]
    .map(normalizeRoute)
    .filter(Boolean);

  if (routes.length === 0) {
    throw new Error('No hay rutas configuradas para el sitemap.');
  }

  const sitemapStream = new SitemapStream({ hostname: BASE_URL });

  routes.forEach((route) => {
    sitemapStream.write({
      url: toRelativeUrl(route.url),
      changefreq: route.changefreq || 'monthly',
      priority:
        typeof route.priority === 'number'
          ? route.priority
          : route.url === '/'
            ? 1
            : 0.7,
      lastmod: route.lastmod || new Date().toISOString()
    });
  });

  sitemapStream.end();

  const xml = await streamToPromise(sitemapStream).then((data) => data.toString());

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, 'utf-8');

  console.log(`[sitemap] Sitemap generado en ${OUTPUT_PATH}`);
}

if (require.main === module) {
  generate().catch((error) => {
    console.error('[sitemap] Error al generar el sitemap:', error);
    process.exitCode = 1;
  });
}

module.exports = generate;
