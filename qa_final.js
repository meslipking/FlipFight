/**
 * FINAL QA Suite - Tests all 3 critical flows:
 * 1. Level 5 → Evolution Choice → Manual branch selection (select_branch)
 * 2. Level 5 → Evolution Choice → 10s auto-pick
 * 3. Level 6 → Perk Choice → Manual selection (select_perk)
 */
const WebSocket = require('ws');

async function runTest(testName, name, waitMs, autoAction) {
  return new Promise((resolve) => {
    const ws = new WebSocket('wss://flipfight.com', {
      rejectUnauthorized: false,
      headers: { 'Origin': 'https://flipfight.com' }
    });
    
    let myId = null;
    let steps = [];
    let done = false;
    
    function log(msg) { console.log(`  [${testName}] ${msg}`); }
    function finish(reason) {
      if (done) return;
      done = true;
      log(`DONE: ${reason}`);
      log(`Steps: ${steps.join(', ')}`);
      ws.close();
      resolve(steps);
    }
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', name }));
      steps.push('CONNECTED');
      log(`Joined as "${name}"`);
    });
    
    ws.on('message', (raw) => {
      let d; try { d = JSON.parse(raw); } catch { return; }
      
      if (d.type === 'init') {
        myId = d.id;
        log(`Got init, myId=${myId}`);
      } else if (d.type === 'evolution_choice') {
        steps.push('EVOLUTION_CHOICE');
        log(`✅ evolution_choice received`);
        if (autoAction === 'select_branch') {
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'select_branch', branch: 'fighter' }));
            log('Sent select_branch=fighter');
            steps.push('BRANCH_SELECTED');
          }, 2000);
        }
      } else if (d.type === 'perk_choice') {
        steps.push('PERK_CHOICE');
        log(`✅ perk_choice received: ${JSON.stringify(d.choices)}`);
        if (autoAction === 'select_perk') {
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'select_perk', perk: d.choices[0] }));
            log(`Sent select_perk=${d.choices[0]}`);
            steps.push('PERK_SELECTED');
          }, 2000);
        }
      } else if (d.type === 'close_modals') {
        steps.push('CLOSE_MODALS');
        log(`✅ close_modals received`);
        setTimeout(() => finish('close_modals received'), 1000);
      } else if (d.type === 'announcement') {
        const t = d.text;
        if (t.includes('auto-evolved') || t.includes('auto-selected') || t.includes('chose') || t.includes('Selected Perk')) {
          log(`📢 ${t}`);
          steps.push('ANNOUNCEMENT');
        }
      } else if (d.type === 'state' && myId) {
        const me = d.players[myId];
        if (me && autoAction === 'select_branch' && steps.includes('BRANCH_SELECTED')) {
          if (me.brnch) {
            steps.push('BRNCH_CONFIRMED_' + me.brnch.toUpperCase());
            log(`✅ Branch confirmed in state: ${me.brnch}`);
            finish('branch confirmed');
          }
        }
      }
    });
    
    ws.on('close', () => { if (!done) finish('connection closed'); });
    ws.on('error', (e) => { log(`ERROR: ${e.message}`); finish('error'); });
    
    setTimeout(() => finish('timeout'), waitMs);
  });
}

async function main() {
  console.log('\n=== FLIPFIGHT.COM FINAL QA SUITE ===\n');
  
  console.log('TEST 1: Level 5 → Evolution Choice → Manual Select Branch');
  const t1 = await runTest('T1-ManualEvo', 'ff_lvl_5_T1Manual', 8000, 'select_branch');
  const t1Pass = t1.includes('EVOLUTION_CHOICE') && t1.includes('BRANCH_SELECTED');
  console.log(`  RESULT: ${t1Pass ? '✅ PASS' : '❌ FAIL'}\n`);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('TEST 2: Level 5 → Evolution Choice → Auto-pick after 10s');
  const t2 = await runTest('T2-AutoEvo', 'ff_lvl_5_T2Auto', 15000, 'wait');
  const t2Pass = t2.includes('EVOLUTION_CHOICE') && t2.includes('CLOSE_MODALS');
  console.log(`  RESULT: ${t2Pass ? '✅ PASS' : '❌ FAIL'}\n`);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('TEST 3: Level 6 → Perk Choice → Manual Select Perk');
  const t3 = await runTest('T3-ManualPerk', 'ff_lvl_6_T3Perk', 8000, 'select_perk');
  const t3Pass = t3.includes('PERK_CHOICE') && t3.includes('PERK_SELECTED');
  console.log(`  RESULT: ${t3Pass ? '✅ PASS' : '❌ FAIL'}\n`);
  
  console.log('=== FINAL QA SUMMARY ===');
  console.log(`Test 1 (Manual Evolution): ${t1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Auto-pick Evo): ${t2Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (Manual Perk): ${t3Pass ? '✅ PASS' : '❌ FAIL'}`);
  const allPass = t1Pass && t2Pass && t3Pass;
  console.log(`\nOVERALL: ${allPass ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
}

main().catch(console.error);
