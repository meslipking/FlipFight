const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected! Fetching remote PM2 out logs...');
  conn.exec('tail -n 100 /root/.pm2/logs/flipfight-out.log', (err, stream) => {
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
