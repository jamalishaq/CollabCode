import { RuntimeLanguage } from '@collabcode/shared-types';

import { Button } from '../../ui/Button';

interface EditorToolbarProps {
  language: RuntimeLanguage;
  onLanguageChange: (language: RuntimeLanguage) => void;
  onRun: () => void;
}

const languages = Object.values(RuntimeLanguage);

export function EditorToolbar({ language, onLanguageChange, onRun }: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <label>
        Language
        <select value={language} onChange={(event) => onLanguageChange(event.target.value as RuntimeLanguage)}>
          {languages.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
      <Button onClick={onRun}>Run</Button>
    </header>
  );
}
