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
