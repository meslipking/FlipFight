const WebSocket = require('ws');

const WS_URL = 'wss://flipfight.com';
let ws;
let myId = null;
let stepsDone = [];
let stateCount = 0;

function log(msg) {
  console.log(`[QA] ${new Date().toISOString()} - ${msg}`);
}

ws = new WebSocket(WS_URL, {
  rejectUnauthorized: false,
  headers: { 'Origin': 'https://flipfight.com' }
});

ws.on('open', () => {
  log('WebSocket connected!');
  // Join at level 3 to test perk_choice on level up via orbs
  ws.send(JSON.stringify({ type: 'join', name: 'ff_lvl_5_QAEvo' }));
  log('Joined at level 5 to test evolution modal...');
  stepsDone.push('CONNECTED');
});

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
    if (me && stateCount % 20 === 0) {
      log(`State #${stateCount}: lvl=${me.lvl}, brnch=${me.brnch}, pndPrks=${JSON.stringify(me.pndPrks)}`);
    }
  } else if (d.type === 'evolution_choice') {
    log(`✅ evolution_choice received! timeout=${d.timeout}ms`);
    stepsDone.push('EVOLUTION_CHOICE_RECEIVED');
    log('Waiting for auto-pick (10s server timeout)...');
  } else if (d.type === 'perk_choice') {
    log(`✅ perk_choice received: ${JSON.stringify(d.choices)}`);
    stepsDone.push('PERK_CHOICE_RECEIVED');
  } else if (d.type === 'close_modals') {
    log(`✅ close_modals received! Server auto-picked.`);
    stepsDone.push('CLOSE_MODALS_RECEIVED');
    
    // Check final state
    setTimeout(() => {
      const me_state = stateCount;
      log(`Final state check: ${me_state} states processed`);
      log('=== QA SUMMARY ===');
      stepsDone.forEach(s => log(`  ✓ ${s}`));
      ws.close();
    }, 2000);
  } else if (d.type === 'announcement') {
    log(`📢 ${d.text}`);
    if (d.text.includes('auto-evolved') || d.text.includes('auto-selected')) {
      stepsDone.push('AUTO_PICK_ANNOUNCEMENT');
    }
  }
});

ws.on('close', (code) => {
  log(`WebSocket closed: code=${code}`);
  log('=== QA CHECK COMPLETE ===');
  log('Steps: ' + stepsDone.join(', '));
});

ws.on('error', (err) => {
  log(`ERROR: ${err.message}`);
  process.exit(1);
});

// Overall timeout: 20s (10s for server auto-pick + buffer)
setTimeout(() => {
  log('Overall 20s timeout reached');
  log('Steps done so far: ' + stepsDone.join(', '));
  ws.close();
}, 20000);
