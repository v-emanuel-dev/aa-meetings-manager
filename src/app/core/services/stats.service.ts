import { computed, Injectable, inject } from '@angular/core';
import { Meeting } from '../models/meeting.model';
import { StorageService } from './storage.service';

const toDate = (value: string) => new Date(`${value}T00:00:00`);
const sameMonth = (date: string, anchor = new Date()) => {
  const parsed = toDate(date);
  return parsed.getFullYear() === anchor.getFullYear() && parsed.getMonth() === anchor.getMonth();
};
const sameYear = (date: string, anchor = new Date()) => toDate(date).getFullYear() === anchor.getFullYear();

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly storage = inject(StorageService);

  readonly attendedMeetings = computed(() => this.storage.meetings().filter((meeting) => meeting.attended));
  readonly absentMeetings = computed(() =>
    this.storage.meetings().filter((meeting) => !meeting.attended && toDate(meeting.date) < new Date())
  );
  readonly monthlyAttendance = computed(() => this.attendedMeetings().filter((meeting) => sameMonth(meeting.date)).length);
  readonly annualAttendance = computed(() => this.attendedMeetings().filter((meeting) => sameYear(meeting.date)).length);
  readonly attendanceRate = computed(() => {
    const finished = this.attendedMeetings().length + this.absentMeetings().length;
    return finished ? Math.round((this.attendedMeetings().length / finished) * 100) : 0;
  });
  readonly currentStreak = computed(() => this.calculateStreak(this.attendedMeetings()));
  readonly weeklyAverage = computed(() => {
    const attended = this.attendedMeetings();
    if (!attended.length) {
      return 0;
    }
    const dates = attended.map((meeting) => toDate(meeting.date).getTime());
    const weeks = Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 7)));
    return Number((attended.length / weeks).toFixed(1));
  });
  readonly monthBuckets = computed(() => this.bucketByMonth(this.attendedMeetings()));
  readonly weekBuckets = computed(() => this.bucketRecentWeeks(this.attendedMeetings()));
  readonly activityDays = computed(() => this.buildActivityDays(this.attendedMeetings()));

  private calculateStreak(meetings: Meeting[]): number {
    const attendedDays = [...new Set(meetings.map((meeting) => meeting.date))].sort().reverse();
    if (!attendedDays.length) {
      return 0;
    }

    let streak = 0;
    let cursor = toDate(attendedDays[0]);
    for (const date of attendedDays) {
      if (date === cursor.toISOString().slice(0, 10)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private bucketByMonth(meetings: Meeting[]) {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(new Date().getFullYear(), index, 1);
      const key = `${date.getFullYear()}-${String(index + 1).padStart(2, '0')}`;
      return {
        label: formatter.format(date),
        value: meetings.filter((meeting) => meeting.date.startsWith(key)).length
      };
    });
  }

  private bucketRecentWeeks(meetings: Meeting[]) {
    return Array.from({ length: 8 }, (_, offset) => {
      const end = new Date();
      end.setDate(end.getDate() - (7 - offset) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const value = meetings.filter((meeting) => {
        const date = toDate(meeting.date);
        return date >= start && date <= end;
      }).length;
      return { label: `${start.getDate()}/${start.getMonth() + 1}`, value };
    });
  }

  private buildActivityDays(meetings: Meeting[]) {
    const counts = new Map<string, number>();
    meetings.forEach((meeting) => counts.set(meeting.date, (counts.get(meeting.date) ?? 0) + 1));

    return Array.from({ length: 112 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (111 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) ?? 0 };
    });
  }
}
