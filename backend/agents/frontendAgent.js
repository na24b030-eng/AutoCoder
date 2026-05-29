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
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8192,
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
      const match = data.error?.message?.match(/try again in ([0-9.]+)s/);
      const wait = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
      console.log(`⚠️ Frontend Agent rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    } catch (err) {
      console.log(`⚠️ Frontend Agent error: ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Frontend Agent: all retries exhausted');
}

function validateFrontendCode(code) {
  const errors = [];
  if (!code.includes('BrowserRouter')) errors.push('missing BrowserRouter');
  if (!code.includes('export default')) errors.push('missing export default');
  if (!code.includes('useState') && !code.includes('useEffect')) errors.push('missing React hooks');

  const forbidden = ['lucide-react', '@heroicons', 'framer-motion', '@headlessui', 'react-icons', 'styled-components', '@mui', 'antd'];
  for (const pkg of forbidden)
    if (code.includes(`from '${pkg}'`) || code.includes(`from "${pkg}"`))
      errors.push(`forbidden import: ${pkg}`);

  if (/=True[\s,>]/.test(code) || /=False[\s,>]/.test(code))
    errors.push('Python boolean syntax detected');

  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (Math.abs(opens - closes) > 2) errors.push(`mismatched braces: ${opens} vs ${closes}`);

  return errors;
}

async function runFrontendAgent(blueprint, backendUrl) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🎨 Frontend Agent: attempt ${attempt}/${maxAttempts}`);

    const text = await callAI(`You are the Frontend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}
Backend API URL: ${backendUrl}

EXACT RULES:

IMPORTS
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS WHATSOEVER
2. Do NOT import lucide-react, @heroicons, framer-motion, axios, or ANY other package
3. First import: import { useState, useEffect } from 'react'
4. Second import: import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

STRUCTURE
5. All components in this single App.jsx file
6. No TypeScript — plain JSX only
7. export default function App() { return <BrowserRouter>...</BrowserRouter> }
8. Do NOT include login, register, or authentication pages

JSX SYNTAX
9. Every opening tag must have a matching closing tag
10. Boolean props: {true} or {false} — NEVER True or False
11. Every { must have a matching }
12. Every ( must have a matching )
13. Use only plain ASCII characters

API
14. All fetch calls: fetch('${backendUrl}/api/...')
15. Every fetch() inside try/catch
16. No axios — only fetch()

STYLING — STUNNING and MODERN:
17. Overall: className="bg-gray-50 min-h-screen font-sans antialiased"
18. Navbar: className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
19. Nav inner: className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between"
20. Brand: className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
21. Nav links: className="text-gray-600 hover:text-indigo-600 font-medium transition-all text-sm px-3 py-2 rounded-lg hover:bg-indigo-50"
22. Hero: className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden pt-20"
23. Blob: className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"
24. Hero heading: className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-6 text-center"
25. Hero sub: className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed mb-10 text-center"
26. CTA: className="px-10 py-5 bg-white text-indigo-900 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
27. Cards: className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2 cursor-pointer"
28. Card strip: className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
29. Card body: className="p-6"
30. Card title: className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
31. Primary btn: className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all shadow-lg"
32. Secondary btn: className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
33. Danger btn: className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all text-sm"
34. Page: className="max-w-7xl mx-auto px-6 py-12 pt-28"
35. Section title: className="text-4xl font-black text-gray-900 mb-3"
36. Underline: className="w-16 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-12"
37. Grid: className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
38. Input: className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
39. Form: className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto"
40. Label: className="block text-sm font-semibold text-gray-700 mb-2"
41. Spinner: className="flex flex-col items-center justify-center py-24" with inner className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"
42. Badge: className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700"
43. Toast ok: className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold z-50"
44. Toast err: className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold z-50"
45. Footer: className="bg-gray-900 text-white mt-20 py-12 px-8 border-t border-gray-800"

INTERACTIVITY
46. useState to toggle add/edit forms
47. Search/filter using useState
48. Toast messages after create/delete, auto-dismiss after 3s
49. useNavigate for card clicks
50. Optimistic UI on item creation

Reply with ONLY JSX code — no markdown, no backticks, no explanation.`);

    if (!text) {
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    let cleaned = text
      .replace(/```jsx\n?/g,'').replace(/```javascript\n?/g,'').replace(/```\n?/g,'').trim()
      .replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"')
      .replace(/[\u2013\u2014]/g,'-').replace(/[\u2026]/g,'...')
      .replace(/[\u00A0]/g,' ').replace(/[^\x00-\x7F]/g,'');

    const errors = validateFrontendCode(cleaned);
    if (errors.length === 0) {
      console.log(`✅ Frontend Agent: valid code on attempt ${attempt}`);
      return cleaned;
    }
    console.warn(`⚠️ Frontend Agent attempt ${attempt} errors:`, errors);
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Frontend Agent: failed after 3 attempts');
}

module.exports = { runFrontendAgent };