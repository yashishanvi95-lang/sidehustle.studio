const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) { reject(new Error('Request too large. Keep your prompt under 18,000 characters.')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON request.')); } });
    req.on('error', reject);
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && req.method === 'GET') {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2500) });
      if (!response.ok) throw new Error('Ollama is not responding.');
      const data = await response.json();
      const installed = (data.models || []).some(model => model.name === MODEL || model.name.startsWith(`${MODEL}:`));
      return send(res, 200, { ok: installed, model: MODEL, message: installed ? 'Ready' : `Model ${MODEL} is not installed. Run: ollama run ${MODEL}` });
    } catch {
      return send(res, 200, { ok: false, model: MODEL, message: 'Ollama is not running. Install Ollama and run the selected model.' });
    }
  }
  if (url.pathname === '/api/generate' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (error) { return send(res, 400, { error: error.message }); }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const system = typeof body.system === 'string' ? body.system.slice(0, 4000) : 'You are a helpful writing assistant.';
    if (!prompt || prompt.length > 18000) return send(res, 400, { error: 'Please provide a prompt under 18,000 characters.' });
    try {
      const response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, stream: false, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], options: { temperature: 0.7 } }),
        signal: AbortSignal.timeout(180000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || `Ollama returned HTTP ${response.status}.`;
        return send(res, 502, { error: message.includes('not found') ? `Model '${MODEL}' is not installed. Run: ollama run ${MODEL}` : message });
      }
      return send(res, 200, { text: data.message?.content || '', model: data.model || MODEL });
    } catch (error) {
      const message = error.name === 'TimeoutError' ? 'The model took too long to respond. Try a smaller model or a shorter prompt.' : 'Cannot connect to Ollama at 127.0.0.1:11434. Make sure Ollama is installed and running.';
      return send(res, 502, { error: message });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) return send(res, 403, { error: 'Forbidden.' });
  fs.readFile(file, (error, content) => {
    if (error) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
});
server.listen(PORT, '127.0.0.1', () => console.log(`SideHustle AI Studio running at http://localhost:${PORT}\nModel: ${MODEL}\nKeep Ollama running in the background.`));
