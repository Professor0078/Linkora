import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lightweight in-memory rate limiter for API abuse protection
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anon');
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }
  bucket.count += 1;
  if (bucket.count > 120) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }
  next();
}

function resolveOrigin(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Security headers compatible with preview iframe
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // SEO: robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = resolveOrigin(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /dashboard',
        'Disallow: /admin',
        `Sitemap: ${origin}/sitemap.xml`,
      ].join('\n')
    );
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const origin = resolveOrigin(req);
    const today = new Date().toISOString().slice(0, 10);
    const routes = ['/', '/about', '/privacy', '/terms', '/contact', '/login', '/signup'];
    const urlsXml = routes
      .map(
        (route) => `  <url>
    <loc>${origin}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`
      )
      .join('\n');

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`
      );
  });

  // Health & API routes
  app.use('/api', apiRateLimiter);
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'linkora' });
  });

  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Linkora server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
