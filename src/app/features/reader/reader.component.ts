import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../core/services/notes.service';
import { NoteBlockComponent } from '../editor/note-block.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { COLOR_PALETTE } from '../../core/models/note.model';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, NoteBlockComponent, TimeAgoPipe],
  template: `
    @if (note) {
      <div class="reader-wrap">
        <!-- top bar -->
        <div class="top-bar">
          <button class="back-btn"
            (click)="ns.isMobile() ? ns.backToList() : ns.selectedId.set(null)">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {{ ns.isMobile() ? 'Notes' : 'Back' }}
          </button>
          <div class="spacer"></div>
          <button class="toggle-btn" [class.fav-active]="note.favorite"
            title="Favorite" (click)="ns.toggleFav(note.id)">
            <svg width="17" height="17" viewBox="0 0 24 24"
              [attr.fill]="note.favorite ? 'var(--accent)' : 'none'"
              stroke="currentColor" stroke-width="1.5">
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
            </svg>
          </button>
          <button class="toggle-btn" [class.active]="note.pinned"
            title="Pin" (click)="ns.togglePin(note.id)">
            <svg width="17" height="17" viewBox="0 0 24 24"
              [attr.fill]="note.pinned ? 'currentColor' : 'none'"
              stroke="currentColor" stroke-width="1.5">
              <path d="M12 17v5"/>
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
            </svg>
          </button>
          <button class="edit-btn" (click)="ns.editNote()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            Edit
          </button>
        </div>

        <!-- content -->
        <div class="reader-body">
          <div class="content-col">
            <div class="note-meta">
              <span class="dot" [style.background]="dotColor"></span>
              <span class="meta-folder">{{ ns.folderName(note.folder) }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-time">Edited {{ note.updatedAt | timeAgo }}</span>
            </div>

            <h1 class="note-title">{{ note.title || 'Untitled note' }}</h1>

            @if (note.tags?.length) {
              <div class="tags">
                @for (tag of note.tags; track tag) {
                  <span class="tag">#{{ tag }}</span>
                }
              </div>
            }

            <div class="divider"></div>

            <div class="blocks-list">
              @for (block of note.blocks; track block.id; let i = $index) {
                <app-note-block
                  [block]="block"
                  [noteId]="note.id"
                  [blockIndex]="i"
                  [editing]="false" />
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
    .reader-wrap {
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
    .spacer { flex: 1; }

    .toggle-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: 0.5px solid rgba(var(--ink), 0.12); background: var(--surface);
      color: rgba(var(--ink), 0.55); cursor: pointer;
    }
    .toggle-btn.active { color: var(--accent); }
    .toggle-btn.fav-active { color: var(--accent); }

    .edit-btn {
      display: inline-flex; align-items: center; gap: 6px; background: var(--surface);
      color: rgba(var(--ink), 0.92); border: 0.5px solid rgba(var(--ink), 0.14);
      border-radius: 8px; padding: 7px 14px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .edit-btn:hover { border-color: var(--accent); color: var(--accent); }

    .reader-body { flex: 1; min-height: 0; overflow-y: auto; }
    .content-col { max-width: 680px; margin: 0 auto; padding: 28px 22px 80px; }

    .note-meta {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
    }
    .dot { width: 7px; height: 7px; border-radius: 999px; flex: 0 0 auto; }
    .meta-folder {
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: rgba(var(--ink), 0.38);
    }
    .meta-sep { color: rgba(var(--ink), 0.20); }
    .meta-time { font-size: 11px; color: rgba(var(--ink), 0.38); }

    .note-title {
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 30px;
      line-height: 1.2; color: rgba(var(--ink), 0.94); margin: 0 0 14px;
    }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
    .tag {
      font-size: 12px; font-weight: 500; color: rgba(var(--ink), 0.64);
      background: rgba(var(--ink), 0.06); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 6px; padding: 3px 9px;
    }

    .divider { height: 0.5px; background: rgba(var(--ink), 0.10); margin-bottom: 22px; }

    .blocks-list { display: flex; flex-direction: column; gap: 18px; }
  `],
})
export class ReaderComponent {
  ns = inject(NotesService);

  get note() { return this.ns.selectedNote(); }

  get dotColor(): string {
    const c = this.note?.color ?? 'none';
    return COLOR_PALETTE[c]?.dot ?? 'rgba(var(--ink),0.30)';
  }
}
