import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-sync-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="ns.showSync.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <span class="modal-title">Sync &amp; backup</span>
          <button class="close-btn" (click)="ns.showSync.set(false)">×</button>
        </div>

        <!-- ── GOOGLE DRIVE SECTION ── -->
        @if (ns.googleConnected()) {

          <!-- Connected state -->
          <div class="account-card">
            <div class="account-avatar">{{ initial }}</div>
            <div class="account-info">
              <div class="account-email">{{ ns.gDriveEmail() }}</div>
              <div class="account-status">
                @if (ns.syncInProgress()) {
                  <span class="dot dot-spin"></span> Syncing…
                } @else if (ns.lastSync()) {
                  <span class="dot dot-ok"></span> Backed up · {{ lastSyncLabel }}
                } @else {
                  <span class="dot dot-warn"></span> Not backed up yet
                }
              </div>
            </div>
          </div>

          <button class="backup-now-btn" (click)="ns.syncNowManual()" [disabled]="ns.syncInProgress()">
            @if (ns.syncInProgress()) {
              <span class="spinner"></span> Backing up…
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Back up now
            }
          </button>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Notes backed up</span>
              <span class="info-val">{{ ns.liveNotes().length }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Backup size</span>
              <span class="info-val">{{ ns.getStorageInfo().sizeKb }} KB</span>
            </div>
            <div class="info-row">
              <span class="info-label">Storage location</span>
              <span class="info-val info-val-sm">Drive · App Data folder</span>
            </div>
          </div>

          <div class="auto-row">
            <div class="auto-text">
              <div class="auto-label">Auto backup</div>
              <div class="auto-sub">Runs silently when you open the app, if 8+ hours have passed</div>
            </div>
            <button class="toggle-pill" [class.on]="ns.autoSync()" (click)="ns.toggleAutoSync()">
              <span class="toggle-knob"></span>
            </button>
          </div>

          <div class="sub-actions">
            <button class="restore-link" (click)="showRestore = !showRestore">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Restore from Drive backup
            </button>
            <button class="disconnect-link" (click)="ns.disconnectDrive()">Disconnect</button>
          </div>

          @if (showRestore) {
            <div class="restore-confirm">
              <div class="restore-warn">
                ⚠ This replaces all local notes with your Drive backup. Cannot be undone.
              </div>
              <div class="restore-btns">
                <button class="restore-cancel" (click)="showRestore = false">Cancel</button>
                <button class="restore-go" (click)="confirmRestore()">Yes, restore</button>
              </div>
            </div>
          }

        } @else {

          <!-- Not connected state -->
          <div class="hero">
            <div class="hero-icon">
              <svg viewBox="0 0 87.3 78" width="36" height="36">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div class="hero-title">Back up to Google Drive</div>
            <div class="hero-sub">Automatically save your notes to Google Drive. Restore them any time, even on a new device.</div>
          </div>

          @if (ns.clientId()) {
            <button class="connect-btn" (click)="ns.connectGoogleDrive()">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
            <button class="change-id-btn" (click)="showIdSetup = !showIdSetup">Change Client ID</button>
          } @else {
            <div class="setup-section">
              <div class="setup-title">One-time setup</div>
              <div class="setup-desc">
                Google Drive sync needs an OAuth Client ID from your
                <a class="setup-link" href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.
                <br><br>
                Steps: Create project → Enable Drive API → Create OAuth 2.0 Client ID (Web) →
                Add <code class="setup-code">{{ origin }}</code> to Authorized JavaScript origins.
              </div>
              <input class="client-id-input" [(ngModel)]="clientIdDraft"
                placeholder="1234567890-xxx.apps.googleusercontent.com"
                (keydown.enter)="saveClientId()" />
              <button class="save-id-btn" [disabled]="!clientIdDraft.trim()" (click)="saveClientId()">
                Save &amp; Connect
              </button>
            </div>
          }

          @if (showIdSetup && ns.clientId()) {
            <div class="setup-section setup-section-inline">
              <input class="client-id-input" [(ngModel)]="clientIdDraft"
                [placeholder]="ns.clientId()"
                (keydown.enter)="saveClientId()" />
              <button class="save-id-btn" [disabled]="!clientIdDraft.trim()" (click)="saveClientId()">Update</button>
            </div>
          }
        }

        <!-- ── LOCAL BACKUP ── -->
        <div class="divider"></div>
        <div class="local-section">
          <div class="local-title">Local backup file</div>
          <div class="local-desc">Export a complete <code>.json</code> — re-import it anywhere and nothing is lost.</div>
          <input #fileInput type="file" accept="application/json,.json" (change)="handleFile($event)" style="display:none;" />
          <div class="local-actions">
            <button class="export-btn" (click)="ns.exportNotes()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 21H3"/>
              </svg>
              Export
            </button>
            <button class="import-btn" (click)="fileInput.click()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M21 21H3"/>
              </svg>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 200;
    }
    .modal {
      width: 460px; max-width: 100%; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.12); border-radius: 18px;
      box-shadow: 0 28px 70px rgba(0,0,0,0.60); padding: 22px 24px 24px;
      position: relative; max-height: 90vh; overflow-y: auto;
    }
    .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: rgba(var(--ink), 0.94); }
    .close-btn { background: transparent; border: none; color: rgba(var(--ink), 0.38); font-size: 20px; cursor: pointer; line-height: 1; padding: 2px 4px; }

    /* ── Connected ── */
    .account-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--bg); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 12px; padding: 13px 14px; margin-bottom: 12px;
    }
    .account-avatar {
      width: 40px; height: 40px; border-radius: 999px;
      background: linear-gradient(135deg, #4285F4, #34A853);
      color: #fff; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px;
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
    }
    .account-info { flex: 1; min-width: 0; }
    .account-email { font-weight: 600; font-size: 14px; color: rgba(var(--ink), 0.90); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .account-status { font-size: 12px; color: rgba(var(--ink), 0.50); margin-top: 2px; display: flex; align-items: center; gap: 5px; }

    .dot { width: 7px; height: 7px; border-radius: 999px; flex: 0 0 auto; }
    .dot-ok   { background: #3DDC97; }
    .dot-warn { background: #FFB347; }
    .dot-spin { background: var(--accent); animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

    .backup-now-btn {
      width: 100%; background: var(--accent); color: #0D0F18; border: none; border-radius: 10px;
      padding: 12px; font-weight: 700; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px;
    }
    .backup-now-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .backup-now-btn:not(:disabled):hover { filter: brightness(1.08); }

    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.25);
      border-top-color: #0D0F18; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .info-grid {
      background: var(--bg); border: 0.5px solid rgba(var(--ink), 0.08);
      border-radius: 10px; overflow: hidden; margin-bottom: 12px;
    }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 0.5px solid rgba(var(--ink), 0.06);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 13px; color: rgba(var(--ink), 0.55); }
    .info-val { font-size: 13px; font-weight: 600; color: rgba(var(--ink), 0.90); }
    .info-val-sm { font-size: 12px; font-weight: 500; color: rgba(var(--ink), 0.60); }

    .auto-row {
      display: flex; align-items: center; gap: 14px;
      background: var(--bg); border: 0.5px solid rgba(var(--ink), 0.08);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 12px;
    }
    .auto-text { flex: 1; }
    .auto-label { font-size: 13px; font-weight: 600; color: rgba(var(--ink), 0.88); }
    .auto-sub { font-size: 11px; color: rgba(var(--ink), 0.45); margin-top: 2px; line-height: 1.4; }
    .toggle-pill {
      width: 40px; height: 24px; border-radius: 999px; border: none; cursor: pointer;
      background: rgba(var(--ink), 0.16); position: relative; transition: background 0.2s; flex: 0 0 auto;
    }
    .toggle-pill.on { background: #3DDC97; }
    .toggle-knob {
      width: 18px; height: 18px; border-radius: 999px; background: #fff;
      position: absolute; top: 3px; left: 3px; transition: left 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .toggle-pill.on .toggle-knob { left: 19px; }

    .sub-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
    .restore-link {
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
      color: rgba(var(--ink), 0.65); background: transparent; border: none; cursor: pointer; padding: 6px 0;
    }
    .restore-link:hover { color: var(--accent); }
    .disconnect-link {
      font-size: 12px; color: rgba(var(--ink), 0.40); background: transparent; border: none; cursor: pointer; padding: 6px 0;
    }
    .disconnect-link:hover { color: #FF5A6A; }

    .restore-confirm {
      background: rgba(255,90,106,0.08); border: 0.5px solid rgba(255,90,106,0.25);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;
    }
    .restore-warn { font-size: 12px; color: #FF5A6A; line-height: 1.5; margin-bottom: 10px; }
    .restore-btns { display: flex; gap: 8px; }
    .restore-cancel {
      flex: 1; background: transparent; color: rgba(var(--ink), 0.72);
      border: 0.5px solid rgba(var(--ink), 0.16); border-radius: 8px;
      padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .restore-go {
      flex: 1; background: #FF5A6A; color: #fff; border: none; border-radius: 8px;
      padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
    }

    /* ── Not connected ── */
    .hero { text-align: center; padding: 6px 0 18px; }
    .hero-icon {
      width: 60px; height: 60px; border-radius: 16px;
      background: rgba(var(--ink), 0.06); display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
    }
    .hero-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px; color: rgba(var(--ink), 0.92); margin-bottom: 6px; }
    .hero-sub { font-size: 13px; color: rgba(var(--ink), 0.55); line-height: 1.55; max-width: 320px; margin: 0 auto; }

    .connect-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
      background: #fff; color: #1f1f1f; border: 0.5px solid rgba(0,0,0,0.18); border-radius: 10px;
      padding: 12px; font-weight: 600; font-size: 14px; cursor: pointer; margin-bottom: 8px;
    }
    .connect-btn:hover { background: #f8f8f8; }
    .change-id-btn {
      width: 100%; background: transparent; color: rgba(var(--ink), 0.45);
      border: none; font-size: 12px; cursor: pointer; padding: 4px; margin-bottom: 6px;
    }

    .setup-section {
      background: var(--bg); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 12px; padding: 14px; margin-top: 4px;
    }
    .setup-section-inline { margin-top: 8px; }
    .setup-title { font-weight: 700; font-size: 13px; color: rgba(var(--ink), 0.88); margin-bottom: 8px; }
    .setup-desc { font-size: 12px; color: rgba(var(--ink), 0.55); line-height: 1.6; margin-bottom: 12px; }
    .setup-link { color: var(--accent); text-decoration: none; }
    .setup-code { font-family: ui-monospace, monospace; background: rgba(var(--ink), 0.08); border-radius: 4px; padding: 1px 4px; font-size: 11px; }
    .client-id-input {
      width: 100%; background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.18);
      border-radius: 8px; padding: 9px 12px; color: rgba(var(--ink), 0.92); font-size: 12px;
      font-family: ui-monospace, monospace; outline: none; box-sizing: border-box; margin-bottom: 10px;
    }
    .save-id-btn {
      width: 100%; background: var(--accent); color: #0D0F18; border: none; border-radius: 8px;
      padding: 10px; font-weight: 700; font-size: 13px; cursor: pointer;
    }
    .save-id-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Local backup ── */
    .divider { height: 0.5px; background: rgba(var(--ink), 0.08); margin: 18px 0 16px; }
    .local-section {}
    .local-title { font-weight: 600; font-size: 13px; color: rgba(var(--ink), 0.86); margin-bottom: 4px; }
    .local-desc { font-size: 12px; color: rgba(var(--ink), 0.50); line-height: 1.5; margin-bottom: 12px; }
    code { font-family: ui-monospace, monospace; font-size: 11px; background: rgba(var(--ink),0.07); border-radius: 4px; padding: 1px 4px; }
    .local-actions { display: flex; gap: 10px; }
    .export-btn {
      flex: 1; background: var(--accent); color: #0D0F18; border: none; border-radius: 9px;
      padding: 10px; font-weight: 600; font-size: 13px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .import-btn {
      flex: 1; background: transparent; color: rgba(var(--ink), 0.86);
      border: 0.5px solid rgba(var(--ink), 0.18); border-radius: 9px;
      padding: 10px; font-weight: 600; font-size: 13px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
  `],
})
export class SyncModalComponent {
  ns = inject(NotesService);

  clientIdDraft = '';
  showRestore = false;
  showIdSetup = false;

  get origin(): string {
    try { return window.location.origin; } catch { return 'https://your-site.com'; }
  }

  get initial(): string {
    return (this.ns.gDriveEmail()[0] || 'G').toUpperCase();
  }

  get lastSyncLabel(): string {
    const ts = Number(this.ns.lastSync());
    if (!ts) return 'Never';
    const d = Date.now() - ts, m = 60000, h = 3600000, day = 86400000;
    if (d < m)    return 'just now';
    if (d < h)    return `${Math.floor(d / m)} min ago`;
    if (d < day)  return `${Math.floor(d / h)} hr ago`;
    if (d < 7 * day) return `${Math.floor(d / day)} days ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  saveClientId(): void {
    if (!this.clientIdDraft.trim()) return;
    this.ns.setClientId(this.clientIdDraft);
    this.clientIdDraft = '';
    this.showIdSetup = false;
    this.ns.connectGoogleDrive();
  }

  handleFile(e: Event): void {
    this.ns.onImportFile(e);
  }

  confirmRestore(): void {
    this.showRestore = false;
    this.ns.restoreFromDrive();
  }
}
