'use strict';
/**
 * WorkWise AI - alpha server.
 *
 * Deliberately built on Node's built-in `http` module only (no Express,
 * no bundler) so the *entire app* runs with nothing more than
 * `node server.js` - no `npm install` step required to demo it. See
 * README.md "Why no Express / React build step in the alpha?" for the
 * reasoning and the upgrade path back to the target stack.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const db = require('./src/db');
const { extractTask } = require('./src/extractor');
const { rankTasks } = require('./src/prioritize');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy(); // basic guard against huge payloads
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  const filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(PUBLIC_DIR, filePath);
  // Prevent path traversal outside the public directory.
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

async function handleApi(req, res, pathname) {
  try {
    // GET /api/tasks - full prioritized list
    if (pathname === '/api/tasks' && req.method === 'GET') {
      const tasks = db.getAll().filter((t) => t.status !== 'rejected');
      return sendJson(res, 200, { tasks: rankTasks(tasks) });
    }

    // POST /api/ingest - run the Smart Task Extractor on raw text (does NOT save)
    if (pathname === '/api/ingest' && req.method === 'POST') {
      const { text, source } = await readBody(req);
      if (!text || !text.trim()) return sendJson(res, 400, { error: 'text is required' });
      const suggestion = await extractTask(text, source || 'email');
      return sendJson(res, 200, { suggestion });
    }

    // POST /api/tasks - approve a suggestion (or create a manual task)
    if (pathname === '/api/tasks' && req.method === 'POST') {
      const payload = await readBody(req);
      if (!payload.title || !payload.title.trim()) {
        return sendJson(res, 400, { error: 'title is required' });
      }
      const record = db.insert({
        title: payload.title,
        deadline: payload.deadline || null,
        subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
        source: payload.source || 'manual',
        importance: payload.importance || 3,
        status: 'approved',
        manualOverride: null,
        extractionReasoning: payload.extractionReasoning || [],
        createdAt: new Date().toISOString(),
      });
      return sendJson(res, 201, { task: record });
    }

    // PUT /api/tasks/:id - edit a task (title, deadline, importance, override, subtasks, status)
    const editMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (editMatch && req.method === 'PUT') {
      const patch = await readBody(req);
      const updated = db.update(editMatch[1], patch);
      if (!updated) return sendJson(res, 404, { error: 'task not found' });
      return sendJson(res, 200, { task: updated });
    }

    // DELETE /api/tasks/:id
    if (editMatch && req.method === 'DELETE') {
      const removed = db.remove(editMatch[1]);
      if (!removed) return sendJson(res, 404, { error: 'task not found' });
      return sendJson(res, 200, { deleted: true });
    }

    return sendJson(res, 404, { error: 'unknown endpoint' });
  } catch (err) {
    return sendJson(res, 500, { error: err.message || 'internal error' });
  }
}

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
  } else {
    serveStatic(req, res, pathname);
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`WorkWise AI alpha running at http://localhost:${PORT}`);
    if (!process.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY not set - Smart Task Extractor is running in heuristic (no-API-key) mode.');
    }
  });
}

module.exports = server;
