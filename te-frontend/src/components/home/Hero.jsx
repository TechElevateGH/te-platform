import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const terminalLines = [
  { type: 'prompt', text: 'te status --me' },
  { type: 'out', text: 'applications   12 tracked' },
  { type: 'out', text: 'interviews      3 scheduled' },
  { type: 'out', text: 'referrals       5 active' },
  { type: 'out', text: 'lessons        28 completed' },
  { type: 'next', text: 'next  ->  mock interview @ 16:00' },
];

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section
      id="home"
      className="relative te-grid-bg overflow-hidden border-b border-[var(--te-border)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-20 sm:pt-32 sm:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <span className="te-eyebrow">{'// career OS for engineers'}</span>

            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-[var(--te-text)]">
              Ship your tech
              <br />
              career like code.
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--te-text-dim)]">
              TechElevate is the workspace for aspiring engineers — track
              applications, run interview prep, manage referrals, and level up
              your CS skills. One clean, focused place to land the offer.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/register')} className="te-btn-primary te-btn-lg">
                    Get started free <span aria-hidden="true">→</span>
                  </button>
                  <button onClick={() => navigate('/login')} className="te-btn-secondary te-btn-lg">
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/workspace')} className="te-btn-primary te-btn-lg">
                    Open workspace <span aria-hidden="true">→</span>
                  </button>
                  <button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="te-btn-secondary te-btn-lg"
                  >
                    Explore features
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[var(--te-text-dim)]">
              <span>$ free to join</span>
              <span className="hidden sm:inline text-[var(--te-border-strong)]">|</span>
              <span>100+ engineers onboard</span>
              <span className="hidden sm:inline text-[var(--te-border-strong)]">|</span>
              <span>Africa &amp; beyond</span>
            </div>
          </div>

          {/* Right: terminal window */}
          <div className="relative">
            <div className="te-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3">
                <span className="h-3 w-3 rounded-full border border-[var(--te-border-strong)]" />
                <span className="h-3 w-3 rounded-full border border-[var(--te-border-strong)]" />
                <span className="h-3 w-3 rounded-full border border-[var(--te-border-strong)]" />
                <span className="ml-3 font-mono text-xs text-[var(--te-text-dim)]">~/techelevate — zsh</span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-7 text-[var(--te-text)]">
                {terminalLines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    {line.type === 'prompt' && (
                      <>
                        <span className="select-none text-[var(--te-text-dim)]">$</span>
                        <span>{line.text}</span>
                      </>
                    )}
                    {line.type === 'out' && (
                      <>
                        <span className="select-none text-[var(--te-text-dim)]">✓</span>
                        <span className="text-[var(--te-text-dim)]">{line.text}</span>
                      </>
                    )}
                    {line.type === 'next' && (
                      <span className="mt-1 text-[var(--te-text)]">{line.text}</span>
                    )}
                  </div>
                ))}
                <div className="mt-1 flex gap-2">
                  <span className="select-none text-[var(--te-text-dim)]">$</span>
                  <span className="inline-block h-[1.05em] w-[8px] translate-y-[2px] bg-[var(--te-text)] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
