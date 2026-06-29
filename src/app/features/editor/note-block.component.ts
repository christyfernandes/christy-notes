import { Component, Input, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteBlock } from '../../core/models/note.model';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-note-block',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="block-wrap">
      <!-- delete button when editing -->
      @if (editing) {
        <button class="delete-block-btn" title="Remove block"
          (click)="ns.deleteBlock(noteId, blockIndex)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      }

      <div class="block-content">
        <!-- HEADING -->
        @if (block.type === 'heading') {
          @if (editing) {
            <input class="heading-input"
              [style.font-size.px]="block.level === 1 ? 24 : 19"
              [value]="block.text"
              (change)="ns.updateBlock(noteId, blockIndex, { text: asInput($event).value })"
              placeholder="Heading" />
          } @else {
            <div class="heading-read"
              [style.font-size.px]="block.level === 1 ? 24 : 19">
              {{ block.text }}
            </div>
          }
        }

        <!-- TEXT -->
        @if (block.type === 'text') {
          @if (editing) {
            <textarea class="text-input"
              [value]="block.text"
              (change)="ns.updateBlock(noteId, blockIndex, { text: asTextarea($event).value })"
              placeholder="Write something…"></textarea>
          } @else {
            <div class="text-read">{{ block.text }}</div>
          }
        }

        <!-- QUOTE -->
        @if (block.type === 'quote') {
          <div class="quote-block">
            @if (editing) {
              <textarea class="quote-input"
                [value]="block.text"
                (change)="ns.updateBlock(noteId, blockIndex, { text: asTextarea($event).value })"
                placeholder="Quote"></textarea>
            } @else {
              <div class="quote-read">{{ block.text }}</div>
            }
          </div>
        }

        <!-- CHECKLIST -->
        @if (block.type === 'checklist') {
          <div class="checklist">
            @for (item of block.items; track item.id; let i = $index) {
              <div class="check-row">
                <button class="check-box" [class.done]="item.done"
                  (click)="ns.updateChecklistItem(noteId, blockIndex, i, { done: !item.done })">
                  @if (item.done) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#0D0F18" stroke-width="3">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  }
                </button>
                @if (editing) {
                  <input class="check-input" [class.done]="item.done"
                    [value]="item.text"
                    (change)="ns.updateChecklistItem(noteId, blockIndex, i, { text: asInput($event).value })"
                    placeholder="List item" />
                  <button class="remove-item-btn"
                    (click)="ns.removeChecklistItem(noteId, blockIndex, i)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                } @else {
                  <span class="check-text" [class.done]="item.done">{{ item.text }}</span>
                }
              </div>
            }
            @if (editing) {
              <button class="add-item-btn" (click)="ns.addChecklistItem(noteId, blockIndex)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="M5 12h14M12 5v14"/>
                </svg>Add item
              </button>
            }
          </div>
        }

        <!-- TABLE -->
        @if (block.type === 'table') {
          <div class="table-wrap">
            @for (row of block.rows; track $index; let r = $index) {
              <div class="table-row" [class.last-row]="r === (block.rows?.length ?? 0) - 1">
                @for (cell of row; track $index; let c = $index) {
                  <div class="table-cell" [class.header-cell]="r === 0"
                    [class.last-col]="c === row.length - 1">
                    @if (editing) {
                      <input class="cell-input" [class.header-input]="r === 0"
                        [value]="cell"
                        (change)="ns.updateTableCell(noteId, blockIndex, r, c, asInput($event).value)" />
                    } @else {
                      <span class="cell-text" [class.header-text]="r === 0">{{ cell }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- IMAGE -->
        @if (block.type === 'image') {
          <input #fileInput type="file" accept="image/*" style="display:none"
            (change)="onFileSelected($event)" />
          <div class="image-box" [class.has-image]="!!block.dataUrl"
            [class.clickable]="editing" (click)="editing && fileInput.click()">
            @if (block.dataUrl) {
              <img class="image-preview" [src]="block.dataUrl" alt="note image" />
              @if (editing) {
                <button class="image-replace-btn" (click)="$event.stopPropagation(); fileInput.click()">
                  Replace
                </button>
              }
            } @else {
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                stroke="rgba(var(--ink),0.32)" stroke-width="1.3">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <span class="image-label">{{ editing ? 'Click to upload image' : 'No image' }}</span>
            }
          </div>
          @if (editing) {
            <input class="caption-input"
              [value]="block.caption"
              (change)="ns.updateBlock(noteId, blockIndex, { caption: asInput($event).value })"
              placeholder="Add a caption…" />
          } @else if (block.caption) {
            <div class="caption-text">{{ block.caption }}</div>
          }
        }

        <!-- VOICE -->
        @if (block.type === 'voice') {
          <div class="voice-card">
            <button class="play-btn" (click)="ns.flash('Playing voice note…')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <div class="voice-info">
              @if (editing) {
                <input class="voice-title-input"
                  [value]="block.title"
                  (change)="ns.updateBlock(noteId, blockIndex, { title: asInput($event).value })"
                  placeholder="Voice note" />
              } @else {
                <div class="voice-title">{{ block.title }}</div>
              }
              <div class="waveform">
                @for (bar of ns.waveform(block.id); track $index) {
                  <div class="waveform-bar" [style.height.px]="bar.height"></div>
                }
              </div>
            </div>
            <span class="voice-duration">{{ block.duration }}</span>
          </div>
        }

        <!-- WEB CLIP -->
        @if (block.type === 'webclip') {
          <div class="webclip-card">
            <div class="webclip-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div class="webclip-info">
              @if (editing) {
                <input class="webclip-title-input"
                  [value]="block.title"
                  (change)="ns.updateBlock(noteId, blockIndex, { title: asInput($event).value })"
                  placeholder="Link title" />
                <input class="webclip-url-input"
                  [value]="block.url"
                  (change)="ns.updateBlock(noteId, blockIndex, { url: asInput($event).value })"
                  placeholder="https://" />
              } @else {
                <div class="webclip-title">{{ block.title }}</div>
                <div class="webclip-url">{{ block.url }}</div>
              }
            </div>
          </div>
        }

        <!-- SKETCH -->
        @if (block.type === 'sketch') {
          <div class="sketch-canvas">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.4">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            <span class="sketch-label">Sketch canvas</span>
          </div>
        }

        <!-- DIVIDER -->
        @if (block.type === 'divider') {
          <div class="divider-line"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .block-wrap { position: relative; display: flex; gap: 8px; align-items: flex-start; }
    .block-content { flex: 1; min-width: 0; }

    .delete-block-btn {
      flex: 0 0 auto; margin-top: 4px; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px; border: none; background: transparent;
      color: rgba(var(--ink), 0.30); cursor: pointer;
    }
    .delete-block-btn:hover { background: rgba(255,90,106,0.14); color: #FF5A6A; }

    /* Heading */
    .heading-input, .heading-read {
      font-family: 'Syne', sans-serif; font-weight: 700; line-height: 1.3;
      color: rgba(var(--ink), 0.92);
    }
    .heading-input {
      width: 100%; background: transparent; border: none; outline: none;
    }

    /* Text */
    .text-input {
      width: 100%; resize: none; min-height: 48px; background: transparent;
      border: none; outline: none; color: rgba(var(--ink), 0.86);
      font-size: 15px; line-height: 1.6;
      field-sizing: content;
    }
    .text-read {
      color: rgba(var(--ink), 0.82); font-size: 15px; line-height: 1.6;
      white-space: pre-wrap; word-break: break-word;
    }

    /* Quote */
    .quote-block { border-left: 3px solid var(--accent); padding: 2px 0 2px 16px; }
    .quote-input {
      width: 100%; resize: none; min-height: 30px; background: transparent;
      border: none; outline: none; color: rgba(var(--ink), 0.78);
      font-size: 16px; font-style: italic; line-height: 1.55;
      field-sizing: content;
    }
    .quote-read {
      color: rgba(var(--ink), 0.78); font-size: 16px; font-style: italic;
      line-height: 1.55; white-space: pre-wrap;
    }

    /* Checklist */
    .checklist { display: flex; flex-direction: column; gap: 8px; }
    .check-row { display: flex; align-items: center; gap: 10px; }
    .check-box {
      width: 20px; height: 20px; border-radius: 6px; flex: 0 0 auto;
      border: 1.5px solid rgba(var(--ink), 0.30); background: transparent;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .check-box.done { background: var(--accent); border: none; }
    .check-input {
      flex: 1; min-width: 0; background: transparent; border: none; outline: none;
      font-size: 15px; color: rgba(var(--ink), 0.86);
    }
    .check-input.done { color: rgba(var(--ink), 0.40); text-decoration: line-through; }
    .check-text { font-size: 15px; line-height: 1.4; color: rgba(var(--ink), 0.86); }
    .check-text.done { color: rgba(var(--ink), 0.40); text-decoration: line-through; }
    .remove-item-btn {
      flex: 0 0 auto; width: 20px; height: 20px; border: none; background: transparent;
      color: rgba(var(--ink), 0.30); cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .remove-item-btn:hover { color: #FF5A6A; }
    .add-item-btn {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: none; color: rgba(var(--ink), 0.45);
      font-size: 13px; cursor: pointer; padding: 2px 0;
    }
    .add-item-btn:hover { color: var(--accent); }

    /* Table */
    .table-wrap { border: 0.5px solid rgba(var(--ink), 0.12); border-radius: 8px; overflow: hidden; }
    .table-row { display: flex; border-bottom: 0.5px solid rgba(var(--ink), 0.10); }
    .table-row.last-row { border-bottom: none; }
    .table-cell {
      flex: 1; min-width: 0; padding: 8px 10px;
      border-right: 0.5px solid rgba(var(--ink), 0.10);
    }
    .table-cell.last-col { border-right: none; }
    .table-cell.header-cell { background: rgba(var(--ink), 0.04); }
    .cell-input {
      width: 100%; background: transparent; border: none; outline: none;
      color: rgba(var(--ink), 0.86); font-size: 13px;
    }
    .cell-input.header-input { font-weight: 600; }
    .cell-text { font-size: 13px; color: rgba(var(--ink), 0.70); }
    .cell-text.header-text { font-weight: 600; color: rgba(var(--ink), 0.92); }

    /* Image */
    .image-box {
      height: 170px; border-radius: 10px; background: rgba(var(--ink), 0.03);
      border: 0.5px solid rgba(var(--ink), 0.10);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      overflow: hidden; position: relative;
    }
    .image-box.clickable { cursor: pointer; }
    .image-box.clickable:hover { background: rgba(var(--ink), 0.06); border-color: rgba(var(--ink), 0.22); }
    .image-box.has-image { height: auto; min-height: 120px; max-height: 400px; }
    .image-preview { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 10px; }
    .image-replace-btn {
      position: absolute; bottom: 8px; right: 8px;
      background: rgba(0,0,0,0.55); color: #fff; border: none;
      border-radius: 6px; font-size: 12px; padding: 4px 10px; cursor: pointer;
    }
    .image-replace-btn:hover { background: rgba(0,0,0,0.75); }
    .image-label { font-size: 12px; color: rgba(var(--ink), 0.40); margin-top: 8px; }
    .caption-input {
      width: 100%; margin-top: 8px; background: transparent; border: none; outline: none;
      color: rgba(var(--ink), 0.55); font-size: 12px; text-align: center;
    }
    .caption-text { text-align: center; color: rgba(var(--ink), 0.45); font-size: 12px; margin-top: 8px; }

    /* Voice */
    .voice-card {
      display: flex; align-items: center; gap: 12px;
      background: rgba(var(--ink), 0.04); border: 0.5px solid rgba(var(--ink), 0.10);
      border-radius: 10px; padding: 12px 14px;
    }
    .play-btn {
      flex: 0 0 auto; width: 38px; height: 38px; border-radius: 999px;
      border: none; background: var(--accent); color: #0D0F18;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .voice-info { flex: 1; min-width: 0; }
    .voice-title-input {
      width: 100%; background: transparent; border: none; outline: none;
      color: rgba(var(--ink), 0.86); font-size: 13px; font-weight: 600;
    }
    .voice-title { color: rgba(var(--ink), 0.86); font-size: 13px; font-weight: 600; }
    .waveform {
      display: flex; align-items: center; gap: 2px; height: 22px; margin-top: 5px;
    }
    .waveform-bar {
      width: 2px; border-radius: 2px; background: rgba(var(--accent-rgb), 0.5); flex: 0 0 auto;
    }
    .voice-duration { font-size: 12px; color: rgba(var(--ink), 0.45); white-space: nowrap; }

    /* Web clip */
    .webclip-card {
      display: flex; gap: 12px;
      background: rgba(0,191,165,0.06); border: 0.5px solid rgba(0,191,165,0.22);
      border-radius: 10px; padding: 12px 14px;
    }
    .webclip-icon {
      flex: 0 0 auto; width: 38px; height: 38px; border-radius: 8px;
      background: rgba(0,191,165,0.14);
      display: flex; align-items: center; justify-content: center; color: #00BFA5;
    }
    .webclip-info { flex: 1; min-width: 0; }
    .webclip-title-input {
      width: 100%; background: transparent; border: none; outline: none;
      color: rgba(var(--ink), 0.86); font-size: 13px; font-weight: 600; margin-bottom: 2px;
    }
    .webclip-url-input {
      width: 100%; background: transparent; border: none; outline: none;
      color: #00BFA5; font-size: 12px;
    }
    .webclip-title {
      color: rgba(var(--ink), 0.86); font-size: 13px; font-weight: 600; margin-bottom: 2px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .webclip-url { color: #00BFA5; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Sketch */
    .sketch-canvas {
      height: 130px; border: 0.5px dashed rgba(var(--ink), 0.18);
      border-radius: 10px; background: rgba(var(--ink), 0.02);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; color: rgba(var(--ink), 0.32);
    }
    .sketch-label { font-size: 12px; }

    /* Divider */
    .divider-line { height: 1px; background: rgba(var(--ink), 0.10); margin: 4px 0; }
  `],
})
export class NoteBlockComponent {
  @Input({ required: true }) block!: NoteBlock;
  @Input({ required: true }) noteId!: string;
  @Input({ required: true }) blockIndex!: number;
  @Input() editing = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ns = inject(NotesService);

  asInput(e: Event): HTMLInputElement { return e.target as HTMLInputElement; }
  asTextarea(e: Event): HTMLTextAreaElement { return e.target as HTMLTextAreaElement; }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = img.width > MAX || img.height > MAX
          ? Math.min(MAX / img.width, MAX / img.height) : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        this.ns.updateBlock(this.noteId, this.blockIndex, { dataUrl });
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }
}
