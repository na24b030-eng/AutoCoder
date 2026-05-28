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
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
      const match = data.error?.message?.match(/try again in ([0-9.]+)s/);
      const wait = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
      console.log(`⚠️ Orchestrator rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    } catch (err) {
      console.log(`⚠️ Orchestrator error: ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Orchestrator: all retries exhausted');
}

async function runOrchestrator(userPrompt) {
  const text = await callAI(`You are the Orchestrator Agent in an AutoCoder system.
The user wants to build: "${userPrompt}"

Reply ONLY with valid JSON, no markdown, no backticks, no explanation:
{
  "project_name": "string (lowercase, no spaces, use hyphens)",
  "description": "string",
  "features": ["feature1", "feature2", "feature3"],
  "db_tables": ["table1", "table2"],
  "api_routes": [
    {"method": "GET", "path": "/api/items", "desc": "list all items"},
    {"method": "POST", "path": "/api/items", "desc": "create item"}
  ],
  "pages": ["Home", "List", "Detail"]
}`);

  if (!text) throw new Error('Orchestrator received empty response');
  const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
  try {
    return JSON.parse(clean);
  } catch(e) {
    throw new Error('Orchestrator JSON parse failed. Raw: ' + clean.slice(0, 300));
  }
}

module.exports = { runOrchestrator };