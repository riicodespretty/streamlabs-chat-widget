interface ProfileInfo {
  name: string;
  active: boolean;
}

function buttonHTML(p: ProfileInfo): string {
  const style = p.active ? "background:#39ff14;color:#000;" : "background:#333;color:#fff;";
  return `<button data-profile="${p.name}" style="${style}border:none;padding:4px 10px;margin:2px;border-radius:4px;cursor:pointer;font:12px monospace">${p.active ? "★ " : ""}${p.name}</button>`;
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
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    await fetch("/__profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: btn.dataset.profile }),
    });
  });
})();
