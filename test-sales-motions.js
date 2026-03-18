// Quick test script for Sales Motions backend
// Run with: node test-sales-motions.js

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Path to the database
const dbPath = path.join(
  os.homedir(),
  'Library/Application Support/deal-tracker/deals.db'
);

console.log('📊 Testing Sales Motions Backend\n');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);

  // Test 1: Check tables exist
  console.log('\n✓ Test 1: Database Tables');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

  console.log('  All tables:', tableNames.join(', '));

  const hasSalesMotionTables =
    tableNames.includes('sales_motion_accounts') &&
    tableNames.includes('sales_motion_changes');

  if (hasSalesMotionTables) {
    console.log('  ✓ Sales Motion tables created successfully');
  } else {
    console.log('  ✗ Missing Sales Motion tables');
  }

  // Test 2: Check schema
  console.log('\n✓ Test 2: Sales Motion Accounts Schema');
  const schema = db.prepare("PRAGMA table_info(sales_motion_accounts)").all();
  console.log(`  Columns (${schema.length}):`);
  schema.forEach(col => {
    console.log(`    - ${col.name} (${col.type})`);
  });

  // Test 3: Check settings
  console.log('\n✓ Test 3: Settings');
  const pricingSetting = db.prepare("SELECT value FROM settings WHERE key = 'sales_motion_pricing'").get();

  if (pricingSetting) {
    const pricing = JSON.parse(pricingSetting.value);
    console.log('  Sales Motion Pricing loaded:');
    console.log('    Copilot LATAM:', pricing.copilot_latam_price);
    console.log('    Copilot Other:', pricing.copilot_other_price);
    console.log('    WEM LATAM:', pricing.wem_latam_price);
    console.log('    WEM Other:', pricing.wem_other_price);
    console.log('    AAIA Price Table:', JSON.parse(pricing.aaia_price_table).length, 'tiers');
  } else {
    console.log('  ℹ️  No pricing settings yet (will use defaults)');
  }

  // Test 4: Check data
  console.log('\n✓ Test 4: Data');
  const accountCount = db.prepare("SELECT COUNT(*) as count FROM sales_motion_accounts").get();
  console.log(`  Sales Motion Accounts: ${accountCount.count}`);

  if (accountCount.count > 0) {
    const sample = db.prepare("SELECT * FROM sales_motion_accounts LIMIT 3").all();
    console.log('  Sample accounts:');
    sample.forEach(acc => {
      console.log(`    - ${acc.account_name} (${acc.crm_account_id})`);
      console.log(`      Motions: M1=${acc.in_motion_1} M2=${acc.in_motion_2} M3=${acc.in_motion_3} M4=${acc.in_motion_4}`);
      console.log(`      Potential: $${acc.total_potential_best?.toLocaleString() || 0} (best)`);
      console.log(`      Priority: ${acc.priority_tier} (score: ${acc.priority_score})`);
    });
  }

  db.close();

  console.log('\n✅ Backend tests complete!\n');

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
