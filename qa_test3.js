/**
 * QA Test 3: Full perk card flow
 * - Join at level 3
 * - Watch for natural level up to level 4 (collect orbs) OR manually check state
 * - Verify perk_choice packet arrives
 * - Wait for server auto-pick (10s timeout)
 * - Verify close_modals and announcement
 */
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000';
let ws;
let myId = null;
let stepsDone = [];
let stateCount = 0;

function log(msg) {
  console.log(`[QA3] ${new Date().toISOString()} - ${msg}`);
}

ws = new WebSocket(WS_URL, {
  rejectUnauthorized: false,
  headers: { 'Origin': 'https://flipfight.com' }
});

ws.on('open', () => {
  log('WebSocket connected!');
  // Join at level 4 - next orb collection should push to level 5 OR we can test perk at this level
  // Actually let's join at level 6 to test perk_choice (level 6+ gets perk on each level up)
  ws.send(JSON.stringify({ type: 'join', name: 'ff_lvl_6_QAPerk' }));
  log('Joined at level 6 to test perk choice on next level up...');
  stepsDone.push('CONNECTED');
});

let lastLevel = 0;

ws.on('message', (raw) => {
  let d;
  try { d = JSON.parse(raw); } catch { return; }

  if (d.type === 'init') {
    myId = d.id;
    log(`Got init! myId = ${myId}`);
    stepsDone.push('GOT_INIT');
  } else if (d.type === 'state') {
    stateCount++;
    const me = d.players[myId];
    if (me) {
      if (stateCount === 1) {
        log(`First state: lvl=${me.lvl}, brnch=${me.brnch}, exp=${me.exp}, nxp=${me.nxp}, pndPrks=${JSON.stringify(me.pndPrks)}`);
        lastLevel = me.lvl;
        stepsDone.push('FIRST_STATE_LVL_' + me.lvl);
      }
      if (me.lvl !== lastLevel) {
        log(`Level changed: ${lastLevel} → ${me.lvl}`);
        lastLevel = me.lvl;
        stepsDone.push('LEVEL_UP_TO_' + me.lvl);
      }
      if (stateCount % 40 === 0) {
        log(`State #${stateCount}: lvl=${me.lvl}, brnch=${me.brnch}, pndPrks=${JSON.stringify(me.pndPrks)}`);
      }
    }
  } else if (d.type === 'evolution_choice') {
    log(`✅ evolution_choice received! timeout=${d.timeout}ms`);
    stepsDone.push('EVOLUTION_CHOICE_RECEIVED');
  } else if (d.type === 'perk_choice') {
    log(`✅ perk_choice received! choices=${JSON.stringify(d.choices)}`);
    stepsDone.push('PERK_CHOICE_RECEIVED');
    log('Waiting for auto-pick (10s server timeout)...');
  } else if (d.type === 'close_modals') {
    log(`✅ close_modals received! Server auto-picked.`);
    stepsDone.push('CLOSE_MODALS_RECEIVED');
    setTimeout(() => { ws.close(); }, 2000);
  } else if (d.type === 'announcement') {
    log(`📢 ${d.text}`);
    if (d.text.includes('auto-selected Perk') || d.text.includes('Perk:')) {
      stepsDone.push('PERK_AUTO_PICKED');
    }
  }
});

ws.on('close', (code) => {
  log(`WebSocket closed: code=${code}`);
  log('=== QA3 COMPLETE ===');
  stepsDone.forEach(s => log(`  ✓ ${s}`));
});

ws.on('error', (err) => {
  log(`ERROR: ${err.message}`);
  process.exit(1);
});

// 20s timeout
setTimeout(() => {
  log('20s timeout reached. Steps: ' + stepsDone.join(', '));
  ws.close();
}, 20000);
