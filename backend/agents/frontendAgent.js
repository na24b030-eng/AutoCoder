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

function validateFrontendCode(code) {
  const errors = [];

  if (!code.includes('BrowserRouter'))
    errors.push('missing BrowserRouter');
  if (!code.includes('export default'))
    errors.push('missing export default');
  if (!code.includes('useState') && !code.includes('useEffect'))
    errors.push('missing React hooks import');

  // Forbidden imports
  const forbidden = ['lucide-react', '@heroicons', 'framer-motion', 'axios',
    '@headlessui', 'react-icons', 'styled-components', '@mui', 'antd'];
  for (const pkg of forbidden) {
    if (code.includes(`from '${pkg}'`) || code.includes(`from "${pkg}"`))
      errors.push(`forbidden import: ${pkg}`);
  }

  // Python boolean syntax
  if (/=True[\s,>]/.test(code) || /=False[\s,>]/.test(code))
    errors.push('Python boolean syntax: use {true}/{false} not True/False');

  // Mismatched braces — allow small tolerance for JSX
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (Math.abs(opens - closes) > 2)
    errors.push(`mismatched braces: ${opens} opening vs ${closes} closing`);

  return errors;
}

async function runFrontendAgent(blueprint, backendUrl) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🎨 Frontend Agent: attempt ${attempt}/${maxAttempts}`);

    const text = await callOpenRouter(`You are the Frontend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}
Backend API URL: ${backendUrl}

EXACT RULES — follow ALL precisely:

IMPORTS & STRUCTURE
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS WHATSOEVER
2. Do NOT import lucide-react, @heroicons, framer-motion, axios, @headlessui, react-icons, or ANY other package
3. Keep all components in this single App.jsx file
4. No TypeScript — plain JSX only
5. Export default App as the root component wrapped in BrowserRouter
6. First import must be: import { useState, useEffect } from 'react'
7. Second import: import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

ROUTING
8. Use React Router v6 with BrowserRouter, Routes, Route
9. React Router v6 uses element={<Component />} — NO render prop, NO component prop
10. Route syntax: <Route path="/" element={<Home />} />
11. Do NOT include any login, register, or authentication pages

JSX SYNTAX — violating these causes build failure:
12. Every JSX opening tag must have a matching closing tag with the EXACT same name
13. Boolean props must use {true} or {false} — NEVER True or False
14. All prop values must be strings in quotes or expressions in {curly braces}
15. Every opening { must have a matching closing }
16. Every opening ( must have a matching closing )
17. export default function App() { return <BrowserRouter>...</BrowserRouter> }
18. Use only plain ASCII characters — no smart quotes, no em dashes, no Unicode symbols

API CALLS
19. All API calls must use fetch('${backendUrl}/api/...') — no localhost, no hardcoded URLs
20. Every fetch() call must be inside a try/catch block
21. Do NOT use axios — only native fetch()

STYLING — the website must look PREMIUM and MODERN like Airbnb or Stripe:

OVERALL
22. Overall wrapper: className="bg-gray-50 min-h-screen font-sans antialiased"
23. Add pt-20 to main content to account for fixed navbar

NAVBAR
24. <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
25. Inner: <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
26. Brand: <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
27. Nav links: <Link className="text-gray-600 hover:text-indigo-600 font-medium transition-colors text-sm">

HERO SECTION
28. <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden pt-20">
29. Decorative blob: <div className="absolute rounded-full bg-purple-500/30 blur-3xl w-96 h-96 -top-20 -left-20 pointer-events-none"></div>
30. Hero heading: <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight text-center">
31. Hero subtext: <p className="text-xl text-indigo-200 mt-6 max-w-2xl leading-relaxed text-center">
32. CTA button: <button className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-2xl mt-10">

CARDS
33. Card wrapper: <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
34. Card top strip: <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
35. Card body: <div className="p-6 space-y-3">
36. Card title: <h3 className="text-lg font-bold text-gray-900">
37. Card meta: <p className="text-sm text-gray-500">

BUTTONS
38. Primary: className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all shadow-lg"
39. Secondary: className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
40. Danger: className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"

LAYOUT
41. Page container: <div className="max-w-7xl mx-auto px-6 py-16">
42. Section title: <h2 className="text-4xl font-black text-gray-900 text-center mb-4">
43. Title underline: <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-16 rounded-full"></div>
44. Grid: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

FORMS
45. Input: className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-900 transition-all"
46. Form wrapper: <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-lg mx-auto">
47. Label: <label className="text-sm font-semibold text-gray-700 mb-2 block">

LOADING & EMPTY STATES
48. Loading: <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
49. Empty: <div className="text-center py-20"><div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-4"></div><p className="text-gray-500 text-lg">No items yet</p></div>
50. Skeleton: <div className="animate-pulse bg-gray-200 rounded-2xl h-48 w-full"></div>

BADGES
51. <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">

FOOTER
52. <footer className="bg-gray-900 text-white py-12 px-8 mt-20 border-t border-gray-800">
53. Brand: <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
54. Text: <p className="text-gray-400 text-sm mt-2">

CRITICAL — build will fail if violated:
55. Do NOT use any package not listed in rule 1
56. Use only plain ASCII characters in all strings and comments — no smart quotes like or no em dashes like or ellipsis like
57. Write all apostrophes as plain ' not curly quotes

Reply with ONLY JSX code — no markdown, no backticks, no explanation.`);

    let cleaned = text
      .replace(/```jsx\n?/g, '')
      .replace(/```javascript\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Replace smart quotes and common Unicode with ASCII equivalents
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/[\u00A0]/g, ' ')
      .replace(/[^\x00-\x7F]/g, '');

    const errors = validateFrontendCode(cleaned);

    if (errors.length === 0) {
      console.log(`✅ Frontend Agent: valid code on attempt ${attempt}`);
      return cleaned;
    }

    console.warn(`⚠️ Frontend Agent attempt ${attempt} errors:`, errors);
    if (attempt < maxAttempts) {
      console.log(`🔄 Frontend Agent retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error('Frontend Agent: failed after 3 attempts');
}

module.exports = { runFrontendAgent };