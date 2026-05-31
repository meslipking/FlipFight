const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connected! Running diagnostics on flipfight app...');
  conn.exec('echo "=== RAM USAGE ===" && free -h && echo "" && echo "=== DISK SPACE ===" && df -h / && echo "" && echo "=== CPU LOAD AVERAGE ===" && uptime && echo "" && pm2 status && echo "=== OUT LOG ===" && tail -n 30 /root/.pm2/logs/flipfight-out.log && echo "=== ERROR LOG ===" && tail -n 30 /root/.pm2/logs/flipfight-error.log', (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '103.7.40.77',
  port: 22,
  username: 'root',
  password: 'UfCeG3hEx8rC'
});
