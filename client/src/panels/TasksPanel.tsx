import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Task } from '../lib/types.ts';

// SQLite's `current_timestamp` default yields "2026-08-23 15:45:24" (space,
// no zone); `completedAt` is set from `Date.toISOString()`, already full ISO
// with a trailing Z. Only reshape the former, or a second Z makes an invalid date.
function formatDate(raw: string) {
  const iso = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
  return new Date(iso).toLocaleString();
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Task[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [text, setText] = useState('');
  const [justToggled, setJustToggled] = useState<number | null>(null);

  const loadActive = () => api.get<Task[]>('/api/tasks').then(setTasks);
  const loadHistory = () => api.get<Task[]>('/api/tasks?done=true').then(setHistory);

  useEffect(() => {
    loadActive();
  }, []);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    await api.post('/api/tasks', { text: value });
    loadActive();
  }

  async function toggle(id: number) {
    setJustToggled(id);
    setTimeout(() => setJustToggled((cur) => (cur === id ? null : cur)), 420);
    await api.patch(`/api/tasks/${id}/toggle`);
    loadActive();
    if (showHistory) loadHistory();
  }

  async function remove(id: number) {
    await api.delete(`/api/tasks/${id}`);
    loadActive();
  }

  return (
    <div className="space-y-8">
      <div>
        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 bg-surface border border-rule px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button className="label text-xs px-4 border border-rule hover:border-accent hover:text-accent">
            Add
          </button>
        </form>
        <ul className="divide-y divide-rule border border-rule">
          {tasks.length === 0 && <li className="px-3 py-4 text-sm text-faint">Nothing pending.</li>}
          {tasks.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center gap-3 px-3 py-2"
              style={{ animation: `nb-rise 400ms cubic-bezier(0.22,0.61,0.36,1) ${i * 60}ms both` }}
            >
              <button
                aria-label="Toggle task"
                onClick={() => toggle(t.id)}
                className={`nb-task-node w-[11px] h-[11px] border border-spine bg-bg p-0 flex-none cursor-pointer transition-transform hover:scale-[1.15] hover:border-accent ${
                  justToggled === t.id ? 'nb-task-node-blip' : ''
                }`}
              />
              <span className="flex-1 text-sm">{t.text}</span>
              <button onClick={() => remove(t.id)} className="text-faint hover:text-accent text-xs">
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="label text-xs text-faint hover:text-accent"
        >
          {showHistory ? '− Hide history' : '+ Show history'}
        </button>
        {showHistory && (
          <ul className="mt-3 divide-y divide-rule border border-rule">
            {history.length === 0 && <li className="px-3 py-4 text-sm text-faint">No completed tasks yet.</li>}
            {history.map((t) => (
              <li key={t.id} className="px-3 py-2">
                <p className="text-sm text-muted line-through">{t.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="label text-[0.65rem] text-faint">
                    {t.completedAt ? formatDate(t.completedAt) : ''}
                  </span>
                  <button onClick={() => toggle(t.id)} className="label text-xs text-faint hover:text-accent">
                    Reopen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
