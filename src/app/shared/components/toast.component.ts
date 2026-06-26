import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ns.toast()) {
      <div class="toast">{{ ns.toast() }}</div>
    }
  `,
  styles: [`
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: rgba(var(--glass), 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 0.5px solid rgba(var(--ink), 0.14); border-radius: 10px; padding: 11px 18px;
      font-size: 13px; color: rgba(var(--ink), 0.92);
      box-shadow: 0 8px 24px rgba(0,0,0,0.45); z-index: 300;
      white-space: nowrap;
      animation: slideUp 150ms ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `],
})
export class ToastComponent {
  ns = inject(NotesService);
}
