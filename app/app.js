// Leonida Legends — GTA VI trophy guide & tracker.
// Plain static app: loads data/trophies.json from its own files, saves progress in localStorage, makes no network request.
const KEY = 'leonida-legends-progress-v1';
const SPOILER_KEY = 'leonida-legends-spoilers-v1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let spoilersHidden = localStorage.getItem(SPOILER_KEY) !== 'shown';

const $ = (id) => document.getElementById(id);
const rows = $('rows');
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
// Rough hours behind each time label, for the "Time needed" sort and the remaining-time estimate.
const TIME_HOURS = {
  '≈10 min': 0.17, '≈20 min': 0.33, '≈30 min': 0.5, '≈15 min': 0.25,
  'Story — opening': 0.5, 'Story — Ch. 1': 4, 'Story — Ch. 2': 5, 'Story — Ch. 3': 6, 'Story — Ch. 4': 6,
  'Story — finale': 2, 'Story mission': 1, 'Story — partner': 1, 'Natural play': 0.5,
  'Strand — 1–2 h': 1.5, 'Across the story': 3, 'Post-story': 3,
  '1–2 h': 1.5, '2–3 h': 2.5, '2–4 h': 3, '3–5 h': 4, '4–6 h': 5, '4–8 h': 6,
  '6–10 h': 8, '8–12 h': 10, '25–35 h': 30, '90–120 h total': 105,
};
const hoursOf = (t) => TIME_HOURS[t.time] ?? 2;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, spoilersHidden ? 'hidden' : 'shown');
}

function dots(n) {
  return '●'.repeat(n) + '○'.repeat(5 - n);
}

function isSpoiler(t) {
  return t.spoiler && spoilersHidden && !earned.has(t.name);
}

