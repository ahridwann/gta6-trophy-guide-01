// Leonida Legends — GTA VI trophy tracker.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and handles filters, spoiler mode, export and import.
(function () {
  "use strict";

  var STORAGE_KEY = "leonida-legends-progress-v1";
  var SPOILER_KEY = "leonida-legends-spoilers-v1";

  var ROADMAP = [
    { num: 1, title: "Stage 1 — Play the story", text: "Chapters 1 to 4 and the final mission. Earn the 12 chapter and mission trophies, plus the partner trophies Hot Together and Retail Therapy and the moment trophies (Catch Me If You Can, Personal Best, Actions Speak Louder, Bad Luck, I Guess) while they are in front of you." },
    { num: 2, title: "Stage 2 — Strangers and side missions", text: "Finish the stranger strands for Andy, Kenton, Billy, Randy and Tyrone, complete 8 strands for Strangers & Freaks, hunt the unique animal for Bret, and grab the Ocean Beach cocktail and the showroom smash while you are out in the world." },
    { num: 3, title: "Stage 3 — Activities and challenges", text: "Gold all 42 Shooting Range challenges, win the 14 Top Fun drone races and 20 different races, try all 9 activity types, finish 50 challenges, pull off 250 stunts, and take down 5 enemies in one Combat Focus." },
    { num: 4, title: "Stage 4 — Collectibles and exploration", text: "Explore all 52 areas of Leonida, meditate at all 18 spots, WAiNK It at 100 locations, discover 100 vehicles, register 10 to the Scooter Bros app, and complete 3 collectible card sets." },
    { num: 5, title: "Stage 5 — Money and mayhem", text: "Rob 5 bank vaults and an armored truck, rob one illegal operation for each of the 9 gangs, launder $250,000 of Marked Bills, spend $100,000 across all shops, buy all 8 garages, and rob a jewelry store undetected." },
    { num: 6, title: "Stage 6 — Platinum", text: "Clear whatever the in-game stats screen still shows as incomplete until you reach 100% completion for A Long Road. The platinum, Vice Got a Price!, pops the moment the last of the other 54 is earned." }
  ];

  var state = {
    trophies: [],
    earned: {},
    kind: "all",
    query: "",
    spoilers: false,
    hideEarned: false,
    openId: null
  };

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") state.earned = parsed;
      }
      state.spoilers = localStorage.getItem(SPOILER_KEY) === "1";
    } catch (e) { state.earned = {}; }
  }

  function saveStored() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.earned));
      localStorage.setItem(SPOILER_KEY, state.spoilers ? "1" : "0");
    } catch (e) { /* storage unavailable: progress lives only for this visit */ }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function isSpoilerHidden(trophy) {
    return state.spoilers && trophy.kind === "story" && !state.earned[trophy.id];
  }

  function matches(trophy) {
    if (state.kind === "missable" && !trophy.missable) return false;
    if (state.kind === "online") return false;
    if (state.kind !== "all" && state.kind !== "missable" && trophy.kind !== state.kind) return false;
    if (state.hideEarned && state.earned[trophy.id]) return false;
    if (state.query) {
      var hay = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function renderRoadmap() {
    var list = document.getElementById("roadmapStages");
    list.textContent = "";
    ROADMAP.forEach(function (stage) {
      var item = el("li");
      item.appendChild(el("span", "stage-num", "Stage " + stage.num));
      item.appendChild(el("h3", null, stage.title.replace(/^Stage \d+ — /, "")));
      item.appendChild(el("p", null, stage.text));
      list.appendChild(item);
    });
  }

  function renderMissable() {
    var list = document.getElementById("missableList");
    list.textContent = "";
    state.trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var item = el("li");
      var name = el("span", "m-name", t.name + " — ");
      var why = el("span", "m-why", t.description);
      item.appendChild(name);
      item.appendChild(why);
      list.appendChild(item);
    });
  }

  function renderList() {
    var list = document.getElementById("trophyList");
    list.textContent = "";
    var shown = 0;
    state.trophies.forEach(function (trophy) {
      if (!matches(trophy)) return;
      shown += 1;
      var earned = !!state.earned[trophy.id];
      var card = el("article", "trophy-card" + (earned ? " earned" : "") + (trophy.missable ? " missable-card" : ""));
      card.id = "trophy-" + trophy.id;

      var head = el("div", "trophy-head");
      var check = el("input", "trophy-check");
      check.type = "checkbox";
      check.checked = earned;
      check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
      check.addEventListener("change", function () {
        if (check.checked) state.earned[trophy.id] = true;
        else delete state.earned[trophy.id];
        saveStored();
        renderProgress();
        renderList();
      });
      head.appendChild(check);

      var titleBox = el("div", "trophy-title");
      var nameLine = el("h3", "trophy-name");
      if (isSpoilerHidden(trophy)) {
        nameLine.appendChild(el("span", "spoiler-mask", "??? Hidden story trophy"));
      } else {
        nameLine.appendChild(document.createTextNode(trophy.name));
      }
      var badge = el("span", "grade-badge grade-" + trophy.grade, gradeLabel(trophy.grade));
      nameLine.appendChild(badge);
      titleBox.appendChild(nameLine);
      var desc = el("p", "trophy-desc", isSpoilerHidden(trophy)
        ? "Hidden on PlayStation until earned. Turn spoiler-free mode off, or tick it earned, to reveal it."
        : trophy.description);
      titleBox.appendChild(desc);

      var tags = el("div", "trophy-tags");
      tags.appendChild(el("span", "tag", trophy.kind));
      if (trophy.count) tags.appendChild(el("span", "tag", "Count: " + trophy.count.toLocaleString("en-US")));
      tags.appendChild(el("span", "tag", "Roadmap stage " + trophy.stage));
      if (trophy.hidden) tags.appendChild(el("span", "tag hidden-tag", "Hidden on PSN"));
      if (trophy.missable) tags.appendChild(el("span", "tag missable-tag", "MISSABLE"));
      titleBox.appendChild(tags);
      head.appendChild(titleBox);
      head.addEventListener("click", function (event) {
        if (event.target === check) return;
        state.openId = state.openId === trophy.id ? null : trophy.id;
        renderList();
      });
      card.appendChild(head);

      if (state.openId === trophy.id) {
        var body = el("div", "guide-body");
        body.appendChild(el("h4", null, "Guide"));
        var guideText = trophy.guide.replace(/\s*Source:[^.]*\.\s*$/, "");
        body.appendChild(el("p", null, isSpoilerHidden(trophy) ? "Reveal this trophy first — turn spoiler-free mode off or mark it earned." : guideText));
        var src = el("p", "guide-source");
        src.appendChild(el("b", null, "Sources: "));
        src.appendChild(document.createTextNode(trophy.source || "Official trophy description (PlayStation)"));
        body.appendChild(src);
        card.appendChild(body);
      }
      list.appendChild(card);
    });
    document.getElementById("shownCount").textContent = shown + " shown";
    document.getElementById("emptyState").hidden = shown !== 0;
  }

  function renderProgress() {
    var total = state.trophies.length;
    var earnedCount = state.trophies.filter(function (t) { return state.earned[t.id]; }).length;
    var pct = total ? Math.round((earnedCount / total) * 100) : 0;
    document.getElementById("progressText").textContent = earnedCount + " / " + total + " earned";
    document.getElementById("progressPct").textContent = pct + "%";
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressSub").textContent = earnedCount === total
      ? "Platinum unlocked — Vice Got a Price! is yours, Leonida Legend."
      : "Platinum progress: " + (total - earnedCount) + " trophies to go until Vice Got a Price!";
  }

  function exportProgress() {
    var data = { app: "leonida-legends", exportedAt: new Date().toISOString(), earned: Object.keys(state.earned).map(Number).sort(function (a, b) { return a - b; }) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "leonida-legends-progress.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = data.earned || data;
        if (!Array.isArray(ids)) throw new Error("bad file");
        var next = {};
        ids.forEach(function (id) {
          var num = Number(id);
          if (state.trophies.some(function (t) { return t.id === num; })) next[num] = true;
        });
        state.earned = next;
        saveStored();
        renderProgress();
        renderList();
      } catch (e) {
        alert("That file is not a Leonida Legends progress export.");
      }
    };
    reader.readAsText(file);
  }

  function wireControls() {
    document.getElementById("kindFilters").addEventListener("click", function (event) {
      var btn = event.target.closest("[data-kind]");
      if (!btn) return;
      state.kind = btn.getAttribute("data-kind");
      document.querySelectorAll("#kindFilters .filter-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderList();
    });
    document.getElementById("searchBox").addEventListener("input", function (event) {
      state.query = event.target.value.trim().toLowerCase();
      renderList();
    });
    var spoiler = document.getElementById("spoilerToggle");
    spoiler.checked = state.spoilers;
    spoiler.addEventListener("change", function () {
      state.spoilers = spoiler.checked;
      saveStored();
      renderList();
    });
    var hideEarned = document.getElementById("hideEarnedToggle");
    hideEarned.addEventListener("change", function () {
      state.hideEarned = hideEarned.checked;
      renderList();
    });
    document.getElementById("exportBtn").addEventListener("click", exportProgress);
    var importFile = document.getElementById("importFile");
    document.getElementById("importBtn").addEventListener("click", function () { importFile.click(); });
    importFile.addEventListener("change", function () {
      if (importFile.files && importFile.files[0]) importProgress(importFile.files[0]);
      importFile.value = "";
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (confirm("Clear all earned trophies? This cannot be undone.")) {
        state.earned = {};
        saveStored();
        renderProgress();
        renderList();
      }
    });
  }

  function init() {
    loadStored();
    wireControls();
    renderRoadmap();
    fetch("data/trophies.json")
      .then(function (res) { if (!res.ok) throw new Error("trophies.json not found"); return res.json(); })
      .then(function (data) {
        state.trophies = data.trophies || data;
        renderMissable();
        renderProgress();
        renderList();
      })
      .catch(function () {
        document.getElementById("trophyList").textContent = "";
        document.getElementById("emptyState").hidden = false;
        document.getElementById("emptyState").textContent = "Could not load data/trophies.json. Serve app/ over HTTP and reload.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
