export type BlockType =
  | 'heading'
  | 'text'
  | 'quote'
  | 'checklist'
  | 'table'
  | 'image'
  | 'voice'
  | 'webclip'
  | 'sketch'
  | 'divider';

export type NoteColor =
  | 'none'
  | 'saffron'
  | 'teal'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteBlock {
  id: string;
  type: BlockType;
  text?: string;
  level?: number;
  items?: ChecklistItem[];
  rows?: string[][];
  caption?: string;
  title?: string;
  duration?: string;
  url?: string;
  dataUrl?: string;
}

export interface Note {
  id: string;
  title: string;
  folder: string;
  color: NoteColor;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
  blocks: NoteBlock[];
}

export interface Folder {
  id: string;
  name: string;
  color: NoteColor;
}

export type Theme = 'system' | 'light' | 'dark';
export type EditorVariant = 'blocks' | 'markdown' | 'focus';
export type ActiveFolder = string; // 'all' | 'fav' | 'trash' | folder.id

export const COLOR_PALETTE: Record<NoteColor, { strip: string; dot: string }> = {
  none:    { strip: 'transparent', dot: 'rgba(var(--ink),0.30)' },
  saffron: { strip: '#FF9933',     dot: '#FF9933' },
  teal:    { strip: '#00BFA5',     dot: '#00BFA5' },
  info:    { strip: '#6FA8FF',     dot: '#6FA8FF' },
  success: { strip: '#3DDC97',     dot: '#3DDC97' },
  warning: { strip: '#F5B971',     dot: '#F5B971' },
  danger:  { strip: '#FF5A6A',     dot: '#FF5A6A' },
};

export const COLOR_KEYS: NoteColor[] = [
  'none', 'saffron', 'teal', 'info', 'success', 'warning', 'danger',
];
