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

async function runFrontendAgent(blueprint) {
  const text = await callOpenRouter(`You are the Frontend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}

Write a complete React App.jsx with:
- React Router for all pages: ${blueprint.pages?.join(', ')}
- Global cart state using useContext + useReducer
- All pages: Home, Product Catalog, Product Detail, Cart, Checkout, Order Confirmation
- API calls using fetch() to http://localhost:3001/api
- Beautiful Tailwind CSS styling appropriate for the project theme
- Loading states, error states, empty states
- Mobile responsive design

Write ONE complete App.jsx file with all components included.
Reply with ONLY JSX code, no markdown, no backticks, no explanation.`);

  return text
    .replace(/```jsx\n?/g,'')
    .replace(/```javascript\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runFrontendAgent };