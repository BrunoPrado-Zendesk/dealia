export type Product = 'AI Agents' | 'Copilot' | 'QA';

export type ContactStatus = 'needs_action' | 'in_contact' | 'deal_live';

export type AisForecast = 'Commit' | 'Best Case' | 'Most Likely' | 'Remaining Pipe';

export const PRODUCTS: Product[] = ['AI Agents', 'Copilot', 'QA'];

export const AIS_FORECAST_OPTIONS: AisForecast[] = ['Commit', 'Best Case', 'Most Likely', 'Remaining Pipe'];

export interface Account {
  id: number;
  crm_account_id: string | null;
  account_name: string;
  arr: number;
  num_agents: number;
  renewal_date: string; // "YYYY-MM-DD"
  account_owner: string;
  current_products: Product[];
  target_products: Product[];
  sfdc_link: string;
  ae_manager: string;
  contact_status: ContactStatus;
  contacted_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  account_name: string;
  arr: number;
  num_agents: number;
  renewal_date: string;
  account_owner: string;
  current_products: Product[];
  target_products: Product[];
  sfdc_link: string;
  ae_manager: string;
  notes: string;
}

export interface TableauFilters {
  product_group: string[];
  segments: string[];
  close_quarter: string[];
  commissionable: string[];
  ai_ae: string[];
  svp_leader: string[];
  svp_minus_1: string[];
  vp_team: string[];
}

export interface AaiaPriceTier {
  volume: number;
  guidance: number;
  floor: number;
}

export const DEFAULT_AAIA_PRICE_TABLE: AaiaPriceTier[] = [
  { volume: 10000, guidance: 1.00, floor: 0.75 },
  { volume: 20000, guidance: 1.00, floor: 0.69 },
  { volume: 30000, guidance: 1.00, floor: 0.69 },
  { volume: 40000, guidance: 1.00, floor: 0.69 },
  { volume: 50000, guidance: 1.00, floor: 0.56 },
  { volume: 60000, guidance: 1.00, floor: 0.56 },
  { volume: 70000, guidance: 0.95, floor: 0.56 },
  { volume: 80000, guidance: 0.95, floor: 0.56 },
  { volume: 90000, guidance: 0.95, floor: 0.56 },
  { volume: 100000, guidance: 0.95, floor: 0.56 },
  { volume: 125000, guidance: 0.85, floor: 0.45 },
  { volume: 150000, guidance: 0.85, floor: 0.45 },
  { volume: 175000, guidance: 0.85, floor: 0.45 },
  { volume: 200000, guidance: 0.80, floor: 0.45 },
  { volume: 225000, guidance: 0.80, floor: 0.45 },
  { volume: 250000, guidance: 0.80, floor: 0.45 },
  { volume: 275000, guidance: 0.75, floor: 0.45 },
  { volume: 300000, guidance: 0.75, floor: 0.45 },
  { volume: 350000, guidance: 0.75, floor: 0.45 },
  { volume: 400000, guidance: 0.70, floor: 0.45 },
  { volume: 450000, guidance: 0.70, floor: 0.45 },
  { volume: 500000, guidance: 0.65, floor: 0.40 },
  { volume: 600000, guidance: 0.65, floor: 0.40 },
  { volume: 700000, guidance: 0.60, floor: 0.40 },
  { volume: 800000, guidance: 0.60, floor: 0.40 },
  { volume: 900000, guidance: 0.55, floor: 0.40 },
  { volume: 1000000, guidance: 0.55, floor: 0.40 },
];

export interface SalesMotionPricing {
  // Copilot pricing
  copilot_latam_price: number;
  copilot_other_price: number;

  // WEM/QA pricing
  wem_latam_price: number;
  wem_other_price: number;

  // AAIA price table (JSON string of array)
  aaia_price_table: string; // JSON: AaiaPriceTier[]
}

export interface AppSettings {
  slack_webhook_url: string;
  notification_enabled: boolean;
  anthropic_api_key: string;
  tableau_pat_name: string;
  tableau_pat_secret: string;
  tableau_site: string;
  tableau_view_id: string;
  tableau_filters: TableauFilters;
  sales_motion_pricing: SalesMotionPricing;
}

export interface CsvImportResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface NotificationLogEntry {
  id: number;
  account_id: number;
  account_name: string;
  notification_type: string;
  sent_at: string;
  fiscal_year: string;
}

