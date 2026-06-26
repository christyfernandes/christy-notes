import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note, COLOR_PALETTE } from '../../core/models/note.model';
import { NotesService } from '../../core/services/notes.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <div
      class="note-card"
      [class.selected]="isSelected"
      [style.border-left-color]="borderColor"
      (click)="ns.openNote(note.id)"
      role="button"
      tabindex="0"
      (keydown.enter)="ns.openNote(note.id)"
    >
      <!-- header row -->
      <div class="card-header">
        <div class="folder-row">
          <span class="dot" [style.background]="dotColor"></span>
          <span class="folder-label">{{ ns.folderName(note.folder) }}</span>
        </div>
        <button class="pin-btn" [class.pinned]="note.pinned"
          title="Pin" (click)="onPin($event)">
          <svg width="14" height="14" viewBox="0 0 24 24"
            [attr.fill]="note.pinned ? 'currentColor' : 'none'"
            stroke="currentColor" stroke-width="1.5">
            <path d="M12 17v5"/>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
          </svg>
        </button>
      </div>

      <!-- title -->
      <div class="card-title">{{ note.title || 'Untitled note' }}</div>

      <!-- snippet -->
      @if (snippet) {
        <div class="card-snippet">{{ snippet }}</div>
      }

      <!-- checklist progress -->
      @if (checklistTotal > 0) {
        <div class="checklist-bar">
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="checklistPct"></div>
          </div>
          <span class="check-label">{{ checklistDone }}/{{ checklistTotal }}</span>
        </div>
      }

      <!-- image placeholder -->
      @if (hasImage) {
        <div class="image-placeholder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="rgba(var(--ink),0.30)" stroke-width="1.5">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
      }

      <!-- tags -->
      @if (note.tags?.length) {
        <div class="tags">
          @for (tag of note.tags; track tag) {
            <span class="tag">#{{ tag }}</span>
          }
        </div>
      }

      <!-- footer -->
      <div class="card-footer">
        <div class="type-icons">
          @if (hasChecklist) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          }
          @if (hasImage) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          }
          @if (hasVoice) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          }
          @if (hasTable) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 3v18M3 9h18M3 15h18"/><rect width="18" height="18" x="3" y="3" rx="2"/>
            </svg>
          }
          @if (hasLink) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          }
          @if (hasSketch) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          }
        </div>
        <div class="spacer"></div>
        <span class="updated-label">{{ note.updatedAt | timeAgo }}</span>
        @if (note.favorite) {
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5">
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
          </svg>
        }
      </div>
    </div>
  `,
  styles: [`
    .note-card {
      background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.08);
      border-left: 3px solid rgba(var(--ink), 0.14);
      border-radius: 12px;
      padding: 13px 15px;
      cursor: pointer;
      transition: background 150ms, border-color 150ms;
      text-align: left;
      width: 100%;
      display: block;
      color: inherit;
    }
    .note-card:hover { background: var(--surface-2); }
    .note-card.selected { background: var(--surface-2); border-color: rgba(var(--ink), 0.18); }

    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; margin-bottom: 8px;
    }
    .folder-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .dot { width: 7px; height: 7px; border-radius: 999px; flex: 0 0 auto; display: inline-block; }
    .folder-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: rgba(var(--ink), 0.38); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .pin-btn {
      width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; border: none; background: transparent;
      color: rgba(var(--ink), 0.30); cursor: pointer; flex: 0 0 auto;
    }
    .pin-btn.pinned { color: var(--accent); }
    .pin-btn:hover { color: var(--accent); }

    .card-title {
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 16px;
      line-height: 1.25; color: rgba(var(--ink), 0.92); margin-bottom: 6px; word-break: break-word;
    }
    .card-snippet {
      font-size: 13px; line-height: 1.5; color: rgba(var(--ink), 0.55);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
      overflow: hidden; margin-bottom: 10px;
    }

    .checklist-bar {
      display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    }
    .bar-track {
      flex: 1; height: 4px; border-radius: 999px;
      background: rgba(var(--ink), 0.10); overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 999px; background: var(--accent); }
    .check-label {
      font-size: 11px; font-weight: 600; color: rgba(var(--ink), 0.55); white-space: nowrap;
    }

    .image-placeholder {
      height: 58px; border-radius: 8px; background: rgba(var(--ink), 0.04);
      border: 0.5px solid rgba(var(--ink), 0.08);
      display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
    }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .tag {
      font-size: 11px; font-weight: 500; color: rgba(var(--ink), 0.64);
      background: rgba(var(--ink), 0.06); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 4px; padding: 2px 7px;
    }

    .card-footer { display: flex; align-items: center; gap: 10px; }
    .type-icons { display: flex; align-items: center; gap: 7px; color: rgba(var(--ink), 0.34); }
    .spacer { flex: 1; }
    .updated-label {
      font-size: 11px; font-weight: 500; color: rgba(var(--ink), 0.34); white-space: nowrap;
    }
  `],
})
export class NoteCardComponent {
  @Input({ required: true }) note!: Note;
  ns = inject(NotesService);

  get isSelected() { return this.ns.selectedId() === this.note.id; }

  get pal() { return COLOR_PALETTE[this.note.color] ?? COLOR_PALETTE.none; }
  get dotColor() { return this.pal.dot; }
  get borderColor() { return this.pal.strip === 'transparent' ? 'rgba(var(--ink),0.14)' : this.pal.strip; }

  get snippet(): string {
    const b = (this.note.blocks || []).find(b =>
      ['text', 'heading', 'quote'].includes(b.type) && (b.text || '').trim()
    );
    return b?.text || '';
  }

  get checklistTotal(): number {
    const cl = this.note.blocks?.find(b => b.type === 'checklist');
    return cl?.items?.length ?? 0;
  }
  get checklistDone(): number {
    const cl = this.note.blocks?.find(b => b.type === 'checklist');
    return cl?.items?.filter(i => i.done).length ?? 0;
  }
  get checklistPct(): number {
    return this.checklistTotal ? Math.round(this.checklistDone / this.checklistTotal * 100) : 0;
  }

  get hasChecklist() { return this.note.blocks?.some(b => b.type === 'checklist') ?? false; }
  get hasImage()     { return this.note.blocks?.some(b => b.type === 'image') ?? false; }
  get hasVoice()     { return this.note.blocks?.some(b => b.type === 'voice') ?? false; }
  get hasTable()     { return this.note.blocks?.some(b => b.type === 'table') ?? false; }
  get hasLink()      { return this.note.blocks?.some(b => b.type === 'webclip') ?? false; }
  get hasSketch()    { return this.note.blocks?.some(b => b.type === 'sketch') ?? false; }

  onPin(e: Event) {
    e.stopPropagation();
    this.ns.togglePin(this.note.id);
  }
}
