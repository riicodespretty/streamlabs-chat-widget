/**
 * Mock feed — dispatches one hardcoded chat message event on load.
 * Only imported in dev mode.
 */

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
