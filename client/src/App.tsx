import { useEffect, useMemo, useState } from 'react';
import TasksPanel from './panels/TasksPanel.tsx';
import NotesPanel from './panels/NotesPanel.tsx';
import FilesPanel from './panels/FilesPanel.tsx';
import Terminal from './Terminal.tsx';
import { api } from './lib/api.ts';
import type { Section, Task } from './lib/types.ts';

const GLYPH_CHARS = ['0', '1', '$', '#', '/', '{', '}', ':', '_', '=', '>', '<'];

function randomGlyph(id: number) {
  return {
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    char: GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)],
    duration: 3000 + Math.random() * 4000,
    delay: Math.random() * 6000,
  };
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [beamActive, setBeamActive] = useState(false);
  const [beamId, setBeamId] = useState(0);
  const [cubeBurst, setCubeBurst] = useState(false);
  const [glyphs, setGlyphs] = useState(() => Array.from({ length: 14 }, (_, i) => randomGlyph(i)));
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [sectionCount, setSectionCount] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const onVisibility = () => root.classList.toggle('nb-anim-paused', document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    api.get<Task[]>('/api/tasks').then((rows) => setOpenCount(rows.length));
    api.get<Section[]>('/api/sections').then((rows) => setSectionCount(rows.length));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setGlyphs((gs) =>
        gs.map((g) => (Math.random() < 0.3 ? { ...randomGlyph(g.id), char: g.char } : g)),
      );
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  const triggerWave = () => {
    setBeamActive(true);
    setBeamId((id) => id + 1);
  };

  useEffect(() => {
    if (!beamActive) return;
    const t = setTimeout(() => setBeamActive(false), 2600);
    return () => clearTimeout(t);
  }, [beamActive, beamId]);

  useEffect(() => {
    triggerWave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function burstCube() {
    if (cubeBurst) return;
    setCubeBurst(true);
    setTimeout(() => setCubeBurst(false), 700);
    triggerWave();
    setGlyphs((gs) =>
      gs.map((g) => ({
        ...g,
        char: GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)],
        left: Math.random() * 100,
        top: Math.random() * 100,
      })),
    );
  }

  const statusLine = useMemo(() => {
    if (sectionCount === null || openCount === null) return '…';
    return `${sectionCount} sections · ${openCount} open`;
  }, [sectionCount, openCount]);

  return (
    <div className="min-h-screen relative">
      <div className="nb-grid-bg" />
      {beamActive && <div className="nb-scan-beam" key={beamId} />}
      <div className="nb-glyph-layer" aria-hidden="true">
        {glyphs.map((g) => (
          <span
            key={g.id}
            className="nb-glyph"
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              animationDuration: `${g.duration}ms`,
              animationDelay: `${g.delay}ms`,
            }}
          >
            {g.char}
          </span>
        ))}
      </div>

      <div className="relative z-[1] max-w-6xl mx-auto px-6 pb-20">
        <header className="flex items-center justify-between border-b border-rule py-5">
          <div className="flex items-baseline gap-2.5">
            <span className="inline-flex">
              <span className="nb-header-dot" />
            </span>
            <span className="font-mono font-semibold text-sm tracking-wide text-ink">
              notebox<span className="nb-brand-cursor" />
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3.5">
              <a
                href="https://ethandbard.com"
                className="label text-xs text-muted no-underline border-b border-spine pb-0.5 transition-colors hover:text-accent hover:border-accent"
              >
                &#8592; ethandbard.com
              </a>
              <span className="label text-[0.72rem] text-faint">{statusLine}</span>
            </div>
            <a
              href="https://github.com/ethandbard/notebox"
              aria-label="View source on GitHub"
              className="font-mono text-[0.62rem] font-semibold text-faint no-underline border border-rule rounded-[2px] w-6 h-6 flex items-center justify-center transition-colors hover:text-accent hover:border-accent"
            >
              GH
            </a>
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="label text-[0.7rem] text-faint border border-rule rounded-[2px] px-2.5 py-1.5 bg-transparent cursor-pointer hover:text-accent hover:border-accent"
            >
              mode: {theme}
            </button>
            <div
              className="nb-cube-scene"
              onClick={burstCube}
              role="button"
              tabIndex={0}
              aria-label="Spin the cube"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') burstCube();
              }}
            >
              <div className={`nb-cube ${cubeBurst ? 'nb-cube-burst' : ''}`} />
              <div className={`nb-cube-inner ${cubeBurst ? 'nb-cube-burst' : ''}`} />
            </div>
          </div>
        </header>

        <p className="flex items-center gap-1.5 font-mono text-[0.8rem] text-faint mt-4 mb-0">
          <span className="nb-typed">
            notebox:~$ tasks --pending {openCount ?? '…'}
          </span>
          <span className="nb-caret" />
        </p>

        <main className="grid grid-cols-1 gap-10 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-10 items-start">
            <aside className="lg:sticky lg:top-6">
              <Terminal path="ethan@notebox:~/tasks$" delay={80}>
                <TasksPanel />
              </Terminal>
            </aside>
            <div className="flex flex-col gap-12">
              <Terminal path="ethan@notebox:~/notes$" delay={170}>
                <NotesPanel />
              </Terminal>
              <Terminal path="ethan@notebox:~/files$" delay={260}>
                <FilesPanel />
              </Terminal>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
