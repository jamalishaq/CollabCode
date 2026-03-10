import { EditorComponent } from '../components/features/editor/Editor';
import { FileTree } from '../components/features/file-tree/FileTree';
import { WorkspacePanel } from '../components/features/workspace/WorkspacePanel';

/** EditorPage composes the primary coding workspace. */
export function EditorPage() {
  return (
    <main>
      <WorkspacePanel />
      <FileTree />
      <EditorComponent />
    </main>
  );
}
