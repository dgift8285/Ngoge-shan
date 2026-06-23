export const name = 'menu';
export const category = 'General';
export const description = 'Show all commands';

export async function execute({ sock, msg, from, PREFIX }) {
  const text = `
*┌─❖*
*│NGOGE SHAN MD*
*└┬❖*
   *│🤖 SwiftBot Tec*
   *└────────┈❖*
▬▬▬▬▬▬▬▬▬▬
> ⌨️ ᴘʀᴇꜰɪx: ${PREFIX}
> 🟢 ꜱᴛᴀᴛᴜꜱ: Online
> 📚 ᴄᴏᴍᴍᴀɴᴅꜱ: 5
> 👑 ᴏᴡɴᴇʀ: Ngoge Shan
▬▬▬▬▬▬▬▬▬▬

*📋 MENU OPTIONS*

*1.* 🔧 GENERAL MENU

_Reply with a number to access that section_

📢 *Channel:*
https://whatsapp.com/channel/0029Vb86btmI1rci3S1NUA0G
`.trim();

  await sock.sendMessage(from, { text }, { quoted: msg });
}