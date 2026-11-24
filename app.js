const CATEGORIES = ["All", "WordPress", "Shopify", "WIX", "Frontend", "UI/UX", "Client Communication", "MTO", "SEO", "Google Ads", "Teaching"];
const state = { q: "", category: "All", location: "all", status: "active", sort: "newest", salary: "all" };
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

// Estimate a job's monthly pay in BDT from its free-text salary string.
// Returns {min, max} in BDT/month, or null when no figure is stated
// (salary missing, "Negotiable", "Competitive", etc.).
// Foreign currencies use rough rates; hourly/lesson pay is converted at
// 160 hours a month and yearly pay divided by 12. Guide only.
const FX = [
  [/australian|aud/i, 78],
  [/£|gbp|pounds?/i, 155],
  [/€|eur/i, 130],
  [/₹|inr/i, 1.45],
  [/pkr/i, 0.43],
  [/\brm\b|ringgit/i, 28],
  [/php/i, 2.1],
  [/idr/i, 0.0075],
  [/usd|us\$|\$/i, 120],
  [/bdt|tk\.?|৳/i, 1],
];
function salaryMonthlyBDT(s) {
  if (!s) return null;
  const text = String(s);
  if (!/\d/.test(text)) return null;
  let rate = 1;
  for (const [re, r] of FX) { if (re.test(text)) { rate = r; break; } }
  // Remove durations that are not pay ("1-year programme", "50-min lesson").
  const clean = text.replace(/\d+\s*[-–]\s*(year|month|week|day|min)/gi, " ").replace(/\d+\s*(years?|yrs?)\b/gi, " ");
  const raw = [];
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|l)?\b/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    raw.push({ v: parseFloat(m[1].replace(/,/g, "")), suf: (m[2] || "").toLowerCase() });
    if (raw.length === 2) break;
  }
  if (!raw.length) return null;
  // "₹5–7L" / "$28–65k": a suffix on the second figure applies to the first too.
  if (raw.length === 2 && !raw[0].suf && raw[1].suf && raw[0].v < 1000) raw[0].suf = raw[1].suf;
  const scale = (x) => x.v * (x.suf === "k" ? 1000 : x.suf ? 100000 : 1);
  let lo = scale(raw[0]), hi = raw.length > 1 ? scale(raw[1]) : lo;
  if (hi < lo) [lo, hi] = [hi, lo];
  let factor = 1;
  if (/\/\s*h(ou)?r|per hour|hourly|per lesson|per class|per session|per 50/i.test(text)) factor = 160;
  else if (/\/\s*y(ea)?r|per year|per annum|annually/i.test(text)) factor = 1 / 12;
  return { min: lo * rate * factor, max: hi * rate * factor };
}

const SALARY_BUCKETS = {
  "u30": [0, 30000],
  "30-50": [30000, 50000],
  "50-80": [50000, 80000],
  "80-120": [80000, 120000],
  "o120": [120000, Infinity],
};

function salaryMatches(job) {
  if (state.salary === "all") return true;
  const est = salaryMonthlyBDT(job.salary);
  if (state.salary === "none") return est === null;
  if (est === null) return false;
  const [blo, bhi] = SALARY_BUCKETS[state.salary];
  return est.max >= blo && est.min < bhi;
}

function render() {
  const q = state.q.trim().toLowerCase();
  let list = JOBS.filter((j) => {
    if (state.category !== "All" && j.category !== state.category) return false;
    if (state.location !== "all" && j.locationType !== state.location) return false;
    if (!salaryMatches(j)) return false;
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
  $("#salaryFilter").addEventListener("change", (e) => { state.salary = e.target.value; render(); });
  $("#statusFilter").addEventListener("change", (e) => { state.status = e.target.value; render(); });
  $("#sortOrder").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
}

init();
