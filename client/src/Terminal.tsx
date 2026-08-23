import type { ReactNode } from 'react';

export default function Terminal({ path, delay, children }: { path: string; delay: number; children: ReactNode }) {
  return (
    <div className="nb-terminal" style={{ animationDelay: `${delay}ms` }}>
      <div className="nb-terminal-bar">
        <span className="nb-terminal-dot" />
        <span className="nb-terminal-dot" />
        <span className="nb-terminal-dot nb-terminal-dot-accent" />
        <span className="nb-terminal-path">{path}</span>
      </div>
      <div className="nb-terminal-body">{children}</div>
    </div>
  );
}
