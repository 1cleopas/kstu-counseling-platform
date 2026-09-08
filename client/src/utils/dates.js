import { format } from 'date-fns';

export function parseDbDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) return date;
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDbDate(value, pattern = 'PPp') {
  const date = parseDbDate(value);
  return date ? format(date, pattern) : '—';
}

export function toSqlDateTime(value) {
  const withSpace = String(value || '').replace('T', ' ');
  if (!withSpace) return withSpace;
  if (withSpace.length === 16) return `${withSpace}:00`;
  return withSpace;
}
