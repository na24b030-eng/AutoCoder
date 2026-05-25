require('dotenv').config();

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free',
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'minimax/minimax-m2.5:free',
];

async function callOpenRouter(prompt) {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const model = FREE_MODELS[i % FREE_MODELS.length];
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://autocoder.vercel.app',
          'X-Title': 'GenAI AutoCoder',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        console.log(`✅ Frontend Agent got response from ${model}`);
        return data.choices[0].message.content;
      }
      const retryAfter = data.error?.metadata?.retry_after_seconds || 15;
      console.log(`⚠️ Frontend Agent: ${model} failed (attempt ${i+1}/${maxRetries}), retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
    } catch (err) {
      console.log(`⚠️ Frontend Agent network error (attempt ${i+1}/${maxRetries}): ${err.message}, retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('Frontend Agent: all models failed');
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

    const text = await callOpenRouter(`You are the Frontend Agent in an AutoCoder system.
Blueprint: ${JSON.stringify(blueprint, null, 2)}
Backend API URL: ${backendUrl}

EXACT RULES:

IMPORTS
1. Only import from: react, react-dom, react-router-dom — NO OTHER IMPORTS
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

UI/UX — CRITICAL — make this website STUNNING and HIGHLY INTERACTIVE:

OVERALL
17. Overall: className="bg-gray-50 min-h-screen font-sans antialiased"
18. Add pt-20 to all page containers for fixed navbar

NAVBAR — fixed, glassmorphism style
19. <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
20. <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
21. Brand: <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
22. Nav links with active state: <Link className="text-gray-600 hover:text-indigo-600 font-medium transition-all duration-200 text-sm px-3 py-2 rounded-lg hover:bg-indigo-50">

HERO — bold, full screen
23. <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden pt-20">
24. Blob 1: <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse">
25. Blob 2: <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse">
26. Content wrapper: <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
27. Badge: <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm mb-8">
28. Heading: <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-6">
29. Subtext: <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed mb-10">
30. CTA: <button className="px-10 py-5 bg-white text-indigo-900 rounded-2xl font-bold text-lg hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl shadow-indigo-500/25">

CARDS — premium with interactions
31. <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2 cursor-pointer">
32. Top accent: <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
33. Body: <div className="p-6">
34. Title: <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
35. Meta: <p className="text-sm text-gray-500 mt-1">
36. Action row: <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">

BUTTONS
37. Primary: className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-200"
38. Secondary: className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
39. Danger: className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium"
40. Icon button: className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"

LAYOUT
41. Page: <div className="max-w-7xl mx-auto px-6 py-12 pt-28">
42. Section title: <h2 className="text-4xl font-black text-gray-900 mb-3">
43. Underline: <div className="w-16 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-12">
44. Grid: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
45. Section bg alt: className="bg-gradient-to-b from-indigo-50/50 to-white py-20"

FORMS — clean and modern
46. Form wrapper: <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
47. Input: className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
48. Textarea: className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
49. Label: <label className="block text-sm font-semibold text-gray-700 mb-2">
50. Form title: <h2 className="text-2xl font-black text-gray-900 mb-2">

STATS ROW — add if relevant
51. <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
52. Stat card: <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
53. Stat number: <div className="text-4xl font-black text-indigo-600 mb-1">
54. Stat label: <div className="text-sm text-gray-500 font-medium">

LOADING & EMPTY
55. Spinner: <div className="flex flex-col items-center justify-center py-24"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div><p className="text-gray-500">Loading...</p></div>
56. Empty: <div className="text-center py-24"><div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">📭</span></div><h3 className="text-xl font-bold text-gray-900 mb-2">Nothing here yet</h3><p className="text-gray-500">Get started by adding your first item</p></div>
57. Skeleton: <div className="animate-pulse space-y-3"><div className="h-48 bg-gray-100 rounded-2xl"></div><div className="h-4 bg-gray-100 rounded w-3/4"></div><div className="h-4 bg-gray-100 rounded w-1/2"></div></div>

BADGES & TAGS
58. <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
59. Success: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
60. Warning: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">

TOAST/FEEDBACK — use state for success messages
61. Success toast: <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold animate-bounce z-50">
62. Error toast: <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold z-50">

FOOTER
63. <footer className="bg-gray-900 text-white mt-20">
64. Inner: <div className="max-w-7xl mx-auto px-8 py-16">
65. Brand: <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
66. Description: <p className="text-gray-400 mt-2 max-w-sm leading-relaxed">
67. Bottom bar: <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">

INTERACTIVITY REQUIREMENTS:
68. Add useState for showing/hiding forms (toggle add form)
69. Add instant optimistic UI updates when creating items
70. Add delete confirmation with a simple confirm() or inline state
71. Add search/filter functionality on list pages using useState
72. Add success/error toast messages after API calls
73. Add hover states on ALL clickable elements
74. Clicking a card navigates to detail page using useNavigate

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