export const DAILY_HOUR_LIMIT = 8;

export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

export function formatToDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatToStorageKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function skipWeekends(date: Date, customWeekendDatesSet: Set<string>): Date {
  const newDate = new Date(date);
  while (true) {
    const dateKey = formatToDateKey(newDate);
    if (!isWeekend(newDate) && !customWeekendDatesSet.has(dateKey)) {
      break;
    }
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
}

export function calculateWorkingDays(startDate: Date, hours: number, customWeekendDatesSet: Set<string>): Date {
  let currentDay = new Date(startDate);
  let remainingHours = hours;

  while (remainingHours > 0) {
    currentDay = skipWeekends(currentDay, customWeekendDatesSet);

    const hoursForToday = Math.min(remainingHours, DAILY_HOUR_LIMIT);
    remainingHours -= hoursForToday;

    if (remainingHours > 0) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  return currentDay;
}

export function calculateEndDateDetailed(startDate: Date, hours: number, customWeekendDatesSet: Set<string> = new Set()): { date: Date, usedHoursOnLastDay: number } {
  let currentDay = new Date(startDate);
  // Reset time to start of day to ensure consistent day skipping
  currentDay.setHours(0, 0, 0, 0);

  let remainingHours = hours;
  let usedHoursOnLastDay = 0;

  if (hours === 0) {
    return { date: currentDay, usedHoursOnLastDay: 0 };
  }

  while (remainingHours > 0) {
    currentDay = skipWeekends(currentDay, customWeekendDatesSet);

    const hoursForToday = Math.min(remainingHours, DAILY_HOUR_LIMIT);
    usedHoursOnLastDay = hoursForToday;
    remainingHours -= hoursForToday;

    if (remainingHours > 0) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  return { date: currentDay, usedHoursOnLastDay };
}

export const getAvailableDate = (tasks: any[], fieldName: string) => {
  const relevantTasks = tasks.filter(t => t.is_comlited === 0 && (t[fieldName as keyof typeof t] || 0) > 0);

  if (relevantTasks.length === 0) {
    return "Вільна";
  }

  // Sort tasks by date_working then id to respect order
  relevantTasks.sort((a, b) => {
    if (a.date_working !== b.date_working) {
      return a.date_working - b.date_working;
    }
    return a.id - b.id;
  });

  const usageMap = new Map<string, number>();
  let lastActiveDate: Date | null = null;

  for (const task of relevantTasks) {
    console.log(new Date(task.field3_end * 1000));

    let currentDate = new Date(task.date_working * 1000);
    // Ensure time is stripped for logic (although date_working is likely clean, mostly)
    currentDate.setHours(0, 0, 0, 0);

    let remaining = Number(task[fieldName as keyof typeof task]);

    while (remaining > 0) {
      // Skip weekends
      if (isWeekend(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const key = formatToDateKey(currentDate);
      const used = usageMap.get(key) || 0;
      const capacity = DAILY_HOUR_LIMIT - used;

      if (capacity <= 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const take = Math.min(remaining, capacity);
      usageMap.set(key, used + take);
      remaining -= take;

      lastActiveDate = new Date(currentDate);
      console.log(lastActiveDate);
      if (remaining > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  if (!lastActiveDate) return "Вільна";

  const lastKey = formatToDateKey(lastActiveDate);
  const usedOnLastDay = usageMap.get(lastKey) || 0;
  const remainingOnLastDay = DAILY_HOUR_LIMIT - usedOnLastDay;

  const day = String(lastActiveDate.getDate()).padStart(2, '0');
  const month = String(lastActiveDate.getMonth() + 1).padStart(2, '0');
  const year = lastActiveDate.getFullYear();
  const formattedDate = `${day}.${month}.${year}`;

  if (remainingOnLastDay > 0) {
    return `${formattedDate} (${remainingOnLastDay} год)`;
  } else {
    let nextDay = new Date(lastActiveDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay = skipWeekends(nextDay, new Set()); // Assuming empty custom set

    const nDay = String(nextDay.getDate()).padStart(2, '0');
    const nMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
    const nYear = nextDay.getFullYear();

    return `${nDay}.${nMonth}.${nYear} (${DAILY_HOUR_LIMIT} год)`;
  }
};

export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeMs = (value: number) => (value < 1e12 ? value * 1000 : value);

export const formatUkDayMonth = (timestamp: number) => {
  return new Date(normalizeMs(timestamp)).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long'
  }) + '.';
};

export const formatUkDateTime = (date: Date) => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleString('uk-UA', dateOptions);
};
