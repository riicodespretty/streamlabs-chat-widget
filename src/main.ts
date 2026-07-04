import "./style.css";
import { renderMessage } from "./renderer";
import type { ChatMessageEvent } from "./renderer";

// Wire Streamlabs event listener — dispatches to the renderer module
window.addEventListener("onEventReceived", ((event: CustomEvent) => {
  const detail = event.detail as ChatMessageEvent;
  if (detail.type === "chatmessage" && detail.command === "PRIVMSG") {
    renderMessage(detail);
  }
}) as EventListener);

import { startMockFeed } from "./mock-feed";

// Mock feed only runs in dev — stripped by the build plugin for production
void (import.meta.env.DEV && startMockFeed());
