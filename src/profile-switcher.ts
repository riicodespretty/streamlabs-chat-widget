void (async () => {
  const r = await fetch("/__profiles");
  const profiles = await r.json();
  const html = profiles
    .map(
      (p: { name: string; active: boolean }) =>
        '<button data-profile="' +
        p.name +
        '" style="' +
        (p.active ? "background:#39ff14;color:#000;" : "background:#333;color:#fff;") +
        'border:none;padding:4px 10px;margin:2px;border-radius:4px;cursor:pointer;font:12px monospace">' +
        (p.active ? "★ " : "") +
        p.name +
        "</button>",
    )
    .join("");
  const panel = document.createElement("div");
  panel.id = "__profile-switcher";
  panel.innerHTML =
    '<div style="position:fixed;top:8px;right:8px;z-index:99999;opacity:0.3;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3">' +
    html +
    "</div>";
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
