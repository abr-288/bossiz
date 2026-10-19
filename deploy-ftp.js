import ftp from 'ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge .env.deploy (non suivi par git) si présent, sans dépendance externe.
const envFile = path.join(__dirname, '.env.deploy');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

const required = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  console.error("Définissez-les dans un .env local (non suivi par git) avant de lancer ce script.");
  process.exit(1);
}

const config = {
  host: process.env.FTP_HOST,
  port: Number(process.env.FTP_PORT) || 21,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  remoteDir: process.env.FTP_REMOTE_DIR || '/public_html'
};

const localDir = path.join(__dirname, 'dist');

function uploadFile(client, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    client.put(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function ensureDirectoryExists(client, remotePath) {
  return new Promise((resolve, reject) => {
    client.mkdir(remotePath, true, (err) => {
      if (err && err.code !== 550) reject(err);
      else resolve();
    });
  });
}

async function uploadDirectory(client, localPath, remotePath) {
  const files = fs.readdirSync(localPath);
  
  for (const file of files) {
    const localFilePath = path.join(localPath, file);
    const remoteFilePath = path.join(remotePath, file).replace(/\\/g, '/');
    const stat = fs.statSync(localFilePath);
    
    if (stat.isDirectory()) {
      await ensureDirectoryExists(client, remoteFilePath);
      await uploadDirectory(client, localFilePath, remoteFilePath);
    } else {
      console.log(`Uploading: ${file}`);
      await uploadFile(client, localFilePath, remoteFilePath);
    }
  }
}

async function deploy() {
  const client = new ftp();
  
  return new Promise((resolve, reject) => {
    client.on('ready', async () => {
      console.log('Connected to FTP server');
      
      try {
        await ensureDirectoryExists(client, config.remoteDir);
        await uploadDirectory(client, localDir, config.remoteDir);
        
        console.log('Upload completed successfully');
        client.end();
        resolve();
      } catch (err) {
        console.error('Upload failed:', err);
        client.end();
        reject(err);
      }
    });
    
    client.on('error', (err) => {
      console.error('FTP error:', err);
      reject(err);
    });
    
    client.connect(config);
  });
}

deploy().catch(console.error);
