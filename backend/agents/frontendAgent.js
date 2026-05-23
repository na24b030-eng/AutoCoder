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

STYLING — the generated website must be STUNNING and MODERN:

OVERALL DESIGN LANGUAGE
20. The design must feel like a premium commercial website — think Airbnb, Stripe, or Linear
21. Overall page: bg-gray-50 min-h-screen font-sans antialiased
22. Use consistent spacing: every section has py-16 or py-20 padding

NAVBAR
23. Navbar: fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-8 py-4 flex items-center justify-between
24. Navbar brand: text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent
25. Navbar links: text-gray-600 hover:text-indigo-600 font-medium transition-colors text-sm

HERO SECTION
26. Hero must be BOLD: min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden
27. Add decorative blobs: absolute div with rounded-full bg-purple-500/30 blur-3xl w-96 h-96 -top-20 -left-20
28. Hero heading: text-5xl md:text-7xl font-black text-white leading-tight tracking-tight
29. Hero subtext: text-xl text-indigo-200 mt-6 max-w-2xl leading-relaxed
30. Hero CTA button: px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-2xl mt-10

CARDS
31. Cards: bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1
32. Card header strip: h-2 bg-gradient-to-r from-indigo-500 to-purple-500 at the top of every card
33. Card content: p-6 space-y-3
34. Card title: text-lg font-bold text-gray-900
35. Card meta: text-sm text-gray-500 flex items-center gap-2

BUTTONS
36. Primary button: px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200
37. Secondary button: px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 hover:border-indigo-400 transition-all
38. Danger button: px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-medium

SECTIONS & LAYOUT
39. Section headers: text-center mb-16 with text-4xl font-black text-gray-900 and colored underline: w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-4 rounded-full
40. Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-6
41. Alternating section backgrounds: white and bg-gradient-to-b from-indigo-50 to-white

FORMS & INPUTS
42. Input fields: w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 transition-all
43. Form containers: bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-lg mx-auto
44. Form labels: text-sm font-semibold text-gray-700 mb-2 block

BADGES & TAGS
45. Category/tag badges: inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700

STATS & HIGHLIGHTS
46. Include a stats/highlights row if relevant: flex gap-8 justify-center with each stat having text-3xl font-black text-indigo-600 and text-sm text-gray-500 label

ANIMATIONS
47. Add subtle entrance animations using Tailwind: use transition-all duration-300 on all interactive elements
48. Skeleton loaders: animate-pulse bg-gray-200 rounded-xl h-48 when loading
49. Spinner: animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto

FOOTER
50. Footer: bg-gray-900 text-white py-12 px-8 mt-20 with project name in gradient text, description in gray-400, and a thin border-t border-gray-800

CRITICAL SYNTAX RULES — violating these causes build failure:
51. Do NOT use any package not in rule 1 — no lucide-react, no heroicons, no @headlessui, no framer-motion
52. Route handlers must be on ONE line: app.get('/path', async (req, res) => {
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