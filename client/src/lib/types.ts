export interface Section {
  id: number;
  name: string;
  position: number;
  createdAt: string;
}

export interface Note {
  id: number;
  sectionId: number;
  title: string;
  bodyMarkdown: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  text: string;
  done: boolean;
  position: number;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface FileEntry {
  id: number;
  storedName: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}
