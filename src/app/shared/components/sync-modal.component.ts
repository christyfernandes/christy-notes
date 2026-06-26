import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-sync-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="ns.showSync.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-title">Sync &amp; backup</div>
        <div class="modal-sub">Keep a copy in the cloud, or move notes between devices with a file.</div>

        <!-- Google Drive -->
        <div class="drive-row">
          <span class="drive-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 13v8"/><path d="m8 17 4-4 4 4"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
          </span>
          <div class="drive-info">
            <div class="drive-name">Google Drive</div>
            <div class="drive-status">{{ ns.googleConnected() ? 'Connected · demo' : 'Not connected' }}</div>
          </div>
          <button [class]="ns.googleConnected() ? 'disconnect-btn' : 'connect-btn'"
            (click)="ns.connectGoogle()">
            {{ ns.googleConnected() ? 'Disconnect' : 'Connect' }}
          </button>
        </div>

        @if (ns.googleConnected()) {
          <div class="sync-status-row">
            <span class="sync-status-label">{{ lastSyncLabel }}</span>
            <button class="sync-now-btn" (click)="ns.syncNow()">Sync now</button>
          </div>
        }

        <div class="divider"></div>

        <div class="section-title">Local backup file</div>
        <div class="section-desc">
          Export a complete <span class="mono">.json</span> with every note, folder, color and tag — re-import it anywhere and nothing is lost.
        </div>
        <input #fileInput type="file" accept="application/json,.json"
          (change)="handleFile($event)" style="display:none;" />
        <div class="backup-actions">
          <button class="export-btn" (click)="ns.exportNotes()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 21H3"/>
            </svg>
            Export backup
          </button>
          <button class="import-btn" (click)="fileInput.click()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M21 21H3"/>
            </svg>
            Import file
          </button>
        </div>

        <button class="close-btn" (click)="ns.showSync.set(false)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 22px; z-index: 200;
    }
    .modal {
      width: 460px; max-width: 100%; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.12); border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.55); padding: 24px; position: relative;
    }
    .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 19px; color: rgba(var(--ink), 0.94); margin-bottom: 4px; }
    .modal-sub { font-size: 13px; color: rgba(var(--ink), 0.55); margin-bottom: 18px; }

    .drive-row {
      display: flex; align-items: center; gap: 12px; background: var(--bg);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 12px; padding: 14px;
    }
    .drive-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(111,168,255,0.14); color: #6FA8FF;
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
    }
    .drive-info { flex: 1; min-width: 0; }
    .drive-name { font-weight: 600; font-size: 14px; color: rgba(var(--ink), 0.92); }
    .drive-status { font-size: 12px; color: rgba(var(--ink), 0.45); }
    .connect-btn {
      background: #6FA8FF; color: #0D0F18; border: none; border-radius: 8px;
      padding: 8px 14px; font-weight: 600; font-size: 12px; cursor: pointer; flex: 0 0 auto;
    }
    .disconnect-btn {
      background: transparent; color: rgba(var(--ink), 0.7);
      border: 0.5px solid rgba(var(--ink), 0.16); border-radius: 8px;
      padding: 8px 14px; font-weight: 600; font-size: 12px; cursor: pointer; flex: 0 0 auto;
    }
    .sync-status-row { display: flex; align-items: center; gap: 10px; padding: 10px 2px 2px; }
    .sync-status-label { font-size: 12px; color: rgba(var(--ink), 0.5); flex: 1; }
    .sync-now-btn {
      background: rgba(0,191,165,0.14); color: #00BFA5; border: none; border-radius: 8px;
      padding: 7px 14px; font-weight: 600; font-size: 12px; cursor: pointer;
    }

    .divider { height: 0.5px; background: rgba(var(--ink), 0.10); margin: 18px 0; }

    .section-title { font-weight: 600; font-size: 13px; color: rgba(var(--ink), 0.86); margin-bottom: 4px; }
    .section-desc { font-size: 12px; color: rgba(var(--ink), 0.5); line-height: 1.5; margin-bottom: 14px; }
    .mono { font-family: ui-monospace, monospace; }
    .backup-actions { display: flex; gap: 10px; }
    .export-btn {
      flex: 1; background: var(--accent); color: #0D0F18; border: none; border-radius: 9px;
      padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    }
    .import-btn {
      flex: 1; background: transparent; color: rgba(var(--ink), 0.86);
      border: 0.5px solid rgba(var(--ink), 0.16); border-radius: 9px;
      padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    }

    .close-btn {
      position: absolute; top: 16px; right: 16px; background: transparent;
      border: none; color: rgba(var(--ink), 0.4); font-size: 20px; cursor: pointer; line-height: 1;
    }
  `],
})
export class SyncModalComponent {
  ns = inject(NotesService);

  get lastSyncLabel(): string {
    const ls = this.ns.lastSync();
    if (!ls) return 'Not synced yet';
    return 'Last synced ' + this.ns.timeAgo(Number(ls));
  }

  handleFile(e: Event): void {
    this.ns.onImportFile(e);
  }
}
