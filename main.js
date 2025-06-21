// In-memory storage for to-dos
let todos = [];
let nextId = 1;

// Create HTTP server using built-in http module
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers to allow testing from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /todos - Create a new to-do
  if (method === 'POST' && path === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.task || typeof data.task !== 'string') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid task' }));
          return;
        }
        const todo = {
          id: nextId++,
          task: data.task,
          done: false
        };
        todos.push(todo);
        res.writeHead(201);
        res.end(JSON.stringify(todo));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (method === 'GET' && path === ('/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the To-Do API! Use /todos to manage your tasks.');
    return;
  }

  // GET /todos - Retrieve all to-dos
  if (method === 'GET' && path === '/todos') {
    res.writeHead(200);
    res.end(JSON.stringify(todos));
    return;
  }

  // DELETE /todos - Delete all to-dos
  if (method === 'DELETE' && path === '/todos') {
    todos = [];
    nextId = 1;
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle invalid routes or methods
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
