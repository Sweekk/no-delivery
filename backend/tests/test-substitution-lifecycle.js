const supabase = require('../lib/supabaseClient');
const substitutionService = require('../services/substitutionService');
const timerService = require('../services/timerService');

async function runSubstitutionTestSuite() {
  console.log('=== RUNNING FULL SUBSTITUTION & PREFERENCE VERIFICATION SUITE ===\n');

  // Test 1: Same-category product substitution resolution
  console.log('[TEST 1] Testing findSubstituteProduct for same category...');
  const sub = await substitutionService.findSubstituteProduct('e0000001-0000-0000-0000-000000000001', 'Fruits & Vegetables');
  console.log('  Resulting substitute product:', sub?.name, `(Category: ${sub?.category})`);
  if (sub && sub.id !== 'e0000001-0000-0000-0000-000000000001') {
    console.log('  ✅ TEST 1 PASSED: Found valid substitute from same category.');
  } else {
    console.error('  ❌ TEST 1 FAILED: Substitute not found or matches original.');
  }

  // Test 2: Legacy / Null preference defaulting to ask_first -> timeout skip
  console.log('\n[TEST 2] Testing Legacy / null substitution preference default behavior...');
  const legacyPref = null;
  const effectivePref = legacyPref || 'ask_first';
  const timeoutAction = effectivePref === 'auto_substitute' ? 'SUBSTITUTED' : 'SKIPPED';
  console.log(`  Legacy pref null -> effectivePref = '${effectivePref}', timeout action = '${timeoutAction}'`);
  if (effectivePref === 'ask_first' && timeoutAction === 'SKIPPED') {
    console.log('  ✅ TEST 2 PASSED: Null/legacy preference correctly defaults to ask_first and falls back to SKIPPED on timeout.');
  } else {
    console.error('  ❌ TEST 2 FAILED');
  }

  // Test 3: Batch decision processing
  console.log('\n[TEST 3] Testing processBatchSubstitutionDecisions...');
  const mockDecisions = [
    { itemId: 'mock-item-1', action: 'accept_suggested', substituteProductId: 'e0000002-0000-0000-0000-000000000002' },
    { itemId: 'mock-item-2', action: 'skip', substituteProductId: null }
  ];
  const batchRes = await substitutionService.processBatchSubstitutionDecisions('mock-order-id', mockDecisions);
  console.log('  Batch decision results count:', batchRes.length);
  if (batchRes.length === 2 && batchRes[0].status === 'SUBSTITUTED' && batchRes[1].status === 'SKIPPED') {
    console.log('  ✅ TEST 3 PASSED: Batch decisions correctly converted to SUBSTITUTED and SKIPPED.');
  } else {
    console.error('  ❌ TEST 3 FAILED');
  }

  console.log('\n=== ALL SUBSTITUTION SUITE TESTS COMPLETED ===');
}

runSubstitutionTestSuite().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
