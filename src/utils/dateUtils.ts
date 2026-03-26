export const DAILY_HOUR_LIMIT = 480; // minutes (8 hours)

// Checks if a date is a weekend (Saturday or Sunday)
export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

// Formats a date into a key string of format YYYY-MM-DD
export function formatToDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Formats a date into a storage key string (uses 0-indexed month)
export function formatToStorageKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Skips weekends and holidays, returning the next working day
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

// Calculates the end date based on minutes, skipping weekends
export function calculateWorkingDays(startDate: Date, minutes: number, customWeekendDatesSet: Set<string>): Date {
  let currentDay = new Date(startDate);
  let remainingMinutes = minutes;

  while (remainingMinutes > 0) {
    currentDay = skipWeekends(currentDay, customWeekendDatesSet);

    const availableToday = DAILY_HOUR_LIMIT;
    const take = Math.min(remainingMinutes, availableToday);
    remainingMinutes -= take;

    if (remainingMinutes > 0) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  return currentDay;
}

// Calculates the date for materials (2 working days before start)
export function calculateMaterialDate(startDate: Date, customWeekendDatesSet: Set<string>): Date {
  let currentDay = new Date(startDate);
  currentDay.setHours(0, 0, 0, 0);
  let backCount = 0;

  while (backCount < 2) {
    currentDay.setDate(currentDay.getDate() - 1);
    const dateKey = formatToDateKey(currentDay);
    if (!isWeekend(currentDay) && !customWeekendDatesSet.has(dateKey)) {
      backCount++;
    }
  }

  return currentDay;
}

// Returns an object with the end date and minutes used on the last working day
export function calculateEndDateDetailed(startDate: Date, minutes: number, customWeekendDatesSet: Set<string> = new Set()): { date: Date, usedMinutesOnLastDay: number } {
  let currentDay = new Date(startDate);
  currentDay.setHours(0, 0, 0, 0);

  let remainingMinutes = minutes;
  let usedMinutesOnLastDay = 0;

  if (minutes === 0) {
    return { date: currentDay, usedMinutesOnLastDay: 0 };
  }

  while (remainingMinutes > 0) {
    currentDay = skipWeekends(currentDay, customWeekendDatesSet);

    const availableToday = DAILY_HOUR_LIMIT;
    const take = Math.min(remainingMinutes, availableToday);
    usedMinutesOnLastDay = take;
    remainingMinutes -= take;

    if (remainingMinutes > 0) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  return { date: currentDay, usedMinutesOnLastDay };
}

// Calculates the earliest available working date for a specific production stage
export const getAvailableDate = (tasks: any[], fieldName: string, customWeekendDatesSet: Set<string> = new Set()) => {
  const relevantTasks = tasks.filter(t => t.is_comlited === 0 && (t[fieldName as keyof typeof t] || 0) > 0);

  if (relevantTasks.length === 0) {
    return "Вільна";
  }

  const getStageStart = (t: any) => {
    if (fieldName === 'field1') return t.date_working;
    if (fieldName === 'field2') return t.field1 > 0 ? t.field1_end : t.date_working;
    if (fieldName === 'field3') {
      if (t.field2 > 0) return t.field2_end;
      if (t.field1 > 0) return t.field1_end;
      return t.date_working;
    }
    return t.date_working;
  };

  relevantTasks.sort((a, b) => {
    const startA = getStageStart(a);
    const startB = getStageStart(b);
    if (startA !== startB) return startA - startB;
    return a.id - b.id;
  });

  const usageMap = new Map<string, number>();
  let lastActiveDate: Date | null = null;

  for (const task of relevantTasks) {
    let currentDate = new Date(getStageStart(task) * 1000);
    currentDate.setHours(0, 0, 0, 0);

    let remaining = Number(task[fieldName as keyof typeof task]);

    while (remaining > 0) {
      const dateKey = formatToDateKey(currentDate);
      if (isWeekend(currentDate) || customWeekendDatesSet.has(dateKey)) {
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

      if (remaining > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  if (!lastActiveDate) return "Вільна";

  const lastKey = formatToDateKey(lastActiveDate);
  const usedOnLastDay = usageMap.get(lastKey) || 0;
  const remainingOnLastDay = DAILY_HOUR_LIMIT - usedOnLastDay;

  const formattedDate = formatUkDayMonthOnly(lastActiveDate.getTime());

  if (remainingOnLastDay > 0) {
    return `${formattedDate} (${formatMinutesToHM(remainingOnLastDay)})`;
  } else {
    let nextDay = new Date(lastActiveDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay = skipWeekends(nextDay, customWeekendDatesSet);

    const nDateFormatted = formatUkDayMonthOnly(nextDay.getTime());

    return `${nDateFormatted} (${formatMinutesToHM(DAILY_HOUR_LIMIT)})`;
  }
};

// Returns today's date as a string in YYYY-MM-DD format
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Normalizes timestamp to milliseconds (if it's in seconds)
export const normalizeMs = (value: number) => (value < 1e12 ? value * 1000 : value);

// Formats timestamp in Ukrainian (Day and full month name)
export const formatUkDayMonth = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return "-";
  return new Date(normalizeMs(timestamp)).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long'
  }) + '.';
};

export const formatUkDayMonthOnly = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return "-";
  return new Date(normalizeMs(timestamp)).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'numeric'
  });
};

// Formats a date object into a full date-time string in Ukrainian
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

export const formatMinutesToHM = (totalMinutes: number): string => {
  if (totalMinutes === 0) return "0хв";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = "";
  if (hours > 0) result += `${hours}г `;
  if (minutes > 0 || hours === 0) result += `${minutes}хв`;
  return result.trim();
};
