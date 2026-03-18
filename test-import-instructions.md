# Testing Sales Motions Import

## 📋 Test Files
- `test-motion-1.csv` - 5 accounts for Motion 1 (Copilot)
- `test-volumes.csv` - Support volume data for same 5 accounts

## 🧪 Test Steps

### Step 1: Open the App
The app should already be running. If not:
```bash
npm start
```

### Step 2: Open DevTools Console
In the Electron app window, press:
- **macOS**: `Cmd + Option + I`
- **Windows/Linux**: `Ctrl + Shift + I`

### Step 3: Test Motion 1 Import

Paste this in the console:

```javascript
// Test Motion 1 Import
(async () => {
  console.log('🚀 Testing Motion 1 Import...');

  // Import Motion 1 CSV (without volumes)
  const result = await window.api.importSalesMotion('motion_1');

  if (result) {
    console.log('✅ Motion 1 Import Result:', result);
    console.log(`   Inserted: ${result.inserted}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Failed: ${result.failed}`);
    if (result.errors.length > 0) {
      console.log('   Errors:', result.errors);
    }
  } else {
    console.log('❌ Import cancelled');
  }
})();
```

**When the file dialog opens, select:** `test-motion-1.csv`

### Step 4: Verify Accounts

```javascript
// Check imported accounts
(async () => {
  const accounts = await window.api.getSalesMotionAccounts();
  console.log(`📊 Total Accounts: ${accounts.length}`);

  accounts.forEach(acc => {
    console.log(`\n${acc.account_name} (${acc.crm_account_id})`);
    console.log(`  Current ARR: $${acc.current_arr.toLocaleString()}`);
    console.log(`  Agents: ${acc.num_agents}`);
    console.log(`  Motion 1 Potential: $${acc.motion_1_potential?.toLocaleString() || 0}`);
    console.log(`  Total Potential (Best): $${acc.total_potential_best.toLocaleString()}`);
    console.log(`  Priority: ${acc.priority_tier} (score: ${acc.priority_score})`);
    console.log(`  Days to Renewal: ${acc.days_to_renewal}`);
    console.log(`  Quadrant: ${acc.value_quadrant}`);
  });
})();
```

### Step 5: Test Volumes Import (Optional)

```javascript
// Import volumes separately
(async () => {
  console.log('🚀 Testing Volumes Import...');

  const result = await window.api.importSalesMotionVolumes();

  if (result) {
    console.log('✅ Volumes Import Result:', result);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Failed: ${result.failed}`);
    if (result.errors.length > 0) {
      console.log('   Errors:', result.errors);
    }

    // Check if Motion 2 potentials are now calculated
    const accounts = await window.api.getSalesMotionAccounts();
    const withMotion2 = accounts.filter(a => a.motion_2_potential_best != null);
    console.log(`\n📊 Accounts with Motion 2 potential: ${withMotion2.length}`);
  } else {
    console.log('❌ Import cancelled');
  }
})();
```

**When the file dialog opens, select:** `test-volumes.csv`

### Step 6: Check Database Directly

```bash
sqlite3 ~/Library/Application\ Support/Dealia/deals.db "SELECT crm_account_id, account_name, num_agents, motion_1_potential, total_potential_best, priority_tier FROM sales_motion_accounts;"
```

## 🎯 Expected Results

### After Motion 1 Import:
- 5 accounts inserted
- Each has `motion_1_potential` calculated (Copilot: agents × 12 × price)
- ACC001 (LATAM, 150 agents): ~$27,000
- ACC002 (US, 45 agents): ~$16,200
- ACC003 (EMEA, 200 agents): ~$72,000
- ACC004 (Brazil, 25 agents): ~$4,500
- ACC005 (US, 350 agents): ~$126,000

### After Volumes Import:
- All 5 accounts updated
- Volume fields populated
- Motion 2 potentials still NULL (because accounts aren't in Motion 2)
- To test Motion 2, you'd need to import those accounts via Motion 2 CSV

## ❓ Troubleshooting

### Import returns null
- File dialog was cancelled
- Try running the command again

### Errors in result
- Check `result.errors` array
- Verify CSV format (tab-separated)
- Check column headers match expected names

### No accounts showing
- Run: `await window.api.getSalesMotionAccounts()`
- Check database directly with sqlite3 command above
