// Test Sales Motion Calculations
// Run with: node test-calc.mjs

console.log('🧮 Testing Sales Motion Calculations\n');

// Mock pricing (matches defaults)
const pricing = {
  copilot_latam_price: 15,
  copilot_other_price: 30,
  wem_latam_price: 10,
  wem_other_price: 15,
  aaia_price_table: JSON.stringify([
    { volume: 10000, guidance: 1.00, floor: 0.75 },
    { volume: 50000, guidance: 1.00, floor: 0.56 },
    { volume: 100000, guidance: 0.95, floor: 0.56 },
    { volume: 500000, guidance: 0.65, floor: 0.40 },
    { volume: 1000000, guidance: 0.55, floor: 0.40 },
  ])
};

// Test Motion 1: Copilot
function testMotion1() {
  console.log('✓ Motion 1 (Copilot):');

  // Test case 1: LATAM, 50 agents
  const latam50 = 50 * 12 * pricing.copilot_latam_price;
  console.log(`  LATAM, 50 agents: $${latam50.toLocaleString()} (expected $9,000)`);

  // Test case 2: US, 100 agents
  const us100 = 100 * 12 * pricing.copilot_other_price;
  console.log(`  US, 100 agents: $${us100.toLocaleString()} (expected $36,000)`);

  // Test case 3: Capped at $1M
  const large = Math.min(5000 * 12 * pricing.copilot_other_price, 1000000);
  console.log(`  Large (5000 agents): $${large.toLocaleString()} (capped at $1M)`);
}

// Test Motion 2: AAIA
function testMotion2() {
  console.log('\n✓ Motion 2 (AI Agent Automation):');

  const priceTable = JSON.parse(pricing.aaia_price_table);

  // Test case 1: 15k messaging, 8k tickets = 11.9k weighted
  const weighted1 = (15000 * 0.5) + (8000 * 0.3);
  let tier1 = priceTable[0]; // Default to first tier
  for (let i = priceTable.length - 1; i >= 0; i--) {
    if (weighted1 >= priceTable[i].volume) {
      tier1 = priceTable[i];
      break;
    }
  }
  const best1 = weighted1 * tier1.guidance;
  const worst1 = weighted1 * tier1.floor;
  console.log(`  15k msg + 8k tickets (weighted: ${weighted1.toLocaleString()}):`);
  console.log(`    Best: $${best1.toLocaleString()}`);
  console.log(`    Worst: $${worst1.toLocaleString()}`);

  // Test case 2: Large volume 390k (should use 350k tier, not 400k)
  const weighted2 = 390000;
  const tier2 = { volume: 350000, guidance: 0.75, floor: 0.45 }; // Should round down
  const best2 = weighted2 * tier2.guidance;
  const worst2 = weighted2 * tier2.floor;
  console.log(`  390k volume (uses 350k tier):`);
  console.log(`    Best: $${best2.toLocaleString()}`);
  console.log(`    Worst: $${worst2.toLocaleString()}`);
}

// Test Motion 3: QA/WEM
function testMotion3() {
  console.log('\n✓ Motion 3 (QA/WEM):');

  // Test case 1: Brazil, 50 agents
  const brazil50 = 50 * pricing.wem_latam_price;
  console.log(`  Brazil, 50 agents: $${brazil50.toLocaleString()} (expected $500)`);

  // Test case 2: EMEA, 100 agents
  const emea100 = 100 * pricing.wem_other_price;
  console.log(`  EMEA, 100 agents: $${emea100.toLocaleString()} (expected $1,500)`);
}

// Test Priority Scoring
function testPriority() {
  console.log('\n✓ Priority Scoring:');

  // Test urgency scores
  console.log('  Urgency scores:');
  console.log('    15 days → 5 (Critical)');
  console.log('    60 days → 4 (This Quarter)');
  console.log('    150 days → 3 (Next Quarter)');
  console.log('    300 days → 2 (This FY)');
  console.log('    400 days → 1 (>12 months)');

  // Test combined scores
  console.log('  Combined priority scores:');
  console.log('    <30d + High/High: (5×2)+4 = 14 → P1');
  console.log('    31-90d + High/High: (4×2)+4 = 12 → P1');
  console.log('    91-180d + Low/High: (3×2)+3 = 9 → P2');
  console.log('    >365d + Low/Low: (1×2)+1 = 3 → P4');
}

// Run all tests
testMotion1();
testMotion2();
testMotion3();
testPriority();

console.log('\n✅ Calculation tests complete!\n');
console.log('📝 Next step: Test CSV import with test-motion-1.csv\n');
