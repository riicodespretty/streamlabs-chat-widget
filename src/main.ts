import "./style.css";

interface ChatMessageEvent {
  type: "chatmessage";
  command: "PRIVMSG";
  from: string;
  body: string;
  tags: {
    "display-name"?: string;
    color?: string;
    broadcaster?: string;
    moderator?: string;
    subscriber?: string;
    vip?: string;
    turbo?: string;
    premium?: string;
    bits?: string;
  };
  messageId: string;
}

interface BadgeDef {
  key: keyof ChatMessageEvent["tags"];
  src: string;
  type: string;
  title: string;
}

// Public CDN badge images matching the baseline #badge_item template.
// Extracted from Streamlabs Chat Box widget preview — scale /1 (18×18px).
const BADGE_MAP: BadgeDef[] = [
  {
    key: "broadcaster",
    src: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1",
    type: "broadcaster",
    title: "Broadcaster",
  },
  {
    key: "moderator",
    src: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1",
    type: "moderator",
    title: "Moderator",
  },
  {
    key: "vip",
    src: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1",
    type: "vip",
    title: "VIP",
  },
  {
    key: "subscriber",
    src: "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1",
    type: "subscriber",
    title: "Subscriber",
  },
  {
    key: "turbo",
    src: "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/1",
    type: "turbo",
    title: "Turbo",
  },
  {
    key: "premium",
    src: "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/1",
    type: "premium",
    title: "Prime",
  },
  {
    key: "bits",
    src: "https://static-cdn.jtvnw.net/badges/v1/09d93036-e7ce-431c-9a9e-7044297133f2/1",
    type: "bits",
    title: "Bits",
  },
];

function renderBadges(tags: ChatMessageEvent["tags"]): string {
  return BADGE_MAP.filter((b) => tags[b.key] === "1")
    .map((b) => `<img src="${b.src}" class="badge ${b.type}-icon" title="${b.title}" />`)
    .join("");
}

/**
 * Render a chat message by cloning the baseline Chat Box template and replacing tokens.
 * Matches the Streamlabs default template structure: color on .meta span,
 * badges inserted via DOM after insertion, data-from/data-id attributes.
 */
function renderMessage(detail: ChatMessageEvent): void {
  const template = document.getElementById("chatlist_item") as HTMLTemplateElement | null;
  if (!template) return;

  const log = document.getElementById("log");
  if (!log) return;

  const tags = detail.tags;
  const displayName = tags["display-name"] ?? detail.from;
  const color = tags.color ?? "#ffffff";

  let html = template.innerHTML;
  html = html.replace(/\{from\}/g, displayName);
  html = html.replace(/\{color\}/g, color);
  html = html.replace(/\{message\}/g, detail.body);
  html = html.replace(/\{messageId\}/g, detail.messageId);

  log.insertAdjacentHTML("beforeend", html);

  // In production, Streamlabs populates the .badges span from the #badge_item template.
  // In dev, we insert badge images into the last inserted message.
  const messages = log.querySelectorAll("[data-id]");
  const lastMsg = messages[messages.length - 1] as HTMLElement | undefined;
  if (lastMsg) {
    const badgesEl = lastMsg.querySelector(".badges");
    if (badgesEl) {
      badgesEl.innerHTML = renderBadges(tags);
    }
  }
}

window.addEventListener("onEventReceived", ((event: CustomEvent) => {
  const detail = event.detail as ChatMessageEvent;
  if (detail.type === "chatmessage" && detail.command === "PRIVMSG") {
    renderMessage(detail);
  }
}) as EventListener);

import { startMockFeed } from "./mock-feed";

// Mock feed only runs in dev — stripped by the build plugin for production
void (import.meta.env.DEV && startMockFeed());
