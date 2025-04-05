import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDateTime(date: Date): string {
  return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
}

export function formatTime(date: Date): string {
  return format(date, "HH:mm:ss", { locale: ko });
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}

export function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function groupByDay<T extends { startTime: Date }>(
  sessions?: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  sessions?.forEach((session) => {
    const dateKey = format(new Date(session.startTime), "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(session);
  });

  return grouped;
}
