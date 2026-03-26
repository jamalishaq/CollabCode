import MonacoEditor from '@monaco-editor/react';
import { RuntimeLanguage, type ExecutionResult } from '@collabcode/shared-types';
import { useState } from 'react';

import { useExecution } from '../../../hooks/useExecution';
import { usePresence } from '../../../hooks/usePresence';
import { ExecutionPanel } from './ExecutionPanel';
import { EditorToolbar } from './EditorToolbar';
import { editorOptions } from './editorConfig';
import { PresenceBar } from './PresenceBar';

interface EditorComponentProps {
  fileId: string;
  fileName: string;
}

const starterCodeByLanguage: Record<RuntimeLanguage, string> = {
  [RuntimeLanguage.JavaScript]: "console.log('Hello CollabCode');",
  [RuntimeLanguage.TypeScript]: "const message: string = 'Hello CollabCode';\nconsole.log(message);",
  [RuntimeLanguage.Python]: "print('Hello CollabCode')",
  [RuntimeLanguage.Go]: 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello CollabCode")\n}',
  [RuntimeLanguage.Rust]: 'fn main() {\n    println!("Hello CollabCode");\n}'
};

/** Editor renders the Monaco editor wrapper. */
export function EditorComponent({ fileId, fileName }: EditorComponentProps) {
  const [language, setLanguage] = useState(RuntimeLanguage.TypeScript);
  const [code, setCode] = useState<string>(starterCodeByLanguage[RuntimeLanguage.TypeScript]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const { run, isRunning } = useExecution();
  const users = usePresence(fileId);

  const handleLanguageChange = (nextLanguage: RuntimeLanguage) => {
    setLanguage(nextLanguage);
    setCode(starterCodeByLanguage[nextLanguage]);
  };

  const handleRun = async () => {
    const executionResult = await run({ code, language });
    setResult(executionResult);
  };

  return (
    <section className="editor-layout">
      <EditorToolbar language={language} onLanguageChange={handleLanguageChange} onRun={handleRun} />
      <PresenceBar users={users} />
      <div className="editor-frame">
        <div className="editor-title">{fileName}</div>
        <MonacoEditor
          height="56vh"
          language={language}
          value={code}
          onChange={(value) => setCode(value ?? '')}
          options={editorOptions}
        />
      </div>
      <ExecutionPanel result={result} isRunning={isRunning} />
    </section>
  );
}
