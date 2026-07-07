const STORAGE_KEY = "alphaBoyceParkSite";

const defaultState = {
  features: [],
  taxa: [],
  notes: {
    riverComparison: "",
    internalComparison: "",
    storyText: ""
  },
  checks: {}
};

const state = loadState();

const workflow = [
  {
    id: "rank",
    title: "Rank abundant sequences",
    body: "Open feature-table.tsv and identify roughly 20 representative sequences with the highest abundance in Boyce Park samples.",
    evidence: "Ranked feature list"
  },
  {
    id: "blast",
    title: "Classify by BLAST",
    body: "Open dna-sequences.fasta, copy each top representative sequence, and align it against a 16S reference database.",
    evidence: "BLAST calls"
  },
  {
    id: "reconcile",
    title: "Reconcile with pipeline",
    body: "Compare your BLAST call with taxonomy.tsv. Watch confidence fade below genus level and record disagreements.",
    evidence: "Trust table"
  },
  {
    id: "controls",
    title: "Check controls",
    body: "Look at blank and distilled-water controls before trusting an organism. Control hits may be contamination.",
    evidence: "Control note"
  },
  {
    id: "profile",
    title: "Build the profile",
    body: "Use the taxonomy table or taxa_barplot.qzv to show which groups dominate the Boyce Park pond-water community.",
    evidence: "Composition figure"
  },
  {
    id: "pcoa",
    title: "Compare two ways",
    body: "Make one PCoA with the river baseline and another view inside Alpha data by site, sub-location, or metadata.",
    evidence: "Two PCoA views"
  },
  {
    id: "story",
    title: "Tell the biology story",
    body: "Explain what lives there, what is surprising, what the organisms may do, and what the evidence can support.",
    evidence: "Claim-evidence-reasoning"
  },
  {
    id: "understand",
    title: "Own every step",
    body: "AI is allowed, but the team must understand each tool, figure, parameter, and claim well enough for Q&A.",
    evidence: "Demo answers"
  }
];

const submissionItems = [
  ["shared", "Colab notebook link is shared and opens for instructors."],
  ["profileSubmit", "Notebook includes the taxonomic profile and BLAST trust check."],
  ["twoViews", "Notebook includes both required comparison views."],
  ["storySubmit", "Write-up tells a biology-grounded story, not just a plot tour."],
  ["figCaptions", "Every figure has a caption that explains the takeaway."],
  ["defend", "Team can defend every tool, figure, and claim during Q&A."]
];

const palette = ["#00a6a6", "#f25f5c", "#ffc857", "#6c63ff", "#2e7d32", "#277da1", "#f3722c", "#577590"];

const $ = (id) => document.getElementById(id);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultState);
  }
  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      notes: { ...defaultState.notes, ...(parsed.notes || {}) },
      checks: parsed.checks || {}
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderWorkflow() {
  const container = $("workflowSteps");
  container.innerHTML = "";
  workflow.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = "workflow-card";
    card.innerHTML = `
      <span class="step-num">${index + 1}</span>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
      <label><input type="checkbox" data-save-check="${step.id}" ${state.checks[step.id] ? "checked" : ""}> ${step.evidence}</label>
    `;
    container.appendChild(card);
  });
}

function renderSubmissionChecklist() {
  const container = $("submissionChecklist");
  container.innerHTML = "";
  submissionItems.forEach(([id, label]) => {
    const row = document.createElement("label");
    row.innerHTML = `<input type="checkbox" data-save-check="${id}" ${state.checks[id] ? "checked" : ""}> ${label}`;
    container.appendChild(row);
  });
}

function addFeature(feature = {}) {
  state.features.push({
    id: feature.id || uid(),
    featureId: feature.featureId || "",
    reads: Number(feature.reads || 0),
    blast: feature.blast || "",
    pipeline: feature.pipeline || "",
    identity: Number(feature.identity || 0),
    control: Boolean(feature.control),
    trust: feature.trust || "medium"
  });
  renderFeatures();
  saveState();
}

function updateFeature(id, field, value) {
  const feature = state.features.find((item) => item.id === id);
  if (!feature) return;
  if (field === "reads" || field === "identity") {
    feature[field] = Number(value || 0);
  } else if (field === "control") {
    feature[field] = Boolean(value);
  } else {
    feature[field] = value;
  }
  saveState();
  renderStats();
}

function trustClass(value) {
  if (value === "high") return "trust-high";
  if (value === "low") return "trust-low";
  return "trust-medium";
}

