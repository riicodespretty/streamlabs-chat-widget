/**
 * Mock feed — timer-driven fake chat messages for local development.
 * Tree-shaken from production builds (imported only in dev mode).
 */

interface MockUser {
  name: string;
  displayName: string;
  color: string;
  badges: string[];
}

const USERS: MockUser[] = [
  { name: "nightbot", displayName: "Nightbot", color: "#2E8B57", badges: ["mod"] },
  { name: "streamelements", displayName: "StreamElements", color: "#8A2BE2", badges: ["vip"] },
  {
    name: "pokemoncommunitygame",
    displayName: "PokemonCommunityGame",
    color: "#DAA520",
    badges: [],
  },
  { name: "fossabot", displayName: "Fossabot", color: "#FF6347", badges: ["sub"] },
  { name: "knight_owl", displayName: "Knight_Owl", color: "#1E90FF", badges: ["mod", "sub"] },
  { name: "chatterbox42", displayName: "Chatterbox42", color: "#FF69B4", badges: ["vip", "sub"] },
  { name: "lurker_pro", displayName: "Lurker_Pro", color: "#7FFF00", badges: [] },
];

const MESSAGES: string[] = [
  "Hello, stream!",
  "Kappa Kappa Kappa",
  "PogChamp",
  "LUL",
  "Great play!",
  "That was amazing!",
  "Can you do a flip?",
  "First time here, love the stream!",
  "gg",
  "OMEGALUL",
  "Let's go!",
  "👋",
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function startMockFeed(): () => void {
  let running = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function tick(): void {
    if (!running) return;

    const user = pick(USERS);
    const body = pick(MESSAGES);

    window.dispatchEvent(
      new CustomEvent("onEventReceived", {
        detail: {
          type: "chatmessage",
          command: "PRIVMSG",
          from: user.name,
          body,
          tags: {
            "display-name": user.displayName,
            color: user.color,
            mod: user.badges.includes("mod") ? "1" : "0",
          },
          messageId: crypto.randomUUID(),
        },
      }),
    );

    timer = setTimeout(tick, randomDelay(800, 2000));
  }

  timer = setTimeout(tick, randomDelay(200, 800));
  return () => {
    running = false;
    if (timer !== null) clearTimeout(timer);
  };
}
