import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';
import { NoteBlockComponent } from './note-block.component';
import { Note, COLOR_PALETTE, COLOR_KEYS, NoteColor, EditorVariant } from '../../core/models/note.model';

const BLOCK_TYPES = [
  { key: 'heading',   label: 'Heading' },
  { key: 'text',      label: 'Text' },
  { key: 'checklist', label: 'To-do' },
  { key: 'table',     label: 'Table' },
  { key: 'quote',     label: 'Quote' },
  { key: 'image',     label: 'Image' },
  { key: 'voice',     label: 'Voice' },
  { key: 'webclip',   label: 'Web clip' },
  { key: 'sketch',    label: 'Sketch' },
  { key: 'divider',   label: 'Divider' },
];

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteBlockComponent],
  template: `
    @if (note) {
      <div class="editor-wrap">
        <!-- top bar -->
        <div class="top-bar">
          <button class="back-btn" (click)="ns.closeEditor()">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {{ ns.isDesktop() ? 'Close' : 'Notes' }}
          </button>

          <div class="variant-switcher">
            @for (v of variants; track v.key) {
              <button class="variant-btn" [class.active]="ns.editorVariant() === v.key"
                (click)="ns.editorVariant.set(v.key)">{{ v.label }}</button>
            }
          </div>

          <button class="meta-btn" [class.active]="ns.showMeta()"
            title="Note options" (click)="toggleMeta()">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>

          <button class="done-btn" (click)="ns.closeEditor()">Done</button>
        </div>

        <!-- meta panel -->
        @if (ns.showMeta()) {
          <div class="meta-panel">
            <div class="meta-row">
              <span class="meta-label">Folder</span>
              <button class="folder-btn" (click)="ns.cycleFolder(note.id)">
                {{ ns.folderName(note.folder) }}
              </button>
            </div>
            <div class="meta-row">
              <span class="meta-label">Color</span>
              <div class="color-swatches">
                @for (k of colorKeys; track k) {
                  <button class="swatch"
                    [style.background]="k === 'none' ? 'var(--bg)' : palDot(k)"
                    [style.border]="note.color === k ? '2px solid rgba(var(--ink),0.92)' : '0.5px solid rgba(var(--ink),0.25)'"
                    (click)="ns.patchNote(note.id, { color: k })">
                  </button>
                }
              </div>
            </div>
            <div class="meta-row tags-row">
              <span class="meta-label">Tags</span>
              <div class="tags-wrap">
                @for (tag of note.tags; track $index; let i = $index) {
                  <span class="tag-chip">
                    #{{ tag }}
                    <button class="remove-tag" (click)="ns.removeTag(note.id, i)">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                <input class="tag-input"
                  [ngModel]="ns.tagDraft()"
                  (ngModelChange)="ns.tagDraft.set($event)"
                  (keydown.enter)="ns.addTag(note.id)"
                  placeholder="add tag…" />
              </div>
            </div>
            <div class="meta-actions">
              <button class="toggle-btn" [class.active]="note.pinned"
                title="Pin" (click)="ns.togglePin(note.id)">
                <svg width="16" height="16" viewBox="0 0 24 24"
                  [attr.fill]="note.pinned ? 'currentColor' : 'none'"
                  stroke="currentColor" stroke-width="1.5">
                  <path d="M12 17v5"/>
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                </svg>
              </button>
              <button class="toggle-btn" [class.fav-active]="note.favorite"
                title="Favorite" (click)="ns.toggleFav(note.id)">
                <svg width="16" height="16" viewBox="0 0 24 24"
                  [attr.fill]="note.favorite ? 'var(--accent)' : 'none'"
                  stroke="currentColor" stroke-width="1.5">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                </svg>
              </button>
              <button class="delete-btn" title="Delete" (click)="ns.deleteNote(note.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        }

        <!-- body -->
        <div class="editor-body">
          <div [class]="colClass">
            <input class="title-input" [style.font-size]="titleFontSize"
              [value]="note.title"
              (change)="ns.patchNote(note.id, { title: asInput($event).value })"
              placeholder="Untitled note" />

            <!-- block toolbar -->
            <div [class]="toolbarClass">
              @for (t of blockTypes; track t.key) {
                <button class="add-block-btn" [title]="t.label"
                  (click)="ns.addBlock(t.key)">
                  <span class="add-icon" [innerHTML]="blockIcon(t.key)"></span>
                  @if (showLabels) {
                    <span class="add-label">{{ t.label }}</span>
                  }
                </button>
              }
            </div>

            <!-- blocks -->
            <div class="blocks-list">
              @for (block of note.blocks; track block.id; let i = $index) {
                <app-note-block
                  [block]="block"
                  [noteId]="note.id"
                  [blockIndex]="i"
                  [editing]="true" />
              }
              @if (!note.blocks.length) {
                <div class="empty-blocks">Add a block above to start writing.</div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .editor-wrap {
      display: flex; flex-direction: column; flex: 1; min-height: 0;
      background: var(--bg);
    }

    .top-bar {
      flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-bottom: 0.5px solid rgba(var(--ink), 0.08);
      background: var(--header);
    }
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px; background: transparent;
      border: none; color: rgba(var(--ink), 0.64); font-size: 13px; cursor: pointer; padding: 6px 4px;
    }
    .back-btn:hover { color: rgba(var(--ink), 0.92); }

    .variant-switcher {
      display: flex; background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 8px; padding: 2px; margin: 0 auto;
    }
    .variant-btn {
      padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 6px;
      border: none; cursor: pointer; white-space: nowrap;
      background: transparent; color: rgba(var(--ink), 0.55);
    }
    .variant-btn.active { background: rgba(var(--ink), 0.12); color: rgba(var(--ink), 0.92); font-weight: 600; }

    .meta-btn {
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: 0.5px solid rgba(var(--ink), 0.12);
      background: var(--surface); color: rgba(var(--ink), 0.64); cursor: pointer;
    }
    .meta-btn.active { background: var(--surface-2); }

    .done-btn {
      background: var(--accent); color: #0D0F18; border: none; border-radius: 8px;
      padding: 8px 16px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .done-btn:active { transform: scale(0.97); }

    /* meta panel */
    .meta-panel {
      flex: 0 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 16px;
      padding: 12px 18px; border-bottom: 0.5px solid rgba(var(--ink), 0.08);
      background: var(--surface-1);
    }
    .meta-row { display: flex; align-items: center; gap: 8px; }
    .tags-row { flex: 1; min-width: 160px; }
    .meta-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: rgba(var(--ink), 0.38);
    }
    .folder-btn {
      background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.12);
      border-radius: 8px; padding: 5px 12px; color: rgba(var(--ink), 0.86); font-size: 13px; cursor: pointer;
    }
    .color-swatches { display: flex; gap: 6px; }
    .swatch { width: 22px; height: 22px; border-radius: 999px; cursor: pointer; padding: 0; }
    .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .tag-chip {
      display: inline-flex; align-items: center; gap: 5px; font-size: 12px;
      color: rgba(var(--ink), 0.72); background: rgba(var(--ink), 0.06);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 6px; padding: 3px 6px 3px 8px;
    }
    .remove-tag { border: none; background: transparent; color: rgba(var(--ink), 0.40); cursor: pointer; padding: 0; display: flex; }
    .tag-input {
      background: transparent; border: none; outline: none; color: rgba(var(--ink), 0.86); font-size: 12px; width: 80px;
    }
    .meta-actions { display: flex; align-items: center; gap: 6px; }
    .toggle-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: 0.5px solid rgba(var(--ink), 0.12); background: var(--surface);
      color: rgba(var(--ink), 0.55); cursor: pointer;
    }
    .toggle-btn.active { color: var(--accent); }
    .toggle-btn.fav-active { color: var(--accent); }
    .delete-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: 0.5px solid rgba(var(--ink), 0.12); background: var(--surface);
      color: rgba(var(--ink), 0.55); cursor: pointer;
    }
    .delete-btn:hover { color: #FF5A6A; border-color: rgba(255,90,106,0.4); }

    /* body */
    .editor-body { flex: 1; min-height: 0; overflow-y: auto; }

    .col-blocks { max-width: 720px; margin: 0 auto; padding: 22px 22px 90px; }
    .col-markdown { max-width: 680px; margin: 0 auto; padding: 18px 22px 90px; }
    .col-focus { max-width: 600px; margin: 0 auto; padding: 30px 22px 100px; }

    .title-input {
      width: 100%; background: transparent; border: none; outline: none;
      font-family: 'Syne', sans-serif; font-weight: 700;
      color: rgba(var(--ink), 0.94); margin-bottom: 4px;
    }

    .toolbar-blocks {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0 14px;
      border-bottom: 0.5px solid rgba(var(--ink), 0.08); margin-bottom: 10px;
      position: sticky; top: 0; background: var(--bg); z-index: 5;
    }
    .toolbar-markdown {
      display: flex; flex-wrap: wrap; gap: 3px; padding: 7px 9px;
      background: var(--surface-1); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 10px; margin-bottom: 16px; position: sticky; top: 6px; z-index: 5;
    }
    .toolbar-focus {
      display: flex; justify-content: center; flex-wrap: wrap; gap: 4px;
      padding: 6px; margin-bottom: 20px; opacity: 0.75;
    }

    .add-block-btn {
      display: inline-flex; align-items: center; gap: 7px; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 8px; padding: 7px 11px; cursor: pointer;
    }
    .toolbar-markdown .add-block-btn {
      background: transparent; border: none; border-radius: 6px; padding: 7px 9px; gap: 5px;
    }
    .toolbar-focus .add-block-btn {
      background: transparent; border: 0.5px solid transparent; border-radius: 8px; padding: 7px; gap: 5px;
    }
    .add-block-btn:hover { border-color: rgba(var(--accent-rgb), 0.55); background: var(--surface-2); }
    .toolbar-markdown .add-block-btn:hover { background: rgba(var(--ink), 0.07); border-color: transparent; }
    .toolbar-focus .add-block-btn:hover { background: rgba(var(--ink), 0.07); }
    .add-icon { display: flex; align-items: center; color: rgba(var(--ink), 0.62); }
    .add-label { font-size: 12px; color: rgba(var(--ink), 0.72); }

    .blocks-list { display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }
    .empty-blocks {
      text-align: center; color: rgba(var(--ink), 0.34); font-size: 13px; padding: 30px 0;
    }
  `],
})
export class EditorComponent {
  ns = inject(NotesService);
  blockTypes = BLOCK_TYPES;
  colorKeys = COLOR_KEYS;

