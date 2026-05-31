const WebSocket = require('ws');

const WS_URL = 'wss://flipfight.com';
let ws;
let myId = null;
let stepsDone = [];
let checksDone = false;

function log(msg) {
  console.log(`[QA] ${new Date().toISOString()} - ${msg}`);
}

ws = new WebSocket(WS_URL, {
  rejectUnauthorized: false,
  headers: { 'Origin': 'https://flipfight.com' }
});

ws.on('open', () => {
  log('WebSocket connected!');
  ws.send(JSON.stringify({ type: 'join', name: 'ff_lvl_5_QATester' }));
  log('Sent join with level 5 cheat code...');
  stepsDone.push('CONNECTED');
});

let stateCount = 0;
let evolutionChoiceReceived = false;

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
        log(`First state packet: lvl=${me.lvl}, brnch=${me.brnch}, hp=${me.hp}`);
        log(`pndPrks in first state: ${JSON.stringify(me.pndPrks)}`);
        stepsDone.push('FIRST_STATE');
      }
      // Check at 5th packet
      if (stateCount === 5) {
        log(`5th state: lvl=${me.lvl}, brnch=${me.brnch}, pndPrks=${JSON.stringify(me.pndPrks)}`);
        stepsDone.push('FIFTH_STATE_OK');
      }
    }
    if (stateCount >= 8 && !checksDone) {
      checksDone = true;
      log('--- QA RESULTS ---');
      stepsDone.forEach(s => log(`  ✓ ${s}`));
      if (!evolutionChoiceReceived) log('  ✗ evolution_choice packet NOT received!');
      ws.close();
    }
  } else if (d.type === 'evolution_choice') {
    log(`✓ evolution_choice received (timeout=${d.timeout}ms)`);
    evolutionChoiceReceived = true;
    stepsDone.push('EVOLUTION_CHOICE_RECEIVED');
  } else if (d.type === 'perk_choice') {
    log(`✓ perk_choice received: choices=${JSON.stringify(d.choices)}`);
    stepsDone.push('PERK_CHOICE_RECEIVED');
  } else if (d.type === 'close_modals') {
    log(`✓ close_modals received (auto-pick happened!)`);
    stepsDone.push('CLOSE_MODALS_RECEIVED');
  } else if (d.type === 'announcement') {
    log(`📢 Announcement: ${d.text}`);
  }
});

ws.on('close', (code) => {
  log(`WebSocket closed: code=${code}`);
  log('=== QA CHECK COMPLETE ===');
  log('Steps completed: ' + stepsDone.join(', '));
});

ws.on('error', (err) => {
  log(`ERROR: ${err.message}`);
  process.exit(1);
});

setTimeout(() => {
  if (!checksDone) {
    log('Timeout - forcing close');
    log('Steps done so far: ' + stepsDone.join(', '));
    ws.close();
  }
}, 15000);
