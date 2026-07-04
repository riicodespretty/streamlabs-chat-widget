import { describe, it, expect, beforeEach, afterEach, vi } from "vite-plus/test";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("mock feed", () => {
  it("fires at least 3 onEventReceived events within 5 seconds", async () => {
    const events: CustomEvent[] = [];
    const dispatch = vi.spyOn(window, "dispatchEvent").mockImplementation((e: Event) => {
      if (e.type === "onEventReceived") events.push(e as CustomEvent);
      return true;
    });

    const { startMockFeed } = await import("../mock-feed");
    const stop = startMockFeed();

    await vi.advanceTimersByTimeAsync(5000);

    expect(events.length).toBeGreaterThanOrEqual(3);

    stop();
    dispatch.mockRestore();
  });

  it("each event has type 'chatmessage' and required fields", async () => {
    const events: CustomEvent[] = [];
    vi.spyOn(window, "dispatchEvent").mockImplementation((e: Event) => {
      if (e.type === "onEventReceived") events.push(e as CustomEvent);
      return true;
    });

    const { startMockFeed } = await import("../mock-feed");
    const stop = startMockFeed();

    await vi.advanceTimersByTimeAsync(3000);

    expect(events.length).toBeGreaterThanOrEqual(1);

    for (const event of events) {
      const d = event.detail as Record<string, unknown>;
      expect(d.type).toBe("chatmessage");
      expect(d.command).toBe("PRIVMSG");
      expect(typeof d.from).toBe("string");
      expect((d.from as string).length).toBeGreaterThan(0);
      expect(typeof d.body).toBe("string");
      expect((d.body as string).length).toBeGreaterThan(0);
      expect(typeof d.messageId).toBe("string");
      expect((d.messageId as string).length).toBeGreaterThan(0);
      expect(d.tags).toBeDefined();
    }

    stop();
  });

  it("different users have different display names and colors", async () => {
    const events: CustomEvent[] = [];
    vi.spyOn(window, "dispatchEvent").mockImplementation((e: Event) => {
      if (e.type === "onEventReceived") events.push(e as CustomEvent);
      return true;
    });

    const { startMockFeed } = await import("../mock-feed");
    const stop = startMockFeed();

    await vi.advanceTimersByTimeAsync(12000);

    const displayNames = new Set<string>();
    const colors = new Set<string>();

    for (const event of events) {
      const tags = event.detail.tags as Record<string, string>;
      displayNames.add(tags["display-name"]);
      colors.add(tags.color);
    }

    expect(displayNames.size).toBeGreaterThanOrEqual(3);
    expect(colors.size).toBeGreaterThanOrEqual(3);

    stop();
  });
});