  variants: { key: EditorVariant; label: string }[] = [
    { key: 'blocks',   label: 'Blocks' },
    { key: 'markdown', label: 'Markdown' },
    { key: 'focus',    label: 'Focus' },
  ];

  get note() { return this.ns.selectedNote(); }

  palDot(k: NoteColor): string { return COLOR_PALETTE[k]?.dot ?? 'transparent'; }

  get showLabels(): boolean { return this.ns.editorVariant() === 'blocks'; }

  get colClass(): string {
    const v = this.ns.editorVariant();
    return v === 'blocks' ? 'col-blocks' : v === 'markdown' ? 'col-markdown' : 'col-focus';
  }

  get toolbarClass(): string {
    const v = this.ns.editorVariant();
    return v === 'blocks' ? 'toolbar-blocks' : v === 'markdown' ? 'toolbar-markdown' : 'toolbar-focus';
  }

  get titleFontSize(): string {
    const v = this.ns.editorVariant();
    return v === 'blocks' ? '30px' : v === 'markdown' ? '26px' : '30px';
  }

  toggleMeta() { this.ns.showMeta.set(!this.ns.showMeta()); }

  asInput(e: Event) { return e.target as HTMLInputElement; }

  blockIcon(key: string): string {
    const icons: Record<string, string> = {
      heading:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 12h12M6 20V4M18 20V4"/></svg>`,
      text:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M17 6.1H3M21 12.1H3M15.1 18H3"/></svg>`,
      checklist: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/></svg>`,
      table:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v18M3 9h18M3 15h18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
      quote:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2-1 3-3 4M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2-1 3-3 4"/></svg>`,
      image:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
      voice:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
      webclip:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
      sketch:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>`,
      divider:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14"/></svg>`,
    };
    return icons[key] ?? '';
  }
}
