require('dotenv').config();

const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen3-235b-a22b:free',
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
        console.log(`✅ Assembler got response from ${model}`);
        return data.choices[0].message.content;
      }
      const retryAfter = data.error?.metadata?.retry_after_seconds || 15;
      console.log(`⚠️ Assembler: ${model} failed (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
    } catch (err) {
      console.log(`⚠️ Assembler network error (attempt ${i+1}/${maxRetries}): ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Assembler: all models failed');
}

async function runAssembler(blueprint) {
  const text = await callOpenRouter(`Write a README.md for:
Project: ${blueprint.project_name}
Description: ${blueprint.description}
Features: ${blueprint.features?.join(', ')}
Stack: React + Tailwind (frontend), Express + SQLite (backend)
Include: overview, setup instructions, API endpoints, feature list.
Reply with ONLY markdown content.`);
  return text;
}

module.exports = { runAssembler };