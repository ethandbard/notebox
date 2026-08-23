import { useState, type ReactNode } from 'react';

// A browser that throttles a hidden/backgrounded tab can discard this
// entrance animation's timeline and replay it in full on refocus — every
// panel would visibly flash back in at once. Dropping the animation once it
// finishes freezes the settled (visible, untransformed) state so there's
// nothing left to replay.
export default function Terminal({ path, delay, children }: { path: string; delay: number; children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  return (
    <div
      className="nb-terminal"
      style={settled ? { animation: 'none' } : { animationDelay: `${delay}ms` }}
      onAnimationEnd={() => setSettled(true)}
    >
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
