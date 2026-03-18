import Papa from 'papaparse';
import fs from 'node:fs';
import type { SalesMotionAccount, ValueQuadrant, PriorityTier } from '../shared/types';
import {
  calculateMotion2Potential,
  calculateMotion4Potential,
  calculateDaysToRenewal,
  classifyValueQuadrant,
  calculatePriorityScore,
  getPriorityTier,
  calculateMedian,
  calculateMotion1Potential,
  calculateMotion3Potential,
} from './sales-motion-calc';
import { getSettings, getSalesMotionAccounts, replaceSalesMotionAccounts, getForecastOpps } from './database';

function readCsvFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.toString('utf16le');
  }
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const tmp = buffer[i]; buffer[i] = buffer[i + 1]; buffer[i + 1] = tmp;
    }
    return buffer.toString('utf16le');
  }
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

function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function importSalesMotionVolumes(filePath: string): {
  updated: number;
  failed: number;
  errors: string[];
} {
  console.log('[sales-motion-volumes] Importing volumes from:', filePath);

  const fileContent = readCsvFile(filePath);

  const headerPreview = Papa.parse<string[]>(fileContent, {
    header: false,
    preview: 1,
    skipEmptyLines: true,
    delimiter: '\t',
  });

  const result = {
    updated: 0,
    failed: 0,
    errors: [] as string[],
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
  console.log('[sales-motion-volumes] Detected columns:', foundKeys.join(', '));

  if (!data[0]['crm_account_id'] && !data[0]['account_id']) {
    result.errors.push(`Column 'crm_account_id' or 'account_id' not found. Detected columns: ${foundKeys.join(', ')}`);
    result.failed = data.length;
    return result;
  }

  // Parse volume data from CSV
  const volumeUpdates = new Map<string, { messaging_vol: number; ticket_vol: number; total_vol: number }>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      const accountId = row['crm_account_id']?.trim() || row['account_id']?.trim() || '';
      if (!accountId) throw new Error('Missing account ID');

      volumeUpdates.set(accountId, {
        messaging_vol: parseNumber(row['messaging_vol'] || row['msg_vol'] || '0'),
        ticket_vol: parseNumber(row['ticket_vol'] || row['tickets'] || '0'),
        total_vol: parseNumber(row['total_vol'] || row['total_volume'] || '0'),
      });
    } catch (err) {
      result.failed++;
      result.errors.push(`Row ${rowNum}: ${(err as Error).message}`);
    }
  }

  console.log(`[sales-motion-volumes] Parsed ${volumeUpdates.size} volume updates`);

  // Get existing accounts
  const existing = getSalesMotionAccounts();
  const existingMap = new Map(existing.map((acc) => [acc.crm_account_id, acc]));

  // Get pricing settings
  const settings = getSettings();
  const pricing = settings.sales_motion_pricing;

  // Update accounts with new volumes and recalculate potentials
  const updatedAccounts: Array<Omit<SalesMotionAccount, 'id' | 'created_at' | 'updated_at'>> = [];

  for (const acc of existing) {
    const volumeUpdate = volumeUpdates.get(acc.crm_account_id);

    if (volumeUpdate) {
      // Update volumes
      const updatedAcc = {
        ...acc,
        messaging_vol: volumeUpdate.messaging_vol,
        ticket_vol: volumeUpdate.ticket_vol,
        total_vol: volumeUpdate.total_vol,
      };

      // Recalculate Motion 2 potential if account is in Motion 2
      if (updatedAcc.in_motion_2) {
        const m2 = calculateMotion2Potential(updatedAcc.messaging_vol, updatedAcc.ticket_vol, pricing);
        updatedAcc.motion_2_potential_best = m2.best;
        updatedAcc.motion_2_potential_worst = m2.worst;
      }

      // Recalculate Motion 4 potential if account is in Motion 4
      if (updatedAcc.in_motion_4) {
        const m1 = calculateMotion1Potential(updatedAcc.num_agents, updatedAcc.region, pricing);
        const m2 = calculateMotion2Potential(updatedAcc.messaging_vol, updatedAcc.ticket_vol, pricing);
        const m3 = calculateMotion3Potential(updatedAcc.num_agents, updatedAcc.region, pricing);
        const m4 = calculateMotion4Potential(m1, m2.best, m2.worst, m3);
        updatedAcc.motion_4_potential_best = m4.best;
        updatedAcc.motion_4_potential_worst = m4.worst;
      }

      // Recalculate total potential
      updatedAcc.total_potential_best =
        (updatedAcc.motion_1_potential ?? 0) +
        (updatedAcc.motion_2_potential_best ?? 0) +
        (updatedAcc.motion_3_potential ?? 0) +
        (updatedAcc.motion_4_potential_best ?? 0);

      updatedAcc.total_potential_worst =
        (updatedAcc.motion_1_potential ?? 0) +
        (updatedAcc.motion_2_potential_worst ?? 0) +
        (updatedAcc.motion_3_potential ?? 0) +
        (updatedAcc.motion_4_potential_worst ?? 0);

      updatedAccounts.push(updatedAcc);
      result.updated++;
    } else {
      // Keep existing account unchanged
      updatedAccounts.push(acc);
    }
  }

  // Recalculate median thresholds and priorities
  const arrValues = updatedAccounts.map((a) => a.current_arr);
  const potentialValues = updatedAccounts.map((a) => a.total_potential_best);
  const medianArr = calculateMedian(arrValues);
  const medianPotential = calculateMedian(potentialValues);

  console.log(`[sales-motion-volumes] Median ARR: ${medianArr}, Median Potential: ${medianPotential}`);

  // Match with forecast opps
  const forecastOpps = getForecastOpps();
  const oppMap = new Map<string, { opp_id: string; arr: number; stage: string }>();
  for (const opp of forecastOpps) {
    if (opp.sfdc_account_id) {
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

  // Final pass: update quadrants and priorities
  const finalAccounts = updatedAccounts.map((acc) => {
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
  replaceSalesMotionAccounts(finalAccounts);

  console.log(`[sales-motion-volumes] Volume import complete. Updated: ${result.updated}`);

  return result;
}
