// pnpm present — build the prototypes and the viewer, then show them at
// http://localhost:4400, laid out the way Metalab Sites serves them
// (/<project>/<site>/), so the viewer finds each prototype at ../<name>/.
// --no-build skips the build and serves what is already there.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

import {
  explorationPackage,
  explorationsDir,
  run,
  sitesProject,
} from '../explorations/lib.mjs';

const VIEWER = 'present';
const port = Number(process.env.PORT) || 4400;
const project = sitesProject() || 'local';

const prototypes = readdirSync(explorationsDir).filter((name) =>
  existsSync(path.join(explorationsDir, name, 'prototype.json')),
);

if (!process.argv.includes('--no-build')) {
  const filters = [VIEWER, ...prototypes].map(
    (name) => `--filter=@explorations/${name}`,
  );
  run('pnpm', ['turbo', 'run', 'build', ...filters]);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const sites = Object.fromEntries(
  [VIEWER, ...prototypes].map((name) => [
    name,
    explorationPackage(name).distDir,
  ]),
);

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const [, proj, site, ...rest] = decodeURIComponent(url.pathname).split('/');
  if (url.pathname === '/') {
    res.writeHead(302, { location: `/${project}/${VIEWER}/` });
    return res.end();
  }
  // (the Sites page kit isn't here, so the viewer saves choices in the browser)
  if (proj !== project || !sites[site]) {
    res.writeHead(404);
    return res.end('Not found');
  }
  if (rest.length === 0) {
    res.writeHead(302, { location: `/${project}/${site}/${url.search}` });
    return res.end();
  }
  const root = sites[site];
  let file = path.join(root, ...rest);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end();
  }
  if (existsSync(file) && statSync(file).isDirectory())
    file = path.join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(readFileSync(file));
}).listen(port, () => {
  console.log(
    `\nPrototype viewer: http://localhost:${port}/${project}/${VIEWER}/\n` +
      `(${prototypes.length} prototype(s): ${prototypes.join(', ') || 'none yet'})\n`,
  );
});
