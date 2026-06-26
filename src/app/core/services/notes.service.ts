import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Note, Folder, NoteBlock, NoteColor, Theme, EditorVariant,
  COLOR_PALETTE, COLOR_KEYS,
} from '../models/note.model';

const STORAGE_KEY = 'christy_state_v1';
const THEME_KEY   = 'christy_theme';
const USER_KEY    = 'christy_user';
const GDRIVE_KEY  = 'christy_gdrive';
const SYNC_KEY    = 'christy_lastsync';

export interface ConflictState {
  list: Note[];
  res: Record<string, 'replace' | 'keepboth' | 'skip'>;
  pending: { incoming: Note[]; incFolders: Folder[] };
}

@Injectable({ providedIn: 'root' })
export class NotesService {

  // ── signals ──────────────────────────────────────────────────────────
  readonly notes    = signal<Note[]>([]);
  readonly folders  = signal<Folder[]>([]);
  readonly selectedId   = signal<string | null>(null);
  readonly activeFolder = signal<string>('all');
  readonly editing  = signal(false);
  readonly editorVariant = signal<EditorVariant>(this.storedEditorVariant());
  readonly showMeta = signal(false);
  readonly query    = signal('');
  readonly tagDraft = signal('');
  readonly toast    = signal<string | null>(null);
  readonly drawerOpen   = signal(false);
  readonly theme    = signal<Theme>(this.storedTheme());
  readonly userName = signal<string>(this.storedUser());
  readonly editingName  = signal(false);
  readonly showStorage  = signal(false);
  readonly showSync     = signal(false);
  readonly googleConnected = signal(this.storedGdrive());
  readonly lastSync    = signal<string>(this.storedLastSync());
  readonly conflicts   = signal<ConflictState | null>(null);
  readonly windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1200);
  readonly mobileView  = signal<'list' | 'search' | 'detail' | 'editor'>('list');

  // ── computed ─────────────────────────────────────────────────────────
  readonly isDesktop = computed(() => this.windowWidth() >= 1024);
  readonly isMobile  = computed(() => !this.isDesktop());

  readonly liveNotes   = computed(() => this.notes().filter(n => !n.deleted));
  readonly deletedNotes = computed(() => this.notes().filter(n => n.deleted));

  readonly selectedNote = computed(() => {
    const id = this.selectedId();
    return id ? this.notes().find(n => n.id === id && !n.deleted) ?? null : null;
  });

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const saved = this.load();
    this.notes.set(saved.notes);
    this.folders.set(saved.folders);

    // Persist on every notes/folders change
    effect(() => {
      const n = this.notes();
      const f = this.folders();
      this.persist(n, f);
    });

    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.windowWidth.set(window.innerWidth);
      });
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────

  genId(): string {
    return Math.random().toString(36).slice(2, 9);
  }

  acc(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FF9933';
  }

  hexToRgb(hex: string): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim());
    return m
      ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`
      : '255,153,51';
  }

  colorPal(color: NoteColor) {
    return COLOR_PALETTE[color] ?? COLOR_PALETTE.none;
  }

  // ── theme ─────────────────────────────────────────────────────────────

  private storedTheme(): Theme {
    try { return (localStorage.getItem(THEME_KEY) as Theme) || 'system'; } catch { return 'system'; }
  }

  private storedUser(): string {
    try { return localStorage.getItem(USER_KEY) || 'Christy'; } catch { return 'Christy'; }
  }

  private storedEditorVariant(): EditorVariant {
    return 'blocks';
  }

  private storedGdrive(): boolean {
    try { return localStorage.getItem(GDRIVE_KEY) === '1'; } catch { return false; }
  }

  private storedLastSync(): string {
    try { return localStorage.getItem(SYNC_KEY) || ''; } catch { return ''; }
  }

  private effectiveTheme(): 'light' | 'dark' {
    const t = this.theme();
    if (t === 'light' || t === 'dark') return t;
    try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch { return 'dark'; }
  }

  applyTheme(): void {
    try {
      document.documentElement.setAttribute('data-theme', this.effectiveTheme());
    } catch { /* SSR guard */ }
  }

  setTheme(t: Theme): void {
    try { localStorage.setItem(THEME_KEY, t); } catch { /**/ }
    this.theme.set(t);
  }

  // ── persistence ────────────────────────────────────────────────────────

  private load(): { notes: Note[]; folders: Folder[] } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.notes) return { notes: d.notes, folders: d.folders || this.seedFolders() };
      }
    } catch { /**/ }
    return this.seed();
  }

  private persist(notes: Note[], folders: Folder[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, folders })); } catch { /**/ }
  }

  // ── note mutations ─────────────────────────────────────────────────────

  setNotes(updater: (ns: Note[]) => Note[]): void {
    this.notes.update(updater);
  }

  patchNote(id: string, patch: Partial<Note>): void {
    this.setNotes(ns =>
      ns.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)
    );
  }

  updateBlocks(id: string, fn: (bs: NoteBlock[]) => NoteBlock[]): void {
    this.setNotes(ns =>
      ns.map(n => n.id !== id ? n : { ...n, blocks: fn(n.blocks), updatedAt: Date.now() })
    );
  }

  updateBlock(id: string, bIdx: number, patch: Partial<NoteBlock>): void {
    this.updateBlocks(id, bs => bs.map((b, i) => i === bIdx ? { ...b, ...patch } : b));
  }

  updateChecklistItem(id: string, bIdx: number, iIdx: number, patch: Partial<{ text: string; done: boolean }>): void {
    this.updateBlocks(id, bs =>
      bs.map((b, i) => i !== bIdx ? b : {
        ...b,
        items: (b.items || []).map((it, j) => j === iIdx ? { ...it, ...patch } : it),
      })
    );
  }

  addChecklistItem(id: string, bIdx: number): void {
    this.updateBlocks(id, bs =>
      bs.map((b, i) => i !== bIdx ? b : {
        ...b,
        items: [...(b.items || []), { id: this.genId(), text: '', done: false }],
      })
    );
  }

  removeChecklistItem(id: string, bIdx: number, iIdx: number): void {
    this.updateBlocks(id, bs =>
      bs.map((b, i) => i !== bIdx ? b : {
        ...b,
        items: (b.items || []).filter((_, j) => j !== iIdx),
      })
    );
  }

  updateTableCell(id: string, bIdx: number, r: number, c: number, val: string): void {
    this.updateBlocks(id, bs =>
      bs.map((b, i) => i !== bIdx ? b : {
        ...b,
        rows: (b.rows || []).map((row, ri) =>
          ri !== r ? row : row.map((cell, ci) => ci === c ? val : cell)
        ),
      })
    );
  }

  defaultBlock(type: string): NoteBlock {
    const id = this.genId();
    switch (type) {
      case 'heading':   return { id, type: 'heading', text: '', level: 2 };
      case 'text':      return { id, type: 'text', text: '' };
      case 'quote':     return { id, type: 'quote', text: '' };
      case 'checklist': return { id, type: 'checklist', items: [{ id: this.genId(), text: '', done: false }] };
      case 'table':     return { id, type: 'table', rows: [['Column', 'Column'], ['', '']] };
      case 'image':     return { id, type: 'image', caption: '' };
      case 'voice':     return { id, type: 'voice', title: 'Voice note', duration: '0:00' };
      case 'webclip':   return { id, type: 'webclip', title: '', url: '' };
      case 'sketch':    return { id, type: 'sketch' };
      case 'divider':   return { id, type: 'divider' };
      default:          return { id, type: 'text', text: '' };
    }
  }

  addBlock(type: string): void {
    const id = this.selectedId();
    if (id) this.updateBlocks(id, bs => [...bs, this.defaultBlock(type)]);
  }

  deleteBlock(id: string, bIdx: number): void {
    this.updateBlocks(id, bs => bs.filter((_, i) => i !== bIdx));
  }

  // ── navigation ─────────────────────────────────────────────────────────

  openNote(id: string): void {
    this.selectedId.set(id);
    this.editing.set(false);
    this.mobileView.set('detail');
    this.drawerOpen.set(false);
  }

  editNote(): void {
    this.editing.set(true);
    this.mobileView.set('editor');
  }

  newNote(): void {
    const f = this.folders().find(x => x.id === this.activeFolder()) ? this.activeFolder() : 'personal';
    const id = this.genId();
    const note: Note = {
      id, title: '', folder: f, color: 'none', tags: [], pinned: false,
      favorite: false, deleted: false, createdAt: Date.now(), updatedAt: Date.now(),
      blocks: [{ id: this.genId(), type: 'text', text: '' }],
    };
    this.setNotes(ns => [note, ...ns]);
    this.selectedId.set(id);
    this.editing.set(true);
    this.showMeta.set(false);
    this.query.set('');
    this.drawerOpen.set(false);
    this.mobileView.set('editor');
  }

  closeEditor(): void {
    const n = this.notes().find(x => x.id === this.selectedId());
    if (n) {
      const empty = !(n.title || '').trim() &&
        (n.blocks || []).filter(b => {
          if (['text', 'heading', 'quote'].includes(b.type)) return (b.text || '').trim();
          return true;
        }).length === 0;
      if (empty) {
        this.setNotes(ns => ns.filter(x => x.id !== n.id));
        this.selectedId.set(null);
        this.editing.set(false);
        this.mobileView.set('list');
        return;
      }
    }
    this.editing.set(false);
    this.mobileView.set('detail');
  }

  backToList(): void {
    this.selectedId.set(null);
    this.mobileView.set('list');
  }

  setFolder(key: string): void {
    this.activeFolder.set(key);
    this.query.set('');
    this.drawerOpen.set(false);
    if (!this.isDesktop()) this.selectedId.set(null);
  }

  // ── note actions ──────────────────────────────────────────────────────

  togglePin(id: string): void {
    const n = this.notes().find(x => x.id === id);
    if (n) this.patchNote(id, { pinned: !n.pinned });
  }

  toggleFav(id: string): void {
    const n = this.notes().find(x => x.id === id);
    if (n) this.patchNote(id, { favorite: !n.favorite });
  }

  cycleFolder(id: string): void {
    const n = this.notes().find(x => x.id === id);
    if (!n) return;
    const ids = this.folders().map(f => f.id);
    const next = ids[(ids.indexOf(n.folder) + 1) % ids.length];
    this.patchNote(id, { folder: next });
  }

  addTag(id: string): void {
    const t = (this.tagDraft() || '').trim().replace(/^#/, '');
    if (!t) return;
    this.setNotes(ns =>
      ns.map(n =>
        n.id === id && !(n.tags || []).includes(t)
          ? { ...n, tags: [...(n.tags || []), t], updatedAt: Date.now() }
          : n
      )
    );
    this.tagDraft.set('');
  }

  removeTag(id: string, i: number): void {
    this.setNotes(ns =>
      ns.map(n => n.id === id ? { ...n, tags: n.tags.filter((_, x) => x !== i), updatedAt: Date.now() } : n)
    );
  }

  deleteNote(id: string): void {
    this.patchNote(id, { deleted: true });
    this.selectedId.set(null);
    this.editing.set(false);
    this.mobileView.set('list');
    this.flash('Moved to trash');
  }

  restoreNote(id: string): void {
    this.patchNote(id, { deleted: false });
    this.flash('Restored');
  }

  purgeNote(id: string): void {
    this.setNotes(ns => ns.filter(x => x.id !== id));
    this.flash('Deleted forever');
  }

  flash(msg: string): void {
    this.toast.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2400);
  }

  // ── identity ───────────────────────────────────────────────────────────

  saveName(): void {
    const v = (this.userName() || '').trim() || 'My';
    try { localStorage.setItem(USER_KEY, v); } catch { /**/ }
    this.userName.set(v);
    this.editingName.set(false);
  }

  // ── storage helpers ────────────────────────────────────────────────────

  storagePath(): string {
    let p = '';
    try { p = (navigator.platform || navigator.userAgent || '').toLowerCase(); } catch { /**/ }
    if (p.includes('mac')) return `~/Library/Application Support/Christy/notes.json`;
    if (p.includes('win')) return `C:\\Users\\${this.userName()}\\AppData\\Roaming\\Christy\\notes.json`;
    return '~/.local/share/christy/notes.json';
  }

  // ── sync / export / import ─────────────────────────────────────────────

  exportNotes(): void {
    try {
      const payload = {
        app: 'Christy', format: 'christy-notes', version: 1,
        exportedAt: new Date().toISOString(),
        userName: this.userName(), folders: this.folders(), notes: this.notes(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `christy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.flash(`Exported ${this.notes().length} notes`);
    } catch { this.flash('Export failed'); }
  }

  triggerImport(): void {
    try {
      const el = document.getElementById('christy-import');
      if (el) el.click();
    } catch { /**/ }
  }

  onImportFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const incoming: Note[] = Array.isArray(data) ? data : (data.notes || []);
        const incFolders: Folder[] = (data?.folders) || [];
        if (!incoming.length) { this.flash('No notes found in that file'); return; }
        const ids = new Set(this.notes().map(n => n.id));
        const conflictList = incoming.filter(n => ids.has(n.id));
        const pending = { incoming, incFolders };
        if (conflictList.length) {
          const res: Record<string, 'replace' | 'keepboth' | 'skip'> = {};
          conflictList.forEach(n => { res[n.id] = 'keepboth'; });
          this.conflicts.set({ list: conflictList, res, pending });
          this.showSync.set(false);
        } else {
          this.applyImport(pending, {});
        }
      } catch { this.flash('Could not read file — invalid format'); }
    };
    reader.readAsText(file);
  }

  applyImport(pending: { incoming: Note[]; incFolders: Folder[] }, res: Record<string, string>): void {
    let added = 0;
    this.notes.update(notes => {
      const list = [...notes];
      const idx = new Map(list.map((n, i) => [n.id, i]));
      pending.incoming.forEach(inc => {
        if (idx.has(inc.id)) {
          const r = res[inc.id] || 'keepboth';
          if (r === 'skip') return;
          if (r === 'replace') { list[idx.get(inc.id)!] = { ...inc }; added++; return; }
          list.unshift({ ...inc, id: this.genId(), title: (inc.title || 'Untitled') + ' (imported)', updatedAt: Date.now() }); added++;
        } else { list.unshift({ ...inc }); added++; }
      });
      return list;
    });
    this.folders.update(folders => {
      const list = [...folders];
      (pending.incFolders || []).forEach(f => { if (!list.find(x => x.id === f.id)) list.push(f); });
      return list;
    });
    this.conflicts.set(null);
    this.showSync.set(false);
    this.flash('Import complete');
  }

  setConflictRes(id: string, val: 'replace' | 'keepboth' | 'skip'): void {
    this.conflicts.update(c => c ? { ...c, res: { ...c.res, [id]: val } } : c);
  }

  setAllConflictRes(val: 'replace' | 'keepboth' | 'skip'): void {
    this.conflicts.update(c => {
      if (!c) return c;
      const res: Record<string, 'replace' | 'keepboth' | 'skip'> = {};
      c.list.forEach(n => { res[n.id] = val; });
      return { ...c, res };
    });
  }

  connectGoogle(): void {
    const next = !this.googleConnected();
    try { localStorage.setItem(GDRIVE_KEY, next ? '1' : '0'); } catch { /**/ }
    this.googleConnected.set(next);
    this.flash(next ? 'Google Drive connected (demo)' : 'Google Drive disconnected');
  }

  syncNow(): void {
    const t = String(Date.now());
    try { localStorage.setItem(SYNC_KEY, t); } catch { /**/ }
    this.lastSync.set(t);
    this.flash('Synced to Google Drive (demo)');
  }

  // ── utility ─────────────────────────────────────────────────────────────

  folderName(id: string): string {
    const f = this.folders().find(x => x.id === id);
    return f ? f.name : 'Personal';
  }

  timeAgo(ts: number): string {
    const d = Date.now() - Number(ts), m = 60000, h = 3600000, day = 86400000;
    if (d < m) return 'now';
    if (d < h) return `${Math.floor(d / m)}m`;
    if (d < day) return `${Math.floor(d / h)}h`;
    if (d < 7 * day) return `${Math.floor(d / day)}d`;
    return new Date(Number(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  noteText(n: Note): string {
    const blockText = (b: NoteBlock): string => {
      if (['text', 'heading', 'quote'].includes(b.type)) return b.text || '';
      if (b.type === 'checklist') return (b.items || []).map(i => i.text).join(' ');
      if (b.type === 'table') return (b.rows || []).flat().join(' ');
      if (b.type === 'webclip') return `${b.title || ''} ${b.url || ''}`;
      if (b.type === 'voice') return b.title || '';
      return '';
    };
    return `${n.title || ''} ${(n.tags || []).join(' ')} ${(n.blocks || []).map(blockText).join(' ')}`;
  }

  waveform(seed: string): { height: number }[] {
    const bars: { height: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const c = seed.charCodeAt(i % seed.length) || 65;
      bars.push({ height: 5 + ((c * 7 + i * 13) % 16) });
    }
    return bars;
  }

  // ── seed data ──────────────────────────────────────────────────────────

  seedFolders(): Folder[] {
    return [
      { id: 'personal', name: 'Personal', color: 'info' },
      { id: 'work',     name: 'Work',     color: 'saffron' },
      { id: 'ideas',    name: 'Ideas',    color: 'warning' },
      { id: 'travel',   name: 'Travel',   color: 'teal' },
      { id: 'health',   name: 'Health',   color: 'success' },
    ];
  }

  seed(): { notes: Note[]; folders: Folder[] } {
    const g = () => this.genId();
    const now = Date.now(), H = 3600000, D = 86400000;
    const ck = (arr: [string, boolean][]): NoteBlock =>
      ({ id: g(), type: 'checklist', items: arr.map(([t, d]) => ({ id: g(), text: t, done: d })) });
    const p  = (text: string): NoteBlock => ({ id: g(), type: 'text', text });
    const h  = (text: string, level = 2): NoteBlock => ({ id: g(), type: 'heading', text, level });
    const q  = (text: string): NoteBlock => ({ id: g(), type: 'quote', text });
    const tbl = (rows: string[][]): NoteBlock => ({ id: g(), type: 'table', rows });
    const img = (caption: string): NoteBlock => ({ id: g(), type: 'image', caption });
    const voice = (title: string, duration: string): NoteBlock => ({ id: g(), type: 'voice', title, duration });
    const web = (title: string, url: string): NoteBlock => ({ id: g(), type: 'webclip', title, url });
    const sketch = (): NoteBlock => ({ id: g(), type: 'sketch' });
    const N = (o: {
      title: string; folder: string; color?: NoteColor; tags?: string[];
      pinned?: boolean; fav?: boolean; ago: number; blocks: NoteBlock[];
    }): Note => ({
      id: g(), title: o.title, folder: o.folder, color: o.color || 'none',
      tags: o.tags || [], pinned: !!o.pinned, favorite: !!o.fav,
      deleted: false, createdAt: now - o.ago, updatedAt: now - o.ago, blocks: o.blocks,
    });

    const notes: Note[] = [
      N({ title: 'Weekend in Goa', folder: 'travel', color: 'teal', tags: ['trip', 'goa'], pinned: true, ago: 2 * H, blocks: [
        p('Long weekend escape — leaving Friday after work, back Monday evening.'),
        ck([['Sunscreen + aloe', true], ['Swimwear', true], ['Power bank', false], ['Beach reads', false], ['Meds kit', false]]),
        web('Stay — Beachfront villa, Anjuna', 'https://airbnb.com/villa-anjuna'),
        img('Sunset point at Vagator'),
      ] }),
      N({ title: 'Q3 product roadmap', folder: 'work', color: 'saffron', tags: ['roadmap', 'planning'], pinned: true, ago: 5 * H, blocks: [
        h('Three bets for the quarter', 1),
        p('Everything else is maintenance. If it is not on this list, it does not ship before October.'),
        tbl([['Initiative', 'Owner', 'Status'], ['Local-first sync', 'Asha', 'On track'], ['Editor v2', 'Ravi', 'At risk'], ['Onboarding', 'Meera', 'Not started']]),
        ck([['Lock scope by Jul 5', true], ['Eng kickoff', false], ['Design review', false]]),
      ] }),
      N({ title: 'App idea: local-first notes', folder: 'ideas', color: 'warning', tags: ['product', 'ideas'], fav: true, ago: 1 * D, blocks: [
        p('What if notes lived on-device first and synced as a nicety, not a requirement?'),
        q('Own your data. The cloud is a cache, not the source of truth.'),
        web('Reference — Local-first software, Ink & Switch', 'https://inkandswitch.com/local-first'),
      ] }),
      N({ title: 'Morning routine', folder: 'health', color: 'success', tags: ['habits'], ago: 1 * D + 3 * H, blocks: [
        ck([['Wake 6:30, no snooze', true], ['Water + stretch', true], ['20 min walk', false], ['Journal 3 lines', false], ['No phone till 8am', false]]),
      ] }),
      N({ title: 'Reading list 2026', folder: 'personal', color: 'info', tags: ['books'], ago: 3 * D, blocks: [
        h('To read', 2),
        ck([['The Overstory', true], ['Annihilation', false], ['Tomb of Sand', false], ['The Mom Test', false], ['Several Short Sentences About Writing', false]]),
      ] }),
      N({ title: 'Design sync — Jun 18', folder: 'work', tags: ['meeting'], ago: 2 * D, blocks: [
        h('Editor variants review', 2),
        p('Walked through three editor directions. Team leans block-based for power users, focus mode for quick capture on mobile.'),
        ck([['Asha to spec block menu', false], ['Ravi to prototype focus mode', true]]),
        voice('Ravi\'s walkthrough recording', '4:12'),
      ] }),
      N({ title: 'Dal tadka', folder: 'personal', color: 'danger', tags: ['recipe', 'food'], ago: 4 * D, blocks: [
        tbl([['Ingredient', 'Qty'], ['Toor dal', '1 cup'], ['Tomato', '2'], ['Garlic', '6 cloves'], ['Cumin + mustard', '1 tsp each']]),
        ck([['Pressure cook dal, 4 whistles', false], ['Make the tadka', false], ['Combine + simmer 5 min', false]]),
        img('Plated with rice + a spoon of ghee'),
      ] }),
      N({ title: 'Grocery run', folder: 'personal', tags: ['shopping'], ago: 6 * H, blocks: [
        ck([['Milk', true], ['Eggs', false], ['Coffee beans', false], ['Spinach', false], ['Curd', true]]),
      ] }),
      N({ title: 'Home office layout', folder: 'ideas', color: 'info', tags: ['design', 'home'], ago: 5 * D, blocks: [
        sketch(),
        p('Desk facing the window, shelf on the left wall, plants on the sill.'),
      ] }),
    ];
    return { notes, folders: this.seedFolders() };
  }
}
