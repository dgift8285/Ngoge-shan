import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREFIX = process.env.PREFIX || '.';
const OWNER = process.env.OWNER || '';

const commands = new Map();
const observers = [];

// ─── Load Commands ────────────────────────────────────────────────────────────
async function loadCommands() {
  const cmdDir = path.join(__dirname, '../commands');
  if (!fs.existsSync(cmdDir)) {
    fs.mkdirSync(cmdDir, { recursive: true });
    return;
  }

  function readRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readRecursive(fullPath);
      } else if (entry.name.endsWith('.js')) {
        loadFile(fullPath);
      }
    }
  }

  async function loadFile(filePath) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
      if (!mod.name) {
        console.log(`⚠️  Skipped ${path.basename(filePath)}: missing export name`);
        return;
      }
      const names = Array.isArray(mod.name) ? mod.name : [mod.name];
      for (const n of names) {
        if (commands.has(n)) {
          console.log(`⚠️  Duplicate command skipped: ${n} in ${path.basename(filePath)}`);
          continue;
        }
        commands.set(n, mod);
      }
      console.log(`✅ Loaded: ${names[0]} [${mod.category || 'General'}]`);
    } catch (e) {
      console.error(`❌ FAILED ${path.basename(filePath)}: ${e.message}`);
      console.error(e.stack);
    }
  }

  readRecursive(cmdDir);
}

// ─── Load Observers ───────────────────────────────────────────────────────────
async function loadObservers() {
  const obsDir = path.join(__dirname, '../observers');
  if (!fs.existsSync(obsDir)) {
    fs.mkdirSync(obsDir, { recursive: true });
    return;
  }
  const files = fs.readdirSync(obsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(path.join(obsDir, file)).href);
      if (mod.default) {
        observers.push(mod.default);
        console.log(`👁️  Observer loaded: ${file}`);
      }
    } catch (e) {
      console.error(`❌ Observer FAILED ${file}: ${e.message}`);
    }
  }
}

// ─── LID to JID Resolver ─────────────────────────────────────────────────────
function resolveLidToJid(participant, groupMetadata) {
  if (!participant) return participant;
  if (participant.endsWith('@s.whatsapp.net')) return participant;
  if (participant.endsWith('@lid') && groupMetadata?.participants) {
    const match = groupMetadata.participants.find(p => p.lid === participant);
    if (match) return match.id;
  }
  return participant;
}

// ─── Get All Commands ─────────────────────────────────────────────────────────
export function getAllCommands() {
  return commands;
}

// ─── Handle Message ───────────────────────────────────────────────────────────
export async function handleMessage(sock, msg) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from?.endsWith('@g.us');
    const sender = isGroup
      ? msg.key.participant || msg.pushName
      : msg.key.remoteJid;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption || '';

    const isOwner = sender?.includes(OWNER);

    // ─── Admin Check ──────────────────────────────────────────────────────
    let isAdmin = false;
    let isBotAdmin = false;
    let groupMetadata = null;

    if (isGroup) {
      try {
        groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const senderId = resolveLidToJid(sender, groupMetadata);

        isAdmin = participants.some(
          p => resolveLidToJid(p.id, groupMetadata) === senderId &&
          (p.admin === 'admin' || p.admin === 'superadmin')
        );
        isBotAdmin = participants.some(
          p => resolveLidToJid(p.id, groupMetadata) === botId &&
          (p.admin === 'admin' || p.admin === 'superadmin')
        );
      } catch {}
    }

    // ─── Run Observers ────────────────────────────────────────────────────
    for (const obs of observers) {
      try {
        await obs(sock, msg, { from, sender, isGroup, isOwner, isAdmin, isBotAdmin, groupMetadata });
      } catch (e) {
        console.error('❌ Observer error:', e.message);
      }
    }

    // ─── Command Handler ──────────────────────────────────────────────────
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) return;

    await command.execute({
      sock,
      msg,
      from,
      sender,
      args,
      isOwner,
      isAdmin,
      isBotAdmin,
      groupMetadata,
      PREFIX,
      OWNER,
    });

  } catch (e) {
    console.error('❌ handleMessage error:', e.message);
    console.error(e.stack);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
await loadCommands();
await loadObservers();