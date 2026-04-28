const ADJECTIVES = ['가락', '새벽', '신선한', '부지런한', '빠른', '든든한', '우직한', '날쌘'];
const NOUNS = ['단골꾼', '배달왕', '상하차맨', '트럭기사', '시장통', '새벽별', '짐꾼'];

export function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}
