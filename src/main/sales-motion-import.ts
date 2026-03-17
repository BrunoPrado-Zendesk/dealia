import Papa from 'papaparse';
import fs from 'node:fs';
import type { SalesMotion, SalesMotionImportResult, SalesMotionAccount, ValueQuadrant, PriorityTier } from '../shared/types';
import {
  calculateMotion1Potential,
  calculateMotion2Potential,
  calculateMotion3Potential,
  calculateMotion4Potential,
  calculateDaysToRenewal,
  classifyValueQuadrant,
  calculatePriorityScore,
  getPriorityTier,
  calculateMedian,
} from './sales-motion-calc';
import { getSettings, getSalesMotionAccounts, replaceSalesMotionAccounts, getForecastOpps } from './database';

function readCsvFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  // UTF-16 LE BOM: FF FE
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.toString('utf16le');
  }
  // UTF-16 BE BOM: FE FF
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const tmp = buffer[i]; buffer[i] = buffer[i + 1]; buffer[i + 1] = tmp;
    }
    return buffer.toString('utf16le');
  }
  // UTF-8 (strip BOM if present)
  let str = buffer.toString('utf-8');
  if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return str;
}

function normalizeHeaders(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

type RawMotionAccount = {
  crm_account_id: string;
  account_name: string;
  account_owner: string;
  ae_manager: string;
  region: string;
  current_arr: number;
  num_agents: number;
  renewal_date: string;
  messaging_vol: number;
  ticket_vol: number;
  total_vol: number;
};

export function importSalesMotionCsv(
  filePath: string,
  motion: SalesMotion,
): SalesMotionImportResult {
  console.log(`[sales-motion-import] Importing ${motion} from:`, filePath);

  const fileContent = readCsvFile(filePath);

  const headerPreview = Papa.parse<string[]>(fileContent, {
    header: false,
    preview: 1,
    skipEmptyLines: true,
    delimiter: '\t',
  });

  const result: SalesMotionImportResult = {
    motion,
    inserted: 0,
    updated: 0,
    failed: 0,
    changes_detected: 0,
    errors: [],
  };

  if (!headerPreview.data || headerPreview.data.length === 0) {
    result.errors.push('Failed to parse CSV headers');
    return result;
  }

  const headers = headerPreview.data[0];
  const fixedHeaders = headers.map((h, i) => {
    const trimmed = (h || '').trim();
    return trimmed === '' ? `unnamed_column_${i}` : trimmed;
  });

  const { data } = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: '\t',
    transformHeader: (h: string, index: number) => {
      const fixed = fixedHeaders[index] || h;
      return normalizeHeaders(fixed);
    },
  });

  if (data.length === 0) {
    result.errors.push('No rows found in CSV');
    return result;
  }

  const foundKeys = Object.keys(data[0]);
  console.log('[sales-motion-import] Detected columns:', foundKeys.join(', '));

  if (!data[0]['crm_account_id'] && !data[0]['account_id']) {
    result.errors.push(`Column 'crm_account_id' or 'account_id' not found. Detected columns: ${foundKeys.join(', ')}`);
    result.failed = data.length;
    return result;
  }

  // Parse raw accounts from CSV
  const rawAccounts: RawMotionAccount[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      const accountId = row['crm_account_id']?.trim() || row['account_id']?.trim() || '';
      if (!accountId) throw new Error('Missing account ID');

      rawAccounts.push({
        crm_account_id: accountId,
        account_name: row['account_name']?.trim() || '',
        account_owner: row['account_owner']?.trim() || '',
        ae_manager: row['ae_manager']?.trim() || row['manager_name']?.trim() || '',
        region: row['region']?.trim() || '',
        current_arr: parseNumber(row['current_arr'] || row['arr'] || '0'),
        num_agents: parseNumber(row['num_agents'] || row['agents'] || row['seats'] || '0'),
        renewal_date: parseDate(row['renewal_date'] || ''),
        messaging_vol: parseNumber(row['messaging_vol'] || row['msg_vol'] || '0'),
        ticket_vol: parseNumber(row['ticket_vol'] || row['tickets'] || '0'),
        total_vol: parseNumber(row['total_vol'] || row['total_volume'] || '0'),
      });
    } catch (err) {
      result.failed++;
      result.errors.push(`Row ${rowNum}: ${(err as Error).message}`);
    }
  }

  console.log(`[sales-motion-import] Parsed ${rawAccounts.length} accounts from CSV`);

  // Get existing accounts and merge with new imports
  const existing = getSalesMotionAccounts();
  const existingMap = new Map(existing.map((acc) => [acc.crm_account_id, acc]));

  // Get pricing settings
  const settings = getSettings();
  const pricing = settings.sales_motion_pricing;

  // Build account map (aggregate if account appears in multiple CSVs/motions)
  const accountMap = new Map<string, RawMotionAccount & {
    in_motion_1: number;
    in_motion_2: number;
    in_motion_3: number;
    in_motion_4: number;
  }>();

  // First, carry forward existing accounts not in this CSV
  for (const acc of existing) {
    if (!rawAccounts.find((r) => r.crm_account_id === acc.crm_account_id)) {
      accountMap.set(acc.crm_account_id, {
        crm_account_id: acc.crm_account_id,
        account_name: acc.account_name,
        account_owner: acc.account_owner,
        ae_manager: acc.ae_manager,
        region: acc.region,
        current_arr: acc.current_arr,
        num_agents: acc.num_agents,
        renewal_date: acc.renewal_date,
        messaging_vol: acc.messaging_vol,
        ticket_vol: acc.ticket_vol,
        total_vol: acc.total_vol,
        in_motion_1: acc.in_motion_1,
        in_motion_2: acc.in_motion_2,
        in_motion_3: acc.in_motion_3,
        in_motion_4: acc.in_motion_4,
      });
    }
  }

  // Then, process new imports and set motion flags
  for (const raw of rawAccounts) {
    const prev = accountMap.get(raw.crm_account_id);
    accountMap.set(raw.crm_account_id, {
      ...raw,
      in_motion_1: motion === 'motion_1' ? 1 : (prev?.in_motion_1 ?? 0),
      in_motion_2: motion === 'motion_2' ? 1 : (prev?.in_motion_2 ?? 0),
      in_motion_3: motion === 'motion_3' ? 1 : (prev?.in_motion_3 ?? 0),
      in_motion_4: motion === 'motion_4' ? 1 : (prev?.in_motion_4 ?? 0),
    });
  }

  const accounts = Array.from(accountMap.values());

  // Calculate potential ARR for each account
  const accountsWithPotential = accounts.map((acc) => {
    let motion1Potential: number | null = null;
    let motion2Best: number | null = null;
    let motion2Worst: number | null = null;
    let motion3Potential: number | null = null;
    let motion4Best: number | null = null;
    let motion4Worst: number | null = null;

    if (acc.in_motion_1) {
      motion1Potential = calculateMotion1Potential(acc.num_agents, acc.region, pricing);
    }

    if (acc.in_motion_2) {
      const m2 = calculateMotion2Potential(acc.messaging_vol, acc.ticket_vol, pricing);
      motion2Best = m2.best;
      motion2Worst = m2.worst;
    }

    if (acc.in_motion_3) {
      motion3Potential = calculateMotion3Potential(acc.num_agents, acc.region, pricing);
    }

    if (acc.in_motion_4) {
      const m1 = calculateMotion1Potential(acc.num_agents, acc.region, pricing);
      const m2 = calculateMotion2Potential(acc.messaging_vol, acc.ticket_vol, pricing);
      const m3 = calculateMotion3Potential(acc.num_agents, acc.region, pricing);
      const m4 = calculateMotion4Potential(m1, m2.best, m2.worst, m3);
      motion4Best = m4.best;
      motion4Worst = m4.worst;
    }

    // Aggregate total potential (sum of all motions this account is in)
    const totalBest = (motion1Potential ?? 0) + (motion2Best ?? 0) + (motion3Potential ?? 0) + (motion4Best ?? 0);
    const totalWorst = (motion1Potential ?? 0) + (motion2Worst ?? 0) + (motion3Potential ?? 0) + (motion4Worst ?? 0);

    return {
      ...acc,
      motion_1_potential: motion1Potential,
      motion_2_potential_best: motion2Best,
      motion_2_potential_worst: motion2Worst,
      motion_3_potential: motion3Potential,
      motion_4_potential_best: motion4Best,
      motion_4_potential_worst: motion4Worst,
      total_potential_best: totalBest,
      total_potential_worst: totalWorst,
    };
  });

  // Calculate median thresholds for dynamic quadrant classification
  const arrValues = accountsWithPotential.map((a) => a.current_arr);
  const potentialValues = accountsWithPotential.map((a) => a.total_potential_best);
  const medianArr = calculateMedian(arrValues);
  const medianPotential = calculateMedian(potentialValues);

  console.log(`[sales-motion-import] Median ARR: ${medianArr}, Median Potential: ${medianPotential}`);

  // Match with forecast opps to set has_open_opp flag
  const forecastOpps = getForecastOpps();
  const oppMap = new Map<string, { opp_id: string; arr: number; stage: string }>();
  for (const opp of forecastOpps) {
    if (opp.sfdc_account_id) {
      // Take the highest ARR opp for this account
      const existing = oppMap.get(opp.sfdc_account_id);
      if (!existing || opp.product_arr_usd > existing.arr) {
        oppMap.set(opp.sfdc_account_id, {
          opp_id: opp.crm_opportunity_id,
          arr: opp.product_arr_usd,
          stage: opp.stage_name,
        });
      }
    }
  }

  // Final processing: quadrant, priority, and open opp matching
  const finalAccounts = accountsWithPotential.map((acc) => {
    const daysToRenewal = calculateDaysToRenewal(acc.renewal_date);
    const valueQuadrant = classifyValueQuadrant(
      acc.current_arr,
      acc.total_potential_best,
      medianArr,
      medianPotential,
    );
    const priorityScore = calculatePriorityScore(daysToRenewal, valueQuadrant);
    const priorityTier = getPriorityTier(priorityScore);

    const openOpp = oppMap.get(acc.crm_account_id);

    return {
      crm_account_id: acc.crm_account_id,
      account_name: acc.account_name,
      account_owner: acc.account_owner,
      ae_manager: acc.ae_manager,
      region: acc.region,
      current_arr: acc.current_arr,
      num_agents: acc.num_agents,
      renewal_date: acc.renewal_date,
      in_motion_1: acc.in_motion_1,
      in_motion_2: acc.in_motion_2,
      in_motion_3: acc.in_motion_3,
      in_motion_4: acc.in_motion_4,
      messaging_vol: acc.messaging_vol,
      ticket_vol: acc.ticket_vol,
      total_vol: acc.total_vol,
      motion_1_potential: acc.motion_1_potential,
      motion_2_potential_best: acc.motion_2_potential_best,
      motion_2_potential_worst: acc.motion_2_potential_worst,
      motion_3_potential: acc.motion_3_potential,
      motion_4_potential_best: acc.motion_4_potential_best,
      motion_4_potential_worst: acc.motion_4_potential_worst,
      total_potential_best: acc.total_potential_best,
      total_potential_worst: acc.total_potential_worst,
      days_to_renewal: daysToRenewal,
      value_quadrant: valueQuadrant as ValueQuadrant,
      priority_tier: priorityTier as PriorityTier,
      priority_score: priorityScore,
      has_open_opp: openOpp ? 1 : 0,
      open_opp_id: openOpp?.opp_id || null,
      open_opp_arr: openOpp?.arr || null,
      open_opp_stage: openOpp?.stage || null,
    };
  });

  // Save to database
  const { inserted, updated } = replaceSalesMotionAccounts(finalAccounts);
  result.inserted = inserted;
  result.updated = updated;

  console.log(`[sales-motion-import] Import complete. Inserted: ${inserted}, Updated: ${updated}`);

  return result;
}
