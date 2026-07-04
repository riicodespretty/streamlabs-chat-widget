import { describe, it, expect, beforeEach, vi } from "vite-plus/test";

// Set up the widget HTML skeleton before each test

vi.mock("../mock-feed", () => ({ startMockFeed: vi.fn() }));

beforeEach(() => {
  document.body.innerHTML = `
    <div id="log" class="sl__chat__layout"></div>
    <script type="text/template" id="chatlist_item">
      <div data-from="{from}" data-id="{messageId}">
        <span class="meta" style="color: {color}">
          <span class="badges"></span>
          <span class="name">{from}</span>
        </span>
        <span class="message">{message}</span>
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
        },
        messageId: "msg-001",
      },
    });

    window.dispatchEvent(event);

    const log = document.getElementById("log")!;
    const messageDiv = log.querySelector<HTMLDivElement>("[data-from]")!;
    expect(messageDiv).not.toBeNull();

    const fromEl = messageDiv.querySelector<HTMLSpanElement>(".name")!;
    expect(fromEl).not.toBeNull();
    expect(fromEl.textContent).toBe("TestUser");

    const bodyEl = messageDiv.querySelector<HTMLSpanElement>(".message")!;
    expect(bodyEl).not.toBeNull();
    expect(bodyEl.textContent).toBe("Hello, stream!");

    expect(messageDiv.getAttribute("data-id")).toBe("msg-001");
    expect(messageDiv.querySelector(".meta")!.getAttribute("style")).toContain("color: #FF0000");
  });

  it("renders badge images when tags include role flags set to '1'", async () => {
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
          moderator: "1",
          subscriber: "0",
          vip: "0",
        },
        messageId: "msg-002",
      },
    });

    window.dispatchEvent(event);

    const log = document.getElementById("log")!;
    const badgesEl = log.querySelector("[data-from]")!.querySelector<HTMLSpanElement>(".badges")!;
    expect(badgesEl).not.toBeNull();
    expect(badgesEl.innerHTML).toContain("moderator-icon");
    expect(badgesEl.innerHTML).toContain("static-cdn.jtvnw.net");
    expect(badgesEl.innerHTML).not.toContain("subscriber-icon");
    expect(badgesEl.innerHTML).not.toContain("vip-icon");
  });

  it("does not render when event type is not chatmessage", async () => {
    await import("../main");

    const event = new CustomEvent("onEventReceived", {
      detail: {
        type: "follow",
        name: "NewFollower",
        from: "newfollower",
        isTest: true,
      },
    });

    window.dispatchEvent(event);

    const log = document.getElementById("log")!;
    expect(log.querySelectorAll("[data-from]").length).toBe(0);
  });
});
