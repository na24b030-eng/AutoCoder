require('dotenv').config();

async function runOrchestrator(userPrompt) {
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
      messages: [{ role: 'user', content: `You are the Orchestrator Agent in an AutoCoder system.
The user wants to build: "${userPrompt}"

Reply ONLY with valid JSON, no markdown, no backticks, no explanation:
{
  "project_name": "string",
  "description": "string",
  "features": ["feature1", "feature2", "feature3"],
  "db_tables": ["table1", "table2", "table3"],
  "api_routes": [
    {"method": "GET", "path": "/api/products", "desc": "list all products"},
    {"method": "POST", "path": "/api/orders", "desc": "create order"}
  ],
  "pages": ["Home", "Catalog", "Cart", "Checkout", "OrderConfirmation"]
}` }]
    })
  });
  const data = await response.json();
  if (!data.choices) throw new Error('Orchestrator failed: ' + JSON.stringify(data));
  const text = data.choices[0].message.content;
  return JSON.parse(text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim());
}

module.exports = { runOrchestrator };