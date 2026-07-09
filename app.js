const STORAGE_KEY = "alphaBoyceParkPresentation";
const DATASET_VERSION = "boyce-top-20-blast-identity-2026-07";

const defaultState = {
  features: [],
  taxa: [],
  checks: {},
  datasetVersion: ""
};

const state = loadState();

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
      checks: parsed.checks || {},
      datasetVersion: parsed.datasetVersion || ""
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

function addFeature(feature = {}) {
  state.features.push({
    id: feature.id || uid(),
    featureId: feature.featureId || "",
    reads: Number(feature.reads || 0),
    blast: feature.blast || "",
    pipeline: feature.pipeline || "",
    identity: feature.identity || "",
    control: Boolean(feature.control),
    trust: feature.trust || "medium"
  });
  renderFeatures();
  saveState();
}

function updateFeature(id, field, value) {
  const feature = state.features.find((item) => item.id === id);
  if (!feature) return;
  if (field === "reads") {
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
      <td><input value="${escapeHtml(feature.blast)}" placeholder="Manual BLAST result or note"></td>
      <td><input value="${escapeHtml(feature.pipeline)}" placeholder="SILVA/QIIME2 call"></td>
      <td><input value="${escapeHtml(feature.identity)}" placeholder="99.3"></td>
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
  $("topOrganism").textContent = top && (top.pipeline || top.blast || top.featureId) ? (top.pipeline || top.blast || top.featureId) : "-";
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

function wireCheckPersistence() {
  document.addEventListener("change", (event) => {
    const key = event.target?.dataset?.saveCheck;
    if (!key) return;
    state.checks[key] = event.target.checked;
    saveState();
  });
}

function loadExample() {
  state.datasetVersion = DATASET_VERSION;
  state.features = [
    { id: uid(), featureId: "821495", reads: 303122, blast: "BLAST: Ferruvum spp. hits, about 99.1%", pipeline: "Proteobacteria; Burkholderiales", identity: "99.14", control: false, trust: "medium" },
    { id: uid(), featureId: "4402734", reads: 94842, blast: "BLAST: Eunotia/Navicula chloroplast, about 99.3%", pipeline: "Cyanobacteria; chloroplast", identity: "99.32", control: false, trust: "high" },
    { id: uid(), featureId: "550329", reads: 51764, blast: "BLAST: Cryptomonas/Komma plastid, about 96.8%", pipeline: "Cyanobacteria; chloroplast", identity: "96.83", control: false, trust: "high" },
    { id: uid(), featureId: "4203120", reads: 20357, blast: "No BLAST screenshot provided; pipeline places it in uncultured Acidimicrobiia", pipeline: "Actinobacteriota; uncultured Acidimicrobiia", identity: "not shown", control: false, trust: "low" },
    { id: uid(), featureId: "4327233", reads: 17360, blast: "BLAST: Curtobacterium hits, about 99.3%", pipeline: "Actinobacteriota; Microbacteriaceae", identity: "99.33", control: false, trust: "high" },
    { id: uid(), featureId: "254922", reads: 16200, blast: "BLAST: Acidocella spp., about 99.1%", pipeline: "Proteobacteria; Acidocella", identity: "99.09", control: false, trust: "medium" },
    { id: uid(), featureId: "1140775", reads: 10178, blast: "BLAST: Aciditerrimonas/Actinobacterium hits, about 93.4%", pipeline: "Actinobacteriota; uncultured Acidimicrobiaceae", identity: "93.44", control: false, trust: "medium" },
    { id: uid(), featureId: "283765", reads: 8520, blast: "BLAST: Kocuria spp., about 99.3%", pipeline: "Actinobacteriota; Kocuria", identity: "99.33", control: false, trust: "high" },
    { id: uid(), featureId: "13505", reads: 8290, blast: "BLAST: Bacterium B10H12/Aciditerrimonas hits", pipeline: "Actinobacteriota; uncultured Banisveld", identity: "98.25", control: false, trust: "low" },
    { id: uid(), featureId: "3538", reads: 5897, blast: "BLAST: Klebsormidium chloroplast, about 99.3%", pipeline: "Cyanobacteria; chloroplast", identity: "99.34", control: false, trust: "high" },
    { id: uid(), featureId: "219317", reads: 5496, blast: "BLAST: Aciditerrimonas/Actinobacterium hits, about 93.2%", pipeline: "Actinobacteriota; uncultured Acidimicrobiaceae", identity: "93.21", control: false, trust: "medium" },
    { id: uid(), featureId: "647790", reads: 5406, blast: "BLAST: Roseiarcus/Methylopila hits, about 97.7%", pipeline: "Proteobacteria; Roseiarcus", identity: "97.73", control: false, trust: "high" },
    { id: uid(), featureId: "1113279", reads: 5399, blast: "BLAST: Acidiphilium spp., about 99.3%", pipeline: "Proteobacteria; Acidiphilium", identity: "99.32", control: false, trust: "high" },
    { id: uid(), featureId: "683891", reads: 5253, blast: "BLAST: Fertoebacter/Rhodobacter-like hits, about 98.0%", pipeline: "Proteobacteria; Pseudorhodobacter; mine drainage", identity: "97.95", control: false, trust: "medium" },
    { id: uid(), featureId: "4203118", reads: 5004, blast: "BLAST: Rhodopila/Acidisphaera hits, about 96.8%", pipeline: "Proteobacteria; Acetobacteraceae", identity: "96.82", control: false, trust: "low" },
    { id: uid(), featureId: "1047041", reads: 4942, blast: "BLAST: Lawsonella clevelandensis, about 99.1%", pipeline: "Actinobacteriota; Lawsonella", identity: "99.10", control: false, trust: "high" },
    { id: uid(), featureId: "1121839", reads: 4283, blast: "BLAST: Rhodoblastus spp., about 98.9%", pipeline: "Proteobacteria; Rhodoblastus", identity: "98.86", control: false, trust: "medium" },
    { id: uid(), featureId: "4453684", reads: 4165, blast: "BLAST: Povalibacter/Steroidobacter hits, about 92.7%", pipeline: "Proteobacteria; uncultured WD260", identity: "92.70", control: false, trust: "medium" },
    { id: uid(), featureId: "169182", reads: 3632, blast: "BLAST: Enterococcus/E. coli hits, about 99.6%", pipeline: "Proteobacteria; Enterobacterales", identity: "99.57", control: false, trust: "low" },
    { id: uid(), featureId: "150673", reads: 3515, blast: "BLAST: Sphingomonas spp., about 99.3%", pipeline: "Proteobacteria; Sphingomonas", identity: "99.32", control: false, trust: "high" }
  ];
  state.taxa = [
    { id: uid(), name: "Proteobacteria", percent: 56.5 },
    { id: uid(), name: "Cyanobacteria / chloroplast", percent: 18.8 },
    { id: uid(), name: "Actinobacteriota", percent: 14.3 },
    { id: uid(), name: "Acidobacteriota", percent: 3.2 },
    { id: uid(), name: "Bacteroidota", percent: 1.9 },
    { id: uid(), name: "Other", percent: 5.3 }
  ];
  saveState();
  renderFeatures();
  renderTaxa();
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
  wireCheckPersistence();
  wireNavigation();
  $("addFeature").addEventListener("click", () => addFeature());
  $("addTaxon").addEventListener("click", () => addTaxon());
  $("loadExample").addEventListener("click", loadExample);

  if (state.datasetVersion !== DATASET_VERSION || state.features.length === 0 || state.taxa.length === 0) {
    loadExample();
  } else {
    renderFeatures();
    renderTaxa();
  }

  drawPond();
}

init();
