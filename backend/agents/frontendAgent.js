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

EXACT RULES — follow ALL precisely:

IMPORTS & STRUCTURE
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS
2. Do NOT import any icon libraries, UI libraries, or external packages
3. Keep all components in this single App.jsx file
4. No TypeScript — plain JSX only
5. Export default App as the root component wrapped in BrowserRouter
6. Always import hooks: import { useState, useEffect } from 'react'

ROUTING
7. Use React Router v6 with BrowserRouter, Routes, Route
8. React Router v6 uses element={<Component />} — NO render prop, NO component prop
9. Route syntax: <Route path="/" element={<Home />} /> — no children pattern
10. Do NOT include any login, register, or authentication pages

JSX SYNTAX
11. Every JSX opening tag must have a matching closing tag with the EXACT same name
12. Boolean props must use {true} or {false} — NEVER True or False
13. All prop values must be strings in quotes or expressions in {curly braces}
14. Every opening { must have a matching closing }
15. Every opening ( must have a matching closing )
16. The BrowserRouter must wrap everything: export default function App() { return <BrowserRouter>...</BrowserRouter> }

API CALLS
17. All API calls must use fetch('${backendUrl}/api/...') — no hardcoded localhost URLs
18. Every fetch() call must be inside a try/catch block
19. Do NOT use axios — only use fetch()

STYLING — CRITICAL, the app must look professional and beautiful:
20. Use Tailwind CSS classes extensively on EVERY element
21. Overall page background: bg-gray-50 min-h-screen
22. The app must have a proper navbar with the project name and navigation links styled with bg-white shadow-sm px-6 py-4
23. Use a consistent primary color scheme throughout (indigo or blue or emerald — pick one and stick to it)
24. Hero/header section must have a gradient background: bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20
25. Cards must have: rounded-xl shadow-lg p-6 bg-white border border-gray-100 hover:shadow-xl transition-all
26. Buttons must have: px-6 py-3 rounded-lg font-semibold transition-all with hover color change
27. Use grid layouts: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
28. Every page must have proper spacing: max-w-6xl mx-auto px-4 py-8
29. Use proper typography: text-3xl font-bold for headings, text-gray-600 for subtext, text-sm for labels
30. Add hover effects: hover:shadow-xl hover:scale-105 transition-all on cards and buttons
31. Empty states must show a styled box with a message — not blank space
32. Loading states must show a visible spinner using animate-spin border-4 border-indigo-600 border-t-transparent rounded-full w-8 h-8
33. Use div placeholders with bg-gray-200 rounded-lg instead of <img> tags with external URLs
34. Footer must have bg-gray-800 text-white py-8 with project name and description

CRITICAL SYNTAX RULES — violating these causes build failure:
35. Do NOT use any package not in rule 1 — no lucide-react, no heroicons, no @headlessui, no framer-motion
36. Route handlers must be on ONE line: app.get('/path', async (req, res) => {
    NEVER split across lines like this:
    app.get('/path',
      async (req, res) => {

Reply with ONLY JSX code — no markdown, no backticks, no explanation.`);

  return text
    .replace(/```jsx\n?/g,'')
    .replace(/```javascript\n?/g,'')
    .replace(/```\n?/g,'')
    .trim();
}

module.exports = { runFrontendAgent };