function renderProgress() {
  const total = trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  $('progressText').textContent = `${n} of ${total} earned`;
  $('progressPct').textContent = `${pct}%`;
  $('progressFill').style.width = `${pct}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `<span><b>${got}/${all}</b> ${g}</span>`;
  }).join('');
  $('gradeCounts').innerHTML = counts;
  const left = trophies.filter((t) => !earned.has(t.name)).reduce((s, t) => s + hoursOf(t), 0);
  $('etaText').textContent = n === total
    ? 'Platinum earned — Leonida Legend. Congratulations!'
    : `About ${Math.round(left)} hours of play left by our estimates (story + grinds). The two golds are the final mission and 100% completion.`;
}

function trophyMatches(t) {
  const q = $('search').value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.category}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if ($('grade').value !== 'all' && t.grade !== $('grade').value) return false;
  if ($('category').value !== 'all' && t.category !== $('category').value) return false;
  if ($('missable').value !== 'all' && t.missable !== $('missable').value) return false;
  if ($('earned').value === 'earned' && !earned.has(t.name)) return false;
  if ($('earned').value === 'unearned' && earned.has(t.name)) return false;
  return true;
}

function sortTrophies(list) {
  const s = $('sort').value;
  const copy = [...list];
  if (s === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (s === 'grade') copy.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  else if (s === 'difficulty') copy.sort((a, b) => b.difficulty - a.difficulty || a.id - b.id);
  else if (s === 'time') copy.sort((a, b) => hoursOf(b) - hoursOf(a) || a.id - b.id);
  return copy;
}

function render() {
  renderProgress();
  const list = sortTrophies(trophies.filter(trophyMatches));
  rows.replaceChildren();
  $('empty').hidden = list.length > 0;
  $('resultCount').textContent = `${list.length} of ${trophies.length} trophies shown`;
  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.name) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      render();
    });
    const body = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'trophy-name';
    name.textContent = isSpoiler(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc' + (isSpoiler(t) ? ' spoiler-hidden' : '');
    desc.textContent = isSpoiler(t)
      ? 'Story trophy — its name and description stay hidden until you earn it. (Spoilers: hidden is on.)'
      : t.description;
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = `grade-badge ${t.grade}`;
    grade.textContent = t.grade;
    const cat = document.createElement('span');
    cat.className = 'chip';
    cat.textContent = t.category;
    const diff = document.createElement('span');
    diff.className = 'dots';
    diff.title = `Difficulty ${t.difficulty} of 5`;
    diff.textContent = `${dots(t.difficulty)} ${t.difficulty}/5`;
    const time = document.createElement('span');
    time.textContent = `⏱ ${t.time}`;
    const miss = document.createElement('span');
    miss.className = `badge ${t.missable === 'watch' ? 'watch' : 'safe'}`;
    miss.textContent = t.missable === 'watch' ? 'WATCH' : 'SAFE';
    meta.append(grade, cat, diff, time, miss);
    body.append(name, desc, meta);
    const actions = document.createElement('div');
    actions.className = 'trophy-actions';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-btn';
    btn.textContent = 'Guide →';
    btn.addEventListener('click', () => openDetail(t));
    actions.append(btn);
    li.append(box, body, actions);
    rows.append(li);
  }
}

// Detail modal.
let current = null;
function openDetail(t) {
  current = t;
  $('detailGrade').innerHTML = '';
  const g = document.createElement('span');
  g.className = `grade-badge ${t.grade}`;
  g.textContent = t.grade;
  $('detailGrade').append(g);
  $('detailCategory').textContent = t.category;
  $('detailName').textContent = t.name;
  $('detailDesc').textContent = t.description;
  $('detailDifficulty').textContent = `${dots(t.difficulty)} ${t.difficulty} of 5`;
  $('detailTime').textContent = t.time;
  $('detailMissable').textContent = t.missable === 'watch' ? 'WATCH — do it when it unlocks' : 'Safe any time';
  $('detailMissableNote').hidden = t.missable !== 'watch';
  if (t.missable === 'watch') $('detailMissableNote').textContent = t.missableNote;
  $('detailGuide').textContent = t.guide;
  $('detailTips').replaceChildren();
  for (const tip of t.tips) {
    const li = document.createElement('li');
    li.textContent = tip;
    $('detailTips').append(li);
  }
  $('detailSources').replaceChildren();
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    $('detailSources').append(li);
  }
  $('detailEarned').checked = earned.has(t.name);
  $('detail').hidden = false;
  $('detailClose').focus();
}
function closeDetail() {
  $('detail').hidden = true;
  current = null;
}
$('detailClose').addEventListener('click', closeDetail);
$('detail').addEventListener('click', (e) => { if (e.target === $('detail')) closeDetail(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
$('detailEarned').addEventListener('change', () => {
  if (!current) return;
  if ($('detailEarned').checked) earned.add(current.name);
  else earned.delete(current.name);
  save();
  render();
});

// Tabs.
document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.removeAttribute('aria-current');
    });
    btn.setAttribute('aria-current', 'page');
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = p.id !== `tab-${btn.dataset.tab}`;
    });
  });
});

// Filters, search, sort, spoiler toggle.
for (const id of ['search', 'grade', 'category', 'missable', 'earned', 'sort']) {
  $(id).addEventListener('input', render);
  $(id).addEventListener('change', render);
}
function syncSpoilerButton() {
  $('spoilerToggle').textContent = spoilersHidden ? 'Spoilers: hidden' : 'Spoilers: shown';
  $('spoilerToggle').setAttribute('aria-pressed', String(spoilersHidden));
}
$('spoilerToggle').addEventListener('click', () => {
  spoilersHidden = !spoilersHidden;
  save();
  syncSpoilerButton();
  render();
});

// Export / import / reset.
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: doc.game, earned: [...earned] }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = new Set(trophies.map((t) => t.name));
    const list = Array.isArray(data) ? data : data.earned;
    earned = new Set((list ?? []).filter((n) => names.has(n)));
    save();
    render();
  } catch {
    alert('That file is not a valid progress export.');
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies? This cannot be undone (export first if you want a backup).')) {
    earned = new Set();
    save();
    render();
  }
});

syncSpoilerButton();
render();
