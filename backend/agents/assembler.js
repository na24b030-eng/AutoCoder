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
          model: 'gemma2-9b-it',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
      const match = data.error?.message?.match(/try again in ([0-9.]+)s/);
      const wait = match ? Math.ceil(parseFloat(match[1])) + 2 : 30;
      console.log(`⚠️ Assembler rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    } catch (err) {
      console.log(`⚠️ Assembler error: ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Assembler: all retries exhausted');
}

async function runAssembler(blueprint) {
  const text = await callAI(`Write a README.md for:
Project: ${blueprint.project_name}
Description: ${blueprint.description}
Features: ${blueprint.features?.join(', ')}
Stack: React + Tailwind (frontend), Express + SQLite (backend)
Include: overview, setup instructions, API endpoints, feature list.
Reply with ONLY markdown content.`);
  return text;
}

module.exports = { runAssembler };