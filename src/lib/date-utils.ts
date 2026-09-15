import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";

export const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
export const DAY_NAMES_SHORT = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

/** يحوّل أي تاريخ إلى بداية أسبوع الدراسة (الأحد) بصيغة yyyy-MM-dd */
export function toWeekStartKey(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return format(start, "yyyy-MM-dd");
}

export function currentWeekStartKey(): string {
  return toWeekStartKey(new Date());
}

export function shiftWeekKey(weekStartKey: string, deltaWeeks: number): string {
  const base = new Date(`${weekStartKey}T00:00:00`);
  const shifted = deltaWeeks >= 0 ? addWeeks(base, deltaWeeks) : subWeeks(base, Math.abs(deltaWeeks));
  return format(shifted, "yyyy-MM-dd");
}

export function weekDateForDay(weekStartKey: string, day: number): Date {
  const base = new Date(`${weekStartKey}T00:00:00`);
  return addDays(base, day);
}

export function formatWeekRangeLabel(weekStartKey: string): string {
  const start = new Date(`${weekStartKey}T00:00:00`);
  const end = addDays(start, 4);
  return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
}

export function isValidWeekStartKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}
