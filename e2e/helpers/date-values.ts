function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isoDateFromToday(offsetDays = 0) {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return toIsoDate(value);
}

export function futureIsoDate(offsetDays = 7) {
  return isoDateFromToday(offsetDays);
}

export function pastIsoDate(offsetDays = 7) {
  return isoDateFromToday(-offsetDays);
}
