/**
 * Mock feed — timer-driven fake chat messages for local development.
 * Tree-shaken from production builds (imported only in dev mode).
 */

import type { BadgeKey, BadgeTags } from "./badges";

interface MockSender {
  name: string;
  displayName: string;
  color: string;
  badges: BadgeKey[];
}

function tagsFromBadges(badges: BadgeKey[]): BadgeTags {
  const tags: Record<string, string> = {};
  for (const b of badges) tags[b] = "1";
  return tags as BadgeTags;
}

const SENDERS: MockSender[] = [
  { name: "nightbot", displayName: "Nightbot", color: "#2E8B57", badges: ["moderator"] },
  {
    name: "streamelements",
    displayName: "StreamElements",
    color: "#8A2BE2",
    badges: ["vip", "turbo"],
  },
  {
    name: "pokemoncommunitygame",
    displayName: "PokemonCommunityGame",
    color: "#DAA520",
    badges: ["broadcaster"],
  },
  { name: "fossabot", displayName: "Fossabot", color: "#FF6347", badges: ["subscriber", "bits"] },
  {
    name: "knight_owl",
    displayName: "Knight_Owl",
    color: "#1E90FF",
    badges: ["moderator", "subscriber"],
  },
  {
    name: "chatterbox42",
    displayName: "Chatterbox42",
    color: "#FF69B4",
    badges: ["vip", "subscriber", "premium"],
  },
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

function dispatchMessage(user: MockSender, body: string): void {
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
          ...tagsFromBadges(user.badges),
        },
        messageId: crypto.randomUUID(),
      },
    }),
  );
}

/**
 * Fire one immediate message on load so the widget isn't empty.
 * Then begin a timer-driven feed at varying intervals.
 */
export function startMockFeed(): () => void {
  // Immediate render — issue #8: "One hardcoded mock event fires on page load"
  const first = pick(SENDERS);
  dispatchMessage(first, pick(MESSAGES));

  let running = true;
  let timer: number | null = null;

  function tick(): void {
    if (!running) return;
    const user = pick(SENDERS);
    dispatchMessage(user, pick(MESSAGES));
    timer = window.setTimeout(tick, randomDelay(800, 2000));
  }

  timer = window.setTimeout(tick, randomDelay(1500, 3000));
  return () => {
    running = false;
    if (timer !== null) window.clearTimeout(timer);
  };
}
