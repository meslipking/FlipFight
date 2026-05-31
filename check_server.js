const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected! Checking server status...');
  conn.exec('tail -n 50 /root/.pm2/logs/flipfight-error.log 2>&1; echo "---"; tail -n 50 /root/.pm2/logs/flipfight-out.log 2>&1', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (d) => process.stdout.write(d)).stderr.on('data', (d) => process.stderr.write(d));
  });
}).on('error', (err) => console.error(err)).connect({
  host: '103.7.40.77',
  port: 22,
  username: 'root',
  password: 'UfCeG3hEx8rC'
});
