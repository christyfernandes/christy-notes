import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';
import { COLOR_PALETTE } from '../../core/models/note.model';

@Component({
  selector: 'app-mobile-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- backdrop -->
    <div class="backdrop" (click)="ns.drawerOpen.set(false)"></div>

    <!-- drawer panel -->
    <aside class="drawer">
      <div class="drawer-header">
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none" style="flex:0 0 auto;">
            <rect x="3" y="7" width="14" height="16" rx="3" fill="#00BFA5"/>
            <rect x="9" y="3" width="14" height="16" rx="3" fill="var(--accent)"/>
          </svg>
          <div class="brand-info">
            <div class="workspace-name">{{ workspaceName }}</div>
            <div class="brand-sub">Christy · local-first</div>
          </div>
        </div>
        <button class="close-btn" aria-label="Close menu" (click)="ns.drawerOpen.set(false)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <button class="rename-btn" (click)="onRename()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
        Rename workspace
      </button>

      <button class="new-note-btn" (click)="ns.newNote()">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5v14"/>
        </svg>New note
      </button>

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
        <button class="nav-item" (click)="openStorage()">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <line x1="22" x2="2" y1="12" y2="12"/>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              <line x1="6" x2="6.01" y1="16" y2="16"/>
            </svg>
          </span>
          <span class="nav-label">Storage location</span>
        </button>
        <button class="nav-item" (click)="openSync()">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 13v8"/><path d="m8 17 4-4 4 4"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
          </span>
          <span class="nav-label">Sync &amp; backup</span>
          @if (ns.googleConnected()) { <span class="sync-dot"></span> }
        </button>

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
    .backdrop {
      position: absolute; inset: 0; background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); z-index: 60;
    }
    .drawer {
      position: absolute; top: 0; left: 0; bottom: 0; width: 286px; z-index: 70;
      padding: 18px 14px; display: flex; flex-direction: column;
      background: rgba(var(--glass), 0.86); backdrop-filter: blur(26px); -webkit-backdrop-filter: blur(26px);
      border-right: 0.5px solid rgba(var(--ink), 0.12); box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 16px;
    }
    .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .brand-info { min-width: 0; }
    .workspace-name {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px;
      color: rgba(var(--ink), 0.94); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .brand-sub {
      font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(var(--ink), 0.34);
    }
    .close-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; color: rgba(var(--ink), 0.55); cursor: pointer; flex: 0 0 auto;
    }

    .rename-btn {
      display: flex; align-items: center; gap: 7px; background: transparent; border: none;
      color: rgba(var(--ink), 0.55); font-size: 12px; cursor: pointer; padding: 0 4px 12px;
    }

    .new-note-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--accent); color: #0D0F18; border: none; border-radius: 10px;
      padding: 11px; font-weight: 600; font-size: 14px; cursor: pointer; margin-bottom: 14px;
    }

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
    .nav-count { font-size: 12px; opacity: 0.6; }
    .sync-dot { width: 7px; height: 7px; border-radius: 999px; background: #3DDC97; }

    .footer-nav {
      display: flex; flex-direction: column; gap: 3px;
      padding-top: 10px; margin-top: 6px;
      border-top: 0.5px solid rgba(var(--ink), 0.08);
    }
    .theme-row { display: flex; align-items: center; gap: 8px; padding: 10px 8px 2px; }
    .theme-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: rgba(var(--ink), 0.34);
    }
    .theme-switcher {
      display: flex; margin-left: auto; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 8px; padding: 2px;
    }
    .theme-btn {
      padding: 5px 10px; font-size: 12px; font-weight: 500; border-radius: 6px;
      border: none; cursor: pointer; background: transparent; color: rgba(var(--ink), 0.55);
    }
    .theme-btn.active { background: rgba(var(--ink), 0.12); color: rgba(var(--ink), 0.92); font-weight: 600; }
  `],
})
export class MobileDrawerComponent {
  ns = inject(NotesService);

  themeOptions = [
    { key: 'system' as const, label: 'Auto' },
    { key: 'light'  as const, label: 'Light' },
    { key: 'dark'   as const, label: 'Dark' },
  ];

  get workspaceName() { return `${this.ns.userName()}'s notes`; }
  get liveCount()  { return this.ns.liveNotes().length; }
  get favCount()   { return this.ns.liveNotes().filter(n => n.favorite).length; }
  get trashCount() { return this.ns.deletedNotes().length; }

  folderCount(id: string) { return this.ns.liveNotes().filter(n => n.folder === id).length; }

  dotColor(color: string): string {
    return (COLOR_PALETTE as Record<string, { dot: string }>)[color]?.dot ?? 'rgba(var(--ink),0.30)';
  }

  onRename() {
    this.ns.drawerOpen.set(false);
    this.ns.editingName.set(true);
  }

  openStorage() { this.ns.drawerOpen.set(false); this.ns.showStorage.set(true); }
  openSync()    { this.ns.drawerOpen.set(false); this.ns.showSync.set(true); }
}
