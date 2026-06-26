import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-conflict-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ns.conflicts()) {
      <div class="overlay">
        <div class="modal">
          <div class="modal-title">{{ conflictTitle }}</div>
          <div class="modal-sub">These notes already exist. Choose what to do with each — keep both makes a renamed copy.</div>

          <div class="apply-all">
            <span class="apply-label">Apply to all</span>
            <button class="pill-btn" (click)="ns.setAllConflictRes('replace')">Replace</button>
            <button class="pill-btn" (click)="ns.setAllConflictRes('keepboth')">Keep both</button>
            <button class="pill-btn" (click)="ns.setAllConflictRes('skip')">Skip</button>
          </div>

          <div class="conflict-list">
            @for (item of ns.conflicts()!.list; track item.id) {
              <div class="conflict-item">
                <span class="conflict-title">{{ item.title || 'Untitled note' }}</span>
                <div class="choice-group">
                  <button class="choice-btn" [class.active]="ns.conflicts()!.res[item.id] === 'replace'"
                    (click)="ns.setConflictRes(item.id, 'replace')">Replace</button>
                  <button class="choice-btn" [class.active]="ns.conflicts()!.res[item.id] === 'keepboth'"
                    (click)="ns.setConflictRes(item.id, 'keepboth')">Keep both</button>
                  <button class="choice-btn" [class.active]="ns.conflicts()!.res[item.id] === 'skip'"
                    (click)="ns.setConflictRes(item.id, 'skip')">Skip</button>
                </div>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" (click)="onCancel()">Cancel</button>
            <button class="confirm-btn" (click)="onConfirm()">
              Import {{ importCount }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.66);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 22px; z-index: 210;
    }
    .modal {
      width: 520px; max-width: 100%; max-height: 84vh; display: flex; flex-direction: column;
      background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.12); border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.55); padding: 24px;
    }
    .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 19px; color: rgba(var(--ink), 0.94); margin-bottom: 4px; }
    .modal-sub { font-size: 13px; color: rgba(var(--ink), 0.55); margin-bottom: 14px; }

    .apply-all { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .apply-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(var(--ink), 0.4); }
    .pill-btn {
      background: rgba(var(--ink), 0.06); border: 0.5px solid rgba(var(--ink), 0.12);
      border-radius: 7px; padding: 5px 11px; font-size: 12px; color: rgba(var(--ink), 0.8); cursor: pointer;
    }

    .conflict-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
    .conflict-item {
      display: flex; align-items: center; gap: 10px; background: var(--bg);
      border: 0.5px solid rgba(var(--ink), 0.08); border-radius: 10px; padding: 10px 12px;
    }
    .conflict-title {
      flex: 1; min-width: 0; font-size: 14px; color: rgba(var(--ink), 0.86);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .choice-group {
      display: flex; background: var(--surface); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 7px; padding: 2px; flex: 0 0 auto;
    }
    .choice-btn {
      padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 6px;
      border: none; cursor: pointer; background: transparent; color: rgba(var(--ink), 0.55);
    }
    .choice-btn.active { background: rgba(var(--ink), 0.12); color: rgba(var(--ink), 0.92); font-weight: 600; }

    .modal-footer { display: flex; gap: 10px; justify-content: flex-end; }
    .cancel-btn {
      background: transparent; color: rgba(var(--ink), 0.7);
      border: 0.5px solid rgba(var(--ink), 0.16); border-radius: 9px;
      padding: 10px 18px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .confirm-btn {
      background: var(--accent); color: #0D0F18; border: none; border-radius: 9px;
      padding: 10px 18px; font-weight: 600; font-size: 13px; cursor: pointer;
    }
  `],
})
export class ConflictModalComponent {
  ns = inject(NotesService);

  get conflictTitle(): string {
    const n = this.ns.conflicts()?.list.length ?? 0;
    return `${n} note${n === 1 ? '' : 's'} already exist${n === 1 ? 's' : ''}`;
  }

  get importCount(): number {
    const c = this.ns.conflicts();
    if (!c) return 0;
    const skipped = c.list.filter(n => c.res[n.id] === 'skip').length;
    return c.pending.incoming.length - skipped;
  }

  onCancel() {
    this.ns.conflicts.set(null);
    this.ns.flash('Import cancelled');
  }

  onConfirm() {
    const c = this.ns.conflicts();
    if (c) this.ns.applyImport(c.pending, c.res);
  }
}
