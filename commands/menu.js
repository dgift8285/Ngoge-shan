export const name = 'menu';
export const category = 'General';
export const description = 'Show all commands';

export async function execute({ sock, msg, from, PREFIX }) {
  const text = `
┏━━━━━━━━━━━━━━━━━━━┓
┃   *🤖 NGOGE SHAN MD*   ┃
┃    _SwiftBot Tec_     ┃
┗━━━━━━━━━━━━━━━━━━━┛

┏━━━ *🔧 GENERAL* ━━━┓
┃
┃ ${PREFIX}ping - Check bot status
┃ ${PREFIX}info - Bot information
┃ ${PREFIX}joke - Random joke
┃ ${PREFIX}v - viewonce
┃ ${PREFIX}menu - Show this menu
┃
┗━━━━━━━━━━━━━━━━━━━┛

📢 *Join our Channel:*
https://whatsapp.com/channel/0029Vb86btmI1rci3S1NUA0G
`.trim();

  await sock.sendMessage(from, { text }, { quoted: msg });
}