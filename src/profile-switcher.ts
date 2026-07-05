interface ProfileInfo {
  name: string;
  active: boolean;
}

function buttonHTML(p: ProfileInfo): string {
  const style = p.active ? "background:#39ff14;color:#000;" : "background:#333;color:#fff;";
  return `<button data-profile="${p.name}" style="${style}border:none;padding:4px 10px;margin:2px;border-radius:4px;cursor:pointer;font:12px monospace">${p.active ? "★ " : ""}${p.name}</button>`;
}

async function refreshUI(): Promise<void> {
  const r = await fetch("/__profiles");
  const profiles = (await r.json()) as ProfileInfo[];
  const wrapper = document.querySelector("#__profile-switcher > div") as HTMLElement | null;
  if (wrapper) wrapper.innerHTML = profiles.map(buttonHTML).join("");
}

/** Hot-swap profile CSS and HTML template. Messages in #log survive. */
async function hotSwapProfile(profile: string): Promise<void> {
  // 1. Swap CSS — use raw CSS endpoint with token replacement applied
  const cssR = await fetch(`/__profile-css/${profile}`);
  const cssText = await cssR.text();
  let style = document.querySelector("style[data-profile-css]") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-profile-css", profile);
    document.head.appendChild(style);
  }
  style.textContent = cssText;

  // 2. Swap HTML template — only affects future messages
  const htmlR = await fetch(`/profiles/${profile}/index.html`);
  const htmlText = await htmlR.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const newTemplate = doc.querySelector("#chatlist_item");
  if (newTemplate) {
    const existing = document.querySelector("#chatlist_item");
    if (existing) existing.innerHTML = newTemplate.innerHTML;
  }
}

void (async () => {
  const r = await fetch("/__profiles");
  const profiles = (await r.json()) as ProfileInfo[];
  const html = profiles.map(buttonHTML).join("");

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;top:8px;right:8px;z-index:99999;opacity:0.3;transition:opacity .2s";
  wrapper.addEventListener("mouseover", () => {
    wrapper.style.opacity = "1";
  });
  wrapper.addEventListener("mouseout", () => {
    wrapper.style.opacity = "0.3";
  });
  wrapper.innerHTML = html;

  const panel = document.createElement("div");
  panel.id = "__profile-switcher";
  panel.appendChild(wrapper);
  document.body.appendChild(panel);

  panel.addEventListener("click", async (e) => {
    const btn = (
      e.target instanceof Element ? e.target : (e.target as Node).parentElement
    )?.closest("button");
    if (!btn) return;

    const profile = btn.dataset.profile!;
    const r = await fetch("/__profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });

    if (r.ok) {
      await hotSwapProfile(profile);
      await refreshUI();
    }
  });
})();
