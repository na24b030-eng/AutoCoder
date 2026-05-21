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
    console.log(`⚠️ Frontend Agent rate limited (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  throw new Error('Frontend Agent: all retries exhausted');
}

async function runFrontendAgent(blueprint, backendUrl) {
  const text = await callOpenRouter(`You are the Frontend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}
Backend API URL: ${backendUrl}

Write a complete React App.jsx file.

EXACT RULES — follow precisely:
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS
2. Do NOT import any icon libraries, UI libraries, or external packages
3. Use inline styles or plain Tailwind classes only — no external CSS imports except index.css
4. All API calls must use fetch('${backendUrl}/api/...')
5. Every JSX opening tag must have a matching closing tag with the EXACT same name
6. Do NOT include any login, register, or authentication pages
7. Use React Router v6 with BrowserRouter, Routes, Route
8. Keep all components in this single App.jsx file
9. No TypeScript — plain JSX only
10. Export default App as the root component wrapped in BrowserRouter

Reply with ONLY JSX code, no markdown, no backticks, no explanation.`);

  return text
    .replace(/```jsx\n?/g,'')
    .replace(/```javascript\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runFrontendAgent };