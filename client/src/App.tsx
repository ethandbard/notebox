import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import TasksPage from './pages/Tasks.tsx';
import NotesPage from './pages/Notes.tsx';
import FilesPage from './pages/Files.tsx';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `label text-xs px-1 pb-1 border-b ${
    isActive ? 'text-accent border-accent' : 'text-faint border-transparent hover:text-ink'
  }`;

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="label text-sm text-ink">notebox</span>
          <nav className="flex gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Tasks
            </NavLink>
            <NavLink to="/notes" className={navLinkClass}>
              Notes
            </NavLink>
            <NavLink to="/files" className={navLinkClass}>
              Files
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<TasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
