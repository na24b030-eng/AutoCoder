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
    console.log(`⚠️ Assembler rate limited (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  throw new Error('Assembler: all retries exhausted');
}

async function runAssembler(blueprint) {
  const text = await callOpenRouter(`Write a complete README.md for:
Project: ${blueprint.project_name}
Description: ${blueprint.description}
Features: ${blueprint.features?.join(', ')}
Stack: React + Tailwind (frontend), Express + SQLite (backend)

Include: overview, folder structure, setup instructions, API endpoints, feature list.
Reply with ONLY markdown content.`);

  return text;
}

module.exports = { runAssembler };