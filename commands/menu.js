export const name = 'menu';
export const category = 'General';
export const description = 'Show all commands';

export async function execute({ sock, msg, from, PREFIX }) {
  const text = `
╔═══════════════════╗
║   *Ngoge Shan MD*   ║
║   _SwiftBot Tec_    ║
╚═══════════════════╝

*🔧 General*
▸ ${PREFIX}menu - Show this menu
▸ ${PREFIX}ping - Check bot status
▸ ${PREFIX}info - Bot information

📢 *Join our WhatsApp Channel:*
https://whatsapp.com/channel/0029Vb86btmI1rci3S1NUA0G
`.trim();

  await sock.sendMessage(from, { text }, { quoted: msg });
}