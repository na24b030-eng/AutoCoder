require('dotenv').config();

async function callAI(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
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
          console.log('✅ Assembler using Groq');
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
        console.log('✅ Assembler using OpenRouter fallback');
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