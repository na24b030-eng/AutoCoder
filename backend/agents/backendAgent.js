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

async function runBackendAgent(blueprint) {
  const text = await callOpenRouter(`You are the Backend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write a complete Express.js server.js file.

EXACT RULES — follow precisely:
1. Only require these packages: express, cors, path, better-sqlite3, dotenv — NO OTHER PACKAGES
2. Import db with: const db = require('./db/schema');
3. Every db.prepare() must contain EXACTLY ONE SQL statement — no semicolons inside prepare()
4. Never use db.exec() in server.js
5. Use cors({ origin: '*' }) to allow all origins
6. Include proper try/catch on every route
7. Listen on: const PORT = process.env.PORT || 3001; app.listen(PORT)
8. Do NOT implement any authentication, login, or registration routes
9. Include GET, POST, PUT, DELETE routes for the main resource

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`);

  return text
    .replace(/```javascript\n?/g,'')
    .replace(/```js\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runBackendAgent };