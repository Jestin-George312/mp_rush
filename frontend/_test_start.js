const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '_test_output.log');
fs.writeFileSync(logFile, 'Starting vite...\n');

const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173'], {
    cwd: __dirname,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' }
});

vite.stdout.on('data', (data) => {
    fs.appendFileSync(logFile, `STDOUT: ${data}`);
});

vite.stderr.on('data', (data) => {
    fs.appendFileSync(logFile, `STDERR: ${data}`);
});

vite.on('error', (err) => {
    fs.appendFileSync(logFile, `ERROR: ${err.message}\n`);
});

vite.on('close', (code) => {
    fs.appendFileSync(logFile, `Process exited with code ${code}\n`);
});

// Keep the script alive
setTimeout(() => { }, 60000);
