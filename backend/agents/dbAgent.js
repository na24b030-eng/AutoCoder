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

async function runDBAgent(blueprint) {
  const text = await callOpenRouter(`You are the Database Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write COMPLETE Node.js code for db/schema.js using better-sqlite3.

EXACT RULES — follow precisely:
1. Start with: const Database = require('better-sqlite3'); const path = require('path'); const db = new Database(path.join(__dirname, '..', 'app.db'));
2. Use db.exec() with a template literal for ALL CREATE TABLE statements together
3. Each INSERT must be: db.prepare('INSERT INTO table (col1, col2) VALUES (?, ?)').run(val1, val2);
4. Every db.prepare() must contain EXACTLY ONE SQL statement — no semicolons inside
5. End with: module.exports = db;
6. Do NOT use bcrypt, jsonwebtoken, or any package other than better-sqlite3 and path
7. Include 5 realistic seed rows for the main table

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`);

  return text
    .replace(/```javascript\n?/g,'')
    .replace(/```js\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runDBAgent };