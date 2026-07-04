import "./style.css";

/**
 * Render a chat message by cloning the template and replacing tokens.
 * In production, this is handled by the Streamlabs template engine.
 * Here we simulate it for local development and testing.
 */
function renderMessage(detail: Record<string, unknown>): void {
  const template = document.getElementById("chatlist_item") as HTMLTemplateElement | null;
  if (!template) return;

  const log = document.getElementById("log");
  if (!log) return;

  const tags = (detail.tags as Record<string, string>) ?? {};
  const displayName = tags["display-name"] ?? (detail.from as string);
  const color = tags.color ?? "#ffffff";

  let html = template.innerHTML;
  html = html.replace(/\{badges\}/g, "");
  html = html.replace(/\{from\}/g, displayName as string);
  html = html.replace(/\{color\}/g, color);
  html = html.replace(/\{message\}/g, (detail.body as string) ?? "");
  html = html.replace(/\{messageId\}/g, (detail.messageId as string) ?? "");

  log.insertAdjacentHTML("beforeend", html);
}

window.addEventListener("onEventReceived", ((event: CustomEvent) => {
  renderMessage(event.detail as Record<string, unknown>);
}) as EventListener);

// Conditionally import the mock feed in dev mode
if (import.meta.env.DEV) {
  void import("./mock-feed");
}
