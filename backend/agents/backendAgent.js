require('dotenv').config();

async function callAI(prompt) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
      const match = data.error?.message?.match(/try again in ([0-9.]+)s/);
      const wait = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
      console.log(`⚠️ Backend Agent rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    } catch (err) {
      console.log(`⚠️ Backend Agent error: ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Backend Agent: all retries exhausted');
}

function autoFix(code) {
  const lines = code.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const routeWithTrailingComma = /^(\s*app\.(get|post|put|delete|patch)\s*\([^)]*['"`]\s*),\s*$/.test(line);
    if (routeWithTrailingComma && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (/^async\s*\(req/.test(nextLine) || /^\(req/.test(nextLine)) {
        result.push(line.trimEnd().replace(/,\s*$/, '') + ', ' + nextLine);
        i++;
        continue;
      }
    }
    result.push(line);
  }
  return result.join('\n');
}

function validateCode(code) {
  const errors = [];
  if (!code.includes('app.listen')) errors.push('missing app.listen');
  if (!code.includes('express')) errors.push('missing express');
  if (!code.includes("require('./db/schema')")) errors.push("missing require('./db/schema')");
  if (!code.includes('try') || !code.includes('catch')) errors.push('missing try/catch');

  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes) errors.push(`mismatched braces: ${opens} vs ${closes}`);

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) errors.push(`mismatched parentheses: ${openParens} vs ${closeParens}`);

  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^async\s*\(req,\s*res\)\s*=>/.test(line)) {
      const prevLine = (lines[i - 1] || '').trim();
      if (!/app\.(get|post|put|delete|patch|use)\(/.test(prevLine))
        errors.push(`broken route handler at line ${i + 1}`);
    }
  }

  const forbidden = ['bcrypt', 'jsonwebtoken', 'jwt', 'passport', 'multer', 'nodemailer', 'mongoose', 'sequelize', 'axios', 'node-fetch'];
  for (const pkg of forbidden)
    if (new RegExp(`require\\(['"]${pkg}['"]\\)`).test(code))
      errors.push(`forbidden package: ${pkg}`);

  return errors;
}

const PROMPT = (blueprint) => `You are the Backend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write a complete Express.js server.js file.

EXACT RULES:
1. Only require: express, cors, path, better-sqlite3, dotenv — NO OTHER PACKAGES
2. Import db with: const db = require('./db/schema');
3. Every db.prepare() must contain EXACTLY ONE SQL statement
4. Never use db.exec() in server.js
5. Use cors({ origin: '*' })
6. Include try/catch on every route
7. Listen on: const PORT = process.env.PORT || 3001; app.listen(PORT)
8. No authentication or login routes
9. Include GET, POST, PUT, DELETE routes for the main resource
10. Route handlers on ONE line: app.get('/api/items', async (req, res) => {
11. Every { must have matching } and every ( must have matching )

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`;

async function runBackendAgent(blueprint) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔧 Backend Agent: attempt ${attempt}/${maxAttempts}`);
    const text = await callAI(PROMPT(blueprint));
    let cleaned = text.replace(/```javascript\n?/g,'').replace(/```js\n?/g,'').replace(/```\n?/g,'').trim();
    cleaned = autoFix(cleaned);
    const errors = validateCode(cleaned);
    if (errors.length === 0) {
      console.log(`✅ Backend Agent: valid code on attempt ${attempt}`);
      return cleaned;
    }
    console.warn(`⚠️ Backend Agent attempt ${attempt} errors:`, errors);
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Backend Agent: failed after 4 attempts');
}

module.exports = { runBackendAgent };