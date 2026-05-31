const { Client } = require('ssh2');
const fs = require('fs');

// Load env vars from .env file for security
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  });
}

const vpsPassword = process.env.VPS_PASSWORD;
if (!vpsPassword) {
  console.error('Error: VPS_PASSWORD is not set in environment or .env file!');
  process.exit(1);
}

const conn = new Client();
console.log('Connecting to server 103.7.40.77...');

conn.on('ready', () => {
  console.log('Connected to remote server! Creating directory...');
  conn.exec('mkdir -p /root/flipfight', (err, stream) => {
      if (err) {
        console.error('Error creating directory:', err);
        conn.end();
        return;
      }
      stream.resume(); // Ensure stream flows so close event fires
      stream.on('close', () => {
          console.log('Directory /root/flipfight verified/created.');
          conn.sftp((err, sftp) => {
            if (err) {
              console.error('SFTP error:', err);
              conn.end();
              return;
            }
            console.log('SFTP session started. Uploading release.tar.gz...');
            
            try {
              const stats = fs.statSync('./release.tar.gz');
              console.log(`Local file size: ${stats.size} bytes`);
            } catch (e) {
              console.error('Error reading local release.tar.gz stats:', e.message);
            }
            
            sftp.fastPut('./release.tar.gz', '/root/flipfight/release.tar.gz', (err) => {
              if (err) {
                console.error('Upload failed:', err);
                conn.end();
                return;
              }
              console.log('Upload complete! Extracting files and restarting game...');
              
              const cmd = `
                cd /root/flipfight && 
                tar -xzf release.tar.gz && 
                PORT=3000 pm2 restart flipfight --update-env && 
                pm2 flush && 
                (sync && sysctl -w vm.drop_caches=3 || true) && 
                (systemctl restart nginx || true)
              `;
              
              console.log('Executing command on VPS...');
              conn.exec(cmd, (err, stream) => {
                if (err) {
                  console.error('Error executing PM2 restart command:', err);
                  conn.end();
                  return;
                }
                stream.on('close', (code, signal) => {
                  console.log(`\n--- DEPLOYMENT FINISHED (Exit code: ${code}) ---`);
                  conn.end();
                }).on('data', (data) => {
                  process.stdout.write(data);
                }).stderr.on('data', (data) => {
                  process.stderr.write(data);
                });
              });
            });
          });
      });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '103.7.40.77',
  port: 22,
  username: 'root',
  password: vpsPassword
});