function renderFeatures() {
  const tbody = $("featureTable").querySelector("tbody");
  tbody.innerHTML = "";
  [...state.features].sort((a, b) => Number(b.reads) - Number(a.reads)).forEach((feature) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input value="${escapeHtml(feature.featureId)}" placeholder="ASV_001"></td>
      <td><input type="number" min="0" value="${feature.reads}"></td>
      <td><input value="${escapeHtml(feature.blast)}" placeholder="Genus or closest match"></td>
      <td><input value="${escapeHtml(feature.pipeline)}" placeholder="SILVA/QIIME2 call"></td>
      <td><input type="number" min="0" max="100" step="0.1" value="${feature.identity}"></td>
      <td class="center"><input type="checkbox" ${feature.control ? "checked" : ""}></td>
      <td>
        <select class="${trustClass(feature.trust)}">
          <option value="high" ${feature.trust === "high" ? "selected" : ""}>High</option>
          <option value="medium" ${feature.trust === "medium" ? "selected" : ""}>Medium</option>
          <option value="low" ${feature.trust === "low" ? "selected" : ""}>Low</option>
        </select>
      </td>
      <td class="center"><button class="icon-button" title="Remove feature" type="button">x</button></td>
    `;
    const inputs = row.querySelectorAll("input, select");
    inputs[0].addEventListener("input", (event) => updateFeature(feature.id, "featureId", event.target.value));
    inputs[1].addEventListener("input", (event) => updateFeature(feature.id, "reads", event.target.value));
    inputs[2].addEventListener("input", (event) => updateFeature(feature.id, "blast", event.target.value));
    inputs[3].addEventListener("input", (event) => updateFeature(feature.id, "pipeline", event.target.value));
    inputs[4].addEventListener("input", (event) => updateFeature(feature.id, "identity", event.target.value));
    inputs[5].addEventListener("change", (event) => updateFeature(feature.id, "control", event.target.checked));
    inputs[6].addEventListener("change", (event) => {
      updateFeature(feature.id, "trust", event.target.value);
      event.target.className = trustClass(event.target.value);
    });
    row.querySelector("button").addEventListener("click", () => {
      state.features = state.features.filter((item) => item.id !== feature.id);
      renderFeatures();
      saveState();
    });
    tbody.appendChild(row);
  });
  renderStats();
}

function renderStats() {
  const totalReads = state.features.reduce((sum, item) => sum + Number(item.reads || 0), 0);
  const highTrust = state.features.filter((item) => item.trust === "high").length;
  const controlFlags = state.features.filter((item) => item.control).length;
  const top = [...state.features].sort((a, b) => Number(b.reads) - Number(a.reads))[0];
  $("totalReads").textContent = totalReads.toLocaleString();
  $("highTrust").textContent = highTrust;
  $("controlFlags").textContent = controlFlags;
  $("topOrganism").textContent = top && (top.blast || top.pipeline || top.featureId) ? (top.blast || top.pipeline || top.featureId) : "-";
}

function addTaxon(taxon = {}) {
  state.taxa.push({
    id: taxon.id || uid(),
    name: taxon.name || "",
    percent: Number(taxon.percent || 0)
  });
  renderTaxa();
  saveState();
}

function updateTaxon(id, field, value) {
  const taxon = state.taxa.find((item) => item.id === id);
  if (!taxon) return;
  taxon[field] = field === "percent" ? Number(value || 0) : value;
  saveState();
  drawComposition();
}

function renderTaxa() {
  const container = $("taxonInputs");
  container.innerHTML = "";
  state.taxa.forEach((taxon, index) => {
    const row = document.createElement("div");
    row.className = "taxon-row";
    row.innerHTML = `
      <span class="taxon-swatch" style="background:${palette[index % palette.length]}"></span>
      <input value="${escapeHtml(taxon.name)}" placeholder="Proteobacteria">
      <input type="number" min="0" max="100" step="0.1" value="${taxon.percent}">
      <button class="icon-button" title="Remove taxon" type="button">x</button>
    `;
    const inputs = row.querySelectorAll("input");
    inputs[0].addEventListener("input", (event) => updateTaxon(taxon.id, "name", event.target.value));
    inputs[1].addEventListener("input", (event) => updateTaxon(taxon.id, "percent", event.target.value));
    row.querySelector("button").addEventListener("click", () => {
      state.taxa = state.taxa.filter((item) => item.id !== taxon.id);
      renderTaxa();
      saveState();
    });
    container.appendChild(row);
  });
  drawComposition();
}

function drawComposition() {
  const canvas = $("compositionChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const total = state.taxa.reduce((sum, item) => sum + Number(item.percent || 0), 0);
  const left = 160;
  const top = 42;
  const width = canvas.width - 230;
  const barHeight = 32;
  const gap = 16;

  ctx.fillStyle = "#172033";
  ctx.font = "700 16px Arial";
  ctx.fillText("Major taxonomic groups", 18, 24);

  if (state.taxa.length === 0) {
    ctx.fillStyle = "#5c667a";
    ctx.font = "14px Arial";
    ctx.fillText("Add taxa to build the chart.", 18, 62);
    $("compositionNote").textContent = "Add the dominant groups from your taxa bar plot.";
    return;
  }

  state.taxa.forEach((taxon, index) => {
    const y = top + index * (barHeight + gap);
    const percent = Math.max(0, Number(taxon.percent || 0));
    const barWidth = Math.min(width, width * percent / 100);

    ctx.font = "13px Arial";
    ctx.fillStyle = "#354154";
    wrapLabel(ctx, taxon.name || `Taxon ${index + 1}`, 18, y + 20, 128, 14);

    ctx.fillStyle = "#ecf1f7";
    roundedRect(ctx, left, y, width, barHeight, 7);
    ctx.fill();

    ctx.fillStyle = palette[index % palette.length];
    roundedRect(ctx, left, y, Math.max(2, barWidth), barHeight, 7);
    ctx.fill();

    ctx.fillStyle = "#172033";
    ctx.font = "700 13px Arial";
    ctx.fillText(`${percent.toFixed(1)}%`, left + width + 12, y + 21);
  });

  const message = Math.abs(total - 100) <= 5
    ? "This is close enough for a broad community profile."
    : "Adjust percentages or add an Other category so the total is near 100%.";
  $("compositionNote").textContent = `Current total: ${total.toFixed(1)}%. ${message}`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapLabel(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = "";
  let lineY = y;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  });
  ctx.fillText(line, x, lineY);
}

function wireNotes() {
  Object.keys(state.notes).forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.value = state.notes[id] || "";
    element.addEventListener("input", (event) => {
      state.notes[id] = event.target.value;
      saveState();
    });
  });
}

function wireCheckPersistence() {
  document.addEventListener("change", (event) => {
    const key = event.target?.dataset?.saveCheck;
    if (!key) return;
    state.checks[key] = event.target.checked;
    saveState();
  });
}

function loadExample() {
  state.features = [
    { id: uid(), featureId: "ASV_0042", reads: 18420, blast: "Limnohabitans", pipeline: "Burkholderiaceae; Limnohabitans", identity: 99.1, control: false, trust: "high" },
    { id: uid(), featureId: "ASV_0017", reads: 13980, blast: "Polynucleobacter", pipeline: "Burkholderiaceae; Polynucleobacter", identity: 98.7, control: false, trust: "high" },
    { id: uid(), featureId: "ASV_0099", reads: 8220, blast: "Acidovorax", pipeline: "Comamonadaceae; Acidovorax", identity: 97.9, control: false, trust: "medium" },
    { id: uid(), featureId: "ASV_0121", reads: 910, blast: "Ralstonia", pipeline: "Burkholderiaceae; Ralstonia", identity: 99.5, control: true, trust: "low" }
  ];
  state.taxa = [
    { id: uid(), name: "Proteobacteria", percent: 48 },
    { id: uid(), name: "Bacteroidota", percent: 19 },
    { id: uid(), name: "Actinobacteriota", percent: 14 },
    { id: uid(), name: "Cyanobacteria", percent: 8 },
    { id: uid(), name: "Other", percent: 11 }
  ];
  state.notes.riverComparison = "Example placeholder: Boyce Park should be compared against the shared river baseline. Replace this with the actual PCoA pattern.";
  state.notes.internalComparison = "Example placeholder: Look for clustering by pond sub-location, control status, chemistry, or another Alpha metadata feature.";
  state.notes.storyText = "Example placeholder: Dominant freshwater heterotrophs would support a pond-water story; acid-tolerant, metal-associated, sulfur-cycling, or iron-cycling taxa would strengthen a mine-drainage influence claim.";
  saveState();
  renderFeatures();
  renderTaxa();
  wireNotes();
}

function exportOutline() {
  const highTrust = state.features.filter((feature) => feature.trust === "high");
  const controlFlags = state.features.filter((feature) => feature.control);
  const taxaLines = state.taxa.map((taxon) => `- ${taxon.name || "Unnamed taxon"}: ${Number(taxon.percent || 0).toFixed(1)}%`).join("\n") || "- Add taxa.";
  const featureLines = state.features
    .sort((a, b) => Number(b.reads) - Number(a.reads))
    .map((feature) => `- ${feature.featureId || "Feature"}: BLAST=${feature.blast || "TBD"}; pipeline=${feature.pipeline || "TBD"}; identity=${feature.identity || 0}%; trust=${feature.trust}; control=${feature.control ? "yes" : "no"}`)
    .join("\n") || "- Add BLAST calls.";

  const markdown = `# Group Alpha: Boyce Park Pond Water Microbiome

## Project Question
Does Boyce Park pond water look like an ordinary freshwater community, a mine-drainage-influenced community, or both?

## BLAST vs. Pipeline Trust
${featureLines}

High-trust calls: ${highTrust.length}
Control flags: ${controlFlags.length}

## Community Profile
${taxaLines}

## PCoA View 1: Boyce Park vs. Rivers
${state.notes.riverComparison || "Add interpretation."}

## PCoA View 2: Inside Alpha
${state.notes.internalComparison || "Add interpretation."}

## Biology Story
${state.notes.storyText || "Add claim, evidence, and reasoning."}

## Going Farther
- PICRUSt function prediction: ${state.checks.picrust ? "included" : "not yet"}
- PERMANOVA or ANOSIM: ${state.checks.permanova ? "included" : "not yet"}
- Indicator organisms: ${state.checks.indicator ? "included" : "not yet"}
`;

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "group-alpha-boyce-park-outline.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function drawPond() {
  const canvas = $("pondCanvas");
  const ctx = canvas.getContext("2d");
  let t = 0;
  const microbes = [
    [110, 90, 24, "#00a6a6"],
    [220, 235, 18, "#f25f5c"],
    [345, 145, 26, "#ffc857"],
    [492, 285, 20, "#6c63ff"],
    [615, 118, 22, "#2e7d32"],
    [745, 245, 19, "#277da1"],
    [820, 150, 18, "#f3722c"],
    [430, 88, 15, "#577590"]
  ];

  function frame() {
    t += 0.012;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const water = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    water.addColorStop(0, "#def7f2");
    water.addColorStop(0.55, "#8ed3d0");
    water.addColorStop(1, "#277da1");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
    for (let i = 0; i < 11; i += 1) {
      const y = 42 + i * 38 + Math.sin(t * 4 + i) * 8;
      roundedRect(ctx, 34, y, canvas.width - 68, 4, 4);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(22, 50, 79, 0.12)";
    ctx.beginPath();
    ctx.ellipse(195, 420, 160, 34, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(640, 405, 210, 42, -0.05, 0, Math.PI * 2);
    ctx.fill();

    microbes.forEach(([x, y, size, color], index) => {
      const dx = Math.sin(t * 4 + index * 0.7) * 22;
      const dy = Math.cos(t * 3 + index) * 14;
      ctx.save();
      ctx.translate(x + dx, y + dy);
      ctx.rotate(t + index);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.beginPath();
      ctx.arc(size * 0.25, -size * 0.08, Math.max(3, size * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.fillStyle = "rgba(22, 50, 79, 0.82)";
    ctx.font = "700 24px Arial";
    ctx.fillText("Boyce Park pond water", 34, 54);
    ctx.font = "16px Arial";
    ctx.fillText("16S taxonomy, controls, composition, and PCoA evidence", 34, 82);

    requestAnimationFrame(frame);
  }
  frame();
}

function wireNavigation() {
  document.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function init() {
  renderWorkflow();
  renderSubmissionChecklist();
  wireCheckPersistence();
  wireNavigation();
  wireNotes();
  $("addFeature").addEventListener("click", () => addFeature());
  $("addTaxon").addEventListener("click", () => addTaxon());
  $("loadExample").addEventListener("click", loadExample);
  $("exportSummary").addEventListener("click", exportOutline);

  if (state.features.length === 0) {
    addFeature();
  } else {
    renderFeatures();
  }

  if (state.taxa.length === 0) {
    addTaxon({ name: "Other", percent: 100 });
  } else {
    renderTaxa();
  }

  drawPond();
}

init();
