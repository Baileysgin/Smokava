/**
 * Iran Timezone Utilities (Frontend)
 * Iran Standard Time (IRST): UTC+3:30
 * Iran Daylight Time (IRDT): UTC+4:30 (during daylight saving)
 */

/**
 * Get current date/time in Iran timezone
 */
export function getIranTime(): Date {
  const now = new Date();
  const iranOffset = getIranTimezoneOffset(now);
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (iranOffset * 60000));
}

/**
 * Get Iran timezone offset in minutes for a given date
 */
function getIranTimezoneOffset(date: Date): number {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Iran Daylight Saving Time typically runs from March 21 to September 22
  if (month > 2 && month < 8) {
    // April through August: DST active (IRDT - UTC+4:30)
    return 270; // 4.5 hours in minutes
  } else if (month === 2 && day >= 21) {
    // March 21+: DST active
    return 270;
  } else if (month === 8 && day < 23) {
    // September before 23: DST active
    return 270;
  } else {
    // Standard time (IRST - UTC+3:30)
    return 210; // 3.5 hours in minutes
  }
}

/**
 * Convert a date to Iran timezone
 */
export function toIranTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return new Date();
  }
  const iranOffset = getIranTimezoneOffset(dateObj);
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utcTime + (iranOffset * 60000));
}

/**
 * Get start of day in Iran timezone
 */
export function getStartOfIranDay(date?: Date): Date {
  const iranDate = date ? toIranTime(date) : getIranTime();
  iranDate.setHours(0, 0, 0, 0);
  return iranDate;
}

/**
 * Calculate days difference between two dates in Iran timezone
 */
export function getDaysDifferenceInIran(date1: Date | string, date2: Date | string = new Date()): number {
  const iranDate1 = toIranTime(date1);
  const iranDate2 = typeof date2 === 'string' ? toIranTime(date2) : toIranTime(date2);

  const start1 = getStartOfIranDay(iranDate1);
  const start2 = getStartOfIranDay(iranDate2);

  const diffMs = start2.getTime() - start1.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format date in Persian format (simple)
 */
export function formatIranDate(date: Date | string): string {
  const iranDate = toIranTime(date);
  const year = iranDate.getFullYear();
  const month = iranDate.getMonth() + 1;
  const day = iranDate.getDate();

  return `${year}/${month}/${day}`;
}

/**
 * Format date for display with Persian month names
 */
export function formatIranDatePersian(date: Date | string): string {
  const iranDate = toIranTime(date);
  const year = iranDate.getFullYear();
  const month = iranDate.getMonth();
  const day = iranDate.getDate();

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];

  return `${day} ${monthNames[month]} ${year}`;
}
