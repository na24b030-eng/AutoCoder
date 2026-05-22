require('dotenv').config();

async function callOpenRouter(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://autocoder.vercel.app',
        'X-Title': 'GenAI AutoCoder',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.choices) return data.choices[0].message.content;
    const retryAfter = data.error?.metadata?.retry_after_seconds || 30;
    console.log(`⚠️ Backend Agent rate limited (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  throw new Error('Backend Agent: all retries exhausted');
}

function autoFix(code) {
  // Split into lines for processing
  const lines = code.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect: app.get('/path', <-- line ends with comma, next line is async handler
    // Pattern: line ends with a comma after a route path string
    const routeWithTrailingComma = /^(\s*app\.(get|post|put|delete|patch)\s*\([^)]*['"`]\s*),\s*$/.test(line);

    if (routeWithTrailingComma && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // If next line starts with async (req or (req
      if (/^async\s*\(req/.test(nextLine) || /^\(req/.test(nextLine)) {
        // Merge the two lines
        result.push(line.trimEnd().replace(/,\s*$/, '') + ', ' + nextLine);
        i++; // skip next line since we merged it
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

function validateCode(code) {
  const errors = [];

  if (!code.includes('app.listen'))
    errors.push('missing app.listen');
  if (!code.includes('express'))
    errors.push('missing express');
  if (!code.includes("require('./db/schema')"))
    errors.push("missing require('./db/schema')");
  if (!code.includes('try') || !code.includes('catch'))
    errors.push('missing try/catch');
  if (/[^\x00-\x7F]/.test(code))
    errors.push('contains non-ASCII characters');

  // Mismatched braces
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes)
    errors.push(`mismatched braces: ${opens} opening vs ${closes} closing`);

  // Mismatched parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens)
    errors.push(`mismatched parentheses: ${openParens} opening vs ${closeParens} closing`);

  // Detect orphaned async arrow function on its own line
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^async\s*\(req,\s*res\)\s*=>/.test(line)) {
      const prevLine = (lines[i - 1] || '').trim();
      if (!/app\.(get|post|put|delete|patch|use)\(/.test(prevLine)) {
        errors.push(`broken route handler at line ${i + 1}: "${line}"`);
      }
    }
  }

  // Forbidden packages
  const forbidden = ['bcrypt', 'jsonwebtoken', 'jwt', 'passport', 'multer',
    'nodemailer', 'mongoose', 'sequelize', 'axios', 'node-fetch'];
  for (const pkg of forbidden) {
    if (new RegExp(`require\\(['"]${pkg}['"]\\)`).test(code))
      errors.push(`forbidden package: ${pkg}`);
  }

  return errors;
}

const PROMPT = (blueprint) => `You are the Backend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write a complete Express.js server.js file.

EXACT RULES — follow ALL of these precisely:
1. Only require these packages: express, cors, path, better-sqlite3, dotenv — NO OTHER PACKAGES WHATSOEVER
2. Import db with: const db = require('./db/schema');
3. Every db.prepare() must contain EXACTLY ONE SQL statement — no semicolons inside prepare()
4. Never use db.exec() in server.js
5. Use cors({ origin: '*' }) to allow all origins
6. Include proper try/catch on every route
7. Listen on: const PORT = process.env.PORT || 3001; app.listen(PORT)
8. Do NOT implement any authentication, login, or registration routes
9. Include GET, POST, PUT, DELETE routes for the main resource

CRITICAL SYNTAX RULES:
10. Route handlers MUST be written on ONE line like this:
    app.get('/api/items', async (req, res) => {
    NEVER split them like this:
    app.get('/api/items',
      async (req, res) => {
11. The opening curly brace { must be on the SAME line as the arrow =>
12. No line break between the route path and the async handler
13. Every opening { must have a matching closing }
14. Every opening ( must have a matching closing )

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`;

async function runBackendAgent(blueprint) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔧 Backend Agent: attempt ${attempt}/${maxAttempts}`);

    const text = await callOpenRouter(PROMPT(blueprint));

    let cleaned = text
      .replace(/```javascript\n?/g, '')
      .replace(/```js\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Auto-fix known patterns before validation
    cleaned = autoFix(cleaned);

    const errors = validateCode(cleaned);

    if (errors.length === 0) {
      console.log(`✅ Backend Agent: valid code on attempt ${attempt}`);
      return cleaned;
    }

    console.warn(`⚠️ Backend Agent attempt ${attempt} validation errors:`, errors);

    if (attempt < maxAttempts) {
      console.log(`🔄 Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error(`Backend Agent: failed after ${maxAttempts} attempts`);
}

module.exports = { runBackendAgent };