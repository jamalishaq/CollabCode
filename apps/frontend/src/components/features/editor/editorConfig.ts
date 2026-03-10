import type { editor } from 'monaco-editor';

/** editorOptions contains all shared Monaco settings. */
export const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  tabSize: 2,
  theme: 'vs-dark'
};
