require('dotenv').config();

async function runAssembler(blueprint) {
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
      messages: [{ role: 'user', content: `Write a complete README.md for:
Project: ${blueprint.project_name}
Description: ${blueprint.description}
Features: ${blueprint.features?.join(', ')}
Stack: React + Tailwind (frontend), Express + SQLite (backend)

Include: overview, folder structure, setup instructions, API endpoints, feature list.
Reply with ONLY markdown content.` }]
    })
  });
  const data = await response.json();
  if (!data.choices) throw new Error('Assembler failed: ' + JSON.stringify(data));
  return data.choices[0].message.content;
}

module.exports = { runAssembler };