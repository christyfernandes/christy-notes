import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-storage-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="ns.showStorage.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <line x1="22" x2="2" y1="12" y2="12"/>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              <line x1="6" x2="6.01" y1="16" y2="16"/>
            </svg>
          </span>
          <div class="modal-title">Where your notes live</div>
        </div>

        <p class="modal-desc">
          Christy is local-first — every note is stored on this device and never leaves it unless you export or sync.
        </p>

        <div class="path-box">{{ ns.storagePath() }}</div>
        <div class="path-hint">
          Active store · browser database key <span class="mono">christy_state_v1</span>
        </div>

        <div class="modal-actions">
          <button class="primary-btn" (click)="onReveal()">Reveal in file manager</button>
          <button class="secondary-btn" (click)="onCopy()">Copy path</button>
        </div>

        <button class="close-btn" (click)="ns.showStorage.set(false)">×</button>
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
      width: 440px; max-width: 100%; background: var(--surface);
      border: 0.5px solid rgba(var(--ink), 0.12); border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.55); padding: 24px; position: relative;
    }
    .modal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .icon-badge {
      width: 36px; height: 36px; border-radius: 9px;
      background: rgba(var(--accent-rgb), 0.14); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
    }
    .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 19px; color: rgba(var(--ink), 0.94); }
    .modal-desc { font-size: 13px; line-height: 1.55; color: rgba(var(--ink), 0.64); margin-bottom: 14px; }
    .path-box {
      font-family: ui-monospace, 'SF Mono', monospace; font-size: 12px;
      color: rgba(var(--ink), 0.86); background: var(--bg);
      border: 0.5px solid rgba(var(--ink), 0.10); border-radius: 9px;
      padding: 11px 13px; word-break: break-all; margin-bottom: 10px;
    }
    .path-hint { font-size: 12px; color: rgba(var(--ink), 0.40); margin-bottom: 18px; }
    .mono { font-family: ui-monospace, monospace; color: rgba(var(--ink), 0.6); }
    .modal-actions { display: flex; gap: 10px; }
    .primary-btn {
      flex: 1; background: var(--accent); color: #0D0F18; border: none; border-radius: 9px;
      padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .secondary-btn {
      background: transparent; color: rgba(var(--ink), 0.86);
      border: 0.5px solid rgba(var(--ink), 0.16); border-radius: 9px;
      padding: 11px 16px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .close-btn {
      position: absolute; top: 16px; right: 16px; background: transparent;
      border: none; color: rgba(var(--ink), 0.4); font-size: 20px; cursor: pointer; line-height: 1;
    }
  `],
})
export class StorageModalComponent {
  ns = inject(NotesService);

  onReveal() {
    this.ns.showStorage.set(false);
    this.ns.flash('Opening file location… (demo)');
  }

  onCopy() {
    try { navigator.clipboard.writeText(this.ns.storagePath()); } catch { /**/ }
    this.ns.flash('Path copied');
  }
}
