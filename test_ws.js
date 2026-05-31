const WebSocket = require('ws');

console.log("Connecting to ws://localhost:4000...");
const ws = new WebSocket('ws://localhost:4000');

let receivedInit = false;
let receivedState = false;

ws.on('open', () => {
  console.log("WebSocket connected. Sending join request...");
  ws.send(JSON.stringify({
    type: 'join',
    name: 'WS_Test'
  }));
});

ws.on('message', (dataStr) => {
  const data = JSON.parse(dataStr);
  console.log(`Received message type: ${data.type}`);
  
  if (data.type === 'init') {
    receivedInit = true;
    console.log(`- Player ID: ${data.id}`);
    console.log(`- Map Size: ${data.mapSize}`);
  }
  
  if (data.type === 'state') {
    receivedState = true;
    console.log(`- Active Players/Bots: ${Object.keys(data.players).length}`);
    console.log(`- Current Leaderboard top hero: ${data.leaderboard[0] ? data.leaderboard[0].name : 'none'}`);
    
    // We have verified everything works. Close the client.
    ws.close();
  }
});

ws.on('close', () => {
  console.log("WebSocket connection closed.");
  if (receivedInit && receivedState) {
    console.log("SUCCESS: WebSocket communication verified!");
    process.exit(0);
  } else {
    console.error("FAIL: Did not receive expected game frames.");
    process.exit(1);
  }
});

ws.on('error', (err) => {
  console.error("WebSocket error:", err);
  process.exit(1);
});

// Set a timeout to prevent hanging
setTimeout(() => {
  console.error("FAIL: Verification timed out.");
  ws.close();
  process.exit(1);
}, 6000);
