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
    console.log(`⚠️ DB Agent rate limited (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  throw new Error('DB Agent: all retries exhausted');
}

function validateDBCode(code) {
  const errors = [];

  if (!code.includes('new Database'))
    errors.push('missing new Database()');
  if (!code.includes('module.exports'))
    errors.push('missing module.exports = db');
  if (!code.includes('db.exec'))
    errors.push('missing db.exec for CREATE TABLE');
  if (!code.includes('CREATE TABLE'))
    errors.push('missing CREATE TABLE statement');
  if (/[^\x00-\x7F]/.test(code))
    errors.push('contains non-ASCII characters');

  // Mismatched braces
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes)
    errors.push(`mismatched braces: ${opens} vs ${closes}`);

  // Mismatched parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens)
    errors.push(`mismatched parentheses: ${openParens} vs ${closeParens}`);

  // Check for multiple statements in a single prepare()
  // Looks for semicolons inside prepare('...') strings
  const prepareMatches = code.match(/db\.prepare\(['"`][^'"`]*;[^'"`]*['"`]\)/g);
  if (prepareMatches)
    errors.push(`multiple SQL statements in db.prepare(): ${prepareMatches[0].slice(0, 60)}`);

  // Forbidden packages
  const forbidden = ['bcrypt', 'jsonwebtoken', 'mongoose', 'sequelize', 'axios'];
  for (const pkg of forbidden) {
    if (new RegExp(`require\\(['"]${pkg}['"]\\)`).test(code))
      errors.push(`forbidden package: ${pkg}`);
  }

  return errors;
}

const PROMPT = (blueprint) => `You are the Database Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write COMPLETE Node.js code for db/schema.js using better-sqlite3.

EXACT RULES — follow ALL of these precisely:
1. First line: const Database = require('better-sqlite3');
2. Second line: const path = require('path');
3. Third line: const db = new Database(path.join(__dirname, '..', 'app.db'));
4. Use ONE db.exec() call with a template literal containing ALL CREATE TABLE statements
5. Each INSERT must be a SEPARATE line: db.prepare('INSERT INTO table (col1, col2) VALUES (?, ?)').run(val1, val2);
6. Every db.prepare() must contain EXACTLY ONE SQL statement — no semicolons inside the string
7. Last line: module.exports = db;
8. Do NOT use any package other than better-sqlite3 and path
9. Do NOT use bcrypt, jsonwebtoken, or any other package
10. Include 5 realistic seed rows for the main table
11. Every opening { must have a matching closing }
12. Every opening ( must have a matching closing )

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`;

async function runDBAgent(blueprint) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🗄️ DB Agent: attempt ${attempt}/${maxAttempts}`);

    const text = await callOpenRouter(PROMPT(blueprint));

    const cleaned = text
      .replace(/```javascript\n?/g, '')
      .replace(/```js\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const errors = validateDBCode(cleaned);

    if (errors.length === 0) {
      console.log(`✅ DB Agent: valid code on attempt ${attempt}`);
      return cleaned;
    }

    console.warn(`⚠️ DB Agent attempt ${attempt} validation errors:`, errors);

    if (attempt < maxAttempts) {
      console.log(`🔄 Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error(`DB Agent: failed after ${maxAttempts} attempts`);
}

module.exports = { runDBAgent };