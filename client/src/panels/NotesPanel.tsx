import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api.ts';
import type { Note, Section } from '../lib/types.ts';

export default function NotesPanel({ onNotesChanged }: { onNotesChanged?: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionName, setSectionName] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const loadSections = () =>
    api.get<Section[]>('/api/sections').then((rows) => {
      setSections(rows);
      if (rows.length > 0 && activeSectionId === null) setActiveSectionId(rows[0].id);
    });

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (activeSectionId === null) {
      setNotes([]);
      return;
    }
    api.get<Note[]>(`/api/notes?sectionId=${activeSectionId}`).then(setNotes);
    setActiveNote(null);
  }, [activeSectionId]);

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    const name = sectionName.trim();
    if (!name) return;
    setSectionName('');
    const section = await api.post<Section>('/api/sections', { name });
    setSections((s) => [...s, section]);
    setActiveSectionId(section.id);
    onNotesChanged?.();
  }

  async function addNote() {
    if (activeSectionId === null) return;
    const note = await api.post<Note>('/api/notes', {
      sectionId: activeSectionId,
      title: 'Untitled',
      bodyMarkdown: '',
    });
    setNotes((n) => [note, ...n]);
    setActiveNote(note);
    setMode('edit');
    onNotesChanged?.();
  }

  async function saveActiveNote(patch: Partial<Pick<Note, 'title' | 'bodyMarkdown'>>) {
    if (!activeNote) return;
    const updated = await api.patch<Note>(`/api/notes/${activeNote.id}`, patch);
    setActiveNote(updated);
    setNotes((n) => n.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function deleteNote(id: number) {
    await api.delete(`/api/notes/${id}`);
    setNotes((n) => n.filter((x) => x.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
    onNotesChanged?.();
  }

  return (
    <>
      <div className="grid grid-cols-[14rem_1fr] gap-6">
      <aside className="space-y-4">
        <form onSubmit={addSection} className="flex gap-1">
          <input
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="New section…"
            className="flex-1 min-w-0 bg-surface border border-rule px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <button className="label text-xs px-2 border border-rule hover:border-accent hover:text-accent">
            +
          </button>
        </form>

        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setActiveSectionId(s.id)}
                className={`label w-full text-left text-xs px-2 py-1 border ${
                  activeSectionId === s.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-faint hover:text-ink'
                }`}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>

        {activeSectionId !== null && (
          <div>
            <button
              onClick={addNote}
              className="label text-xs text-faint hover:text-accent mb-2 block"
            >
              + Note
            </button>
            <ul className="space-y-1">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      setActiveNote(n);
                      setMode('edit');
                    }}
                    className={`w-full text-left text-sm px-2 py-1 truncate ${
                      activeNote?.id === n.id ? 'text-accent' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {n.title || 'Untitled'}
                  </button>
                </li>
              ))}
              {notes.length === 0 && <li className="text-xs text-faint px-2">No notes yet.</li>}
            </ul>
          </div>
        )}
      </aside>

      <section>
        {!activeNote ? (
          <p className="text-sm text-faint">Select or create a note.</p>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 gap-3">
              <input
                value={activeNote.title}
                onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                onBlur={(e) => saveActiveNote({ title: e.target.value })}
                className="flex-1 bg-transparent font-mono text-lg font-semibold outline-none border-b border-transparent focus:border-accent"
              />
              <div className="flex gap-1 label text-xs">
                <button
                  onClick={() => setMode('edit')}
                  className={`px-2 py-1 border ${mode === 'edit' ? 'border-accent text-accent' : 'border-rule text-faint'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className={`px-2 py-1 border ${mode === 'preview' ? 'border-accent text-accent' : 'border-rule text-faint'}`}
                >
                  Preview
                </button>
              </div>
              <button
                onClick={() => saveActiveNote({ title: activeNote.title, bodyMarkdown: activeNote.bodyMarkdown })}
                className="label text-xs text-faint hover:text-accent"
              >
                Save
              </button>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="label text-xs text-faint hover:text-accent"
              >
                Delete
              </button>
            </div>

            {mode === 'edit' ? (
              <textarea
                value={activeNote.bodyMarkdown}
                onChange={(e) => setActiveNote({ ...activeNote, bodyMarkdown: e.target.value })}
                onBlur={(e) => saveActiveNote({ bodyMarkdown: e.target.value })}
                rows={20}
                placeholder="Write markdown…"
                className="w-full bg-surface border border-rule p-3 text-sm font-mono outline-none focus:border-accent resize-y"
              />
            ) : (
              <div className="markdown-body border border-rule p-4 min-h-[20rem]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.bodyMarkdown}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </section>
      </div>
    </>
  );
}
