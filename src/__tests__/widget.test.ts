import { describe, it, expect, beforeEach } from "vite-plus/test";

// Set up the widget HTML skeleton before each test
beforeEach(() => {
  document.body.innerHTML = `
    <div id="log" class="sl__chat__layout"></div>
    <script type="text/template" id="chatlist_item">
      <div class="sl__chat__message" style="color:{color}" data-message-id="{messageId}">
        <span class="sl__chat__meta">
          <span class="sl__chat__badges">{badges}</span>
          <span class="sl__chat__from">{from}</span>
        </span>
        <span class="sl__chat__body">{message}</span>
      </div>
    </script>
  `;
});

describe("onEventReceived — chat message rendering", () => {
  it("renders a message div with sender name and body in #log", async () => {
    // Import the module which registers the event listener
    await import("../main");

    const event = new CustomEvent("onEventReceived", {
      detail: {
        type: "chatmessage",
        command: "PRIVMSG",
        from: "testuser",
        body: "Hello, stream!",
        tags: {
          "display-name": "TestUser",
          color: "#FF0000",
          mod: "0",
        },
        messageId: "msg-001",
      },
    });

    window.dispatchEvent(event);

    const log = document.getElementById("log")!;
    const messageDiv = log.querySelector<HTMLDivElement>(".sl__chat__message")!;
    expect(messageDiv).not.toBeNull();

    const fromEl = messageDiv.querySelector<HTMLSpanElement>(".sl__chat__from")!;
    expect(fromEl).not.toBeNull();
    expect(fromEl.textContent).toBe("TestUser");

    const bodyEl = messageDiv.querySelector<HTMLSpanElement>(".sl__chat__body")!;
    expect(bodyEl).not.toBeNull();
    expect(bodyEl.textContent).toBe("Hello, stream!");

    expect(messageDiv.getAttribute("data-message-id")).toBe("msg-001");
    expect(messageDiv.style.color).toBe("#FF0000");
  });

  it("renders badge spans when tags include role flags set to '1'", async () => {
    // Re-import to get a fresh module with the listener registered
    await import("../main");

    const event = new CustomEvent("onEventReceived", {
      detail: {
        type: "chatmessage",
        command: "PRIVMSG",
        from: "moduser",
        body: "mod chat",
        tags: {
          "display-name": "ModUser",
          color: "#00FF00",
          mod: "1",
          subscriber: "0",
          vip: "0",
        },
        messageId: "msg-002",
      },
    });

    window.dispatchEvent(event);

    const log = document.getElementById("log")!;
    const badgesEl = log.querySelector<HTMLSpanElement>(".sl__chat__badges")!;
    expect(badgesEl).not.toBeNull();
    expect(badgesEl.innerHTML).toContain("badge--mod");
    expect(badgesEl.textContent).toContain("MOD");
    expect(badgesEl.textContent).not.toContain("SUB");
    expect(badgesEl.textContent).not.toContain("VIP");
  });
});
