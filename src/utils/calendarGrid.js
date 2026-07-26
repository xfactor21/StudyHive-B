const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Builds a 6-row (42-cell) calendar grid for the given year/month (0-indexed
 * month, matching JS Date), including the muted leading/trailing days from
 * adjacent months so the grid always fills evenly.
 */
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const cells = [];

  for (let i = 0; i < startDow; i++) {
    cells.push({ d: daysInPrevMonth - startDow + 1 + i, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      d,
      today: isCurrentMonth && d === todayDate,
      dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ d: trailing++, muted: true });
    if (cells.length >= 42) break;
  }

  return { cells, monthName: MONTH_NAMES[month], monthAbbr: MONTH_ABBR[month] };
}

export function dateKeyToDisplay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { day: d, month: MONTH_ABBR[m - 1] };
}

export const EVENT_TYPE_META = {
  test: { emoji: '📝', label: 'Test', color: 'var(--alert)' },
  homework: { emoji: '📚', label: 'Homework', color: 'var(--accent)' },
  'study-group': { emoji: '👥', label: 'Study Group', color: 'var(--positive)' },
  presentation: { emoji: '🎤', label: 'Presentation', color: 'var(--info)' },
  other: { emoji: '✨', label: 'Other', color: 'var(--text-tertiary)' },
};

const DOW_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Builds the 7 days of the week containing `anchorDate` (Sunday-start).
 * `weekOffset` shifts by whole weeks (±1 = prev/next week).
 */
export function buildWeek(anchorDate, weekOffset = 0) {
  const base = new Date(anchorDate);
  base.setDate(base.getDate() - base.getDay() + weekOffset * 7);

  const today = new Date();
  const todayKey = toDateKey(today);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateKey = toDateKey(d);
    days.push({
      dateKey,
      dow: DOW_LETTER[i],
      dayNum: d.getDate(),
      isToday: dateKey === todayKey,
      monthAbbr: MONTH_ABBR[d.getMonth()],
    });
  }

  const label = days[0].monthAbbr === days[6].monthAbbr
    ? `${days[0].monthAbbr} ${days[0].dayNum}–${days[6].dayNum}`
    : `${days[0].monthAbbr} ${days[0].dayNum} – ${days[6].monthAbbr} ${days[6].dayNum}`;

  return { days, label };
}
