import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';
import { NoteCardComponent } from './note-card.component';
import { Note } from '../../core/models/note.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteCardComponent, TimeAgoPipe],
  template: `
    <section class="note-list">
      <!-- search bar -->
      <div class="search-header">
        <div class="search-wrap">
          <span class="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </span>
          <input
            class="search-input"
            [ngModel]="ns.query()"
            (ngModelChange)="ns.query.set($event)"
            placeholder="Search notes"
          />
        </div>
        <div class="list-title-row">
          <span class="list-title">{{ listTitle }}</span>
          <span class="list-count">{{ visCount }} {{ visCount === 1 ? 'note' : 'notes' }}</span>
        </div>
      </div>

      <!-- cards area -->
      <div class="cards-scroll">
        <!-- search results -->
        @if (showResults) {
          @for (note of resultCards; track note.id) {
            <app-note-card [note]="note" />
          }
          @if (!resultCards.length) {
            <div class="empty-msg">No notes match "{{ ns.query() }}"</div>
          }
        }

        <!-- trash view -->
        @if (showTrash) {
          @for (n of trashNotes; track n.id) {
            <div class="trash-item">
              <div class="trash-title">{{ n.title || 'Untitled note' }}</div>
              <div class="trash-meta">{{ ns.folderName(n.folder) }} · {{ n.updatedAt | timeAgo }}</div>
              <div class="trash-actions">
                <button class="restore-btn" (click)="ns.restoreNote(n.id)">Restore</button>
                <button class="purge-btn" (click)="ns.purgeNote(n.id)">Delete</button>
              </div>
            </div>
          }
          @if (!trashNotes.length) {
            <div class="empty-msg">Trash is empty</div>
          }
        }

        <!-- normal view -->
        @if (showNormal) {
          @if (pinnedCards.length) {
            <div class="section-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
              </svg>Pinned
            </div>
            @for (note of pinnedCards; track note.id) {
              <app-note-card [note]="note" />
            }
            <div style="height:4px"></div>
          }
          @for (note of otherCards; track note.id) {
            <app-note-card [note]="note" />
          }
          @if (!pinnedCards.length && !otherCards.length) {
            <div class="empty-msg">No notes here yet</div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      flex: 0 0 366px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .note-list {
      flex: 1;
      background: var(--bg);
      border-right: 0.5px solid rgba(var(--ink), 0.08);
      display: flex; flex-direction: column;
      min-height: 0;
    }

    .search-header {
      flex: 0 0 auto; padding: 16px 16px 12px;
      border-bottom: 0.5px solid rgba(var(--ink), 0.06);
    }
    .search-wrap { position: relative; }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: rgba(var(--ink), 0.38); display: flex;
    }
    .search-input {
      width: 100%; background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 9px; padding: 9px 12px 9px 34px; color: rgba(var(--ink), 0.92);
      font-size: 14px; outline: none;
    }
    .list-title-row {
      display: flex; align-items: baseline; justify-content: space-between; margin-top: 13px;
    }
    .list-title {
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px;
      color: rgba(var(--ink), 0.92);
    }
    .list-count { font-size: 12px; color: rgba(var(--ink), 0.38); }

    .cards-scroll {
      flex: 1; min-height: 0; overflow-y: auto;
      padding: 14px 16px 24px; display: flex; flex-direction: column; gap: 10px;
    }

    .section-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.34); display: flex; align-items: center; gap: 5px;
    }

    .empty-msg { text-align: center; color: rgba(var(--ink), 0.34); font-size: 13px; padding: 40px 10px; }

    .trash-item {
      background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.08);
      border-radius: 12px; padding: 13px 15px;
    }
    .trash-title {
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px;
      color: rgba(var(--ink), 0.80); margin-bottom: 4px;
    }
    .trash-meta { font-size: 12px; color: rgba(var(--ink), 0.40); margin-bottom: 10px; }
    .trash-actions { display: flex; gap: 8px; }
    .restore-btn {
      flex: 1; background: rgba(0,191,165,0.12); color: #00BFA5; border: none;
      border-radius: 7px; padding: 7px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .purge-btn {
      flex: 1; background: transparent; color: #FF5A6A;
      border: 0.5px solid rgba(255,90,106,0.3); border-radius: 7px;
      padding: 7px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
  `],
})
export class NoteListComponent {
  ns = inject(NotesService);

  private sorted(notes: Note[]) {
    return notes.slice().sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt));
  }

  get visible(): Note[] {
    const live = this.ns.liveNotes();
    const af = this.ns.activeFolder();
    if (af === 'fav')   return this.sorted(live.filter(n => n.favorite));
    if (af === 'all')   return this.sorted(live);
    if (af === 'trash') return [];
    return this.sorted(live.filter(n => n.folder === af));
  }

  get pinnedCards()  { return this.visible.filter(n => n.pinned); }
  get otherCards()   { return this.visible.filter(n => !n.pinned); }
  get resultCards(): Note[] {
    const q = this.ns.query().trim().toLowerCase();
    return q
      ? this.ns.liveNotes().filter(n => this.ns.noteText(n).toLowerCase().includes(q))
          .sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  }
  get trashNotes()  { return this.ns.deletedNotes().slice().sort((a, b) => b.updatedAt - a.updatedAt); }

  get showResults() { return !!this.ns.query().trim(); }
  get showTrash()   { return !this.showResults && this.ns.activeFolder() === 'trash'; }
  get showNormal()  { return !this.showResults && this.ns.activeFolder() !== 'trash'; }

  get listTitle(): string {
    const q = this.ns.query().trim();
    if (q) return 'Search';
    const map: Record<string, string> = { all: 'All notes', fav: 'Favorites', trash: 'Trash' };
    return map[this.ns.activeFolder()] || this.ns.folderName(this.ns.activeFolder());
  }
  get visCount(): number {
    if (this.showResults) return this.resultCards.length;
    if (this.showTrash)   return this.trashNotes.length;
    return this.visible.length;
  }
}
