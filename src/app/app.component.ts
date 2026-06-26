import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from './core/services/notes.service';
import { SidebarComponent } from './features/sidebar/sidebar.component';
import { NoteListComponent } from './features/note-list/note-list.component';
import { EditorComponent } from './features/editor/editor.component';
import { ReaderComponent } from './features/reader/reader.component';
import { MobileDrawerComponent } from './features/sidebar/mobile-drawer.component';
import { StorageModalComponent } from './shared/components/storage-modal.component';
import { SyncModalComponent } from './shared/components/sync-modal.component';
import { ConflictModalComponent } from './shared/components/conflict-modal.component';
import { ToastComponent } from './shared/components/toast.component';
import { Note } from './core/models/note.model';
import { TimeAgoPipe } from './shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    SidebarComponent, NoteListComponent, EditorComponent, ReaderComponent,
    MobileDrawerComponent,
    StorageModalComponent, SyncModalComponent, ConflictModalComponent, ToastComponent,
    TimeAgoPipe,
  ],
  template: `
    <!-- ============ DESKTOP ============ -->
    @if (ns.isDesktop()) {
      <div class="desktop-layout">
        <app-sidebar />
        <app-note-list />

        <!-- main pane -->
        <section class="main-pane">
          @if (ns.editing() && ns.selectedNote()) {
            <app-editor />
          } @else if (!ns.editing() && ns.selectedNote()) {
            <app-reader />
          } @else {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="7" width="14" height="16" rx="3" fill="#00BFA5"/>
                <rect x="9" y="3" width="14" height="16" rx="3" fill="var(--accent)"/>
              </svg>
              <div class="empty-title">Select a note to read</div>
              <div class="empty-sub">or press "New note" to start writing</div>
            </div>
          }
        </section>
      </div>
    }

    <!-- ============ MOBILE ============ -->
    @if (ns.isMobile()) {
      <div class="mobile-layout">

        <!-- LIST VIEW -->
        @if (ns.mobileView() === 'list') {
          <header class="mob-header">
            <div class="mob-header-left">
              <button class="mob-menu-btn" aria-label="Menu"
                (click)="ns.drawerOpen.set(true)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <svg width="22" height="22" viewBox="0 0 26 26" fill="none" style="flex:0 0 auto;">
                <rect x="3" y="7" width="14" height="16" rx="3" fill="#00BFA5"/>
                <rect x="9" y="3" width="14" height="16" rx="3" fill="var(--accent)"/>
              </svg>
              <span class="mob-workspace">{{ workspaceName }}</span>
            </div>
            <button class="mob-search-btn"
              (click)="ns.mobileView.set('search'); ns.query.set('')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          </header>

          <!-- category chips -->
          <div class="chips-bar">
            @for (chip of chips; track chip.key) {
              <button class="chip" [class.active]="ns.activeFolder() === chip.key"
                (click)="ns.setFolder(chip.key)">{{ chip.label }}</button>
            }
          </div>

          <!-- note cards -->
          <div class="mob-cards-scroll">
            @if (ns.activeFolder() === 'trash') {
              @for (n of trashNotes; track n.id) {
                <div class="mob-trash-item">
                  <div class="mob-trash-title">{{ n.title || 'Untitled note' }}</div>
                  <div class="mob-trash-meta">{{ ns.folderName(n.folder) }} · {{ n.updatedAt | timeAgo }}</div>
                  <div class="mob-trash-actions">
                    <button class="restore-btn" (click)="ns.restoreNote(n.id)">Restore</button>
                    <button class="purge-btn" (click)="ns.purgeNote(n.id)">Delete</button>
                  </div>
                </div>
              }
              @if (!trashNotes.length) {
                <div class="mob-empty">Trash is empty</div>
              }
            } @else {
              @if (pinnedCards.length) {
                <div class="mob-section-label">Pinned</div>
                @for (n of pinnedCards; track n.id) {
                  <div class="mob-note-card" (click)="ns.openNote(n.id)">
                    <div class="mob-card-title">{{ n.title || 'Untitled note' }}</div>
                    <div class="mob-card-meta">{{ ns.folderName(n.folder) }} · {{ n.updatedAt | timeAgo }}</div>
                  </div>
                }
                <div style="height:4px"></div>
              }
              @for (n of otherCards; track n.id) {
                <div class="mob-note-card" (click)="ns.openNote(n.id)">
                  <div class="mob-card-title">{{ n.title || 'Untitled note' }}</div>
                  <div class="mob-card-meta">{{ ns.folderName(n.folder) }} · {{ n.updatedAt | timeAgo }}</div>
                </div>
              }
              @if (!pinnedCards.length && !otherCards.length) {
                <div class="mob-empty">No notes here yet — tap + to add one</div>
              }
            }
          </div>

          <!-- FAB -->
          <button class="fab" (click)="ns.newNote()">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M12 5v14"/>
            </svg>
          </button>
        }

        <!-- SEARCH VIEW -->
        @if (ns.mobileView() === 'search') {
          <header class="mob-search-header">
            <button class="mob-back-btn"
              (click)="ns.mobileView.set('list'); ns.query.set('')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <input class="mob-search-input"
              [ngModel]="ns.query()"
              (ngModelChange)="ns.query.set($event)"
              autofocus placeholder="Search notes" />
          </header>
          <div class="mob-search-results">
            @for (n of searchResults; track n.id) {
              <div class="mob-note-card" (click)="ns.openNote(n.id)">
                <div class="mob-card-title">{{ n.title || 'Untitled note' }}</div>
                <div class="mob-card-meta">{{ ns.folderName(n.folder) }} · {{ n.updatedAt | timeAgo }}</div>
              </div>
            }
            @if (ns.query().trim() && !searchResults.length) {
              <div class="mob-empty">No notes match "{{ ns.query() }}"</div>
            }
          </div>
        }

        <!-- DETAIL VIEW -->
        @if (ns.mobileView() === 'detail') {
          <app-reader />
        }

        <!-- EDITOR VIEW -->
        @if (ns.mobileView() === 'editor') {
          <app-editor />
        }

        <!-- DRAWER -->
        @if (ns.drawerOpen()) {
          <app-mobile-drawer />
        }
      </div>
    }

    <!-- ============ MODALS ============ -->
    @if (ns.showStorage()) { <app-storage-modal /> }
    @if (ns.showSync())    { <app-sync-modal /> }
    @if (ns.conflicts())   { <app-conflict-modal /> }

    <!-- toast -->
    <app-toast />
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    /* Desktop */
    .desktop-layout { display: flex; height: 100vh; background: var(--bg); overflow: hidden; }
    .main-pane { flex: 1; min-width: 0; background: var(--bg); display: flex; flex-direction: column; overflow: hidden; }
    .empty-state {
      height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 14px; opacity: 0.55;
    }
    .empty-title {
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px;
      color: rgba(var(--ink), 0.6);
    }
    .empty-sub { font-size: 13px; color: rgba(var(--ink), 0.4); }

    /* Mobile */
    .mobile-layout {
      height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden;
      background: var(--bg);
    }
    .mob-header {
      flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 14px 16px 12px; background: rgba(var(--glass), 0.55);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(var(--ink), 0.10);
    }
    .mob-header-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .mob-menu-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      border-radius: 10px; border: none; background: transparent;
      color: rgba(var(--ink), 0.80); cursor: pointer; margin-left: -6px; flex: 0 0 auto;
    }
    .mob-workspace {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px;
      color: rgba(var(--ink), 0.94); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .mob-search-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      border-radius: 10px; border: 0.5px solid rgba(var(--ink), 0.10);
      background: rgba(var(--ink), 0.04); color: rgba(var(--ink), 0.72); cursor: pointer; flex: 0 0 auto;
    }

    .chips-bar {
      flex-shrink: 0; display: flex; gap: 8px; overflow-x: auto; padding: 12px 16px;
      background: rgba(var(--glass), 0.30); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 0.5px solid rgba(var(--ink), 0.06);
    }
    .chip {
      display: inline-flex; align-items: center; white-space: nowrap; padding: 7px 14px;
      border-radius: 999px; border: 0.5px solid rgba(var(--ink), 0.12); background: transparent;
      color: rgba(var(--ink), 0.80); font-size: 13px; font-weight: 500; cursor: pointer; flex: 0 0 auto;
    }
    .chip.active {
      border: none; background: var(--accent); color: #0D0F18; font-weight: 600;
    }

    .mob-cards-scroll {
      flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px 96px;
      display: flex; flex-direction: column; gap: 10px;
    }

    .mob-note-card {
      background: rgba(var(--glass), 0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 12px; padding: 13px 15px; cursor: pointer;
    }
    .mob-note-card:hover { background: rgba(var(--glass), 0.70); }
    .mob-card-title {
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 16px;
      color: rgba(var(--ink), 0.92); margin-bottom: 4px;
    }
    .mob-card-meta { font-size: 12px; color: rgba(var(--ink), 0.45); }

    .mob-section-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.34);
    }
    .mob-empty { text-align: center; color: rgba(var(--ink), 0.34); font-size: 13px; padding: 40px 10px; }

    .mob-trash-item {
      background: rgba(var(--glass), 0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 12px; padding: 13px 15px;
    }
    .mob-trash-title {
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px;
      color: rgba(var(--ink), 0.80); margin-bottom: 4px;
    }
    .mob-trash-meta { font-size: 12px; color: rgba(var(--ink), 0.40); margin-bottom: 10px; }
    .mob-trash-actions { display: flex; gap: 8px; }
    .restore-btn {
      flex: 1; background: rgba(0,191,165,0.14); color: #00BFA5; border: none;
      border-radius: 7px; padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .purge-btn {
      flex: 1; background: transparent; color: #FF5A6A;
      border: 0.5px solid rgba(255,90,106,0.3); border-radius: 7px;
      padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
    }

    .fab {
      position: absolute; bottom: 22px; right: 20px; width: 56px; height: 56px;
      border-radius: 999px; border: none; background: var(--accent); color: #0D0F18;
      box-shadow: 0 10px 28px rgba(0,0,0,0.45); cursor: pointer;
      display: flex; align-items: center; justify-content: center; z-index: 40;
    }
    .fab:active { transform: scale(0.95); }

    .mob-search-header {
      flex-shrink: 0; display: flex; align-items: center; gap: 10px; padding: 14px 16px;
      background: rgba(var(--glass), 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(var(--ink), 0.10);
    }
    .mob-back-btn { background: transparent; border: none; color: rgba(var(--ink), 0.64); cursor: pointer; display: flex; padding: 4px; }
    .mob-search-input {
      flex: 1; background: rgba(var(--ink), 0.05); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 9px; padding: 10px 14px; color: rgba(var(--ink), 0.92); font-size: 15px; outline: none;
    }
    .mob-search-results {
      flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
  `],
})
export class AppComponent {
  ns = inject(NotesService);

  get workspaceName() { return `${this.ns.userName()}'s notes`; }

  get chips() {
    return [
      { key: 'all', label: 'All' },
      { key: 'fav', label: 'Favorites' },
      ...this.ns.folders().map(f => ({ key: f.id, label: f.name })),
      { key: 'trash', label: 'Trash' },
    ];
  }

  private get visible(): Note[] {
    const live = this.ns.liveNotes();
    const af = this.ns.activeFolder();
    let list: Note[];
    if (af === 'fav')   list = live.filter(n => n.favorite);
    else if (af === 'all') list = live;
    else list = live.filter(n => n.folder === af);
    return list.slice().sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt));
  }

  get pinnedCards() { return this.visible.filter(n => n.pinned); }
  get otherCards()  { return this.visible.filter(n => !n.pinned); }
  get trashNotes()  {
    return this.ns.deletedNotes().slice().sort((a, b) => b.updatedAt - a.updatedAt);
  }
  get searchResults(): Note[] {
    const q = this.ns.query().trim().toLowerCase();
    return q
      ? this.ns.liveNotes().filter(n => this.ns.noteText(n).toLowerCase().includes(q))
          .sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  }
}
