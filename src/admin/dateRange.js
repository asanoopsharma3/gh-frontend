export const MAX_RANGE_DAYS = 31;
export const EARLIEST_DATE = "2024-01-01";

export const ghanaDateValue = (date = new Date()) =>
  date.toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });

export const ghanaMonthStart = (date = new Date()) => {
  const [year, month] = ghanaDateValue(date).split("-");
  return `${year}-${month}-01`;
};

export const shiftDate = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const minDate = (a, b) => (a <= b ? a : b);
export const maxDate = (a, b) => (a >= b ? a : b);

export const maxToFromFrom = (fromDate) => {
  const today = ghanaDateValue();
  const from = fromDate || today;
  return minDate(shiftDate(from, MAX_RANGE_DAYS - 1), today);
};

/** Keep FROM as selected; cap TO to FROM + 31 days. Previous months stay selectable. */
export const clampRangeFromStart = (fromDate, toDate) => {
  const today = ghanaDateValue();
  let from = fromDate || ghanaMonthStart();
  if (from > today) from = today;
  if (from < EARLIEST_DATE) from = EARLIEST_DATE;

  let to = toDate || from;
  if (to < from) to = from;
  const maxTo = maxToFromFrom(from);
  const clamped = to > maxTo;
  if (clamped) to = maxTo;

  return { from, to, clamped, maxTo };
};
