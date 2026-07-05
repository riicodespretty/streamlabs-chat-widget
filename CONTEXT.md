# Streamlabs Chat Box

A browser-based overlay widget that renders live viewer messages on top of a stream.

## Language

**Chat Box**:
The built-in Streamlabs widget that displays viewer messages on stream. Uses a custom HTML/CSS/JS template — Streamlabs' template engine clones the `#chatlist_item` snippet, replaces `{token}` placeholders, and handles the message lifecycle (animation, cleanup).
_Avoid_: chat widget, chat overlay, Custom Widget (a different Streamlabs widget type with no built-in rendering)

**Baseline**:
The Streamlabs default Chat Box template structure that custom HTML/CSS/JS extends. Defines the DOM class names (`.meta`, `.name`, `.message`, `.badges`), the `#chatlist_item` and `#badge_item` snippets, and the `{type}-icon` badge class convention. Custom CSS targets these classes; custom HTML replaces the snippets.
_Avoid_: default template, stock widget

**Profile**:
A self-contained widget variant: a directory under `profiles/<name>/` holding its own `index.html`, `style.css`, and `widget.config.json`. The **active profile** (tracked in `profiles/.active`) is the one served by the dev server and built by `build-all.ts`. Profiles share the same TypeScript runtime (`src/main.ts`, `src/renderer.ts`, `src/badges.ts`, `src/mock-feed.ts`); only HTML, CSS, and field token defaults vary.
_Avoid_: theme, variant, preset

**Template Token**:
A `{placeholder}` string in HTML or CSS that Streamlabs replaces at runtime. Message tokens (`{from}`, `{color}`, `{message}`, `{messageId}`) are replaced per-message by the built-in template engine. Field tokens (`{background_color}`, `{font_size}`, `{text_color}`, `{message_hide_delay}`) are replaced with the streamer's configured values.
_Avoid_: placeholder, variable, slot

**Field Setting**:
A streamer-configurable value exposed in the widget's Fields tab — colors, font sizes, timing. Injected as `{token}` in HTML/CSS and available in JS via `onLoad` → `e.detail.fieldData`.
_Avoid_: config option, preference, parameter

**Message**:
Text and emotes sent by a viewer, displayed as a single row in the Chat Box. Each message has a sender, body, display color, and may carry badges.
_Avoid_: chat, line, comment

**Sender**:
The viewer who authored a message. Identified by a platform username and an assigned display color.
_Avoid_: user, from, chatter, username

**Badge**:
A role indicator icon rendered next to the sender's name. Rendered via the `#badge_item` template as an `<img>` with CDN-hosted images, not part of the `#chatlist_item` snippet. Known types: `broadcaster`, `moderator`, `subscriber`, `vip`, `turbo`, `premium`, `bits`, `sub-gifter`. CSS class convention: `badge {type}-icon`.
_Avoid_: role icon, flair, tag

**Emote**:
An inline image embedded within a message body, representing an emotion or reaction. Platform-provided (Twitch, BTTV, FFZ) or channel-custom.
_Avoid_: emoji, smiley, sticker

**Event**:
A notification from the streaming platform about viewer activity. Events carry typed payloads — a chat message includes sender and body; a subscription includes tier and months.
_Avoid_: signal, trigger, callback

**Overlay**:
The transparent visual layer rendered on top of the live stream video. The Chat Box is one type of overlay; others include alert boxes, event lists, and goal trackers.
_Avoid_: widget layer, HUD
