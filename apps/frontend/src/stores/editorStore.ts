import { create } from 'zustand';

interface EditorState {
  theme: 'light' | 'dark';
  language: string;
  setLanguage: (language: string) => void;
}

/** useEditorStore stores editor settings and preferences. */
export const useEditorStore = create<EditorState>((set) => ({
  theme: 'dark',
  language: 'typescript',
  setLanguage: (language) => set({ language })
}));
