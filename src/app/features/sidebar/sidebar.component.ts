import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';
import { COLOR_PALETTE } from '../../core/models/note.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="sidebar">
      <!-- brand / workspace name -->
      <div class="brand">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style="flex:0 0 auto; margin-top:1px;">
          <rect x="3" y="7" width="14" height="16" rx="3" fill="#00BFA5"/>
          <rect x="9" y="3" width="14" height="16" rx="3" fill="var(--accent)"/>
        </svg>
        <div class="brand-text">
          @if (ns.editingName()) {
            <input class="name-input"
              [ngModel]="ns.userName()"
              (ngModelChange)="ns.userName.set($event)"
              (blur)="ns.saveName()"
              (keydown.enter)="ns.saveName()"
              autofocus />
          } @else {
            <button class="name-btn" title="Rename workspace" (click)="ns.editingName.set(true)">
              <span class="workspace-name">{{ workspaceName }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="rgba(var(--ink),0.40)" stroke-width="1.8">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
          }
          <div class="brand-sub">Christy · local-first</div>
        </div>
      </div>

      <!-- new note -->
      <button class="new-note-btn" (click)="ns.newNote()">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5v14"/>
        </svg>New note
      </button>

      <!-- nav list -->
      <div class="nav-list">
        <button class="nav-item" [class.active]="ns.activeFolder() === 'all'"
          (click)="ns.setFolder('all')">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </span>
          <span class="nav-label">All notes</span>
          <span class="nav-count">{{ liveCount }}</span>
        </button>
        <button class="nav-item" [class.active]="ns.activeFolder() === 'fav'"
          (click)="ns.setFolder('fav')">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
            </svg>
          </span>
          <span class="nav-label">Favorites</span>
          <span class="nav-count">{{ favCount }}</span>
        </button>

        <div class="folders-label">Folders</div>
        @for (f of ns.folders(); track f.id) {
          <button class="nav-item" [class.active]="ns.activeFolder() === f.id"
            (click)="ns.setFolder(f.id)">
            <span class="nav-icon" [style.color]="dotColor(f.color)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <circle cx="12" cy="12" r="6"/>
              </svg>
            </span>
            <span class="nav-label">{{ f.name }}</span>
            <span class="nav-count">{{ folderCount(f.id) }}</span>
          </button>
        }
      </div>

      <!-- footer nav -->
      <div class="footer-nav">
        <button class="nav-item" [class.active]="ns.activeFolder() === 'trash'"
          (click)="ns.setFolder('trash')">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </span>
          <span class="nav-label">Trash</span>
          <span class="nav-count">{{ trashCount }}</span>
        </button>

        <button class="nav-item" (click)="ns.showStorage.set(true)">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <line x1="22" x2="2" y1="12" y2="12"/>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              <line x1="6" x2="6.01" y1="16" y2="16"/>
            </svg>
          </span>
          <span class="nav-label">Storage location</span>
        </button>

        <button class="nav-item" (click)="ns.showSync.set(true)">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 13v8"/><path d="m8 17 4-4 4 4"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
          </span>
          <span class="nav-label">Sync &amp; backup</span>
          @if (ns.googleConnected()) {
            <span class="sync-dot"></span>
          }
        </button>

        <!-- theme switcher -->
        <div class="theme-row">
          <span class="theme-label">Theme</span>
          <div class="theme-switcher">
            @for (opt of themeOptions; track opt.key) {
              <button class="theme-btn" [class.active]="ns.theme() === opt.key"
                (click)="ns.setTheme(opt.key)">{{ opt.label }}</button>
            }
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      flex: 0 0 252px; background: var(--header);
      border-right: 0.5px solid rgba(var(--ink), 0.08);
      display: flex; flex-direction: column; padding: 18px 14px;
      height: 100%; overflow: hidden;
    }

    .brand {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 4px 6px 16px;
    }
    .brand-text { min-width: 0; flex: 1; }
    .name-input {
      width: 100%; background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.18);
      border-radius: 7px; padding: 5px 8px; color: rgba(var(--ink), 0.92);
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; outline: none;
    }
    .name-btn {
      display: flex; align-items: center; gap: 6px; background: transparent;
      border: none; padding: 0; cursor: pointer; color: inherit; text-align: left;
    }
    .workspace-name {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px;
      letter-spacing: 0.01em; color: rgba(var(--ink), 0.94); line-height: 1.15;
    }
    .brand-sub {
      font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.34); margin-top: 4px;
    }

    .new-note-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--accent); color: #0D0F18; border: none; border-radius: 10px;
      padding: 11px; font-weight: 600; font-size: 14px; cursor: pointer; margin-bottom: 14px;
    }
    .new-note-btn:active { transform: scale(0.98); }

    .nav-list {
      flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
    }

    .folders-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.30); padding: 14px 10px 6px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px;
      border-radius: 8px; border: none; cursor: pointer; text-align: left;
      font-size: 13px; font-weight: 500;
      background: transparent; color: rgba(var(--ink), 0.72);
    }
    .nav-item:hover { background: rgba(var(--ink), 0.06); }
    .nav-item.active {
      background: color-mix(in srgb, var(--accent) 13%, transparent);
      color: var(--accent); font-weight: 600;
    }
    .nav-icon { display: flex; align-items: center; flex: 0 0 auto; }
    .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nav-count { font-size: 12px; opacity: 0.6; font-variant-numeric: tabular-nums; }
    .sync-dot { width: 7px; height: 7px; border-radius: 999px; background: #3DDC97; }

    .footer-nav {
      display: flex; flex-direction: column; gap: 3px;
      padding-top: 10px; margin-top: 6px;
      border-top: 0.5px solid rgba(var(--ink), 0.08);
    }

    .theme-row {
      display: flex; align-items: center; gap: 8px; padding: 10px 8px 2px;
    }
    .theme-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.34);
    }
    .theme-switcher {
      display: flex; margin-left: auto; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 8px; padding: 2px;
    }
    .theme-btn {
      padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 6px;
      border: none; cursor: pointer; white-space: nowrap;
      background: transparent; color: rgba(var(--ink), 0.55);
    }
    .theme-btn.active { background: rgba(var(--ink), 0.12); color: rgba(var(--ink), 0.92); font-weight: 600; }
  `],
})
export class SidebarComponent {
  ns = inject(NotesService);

  themeOptions = [
    { key: 'system' as const, label: 'Auto' },
    { key: 'light'  as const, label: 'Light' },
    { key: 'dark'   as const, label: 'Dark' },
  ];

  get workspaceName() { return `${this.ns.userName()}’s notes`; }

  get liveCount()  { return this.ns.liveNotes().length; }
  get favCount()   { return this.ns.liveNotes().filter(n => n.favorite).length; }
  get trashCount() { return this.ns.deletedNotes().length; }

  folderCount(id: string) { return this.ns.liveNotes().filter(n => n.folder === id).length; }

  dotColor(color: string): string {
    return (COLOR_PALETTE as Record<string, { dot: string }>)[color]?.dot ?? 'rgba(var(--ink),0.30)';
  }
}
