require('dotenv').config();

async function runDBAgent(blueprint) {
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
      messages: [{ role: 'user', content: `You are the Database Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write COMPLETE Node.js code for db/schema.js using better-sqlite3.
Include:
- All CREATE TABLE statements with proper columns, types, constraints
- Foreign keys between related tables
- At least 8 realistic seed data rows for the main product table
- Index creation for performance
- Export the db instance

Reply with ONLY JavaScript code, no markdown, no backticks, no explanation.` }]
    })
  });
  const data = await response.json();
  if (!data.choices) throw new Error('DB Agent failed: ' + JSON.stringify(data));
  return data.choices[0].message.content
    .replace(/```javascript\n?/g,'')
    .replace(/```js\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runDBAgent };