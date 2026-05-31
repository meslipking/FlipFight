const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting...');
conn.on('ready', () => {
  console.log('Connected!');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading...');
    sftp.fastPut('./release.tar.gz', '/root/flipfight/release.tar.gz', (err) => {
      if (err) throw err;
      console.log('Upload done, restarting...');
      conn.exec('cd /root/flipfight && tar -xzf release.tar.gz && PORT=3000 pm2 restart flipfight --update-env && pm2 flush && (sync && sysctl -w vm.drop_caches=3 || true) && (systemctl restart nginx || true)', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('Done!');
          conn.end();
          process.exit(0);
        }).on('data', (d) => process.stdout.write(d)).stderr.on('data', (d) => process.stderr.write(d));
      });
    });
  });
}).on('error', (err) => console.error(err)).connect({
  host: '103.7.40.77', port: 22, username: 'root', password: 'UfCeG3hEx8rC'
});
