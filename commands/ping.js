export const name = 'ping';
export const category = 'General';
export const description = 'Check if bot is online';

export async function execute({ sock, msg, from }) {
  await sock.sendMessage(from, { text: '🏓 Pong! Ngoge Shan MD is alive!' }, { quoted: msg });
}