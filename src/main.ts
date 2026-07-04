import "./style.css";

interface ChatMessageEvent {
  type: "chatmessage";
  command: "PRIVMSG";
  from: string;
  body: string;
  tags: {
    "display-name"?: string;
    color?: string;
    mod?: string;
    subscriber?: string;
    vip?: string;
  };
  messageId: string;
}

interface BadgeDef {
  key: keyof ChatMessageEvent["tags"];
  src: string;
  type: string;
  title: string;
}

// Public CDN badge images matching the baseline #badge_item template format
const BADGE_MAP: BadgeDef[] = [
  {
    key: "mod",
    src: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
    type: "mod",
    title: "Moderator",
  },
  {
    key: "subscriber",
    src: "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e9-8bf2-0eb25a108717/3",
    type: "subscriber",
    title: "Subscriber",
  },
  {
    key: "vip",
    src: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3",
    type: "vip",
    title: "VIP",
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
  // In dev, we insert text-based badge spans into the last inserted message.
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
