import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'https://autocoder-8qa6.onrender.com';

const EXAMPLES = [
  { label: 'E-Commerce', prompt: 'Create a luxury jewelry e-commerce store with product catalog and cart' },
  { label: 'Restaurant', prompt: 'Create a restaurant website with menu, reservations and online ordering' },
  { label: 'Portfolio', prompt: 'Create a personal portfolio website for a UI/UX designer' },
  { label: 'SaaS', prompt: 'Create a project management SaaS app with tasks and team collaboration' },
  { label: 'Blog', prompt: 'Create a minimal blog platform with categories and comments' },
  { label: 'Fitness', prompt: 'Create a fitness tracking app with workout plans and progress charts' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'You describe your idea',
    desc: 'Type what you want to build in plain English. No technical knowledge required.',
    icon: '✦',
  },
  {
    step: '02',
    title: 'AI agents plan in parallel',
    desc: 'Five specialised agents simultaneously design your database, API, and UI.',
    icon: '◈',
  },
  {
    step: '03',
    title: 'Code is written & deployed',
    desc: 'Your complete app is pushed to GitHub and deployed live — automatically.',
    icon: '◎',
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef(null);
  const stepRef = useRef(null);
  const textareaRef = useRef(null);

  const STEPS = [
    'Orchestrator is reading your prompt...',
    'Designing your database schema...',
    'Writing backend API routes...',
    'Building your React frontend...',
    'Assembling & deploying your app...',
  ];

  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      let s = 0;
      stepRef.current = setInterval(() => {
        s = Math.min(s + 1, STEPS.length - 1);
        setActiveStep(s);
      }, 12000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(stepRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(stepRef.current);
    };
  }, [phase]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setPhase('running');
    setResult(null);
    setElapsed(0);
    setActiveStep(0);
    try {
      const { data } = await axios.post(`${API}/api/generate`, { prompt });
      setResult(data);
      setPhase('done');
    } catch (err) {
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setElapsed(0);
    setPrompt('');
    setActiveStep(0);
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F5F0',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      color: '#1A1814',
    }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::selection { background: #C8B89A; color: #1A1814; }

        .prompt-area {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          font-weight: 400;
          color: #1A1814;
          line-height: 1.6;
          min-height: 56px;
          max-height: 160px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .prompt-area::placeholder { color: #B8B0A4; }
        .prompt-area::-webkit-scrollbar { display: none; }

        .generate-btn {
          background: #1A1814;
          color: #F7F5F0;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
          padding: 14px 32px;
          border-radius: 100px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .generate-btn:hover:not(:disabled) {
          background: #2C2820;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(26,24,20,0.2);
        }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .example-chip {
          background: #EDEAE4;
          border: 1px solid #DDD9D2;
          color: #5C564E;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .example-chip:hover {
          background: #1A1814;
          color: #F7F5F0;
          border-color: #1A1814;
        }

        .url-card {
          background: white;
          border: 1px solid #E8E4DC;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
          text-decoration: none;
          display: block;
        }
        .url-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(26,24,20,0.08);
          border-color: #C8B89A;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #C8B89A;
          flex-shrink: 0;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .fade-in {
          animation: fadeIn 0.6s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #E8E4DC;
          border-top-color: #1A1814;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C8B89A; border-radius: 4px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E8E4DC',
        background: '#F7F5F0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: '#1A1814',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 18,
            letterSpacing: '-0.3px',
          }}>AutoCoder</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#how-it-works" style={{
            fontSize: 14, color: '#8C8680', textDecoration: 'none',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.target.style.color = '#1A1814'}
            onMouseLeave={e => e.target.style.color = '#8C8680'}
          >How it works</a>
          <a href="https://github.com/na24b030-eng/autocoder"
            target="_blank" rel="noreferrer"
            style={{
              fontSize: 14, color: '#8C8680', textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = '#1A1814'}
            onMouseLeave={e => e.target.style.color = '#8C8680'}
          >GitHub</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      {phase === 'idle' && (
        <section style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '80px 24px 0',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#EDEAE4',
            border: '1px solid #DDD9D2',
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 12,
            color: '#8C8680',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            <span style={{ color: '#C8B89A' }}>✦</span>
            Powered by Gemini AI
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: 24,
            color: '#1A1814',
          }}>
            Describe your app.<br />
            <em style={{ color: '#C8B89A' }}>Watch it come alive.</em>
          </h1>

          <p style={{
            fontSize: 18,
            color: '#8C8680',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 48px',
            fontWeight: 300,
          }}>
            Type what you want to build. Our AI agents generate the code,
            deploy to GitHub, and give you a live URL — in minutes.
          </p>
        </section>
      )}

      {/* ── PROMPT BOX ── */}
      <section style={{
        maxWidth: 760,
        margin: phase === 'idle' ? '0 auto' : '60px auto 0',
        padding: '0 24px',
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #E8E4DC',
          borderRadius: 20,
          padding: '24px 24px 20px',
          boxShadow: '0 2px 40px rgba(26,24,20,0.06)',
          transition: 'box-shadow 0.2s',
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            className="prompt-area"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); autoResize(e); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && phase === 'idle') {
                e.preventDefault();
                generate();
              }
            }}
            disabled={phase === 'running'}
            placeholder="Describe the app you want to build..."
            rows={1}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #F0EDE8',
          }}>
            <span style={{ fontSize: 12, color: '#C8B89A' }}>
              {phase === 'running' ? `${elapsed}s elapsed` : 'Press Enter to generate'}
            </span>
            <button
              className="generate-btn"
              onClick={phase === 'done' || phase === 'error' ? reset : generate}
              disabled={phase === 'running' || (!prompt.trim() && phase === 'idle')}
            >
              {phase === 'running' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="spinner" />
                  Building...
                </span>
              ) : phase === 'done' || phase === 'error' ? (
                '↺ Start over'
              ) : (
                'Generate app →'
              )}
            </button>
          </div>
        </div>

        {/* ── EXAMPLE CHIPS ── */}
        {phase === 'idle' && (
          <div style={{
            marginTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                className="example-chip"
                onClick={() => {
                  setPrompt(ex.prompt);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height =
                      Math.min(textareaRef.current.scrollHeight, 160) + 'px';
                  }
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── GENERATING STATE ── */}
      {phase === 'running' && (
        <section className="fade-in" style={{
          maxWidth: 760,
          margin: '40px auto 0',
          padding: '0 24px',
        }}>
          <div style={{
            background: 'white',
            border: '1px solid #E8E4DC',
            borderRadius: 20,
            padding: '32px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 0',
                  borderBottom: i < STEPS.length - 1 ? '1px solid #F7F5F0' : 'none',
                  opacity: i > activeStep ? 0.3 : 1,
                  transition: 'opacity 0.4s ease',
                }}>
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: i < activeStep ? '#1A1814' : i === activeStep ? '#C8B89A' : '#EDEAE4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                    color: i < activeStep ? 'white' : i === activeStep ? '#1A1814' : '#B8B0A4',
                    fontWeight: 600,
                    flexShrink: 0,
                    transition: 'all 0.4s ease',
                  }}>
                    {i < activeStep ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 14,
                    color: i === activeStep ? '#1A1814' : '#8C8680',
                    fontWeight: i === activeStep ? 500 : 400,
                    transition: 'all 0.3s',
                  }}>
                    {step}
                  </span>
                  {i === activeStep && (
                    <div className="step-dot" style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RESULT ── */}
      {phase === 'done' && result?.urls && (
        <section className="fade-in" style={{
          maxWidth: 760,
          margin: '40px auto 0',
          padding: '0 24px',
        }}>
          {/* Success message */}
          <div style={{
            background: '#F0F7F0',
            border: '1px solid #C8E0C8',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1A3A1A' }}>
                Your app is live!
              </p>
              <p style={{ fontSize: 13, color: '#4A7A4A', marginTop: 2 }}>
                Generated in {elapsed}s — 3 deployments created
              </p>
            </div>
          </div>

          {/* URL Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <a href={result.urls.frontendUrl} target="_blank" rel="noreferrer"
              className="url-card">
              <div style={{
                fontSize: 24, marginBottom: 12,
                width: 44, height: 44,
                background: '#F7F5F0',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🌐</div>
              <p style={{ fontSize: 12, color: '#8C8680', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live Website
              </p>
              <p style={{ fontSize: 13, color: '#1A1814', fontWeight: 500, wordBreak: 'break-all' }}>
                {result.urls.frontendUrl?.replace('https://', '')}
              </p>
            </a>

            <a href={result.urls.backendUrl} target="_blank" rel="noreferrer"
              className="url-card">
              <div style={{
                fontSize: 24, marginBottom: 12,
                width: 44, height: 44,
                background: '#F7F5F0',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⚙️</div>
              <p style={{ fontSize: 12, color: '#8C8680', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live API
              </p>
              <p style={{ fontSize: 13, color: '#1A1814', fontWeight: 500, wordBreak: 'break-all' }}>
                {result.urls.backendUrl?.replace('https://', '')}
              </p>
            </a>

            <a href={result.urls.githubUrl} target="_blank" rel="noreferrer"
              className="url-card">
              <div style={{
                fontSize: 24, marginBottom: 12,
                width: 44, height: 44,
                background: '#F7F5F0',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🐙</div>
              <p style={{ fontSize: 12, color: '#8C8680', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Source Code
              </p>
              <p style={{ fontSize: 13, color: '#1A1814', fontWeight: 500, wordBreak: 'break-all' }}>
                {result.urls.githubUrl?.replace('https://github.com/', '')}
              </p>
            </a>
          </div>

          {/* Project summary */}
          {result.blueprint && (
            <div style={{
              background: 'white',
              border: '1px solid #E8E4DC',
              borderRadius: 16,
              padding: '24px',
              marginTop: 12,
            }}>
              <p style={{
                fontSize: 11, color: '#B8B0A4',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12,
              }}>
                Generated Project
              </p>
              <p style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", marginBottom: 6 }}>
                {result.blueprint.project_name}
              </p>
              <p style={{ fontSize: 14, color: '#8C8680', lineHeight: 1.6, marginBottom: 16 }}>
                {result.blueprint.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.blueprint.features?.map(f => (
                  <span key={f} style={{
                    fontSize: 12, color: '#5C564E',
                    background: '#F7F5F0',
                    border: '1px solid #E8E4DC',
                    borderRadius: 100,
                    padding: '4px 12px',
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── ERROR STATE ── */}
      {phase === 'error' && (
        <section className="fade-in" style={{
          maxWidth: 760,
          margin: '40px auto 0',
          padding: '0 24px',
        }}>
          <div style={{
            background: '#FDF5F5',
            border: '1px solid #E8C8C8',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#5A1A1A', marginBottom: 8 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 14, color: '#8C6060' }}>
              This could be a rate limit or connection issue. Please try again.
            </p>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      {phase === 'idle' && (
        <section id="how-it-works" style={{
          maxWidth: 960,
          margin: '120px auto 0',
          padding: '0 24px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{
              fontSize: 11, color: '#B8B0A4',
              textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16,
            }}>
              The Process
            </p>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 400,
              letterSpacing: '-1px',
              color: '#1A1814',
            }}>
              From prompt to production
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
          }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{
                background: i === 1 ? '#1A1814' : 'white',
                border: '1px solid #E8E4DC',
                borderRadius: i === 0 ? '20px 0 0 20px' : i === 2 ? '0 20px 20px 0' : 0,
                padding: '40px 32px',
              }}>
                <div style={{
                  fontSize: 28, marginBottom: 24,
                  color: i === 1 ? '#C8B89A' : '#C8B89A',
                }}>
                  {item.icon}
                </div>
                <p style={{
                  fontSize: 11,
                  color: i === 1 ? '#8C8478' : '#B8B0A4',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 12,
                }}>
                  Step {item.step}
                </p>
                <h3 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 22,
                  fontWeight: 400,
                  color: i === 1 ? '#F7F5F0' : '#1A1814',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: i === 1 ? '#8C8478' : '#8C8680',
                  lineHeight: 1.7,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TECH STRIP ── */}
      {phase === 'idle' && (
        <section style={{
          maxWidth: 960,
          margin: '80px auto 0',
          padding: '0 24px',
        }}>
          <div style={{
            background: 'white',
            border: '1px solid #E8E4DC',
            borderRadius: 20,
            padding: '32px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
          }}>
            <p style={{ fontSize: 13, color: '#B8B0A4', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Built with
            </p>
            {['Gemini AI', 'React', 'Express.js', 'SQLite', 'Vercel', 'Railway', 'GitHub'].map(tech => (
              <span key={tech} style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#5C564E',
              }}>
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        maxWidth: 960,
        margin: '80px auto 0',
        padding: '32px 24px 48px',
        borderTop: '1px solid #E8E4DC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24,
            background: '#1A1814',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12,
          }}>⚡</div>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 15,
          }}>AutoCoder</span>
        </div>
        <p style={{ fontSize: 13, color: '#B8B0A4' }}>
          Built with Gemini AI · Open source on{' '}
          <a href="https://github.com/na24b030-eng/autocoder"
            target="_blank" rel="noreferrer"
            style={{ color: '#8C8680', textDecoration: 'underline' }}>
            GitHub
          </a>
        </p>
      </footer>

    </div>
  );
}