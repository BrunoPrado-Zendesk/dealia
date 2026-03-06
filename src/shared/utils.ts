import type { AisForecast } from './types';
import { AIS_FORECAST_OPTIONS } from './types';

// Maps raw Salesforce product strings to normalized display names.
// Raw values vary between CSV exports (e.g. 'ultimate_ar', 'zendesk_ar' both mean 'AI Agents').
export function normalizeProduct(raw: string): string {
  switch (raw.toLowerCase()) {
    case 'ultimate_ar':
    case 'ultimate':
    case 'zendesk_ar':
      return 'AI Agents';
    case 'ai_expert':
      return 'AI Expert';
    case 'wem':
      return 'WEM';
    default:
      return raw;
  }
}

// Maps any forecast string (including prefixed like "2 - Most Likely") to an AIS category.
export function mapForecast(raw: string | null | undefined): AisForecast | null {
  if (!raw?.trim()) return null;
  const lower = raw.toLowerCase();
  for (const opt of AIS_FORECAST_OPTIONS) {
    if (lower.includes(opt.toLowerCase())) return opt;
  }
  if (lower.includes('remaining')) return 'Remaining Pipe';
  return null;
}

// Fiscal year starts Feb 1; FY number = calendar year + 1 (except Jan which stays in same FY)
// e.g. Apr 16 2026 → 2027Q1, Nov 1 2026 → 2027Q4, Jan 15 2027 → 2027Q4, Feb 1 2027 → 2028Q1
export function toCloseQuarter(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();

  let fiscalYear: number;
  let quarter: number;

  if (month === 1) {
    fiscalYear = year;
    quarter = 4;
  } else if (month <= 4) {
    fiscalYear = year + 1;
    quarter = 1;
  } else if (month <= 7) {
    fiscalYear = year + 1;
    quarter = 2;
  } else if (month <= 10) {
    fiscalYear = year + 1;
    quarter = 3;
  } else {
    fiscalYear = year + 1;
    quarter = 4;
  }

  return `${fiscalYear}Q${quarter}`;
}
