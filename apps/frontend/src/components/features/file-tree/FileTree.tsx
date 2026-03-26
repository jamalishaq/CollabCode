import type { File } from '@collabcode/shared-types';

interface FileTreeProps {
  files: File[];
  activeFileId: string | null;
  onSelect: (fileId: string) => void;
}

export function FileTree({ files, activeFileId, onSelect }: FileTreeProps) {
  return (
    <aside className="panel file-tree">
      <h3>Files</h3>
      {files.map((file) => (
        <button
          className={`file-row ${activeFileId === file.id ? 'is-active' : ''}`}
          key={file.id}
          onClick={() => onSelect(file.id)}
          type="button"
        >
          <span>{file.name}</span>
          <small>{file.language}</small>
        </button>
      ))}
    </aside>
  );
}
