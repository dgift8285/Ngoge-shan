import ws from 'ws';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const pino = require('pino');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  realtime: { transport: ws }
});

const SESSION_ID = 'ngoge-shan-session';
const SESSION_DIR = path.join(__dirname, 'session');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.json({ status: 'Ngoge Shan MD is running ✅', brand: 'SwiftBot Tec' });
});

// ─── Supabase Session Sync ────────────────────────────────────────────────────

async function uploadSession() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return;
    const zip = new AdmZip();
    zip.addLocalFolder(SESSION_DIR);
    const data = zip.toBuffer().toString('base64');
    await supabase.from('bu_sessions').upsert({ id: SESSION_ID, data });
    console.log('☁️  Session saved to Supabase');
  } catch (e) {
    console.error('❌ Upload session error:', e.message);
  }
}

async function downloadSession() {
  try {
    const { data, error } = await supabase
      .from('bu_sessions')
      .select('data')
      .eq('id', SESSION_ID)
      .single();
    if (error || !data?.data) return false;
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
    const zip = new AdmZip(Buffer.from(data.data, 'base64'));
    zip.extractAllTo(SESSION_DIR, true);
    console.log('📥 Session loaded from Supabase');
    return true;
  } catch (e) {
    console.error('❌ Download session error:', e.message);
    return false;
  }
}

// ─── Throttle uploads (max once per 2 minutes) ────────────────────────────────
let lastUpload = 0;
function throttledUpload() {
  const now = Date.now();
  if (now - lastUpload > 2 * 60 * 1000) {
    lastUpload = now;
    uploadSession();
  }
}

// ─── Main Bot Function ────────────────────────────────────────────────────────
async function startBot() {
  await downloadSession();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    syncFullHistory: false,
    fireInitQueries: false,
    markOnlineOnConnect: true,
  });

  // ─── Pair Code Support ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    socket.on('request-pair', async (number) => {
      try {
        if (!sock.authState.creds.registered) {
          const code = await sock.requestPairingCode(number);
          socket.emit('pair-code', code);
        }
      } catch (e) {
        socket.emit('pair-error', e.message);
      }
    });
  });

  // ─── Connection Updates ───────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 QR Code received');
      io.emit('qr', qr);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || '';

      if (reason.toLowerCase().includes('conflict')) {
        console.log('⚠️  Stream conflict detected. Stopping this instance...');
        process.exit(0);
      }

      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`🔄 Reconnecting: ${shouldReconnect} (code: ${code})`);
      if (shouldReconnect) setTimeout(startBot, 5000);
    }

    if (connection === 'open') {
      console.log('✅ Ngoge Shan MD connected!');
      await uploadSession();
      await sock.sendMessage(process.env.OWNER + '@s.whatsapp.net', {
        text: `✅ *Ngoge Shan MD* is now online!\n\n> Powered by *SwiftBot Tec*`,
      });
    }
  });

  // ─── Save Creds ───────────────────────────────────────────────────────────
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    throttledUpload();
  });

  // ─── Messages ─────────────────────────────────────────────────────────────
  const { handleMessage } = await import('./lib/router.js');
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      await handleMessage(sock, msg);
    }
  });
}

httpServer.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

startBot();