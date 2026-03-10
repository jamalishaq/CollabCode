import Editor from '@monaco-editor/react';

import { editorOptions } from './editorConfig';

/** Editor renders the Monaco editor wrapper. */
export function EditorComponent() {
  return <Editor height="100%" defaultLanguage="typescript" options={editorOptions} />;
}
