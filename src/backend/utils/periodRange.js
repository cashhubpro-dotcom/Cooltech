const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function getPeriodDateRange(period) {
  if (!period) return null;
  period = period.trim();

  if (period.includes('→')) {
    const [from, to] = period.split('→').map(s => s.trim());
    return { start: new Date(from), end: new Date(to + 'T23:59:59') };
  }

  const qMatch = period.match(/^Q([1-4])-(\d{4})$/);
  if (qMatch) {
    const q = Number(qMatch[1]), year = Number(qMatch[2]);
    const startMonth = (q - 1) * 3;
    return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0, 23, 59, 59) };
  }

  const bwMatch = period.match(/^BW([12])-([A-Za-z]+)-(\d{4})$/);
  if (bwMatch) {
    const half = Number(bwMatch[1]), mIdx = MONTH_NAMES.indexOf(bwMatch[2]), year = Number(bwMatch[3]);
    if (mIdx === -1) return null;
    if (half === 1) return { start: new Date(year, mIdx, 1), end: new Date(year, mIdx, 15, 23, 59, 59) };
    const lastDay = new Date(year, mIdx + 1, 0).getDate();
    return { start: new Date(year, mIdx, 16), end: new Date(year, mIdx, lastDay, 23, 59, 59) };
  }

  const wMatch = period.match(/^W(\d+)-([A-Za-z]+)-(\d{4})$/);
  if (wMatch) {
    const weekNum = Number(wMatch[1]), mIdx = MONTH_NAMES.indexOf(wMatch[2]), year = Number(wMatch[3]);
    if (mIdx === -1) return null;
    const start = new Date(year, mIdx, 1 + (weekNum - 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59);
    return { start, end };
  }

  const mMatch = period.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (mMatch) {
    const mIdx = MONTH_NAMES.indexOf(mMatch[1]), year = Number(mMatch[2]);
    if (mIdx === -1) return null;
    return { start: new Date(year, mIdx, 1), end: new Date(year, mIdx + 1, 0, 23, 59, 59) };
  }

  return null;
}