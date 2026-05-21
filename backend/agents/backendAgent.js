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

Write a complete Express.js server.js file with:
- All CRUD routes for products with search and filter
- Cart management endpoints
- Order creation and retrieval
- Proper error handling with try/catch on every route
- Input validation
- CORS configured for all origins
- At least 12 real API endpoints
- Use better-sqlite3 for database
- Import db from './db/schema'

CRITICAL RULES FOR better-sqlite3:
- Every db.prepare() call must contain ONLY ONE single SQL statement
- NEVER chain multiple SQL statements with semicolons inside db.prepare()
- NEVER use db.exec() anywhere in server.js
- Each query must be its own separate db.prepare().run() or db.prepare().get() or db.prepare().all() call

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.`);

  return text
    .replace(/```javascript\n?/g,'')
    .replace(/```js\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runBackendAgent };