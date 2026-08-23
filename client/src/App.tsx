import TasksPanel from './panels/TasksPanel.tsx';
import NotesPanel from './panels/NotesPanel.tsx';
import FilesPanel from './panels/FilesPanel.tsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <span className="label text-sm text-ink">notebox</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-10 items-start">
          <aside className="lg:sticky lg:top-8">
            <TasksPanel />
          </aside>
          <div className="space-y-12">
            <NotesPanel />
            <FilesPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
