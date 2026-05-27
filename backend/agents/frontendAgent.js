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
            max_tokens: 8192,
          })
        });
        const groqData = await groqRes.json();
        if (groqData.choices?.[0]?.message?.content) {
          console.log('✅ Frontend Agent using Groq');
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
        console.log('✅ Frontend Agent using OpenRouter fallback');
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

  const forbidden = ['lucide-react', '@heroicons', 'framer-motion',
    '@headlessui', 'react-icons', 'styled-components', '@mui', 'antd'];
  for (const pkg of forbidden) {
    if (code.includes(`from '${pkg}'`) || code.includes(`from "${pkg}"`))
      errors.push(`forbidden import: ${pkg}`);
  }

  if (/=True[\s,>]/.test(code) || /=False[\s,>]/.test(code))
    errors.push('Python boolean syntax detected');

  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (Math.abs(opens - closes) > 2)
    errors.push(`mismatched braces: ${opens} vs ${closes}`);

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
2. Do NOT import lucide-react, @heroicons, framer-motion, axios, @headlessui, react-icons, or ANY other package
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
13. Use only plain ASCII characters — no smart quotes, no Unicode symbols

API
14. All fetch calls use: fetch('${backendUrl}/api/...')
15. Every fetch() inside try/catch
16. No axios — only fetch()

UI/UX — make this website STUNNING and HIGHLY INTERACTIVE:

OVERALL
17. Overall: className="bg-gray-50 min-h-screen font-sans antialiased"
18. Add pt-20 to all page containers for fixed navbar

NAVBAR
19. <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
20. <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
21. Brand: <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
22. Nav links: <Link className="text-gray-600 hover:text-indigo-600 font-medium transition-all duration-200 text-sm px-3 py-2 rounded-lg hover:bg-indigo-50">

HERO
23. <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden pt-20">
24. Blob 1: <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse">
25. Blob 2: <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse">
26. Heading: <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-6">
27. Subtext: <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed mb-10">
28. CTA: <button className="px-10 py-5 bg-white text-indigo-900 rounded-2xl font-bold text-lg hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl">

CARDS
29. <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2 cursor-pointer">
30. Top strip: <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
31. Body: <div className="p-6">
32. Title: <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">

BUTTONS
33. Primary: className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
34. Secondary: className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200"
35. Danger: className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium"

LAYOUT
36. Page: <div className="max-w-7xl mx-auto px-6 py-12 pt-28">
37. Section title: <h2 className="text-4xl font-black text-gray-900 mb-3">
38. Underline: <div className="w-16 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-12">
39. Grid: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

FORMS
40. Input: className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
41. Form wrapper: <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
42. Label: <label className="block text-sm font-semibold text-gray-700 mb-2">

LOADING AND EMPTY
43. Spinner: <div className="flex flex-col items-center justify-center py-24"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div><p className="text-gray-500">Loading...</p></div>
44. Empty: <div className="text-center py-24"><div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">empty</span></div><h3 className="text-xl font-bold text-gray-900 mb-2">Nothing here yet</h3><p className="text-gray-500">Get started by adding your first item</p></div>

INTERACTIVITY
45. useState for showing/hiding add forms
46. Search/filter on list pages using useState
47. Success/error toast messages after API calls using useState
48. useNavigate for card click navigation to detail pages
49. Optimistic UI — add item to list immediately before API confirms

FOOTER
50. <footer className="bg-gray-900 text-white mt-20 py-12 px-8 border-t border-gray-800">

Reply with ONLY JSX code — no markdown, no backticks, no explanation.`);

    if (!text) {
      console.warn(`⚠️ Frontend Agent attempt ${attempt}: empty response`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    let cleaned = text
      .replace(/```jsx\n?/g, '')
      .replace(/```javascript\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

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
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error('Frontend Agent: failed after 3 attempts');
}

module.exports = { runFrontendAgent };