const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'join', name: 'Test' }));
});
ws.on('message', data => {
  const msg = JSON.parse(data);
  if (msg.type !== 'state') console.log('Received:', msg.type);
});
ws.on('close', () => console.log('Closed'));
ws.on('error', err => console.error('Error:', err));
