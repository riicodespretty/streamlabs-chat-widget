/** Badge tag keys — subset of ChatMessageEvent["tags"] that drive badge rendering. */
export interface BadgeTags {
  broadcaster?: string;
  moderator?: string;
  subscriber?: string;
  vip?: string;
  turbo?: string;
  premium?: string;
  bits?: string;
}

export interface BadgeDef {
  key: keyof BadgeTags;
  src: string;
  type: string;
  title: string;
}

// Public CDN badge images matching the baseline #badge_item template.
// Extracted from Streamlabs Chat Box widget preview — scale /1 (18×18px).
export const BADGE_MAP: BadgeDef[] = [
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

export function renderBadges(tags: BadgeTags): string {
  return BADGE_MAP.filter((b) => tags[b.key] === "1")
    .map((b) => `<img src="${b.src}" class="badge ${b.type}-icon" title="${b.title}" />`)
    .join("");
}