export interface ForecastOpp {
  id: number;
  crm_opportunity_id: string;
  sfdc_account_id: string;
  account_name: string;
  manager_name: string;
  ae_name: string;
  region: string;
  segment: string;
  product: string;
  type: string;
  stage_name: string;
  vp_deal_forecast: string;
  product_specialist_forecast: string;
  product_specialist_notes: string;
  ai_ae: string;
  close_date: string;
  s2_plus_date: string;
  product_arr_usd: number;
  // AIS editable fields
  ais_forecast: AisForecast | null;
  ais_arr: number | null;
  ais_close_date: string | null;
  // AIS manual-edit flags (1 = user explicitly set, 0 = system default)
  ais_arr_manual: number;
  ais_forecast_manual: number;
  ais_close_date_manual: number;
  // AIS top deal flag (1 = starred by AIS as a top focus deal)
  ais_top_deal: number;
  // Change-tracking fields
  push_count: number;
  total_days_pushed: number;
  stage_entered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quota {
  ai_ae: string;
  region: string;
  quota: number;      // annual
  q1_target: number;
  q2_target: number;
  q3_target: number;
  q4_target: number;
}

export interface ClosedWonOpp {
  id: number;
  crm_opportunity_id: string;
  account_name: string;
  manager_name: string;
  ae_name: string;
  region: string;
  segment: string;
  product: string;
  type: string;
  ai_ae: string;
  close_date: string;
  bookings: number;
  created_at: string;
  updated_at: string;
}

export interface ForecastImportResult {
  inserted: number;
  updated: number;
  failed: number;
  synced_renewals: number;
  changes_detected: number;
  errors: string[];
}

export type ChangeType =
  | 'arr_up' | 'arr_down'
  | 'date_pushed' | 'date_pulled'
  | 'stage_progressed' | 'stage_regressed'
  | 'vp_forecast_changed'
  | 'ais_forecast_changed'
  | 'opp_added' | 'opp_dropped';

export type AlertReason =
  | 'pushed_out_of_quarter'
  | 'multi_push'
  | 'stage_regression'
  | 'large_new_opp';

export interface ForecastChange {
  id: number;
  imported_at: string;
  crm_opportunity_id: string;
  product: string;
  account_name: string;
  ae_name: string;
  ai_ae: string;
  manager_name: string;
  change_type: ChangeType;
  old_value: string | null;
  new_value: string | null;
  delta_numeric: number | null;
  is_alert: number;       // 0 | 1
  alert_reason: AlertReason | null;
  created_at: string;
}

export interface OppPushStats {
  crm_opportunity_id: string;
  product: string;
  account_name: string;
  ae_name: string;
  ai_ae: string;
  manager_name: string;
  push_count: number;
  total_days_pushed: number;
  current_arr: number;
}

export interface ForecastDifference {
  crm_opportunity_id: string;
  account_name: string;
  product: string;
  ai_ae: string;
  manager_name: string;
  diff_type: 'category' | 'arr' | 'date';
  vp_value: string;
  ais_value: string;
  arr_delta?: number;
  days_delta?: number;
}

export interface AnalyticsData {
  changes: ForecastChange[];
  lastImportAt: string | null;
  multiPushOpps: OppPushStats[];
  totalPipelineNow: number;
  totalPipelinePrev: number;
  forecastDifferences: ForecastDifference[];
}

export interface ImportHistoryEntry {
  id: number;
  imported_at: string;
  source_type: string;
  backup_filename: string;
  row_count: number;
  inserted_count: number;
  updated_count: number;
  total_pipeline: number;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────
// Sales Motions
// ──────────────────────────────────────────────────────────────────

export type SalesMotion = 'motion_1' | 'motion_2' | 'motion_3' | 'motion_4';

export const SALES_MOTIONS: { value: SalesMotion; label: string }[] = [
  { value: 'motion_1', label: 'Motion 1: AI Bundle at Renewal' },
  { value: 'motion_2', label: 'Motion 2: AI Agent Automation' },
  { value: 'motion_3', label: 'Motion 3: QA/WEM' },
  { value: 'motion_4', label: 'Motion 4: Full AI Platform' },
];

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4';
export type ValueQuadrant = 'high_spender_high_potential' | 'high_spender_low_potential' | 'low_spender_high_potential' | 'low_spender_low_potential';

export interface SalesMotionAccount {
  id: number;
  crm_account_id: string;
  account_name: string;
  account_owner: string;
  ae_manager: string;
  region: string;
  current_arr: number;
  num_agents: number;
  renewal_date: string;

  // Motion membership (CSV determines which motions this account is in)
  in_motion_1: number; // 0 | 1
  in_motion_2: number;
  in_motion_3: number;
  in_motion_4: number;

  // Volume data (for Motion 2 calculation)
  messaging_vol: number;
  ticket_vol: number;
  total_vol: number;

  // Potential ARR per motion
  motion_1_potential: number | null; // Copilot
  motion_2_potential_best: number | null; // AI Agent (Guidance)
  motion_2_potential_worst: number | null; // AI Agent (Floor)
  motion_3_potential: number | null; // QA/WEM
  motion_4_potential_best: number | null; // Full Platform (Best)
  motion_4_potential_worst: number | null; // Full Platform (Worst)

  // Aggregated potential (sum of all motions this account is in)
  total_potential_best: number;
  total_potential_worst: number;

  // Prioritization
  days_to_renewal: number;
  value_quadrant: ValueQuadrant;
  priority_tier: PriorityTier;
  priority_score: number;

  // Existing deal tracking
  has_open_opp: number; // 0 | 1
  open_opp_id: string | null;
  open_opp_arr: number | null;
  open_opp_stage: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SalesMotionChange {
  id: number;
  imported_at: string;
  crm_account_id: string;
  account_name: string;
  change_type: 'account_added' | 'account_removed' | 'motion_added' | 'motion_removed' | 'potential_changed';
  motion: SalesMotion | null;
  old_value: string | null;
  new_value: string | null;
  delta_numeric: number | null;
  created_at: string;
}

export interface SalesMotionImportResult {
  motion: SalesMotion;
  inserted: number;
  updated: number;
  failed: number;
  changes_detected: number;
  errors: string[];
}
