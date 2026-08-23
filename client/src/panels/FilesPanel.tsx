import { useEffect, useRef, useState } from 'react';
import { api, uploadFile } from '../lib/api.ts';
import type { FileEntry } from '../lib/types.ts';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// See Tasks.tsx formatDate: only reshape SQLite's space-separated timestamp,
// never a value that already carries a 'T' and zone.
function formatDate(raw: string) {
  const iso = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
  return new Date(iso).toLocaleString();
}

function PreviewBody({ file }: { file: FileEntry }) {
  const viewUrl = `/api/files/${file.id}/view`;
  if (file.mimeType.startsWith('image/')) {
    return <img src={viewUrl} alt={file.originalName} className="max-w-full max-h-[75vh] mx-auto" />;
  }
  if (file.mimeType.startsWith('video/')) {
    return <video src={viewUrl} controls className="max-w-full max-h-[75vh] mx-auto" />;
  }
  if (file.mimeType.startsWith('audio/')) {
    return <audio src={viewUrl} controls className="w-full" />;
  }
  if (
    file.mimeType === 'application/pdf' ||
    file.mimeType.startsWith('text/') ||
    file.mimeType === 'application/json'
  ) {
    return <iframe src={viewUrl} title={file.originalName} className="w-full h-[75vh] bg-surface" />;
  }
  return (
    <div className="text-center py-16 text-muted text-sm">
      <p className="mb-4">No preview available for this file type.</p>
      <a href={`/api/files/${file.id}/download`} className="label text-xs text-accent hover:underline">
        Download instead
      </a>
    </div>
  );
}

export default function FilesPanel() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<FileEntry[]>('/api/files').then(setFiles);

  useEffect(() => {
    load();
  }, []);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        await uploadFile(file);
      }
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/api/files/${id}`);
    if (previewFile?.id === id) setPreviewFile(null);
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className="label text-xs text-faint">Files</h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-accent text-accent' : 'border-rule text-faint hover:text-ink'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="label text-xs">
          {uploading ? 'Uploading…' : 'Drop files here, or click to choose'}
        </p>
      </div>

      <table className="w-full text-sm border border-rule">
        <thead>
          <tr className="label text-[0.65rem] text-faint border-b border-rule">
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Size</th>
            <th className="text-left px-3 py-2">Uploaded</th>
            <th className="text-left px-3 py-2">By</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {files.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-faint">
                No files yet.
              </td>
            </tr>
          )}
          {files.map((f) => (
            <tr key={f.id}>
              <td className="px-3 py-2">
                <button
                  onClick={() => setPreviewFile(f)}
                  className="text-accent hover:underline text-left"
                >
                  {f.originalName}
                </button>
              </td>
              <td className="px-3 py-2 text-muted">{formatSize(f.sizeBytes)}</td>
              <td className="px-3 py-2 text-muted">{formatDate(f.uploadedAt)}</td>
              <td className="px-3 py-2 text-muted">{f.uploadedBy}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => remove(f.id)} className="text-faint hover:text-accent text-xs">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 z-10 bg-bg/80 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bg border border-rule max-w-4xl w-full max-h-[90vh] overflow-auto p-4"
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <span className="text-sm truncate">{previewFile.originalName}</span>
              <div className="flex items-center gap-4 label text-xs shrink-0">
                <a href={`/api/files/${previewFile.id}/download`} className="text-faint hover:text-accent">
                  Download
                </a>
                <button onClick={() => setPreviewFile(null)} className="text-faint hover:text-accent">
                  Close ✕
                </button>
              </div>
            </div>
            <PreviewBody file={previewFile} />
          </div>
        </div>
      )}
    </div>
  );
}
