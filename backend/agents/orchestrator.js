require('dotenv').config();

async function callAI(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try Groq first (14,400 req/day free)
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
          console.log('✅ Orchestrator using Groq');
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

    // Fallback to OpenRouter
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
        console.log('✅ Orchestrator using OpenRouter fallback');
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