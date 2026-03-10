import { create } from 'zustand';

interface EditorState {
  theme: 'light' | 'dark';
  language: string;
}

/** useEditorStore stores editor settings and preferences. */
export const useEditorStore = create<EditorState>(() => ({
  theme: 'dark',
  language: 'typescript'
}));
