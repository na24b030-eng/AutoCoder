require('dotenv').config();

const FREE_MODELS = [
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

async function callOpenRouter(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const model = FREE_MODELS[i % FREE_MODELS.length];
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://autocoder.vercel.app',
          'X-Title': 'GenAI AutoCoder',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        console.log(`✅ Orchestrator got response from ${model}`);
        return data.choices[0].message.content;
      }
      const retryAfter = data.error?.metadata?.retry_after_seconds || 15;
      console.log(`⚠️ Orchestrator: ${model} failed (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
    } catch (err) {
      console.log(`⚠️ Orchestrator network error (attempt ${i+1}/${maxRetries}): ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Orchestrator: all models failed');
}

async function runOrchestrator(userPrompt) {
  const text = await callOpenRouter(`You are the Orchestrator Agent in an AutoCoder system.
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

  if (!text) throw new Error('Orchestrator received empty response from AI');
  const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
  if (!clean) throw new Error('Orchestrator received blank response from AI');
  try {
    return JSON.parse(clean);
  } catch(e) {
    throw new Error('Orchestrator JSON parse failed. Raw: ' + clean.slice(0, 300));
  }
}

module.exports = { runOrchestrator };