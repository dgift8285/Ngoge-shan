export const name = 'joke';
export const category = 'General';
export const description = 'Get a random joke';

const jokes = [
  "Why don't scientists trust atoms?\nBecause they make up everything! 😂",
  "Why did the scarecrow win an award?\nBecause he was outstanding in his field! 🌾",
  "Why don't eggs tell jokes?\nThey'd crack each other up! 🥚",
  "What do you call a fish without eyes?\nA fsh! 🐟",
  "Why did the math book look so sad?\nBecause it had too many problems! 📚",
  "What do you call a sleeping dinosaur?\nA dino-snore! 🦕",
  "Why can't you give Elsa a balloon?\nBecause she'll let it go! 🎈",
  "What did the ocean say to the beach?\nNothing, it just waved! 🌊",
  "Why did the bicycle fall over?\nBecause it was two-tired! 🚲",
  "What do you call cheese that isn't yours?\nNacho cheese! 🧀"
];

export async function execute({ sock, msg, from }) {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  await sock.sendMessage(from, { text: `😂 *Random Joke*\n\n${joke}` }, { quoted: msg });
}