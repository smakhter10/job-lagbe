const CATEGORIES = ["All", "Client & Business", "WordPress & Web", "Teaching"];
const state = { q: "", category: "All", location: "all", status: "active", sort: "newest" };
let JOBS = [];

const $ = (s) => document.querySelector(s);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusBadge(status) {
  if (status === "open") return '<span class="badge open">● Verified open</span>';
  if (status === "check") return '<span class="badge check">● Check before applying</span>';
  return '<span class="badge closed">● Closed / expired</span>';
}

function render() {
  const q = state.q.trim().toLowerCase();
  let list = JOBS.filter((j) => {
    if (state.category !== "All" && j.category !== state.category) return false;
    if (state.location !== "all" && j.locationType !== state.location) return false;
    if (state.status === "active" && j.status === "closed") return false;
    if (state.status !== "active" && state.status !== "all" && j.status !== state.status) return false;
    if (q) {
      const hay = `${j.title} ${j.company} ${j.category} ${j.locationType} ${j.salary || ""} ${j.details || ""}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  list.sort((a, b) => (state.sort === "newest" ? b.dateFound.localeCompare(a.dateFound) || b.id - a.id : a.dateFound.localeCompare(b.dateFound) || a.id - b.id));

  $("#jobGrid").innerHTML = list.map((j) => `
    <article class="job-card">
      <div class="badges">
        <span class="badge cat">${esc(j.category)}</span>
        <span class="badge">${esc(j.locationType)}</span>
        ${statusBadge(j.status)}
      </div>
      <h3>${esc(j.title)}</h3>
      <div class="company">${esc(j.company)}</div>
      ${j.salary ? `<div class="salary">${esc(j.salary)}</div>` : '<div class="salary none">Salary not listed</div>'}
      ${j.details ? `<p class="details">${esc(j.details)}</p>` : ""}
      <div class="meta">
        <span class="found">Found ${esc(j.dateFound)}</span>
        ${j.url ? `<a class="apply" href="${esc(j.url)}" target="_blank" rel="noopener">View &amp; Apply →</a>` : '<span class="apply disabled">No link</span>'}
      </div>
    </article>`).join("");
  $("#emptyState").hidden = list.length > 0;
  $("#resultCount").textContent = `Showing ${list.length} of ${JOBS.length} jobs`;
}

function renderStats() {
  const open = JOBS.filter((j) => j.status === "open").length;
  const remote = JOBS.filter((j) => j.locationType === "Remote").length;
  $("#stats").innerHTML = `<span>${JOBS.length} jobs listed</span><span>${open} verified open</span><span>${remote} remote</span>`;
}

function renderChips() {
  $("#categoryChips").innerHTML = CATEGORIES.map((c) =>
    `<button class="chip${state.category === c ? " active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
    state.category = b.dataset.cat; renderChips(); render();
  }));
}

async function init() {
  try {
    const res = await fetch("jobs.json");
    const data = await res.json();
    JOBS = data.jobs || [];
    $("#updatedAt").textContent = data.updated || "—";
  } catch (e) {
    $("#jobGrid").innerHTML = "<p class='empty'>Could not load the job list. Please refresh.</p>";
    return;
  }
  renderStats(); renderChips(); render();
  $("#search").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#locationFilter").addEventListener("change", (e) => { state.location = e.target.value; render(); });
  $("#statusFilter").addEventListener("change", (e) => { state.status = e.target.value; render(); });
  $("#sortOrder").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
}

init();
