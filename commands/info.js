export const name = 'info';
export const category = 'General';
export const description = 'Show bot information';

export async function execute({ sock, msg, from }) {
  const text = `
*🤖 Bot Information*

▸ *Name:* Ngoge Shan MD
▸ *Brand:* SwiftBot Tec
▸ *Platform:* WhatsApp
▸ *Library:* Baileys 6.7.18
▸ *Node:* 20.11.1
▸ *Status:* Online ✅
`.trim();

  await sock.sendMessage(from, { text }, { quoted: msg });
}