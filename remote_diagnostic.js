const { Client } = require('ssh2');
const conn = new Client();
console.log('Connecting to VPS for diagnostics...');
conn.on('ready', () => {
  console.log('Connected! Fetching remote PM2 logs...');
  conn.exec('pm2 status', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('\n--- DIAGNOSTIC FINISHED ---');
      conn.end();
    }).on('data', (d) => process.stdout.write(d)).stderr.on('data', (d) => process.stderr.write(d));
  });
}).on('error', (err) => console.error(err)).connect({
  host: '103.7.40.77',
  port: 22,
  username: 'root',
  password: 'UfCeG3hEx8rC'
});
