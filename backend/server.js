require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/schema');
const { runOrchestrator } = require('./agents/orchestrator');
const { runDBAgent } = require('./agents/dbAgent');
const { runBackendAgent } = require('./agents/backendAgent');
const { runFrontendAgent } = require('./agents/frontendAgent');
const { runAssembler } = require('./agents/assembler');
const { deployApp } = require('./deploy');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://auto-coder-sigma.vercel.app',
  ]
}));
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const { lastInsertRowid: id } = db.prepare(
    'INSERT INTO generations (prompt, status) VALUES (?, ?)'
  ).run(prompt, 'running');

  try {
    const blueprint = await runOrchestrator(prompt);

    const [dbCode, backendCode, frontendCode] = await Promise.all([
      runDBAgent(blueprint),
      runBackendAgent(blueprint),
      runFrontendAgent(blueprint),
    ]);

    const readme = await runAssembler(blueprint);
    const urls = await deployApp(blueprint, dbCode, backendCode, frontendCode, readme);

    db.prepare(`UPDATE generations SET
      status='complete', blueprint=?, db_code=?,
      backend_code=?, frontend_code=?, readme=?,
      frontend_url=?, backend_url=?, github_url=?
      WHERE id=?`
    ).run(JSON.stringify(blueprint), dbCode, backendCode, frontendCode, readme,
      urls.frontendUrl, urls.backendUrl, urls.githubUrl, id);

    res.json({ id, blueprint, dbCode, backendCode, frontendCode, readme, urls });

  } catch (err) {
    console.error('GENERATION ERROR:', err);
    db.prepare('UPDATE generations SET status=?, error=? WHERE id=?')
      .run('failed', err.message, id);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/generations', (req, res) => {
  const rows = db.prepare(
    'SELECT id, prompt, status, frontend_url, backend_url, github_url, created_at FROM generations ORDER BY id DESC'
  ).all();
  res.json(rows);
});

app.get('/api/generations/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM generations WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));