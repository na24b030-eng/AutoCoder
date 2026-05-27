require('dotenv').config();

async function callAI(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (process.env.GROQ_API_KEY) {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
          })
        });
        const groqData = await groqRes.json();
        if (groqData.choices?.[0]?.message?.content) {
          console.log('✅ DB Agent using Groq');
          return groqData.choices[0].message.content;
        }
        const retryAfter = groqData.error?.message?.includes('rate') ? 60 : 5;
        console.log(`⚠️ Groq failed (attempt ${i+1}): ${groqData.error?.message || 'unknown'}, retrying in ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
    } catch (err) {
      console.log(`⚠️ Groq network error: ${err.message}`);
    }

    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
      const orData = await orRes.json();
      if (orData.choices?.[0]?.message?.content) {
        console.log('✅ DB Agent using OpenRouter fallback');
        return orData.choices[0].message.content;
      }
      const retryAfter = orData.error?.metadata?.retry_after_seconds || 30;
      console.log(`⚠️ OpenRouter also failed, retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
    } catch (err) {
      console.log(`⚠️ OpenRouter network error: ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
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

  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes)
    errors.push(`mismatched braces: ${opens} vs ${closes}`);

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens)
    errors.push(`mismatched parentheses: ${openParens} vs ${closeParens}`);

  const prepareMatches = code.match(/db\.prepare\(['"`][^'"`]*;[^'"`]*['"`]\)/g);
  if (prepareMatches)
    errors.push(`multiple SQL in db.prepare(): ${prepareMatches[0].slice(0, 60)}`);

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

EXACT RULES:
1. First line: const Database = require('better-sqlite3');
2. Second line: const path = require('path');
3. Third line: const db = new Database(path.join(__dirname, '..', 'app.db'));
4. Use ONE db.exec() call with a template literal containing ALL CREATE TABLE statements
5. Each INSERT must be: db.prepare('INSERT INTO table (col1, col2) VALUES (?, ?)').run(val1, val2);
6. Every db.prepare() must contain EXACTLY ONE SQL statement — no semicolons inside
7. Last line must be exactly: module.exports = db;
8. Only use packages: better-sqlite3, path
9. Include 5 realistic seed rows for the main table
10. Every opening { must have a matching closing }
11. Every opening ( must have a matching closing )

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`;

async function runDBAgent(blueprint) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🗄️ DB Agent: attempt ${attempt}/${maxAttempts}`);
    const text = await callAI(PROMPT(blueprint));
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
    console.warn(`⚠️ DB Agent attempt ${attempt} errors:`, errors);
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('DB Agent: failed after 4 attempts');
}

module.exports = { runDBAgent };