/**
 * Iran Timezone Utilities
 * Iran Standard Time (IRST): UTC+3:30
 * Iran Daylight Time (IRDT): UTC+4:30 (during daylight saving)
 */

/**
 * Get current date/time in Iran timezone
 * @returns {Date} Date object adjusted for Iran timezone
 */
function getIranTime() {
  const now = new Date();
  // Iran timezone offset: UTC+3:30 (IRST) or UTC+4:30 (IRDT)
  // We need to check if DST is active (typically March 21 - September 22)
  const iranOffset = getIranTimezoneOffset(now);
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (iranOffset * 60000));
}

/**
 * Get Iran timezone offset in minutes for a given date
 * @param {Date} date - Date to check
 * @returns {number} Offset in minutes (210 for IRST, 270 for IRDT)
 */
function getIranTimezoneOffset(date) {
  // Iran Daylight Saving Time typically runs from March 21 to September 22
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Approximate DST dates (Iran's DST varies slightly year to year)
  // Spring forward: Usually around March 21-22 (start of Persian new year)
  // Fall back: Usually around September 22-23

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
 * @param {Date} date - Date to convert
 * @returns {Date} Date adjusted for Iran timezone
 */
function toIranTime(date) {
  if (!date || !(date instanceof Date)) {
    date = new Date(date);
  }
  const iranOffset = getIranTimezoneOffset(date);
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utcTime + (iranOffset * 60000));
}

/**
 * Get start of day in Iran timezone
 * @param {Date} date - Date (defaults to now)
 * @returns {Date} Start of day (00:00:00) in Iran timezone
 */
function getStartOfIranDay(date = null) {
  const iranDate = date ? toIranTime(date) : getIranTime();
  iranDate.setHours(0, 0, 0, 0);
  return iranDate;
}

/**
 * Add days to a date in Iran timezone
 * @param {Date} date - Start date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
function addIranDays(date, days) {
  const iranDate = toIranTime(date);
  iranDate.setDate(iranDate.getDate() + days);
  return iranDate;
}

/**
 * Format date in Persian calendar format (simple version)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatIranDate(date) {
  const iranDate = toIranTime(date);
  const year = iranDate.getFullYear();
  const month = iranDate.getMonth() + 1;
  const day = iranDate.getDate();

  // Simple formatting - could use a Persian calendar library for full conversion
  return `${year}/${month}/${day}`;
}

module.exports = {
  getIranTime,
  getIranTimezoneOffset,
  toIranTime,
  getStartOfIranDay,
  addIranDays,
  formatIranDate
};
