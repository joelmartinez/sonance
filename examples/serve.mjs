// Small static server for the examples. Run from the repo root:
//   node examples/serve.mjs
// Then open http://localhost:8371/examples/audio-demo/ or
// http://localhost:8371/examples/synth-designer/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.map': 'application/json' };
const port = Number(process.env.PORT || 8371);

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
    // Some packages ship ES modules with extensionless imports; resolve
    // those the way a consumer's dev server would.
    let body;
    let served = file;
    try { body = await readFile(file); }
    catch {
      served = extname(file) ? `${file}/index.js` : `${file}.js`;
      body = await readFile(served);
    }
    res.writeHead(200, { 'content-type': types[extname(served)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
}).listen(port, () => console.log(`Sonance examples at http://localhost:${port}/examples/`));
