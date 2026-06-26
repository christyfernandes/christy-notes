import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(ts: number): string {
    const d = Date.now() - Number(ts), m = 60000, h = 3600000, day = 86400000;
    if (d < m)       return 'now';
    if (d < h)       return `${Math.floor(d / m)}m`;
    if (d < day)     return `${Math.floor(d / h)}h`;
    if (d < 7 * day) return `${Math.floor(d / day)}d`;
    return new Date(Number(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
