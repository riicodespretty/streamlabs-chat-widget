import { renderBadges } from "./badges";

export interface ChatMessageEvent {
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

/**
 * Render a chat message by cloning the baseline Chat Box template and replacing tokens.
 * Matches the Streamlabs default template structure: color on .meta span,
 * badges inserted via DOM after insertion, data-from/data-id attributes.
 */
export function renderMessage(detail: ChatMessageEvent): void {
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
      badgesEl.innerHTML = renderBadges(detail.tags);
    }
  }
}
