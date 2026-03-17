import type { AaiaPriceTier, SalesMotionPricing, ValueQuadrant, PriorityTier } from '../shared/types';

// ── Motion Potential Calculations ─────────────────────────────────

export function calculateMotion1Potential(
  numAgents: number,
  region: string,
  pricing: SalesMotionPricing,
): number {
  const isLatam = region.toLowerCase().includes('latam') || region.toLowerCase().includes('brazil');
  const price = isLatam ? pricing.copilot_latam_price : pricing.copilot_other_price;

  const potential = numAgents * 12 * price;
  const capped = Math.min(potential, 1_000_000); // $1M cap

  return capped;
}

export function calculateMotion2Potential(
  messagingVol: number,
  ticketVol: number,
  pricing: SalesMotionPricing,
): { best: number; worst: number } {
  const priceTable: AaiaPriceTier[] = JSON.parse(pricing.aaia_price_table);

  // Calculate weighted volume
  const weightedVol = (messagingVol * 0.5) + (ticketVol * 0.3);

  // Find the tier (round DOWN to nearest tier)
  let tier: AaiaPriceTier | null = null;
  for (let i = priceTable.length - 1; i >= 0; i--) {
    if (weightedVol >= priceTable[i].volume) {
      tier = priceTable[i];
      break;
    }
  }

  // If volume is below the lowest tier, use the lowest tier
  if (!tier) {
    tier = priceTable[0];
  }

  const best = weightedVol * tier.guidance;
  const worst = weightedVol * tier.floor;

  return { best, worst };
}

export function calculateMotion3Potential(
  numAgents: number,
  region: string,
  pricing: SalesMotionPricing,
): number {
  const isLatam = region.toLowerCase().includes('latam') || region.toLowerCase().includes('brazil');
  const price = isLatam ? pricing.wem_latam_price : pricing.wem_other_price;

  return numAgents * price;
}

export function calculateMotion4Potential(
  motion1: number,
  motion2Best: number,
  motion2Worst: number,
  motion3: number,
): { best: number; worst: number } {
  return {
    best: motion1 + motion2Best + motion3,
    worst: motion1 + motion2Worst + motion3,
  };
}

// ── Priority & Quadrant Classification ────────────────────────────

export function calculateDaysToRenewal(renewalDate: string): number {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffMs = renewal.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days;
}

export function getUrgencyScore(daysToRenewal: number): number {
  // <30 days = Critical (5)
  // 31-90 days (This Quarter) = High (4)
  // 91-180 days (Next Quarter) = Medium (3)
  // 181-365 days (This FY) = Lower (2)
  // >365 days (>12 months) = Lowest (1)

  if (daysToRenewal <= 30) return 5;
  if (daysToRenewal <= 90) return 4;
  if (daysToRenewal <= 180) return 3;
  if (daysToRenewal <= 365) return 2;
  return 1;
}

export function getValueQuadrantScore(quadrant: ValueQuadrant): number {
  // High Spender + High Potential = Highest (4)
  // Low Spender + High Potential = High (3)
  // High Spender + Low Potential = Medium (2)
  // Low Spender + Low Potential = Lowest (1)

  switch (quadrant) {
    case 'high_spender_high_potential': return 4;
    case 'low_spender_high_potential': return 3;
    case 'high_spender_low_potential': return 2;
    case 'low_spender_low_potential': return 1;
    default: return 1;
  }
}

export function calculatePriorityScore(
  daysToRenewal: number,
  valueQuadrant: ValueQuadrant,
): number {
  // Combined score: (Urgency × 2) + Value
  // This weights urgency higher but allows high-value deals to still rank well
  const urgencyScore = getUrgencyScore(daysToRenewal);
  const valueScore = getValueQuadrantScore(valueQuadrant);

  return (urgencyScore * 2) + valueScore;
}

export function getPriorityTier(priorityScore: number): PriorityTier {
  // P1 (Critical): score >= 12 (e.g., <30 days + high value: 5*2+4=14)
  // P2 (High): score 9-11
  // P3 (Medium): score 6-8
  // P4 (Low): score <= 5

  if (priorityScore >= 12) return 'P1';
  if (priorityScore >= 9) return 'P2';
  if (priorityScore >= 6) return 'P3';
  return 'P4';
}

export function classifyValueQuadrant(
  currentArr: number,
  totalPotential: number,
  medianArr: number,
  medianPotential: number,
): ValueQuadrant {
  const isHighSpender = currentArr >= medianArr;
  const isHighPotential = totalPotential >= medianPotential;

  if (isHighSpender && isHighPotential) return 'high_spender_high_potential';
  if (isHighSpender && !isHighPotential) return 'high_spender_low_potential';
  if (!isHighSpender && isHighPotential) return 'low_spender_high_potential';
  return 'low_spender_low_potential';
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
