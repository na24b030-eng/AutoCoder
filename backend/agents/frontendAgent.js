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

EXACT RULES — follow ALL precisely:

IMPORTS & STRUCTURE
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS
2. Do NOT import any icon libraries, UI libraries, or external packages
3. Keep all components in this single App.jsx file
4. No TypeScript — plain JSX only
5. Export default App as the root component wrapped in BrowserRouter

ROUTING
6. Use React Router v6 with BrowserRouter, Routes, Route
7. React Router v6 uses element={<Component />} — NO render prop, NO component prop
8. Route syntax: <Route path="/" element={<Home />} /> — no children pattern
9. Do NOT include any login, register, or authentication pages

JSX SYNTAX
10. Every JSX opening tag must have a matching closing tag with the EXACT same name
11. Boolean props must use {true} or {false} — NEVER True or False
12. Use exact={true} — NOT exactly=True
13. All prop values must be strings in quotes or expressions in {curly braces}

API CALLS
14. All API calls must use fetch('${backendUrl}/api/...') — no hardcoded URLs

STYLING — CRITICAL, the app must look professional:
15. Use Tailwind CSS classes extensively on EVERY element — no external CSS imports except index.css; inline styles allowed as fallback
16. Overall page background: bg-gray-50 min-h-screen
17. The app must have a proper navbar with the project name and navigation links
18. Use a consistent primary color scheme throughout (e.g. indigo, blue, or emerald)
19. Hero/header section must have a gradient background (e.g. bg-gradient-to-r from-indigo-600 to-purple-600)
20. Cards must have: rounded-xl shadow-lg p-6 bg-white border border-gray-100
21. Buttons must have: px-6 py-3 rounded-lg font-semibold with hover effects (e.g. hover:bg-indigo-700 transition-all)
22. Use grid layouts: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
23. Every page must have proper spacing: max-w-6xl mx-auto px-4 py-8
24. Use proper typography: text-3xl font-bold, text-gray-600, text-sm, etc.
25. Add hover effects on interactive elements: hover:shadow-xl hover:scale-105 transition-all
26. Empty states must show a styled message with an icon placeholder — not just blank space
27. Loading states must show a spinner or skeleton — not just blank space

Reply with ONLY JSX code — no markdown, no backticks, no explanation.

  return text
    .replace(/```jsx\n?/g,'')
    .replace(/```javascript\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runFrontendAgent };