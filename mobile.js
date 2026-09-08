import { SCENARIOS, METRICS, CATEGORIES } from "./scenarios.js";

const STORAGE_KEY = "med-kindness-progress-v1";
const INITIAL_SCORE = 60;
const $ = (selector) => document.querySelector(selector);
const clamp = (value) => Math.min(100, Math.max(0, value));

const els = {
  home: $("#mobileHomeView"),
  player: $("#mobilePlayerView"),
  result: $("#mobileResultView"),
  completedCount: $("#mobileCompletedCount"),
  filters: $("#mobileFilters"),
  search: $("#mobileSearch"),
  caseList: $("#mobileCaseList"),
  playerCategory: $("#mobilePlayerCategory"),
  playerTitle: $("#mobilePlayerTitle"),
  progressFill: $("#mobileProgressFill"),
  stageBg: $("#mobileStageBg"),
  stageActor: $("#mobileStageActor"),
  sceneLabel: $("#mobileSceneLabel"),
  metricStrip: $("#mobileMetricStrip"),
  roundStage: $("#mobileRoundStage"),
  roundNumber: $("#mobileRoundNumber"),
  avatar: $("#mobileAvatar"),
  speakerName: $("#mobileSpeakerName"),
  dialogueText: $("#mobileDialogueText"),
  openingQuote: $("#mobileOpeningQuote"),
  prompt: $("#mobilePrompt"),
  options: $("#mobileOptions"),
  feedback: $("#mobileFeedback"),
  feedbackRating: $("#mobileFeedbackRating"),
  deltaSummary: $("#mobileDeltaSummary"),
  actorReply: $("#mobileActorReply"),
  feedbackText: $("#mobileFeedbackText"),
  continueButton: $("#mobileContinueButton"),
  evidenceCount: $("#mobileEvidenceCount"),
  evidenceList: $("#mobileEvidenceList"),
  undoButton: $("#mobileUndoButton"),
  resultBg: $("#mobileResultBg"),
  resultSeal: $("#mobileResultSeal"),
  resultTitle: $("#mobileResultTitle"),
  totalScore: $("#mobileTotalScore"),
  resultLevel: $("#mobileResultLevel"),
  resultSummary: $("#mobileResultSummary"),
  resultMetrics: $("#mobileResultMetrics"),
  debrief: $("#mobileDebrief"),
  progressDialog: $("#mobileProgressDialog"),
  progressList: $("#mobileProgressList")
};

let activeCategory = "全部";
let state = emptyState();

function emptyState() {
  return {
    scenarioIndex: -1,
    roundIndex: -1,
    metrics: Object.fromEntries(Object.keys(METRICS).map((key) => [key, INITIAL_SCORE])),
    evidence: [],
    history: [],
    answered: false,
    changedMetrics: []
  };
}

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeProgress(scenarioId, score) {
  const progress = readProgress();
  const previous = progress[scenarioId];
  progress[scenarioId] = {
    bestScore: Math.max(score, previous?.bestScore || 0),
    metrics: score >= (previous?.bestScore || 0) ? { ...state.metrics } : previous.metrics,
    attempts: (previous?.attempts || 0) + 1,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function showOnly(view) {
  [els.home, els.player, els.result].forEach((item) => { item.hidden = item !== view; });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  state = emptyState();
  history.replaceState(null, "", location.pathname);
  renderCases();
  updateCompletedCount();
  showOnly(els.home);
}

function updateCompletedCount() {
  els.completedCount.textContent = Object.keys(readProgress()).length;
}

function renderFilters() {
  els.filters.innerHTML = CATEGORIES.map((category) => `
    <button class="mobile-filter ${category === activeCategory ? "active" : ""}" type="button" data-category="${category}">${category}</button>
  `).join("");
  els.filters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderCases();
    });
  });
}

function renderCases() {
  const query = els.search.value.trim().toLowerCase();
  const progress = readProgress();
  const filtered = SCENARIOS.filter((scenario) => {
    const categoryMatches = activeCategory === "全部" || scenario.category === activeCategory;
    const searchable = [scenario.title, scenario.category, scenario.actorName, scenario.brief, ...scenario.focus].join(" ").toLowerCase();
    return categoryMatches && (!query || searchable.includes(query));
  });

  els.caseList.innerHTML = filtered.length ? filtered.map((scenario) => {
    const index = SCENARIOS.indexOf(scenario);
    const record = progress[scenario.id];
    return `
      <article class="mobile-case-card">
        ${record ? `<span class="mobile-complete">最佳 ${record.bestScore}</span>` : ""}
        <div class="mobile-case-art">
          <img src="${scenario.background}" alt="">
          <img class="mobile-case-actor" src="${scenario.actor}" alt="">
          <span class="mobile-case-index">${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="mobile-case-body">
          <div class="mobile-case-meta"><span>${scenario.category}</span><span>${scenario.difficulty}</span></div>
          <h3>${scenario.title}</h3>
          <p>${scenario.brief}</p>
          <div class="mobile-case-action">
            <small>${scenario.rounds.length} 回合 · ${scenario.duration}</small>
            <button type="button" data-case-index="${index}">${record ? "再练一次" : "开始"}</button>
          </div>
        </div>
      </article>
    `;
  }).join("") : `<p class="mobile-empty">没有匹配的病例，换个关键词试试。</p>`;

  els.caseList.querySelectorAll("[data-case-index]").forEach((button) => {
    button.addEventListener("click", () => startCase(Number(button.dataset.caseIndex)));
  });
}

function quickStart() {
  const progress = readProgress();
  const index = SCENARIOS.findIndex((scenario) => !progress[scenario.id]);
  startCase(index < 0 ? 0 : index);
}

function startCase(index) {
  state = emptyState();
  state.scenarioIndex = index;
  const scenario = SCENARIOS[index];
  els.playerCategory.textContent = `${scenario.category} · ${scenario.difficulty}`;
  els.playerTitle.textContent = scenario.title;
  els.stageBg.src = scenario.background;
  els.stageBg.alt = scenario.scene;
  els.stageActor.src = scenario.actor;
  els.stageActor.alt = scenario.actorName;
  els.sceneLabel.textContent = scenario.scene;
  els.avatar.style.backgroundImage = `url("${scenario.actor}")`;
  history.replaceState(null, "", `#case=${scenario.id}`);
  renderMetrics();
  renderEvidence();
  renderIntro();
  showOnly(els.player);
}

function renderIntro() {
  const scenario = SCENARIOS[state.scenarioIndex];
  state.roundIndex = -1;
  state.answered = false;
  els.roundStage.textContent = "场景序幕";
  els.roundNumber.textContent = `0 / ${scenario.rounds.length}`;
  els.speakerName.textContent = "场景旁白";
  els.dialogueText.textContent = scenario.setup;
  els.openingQuote.hidden = false;
  els.openingQuote.innerHTML = `“${scenario.quote}”<cite>—— ${scenario.quoteBy}</cite>`;
  els.prompt.textContent = "带着这句话进入今天的会谈";
  els.options.innerHTML = `<button class="mobile-primary" type="button">进入会谈</button>`;
  els.options.querySelector("button").addEventListener("click", () => {
    state.roundIndex = 0;
    renderRound();
  });
  els.feedback.hidden = true;
  els.undoButton.disabled = true;
  updateRoundProgress();
}

function renderRound() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const round = scenario.rounds[state.roundIndex];
  state.answered = false;
  state.changedMetrics = [];
  els.roundStage.textContent = round.stage;
  els.roundNumber.textContent = `${state.roundIndex + 1} / ${scenario.rounds.length}`;
  els.speakerName.textContent = round.speaker;
  els.dialogueText.textContent = round.text;
  els.openingQuote.hidden = true;
  els.prompt.textContent = round.prompt;
  els.feedback.hidden = true;
  els.feedback.className = "mobile-feedback";
  els.options.innerHTML = round.options.map((choice, index) => `
    <button class="mobile-option" type="button" data-option-index="${index}">
      <span>${String.fromCharCode(65 + index)}</span><span>${choice.text}</span>
    </button>
  `).join("");
  els.options.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => chooseOption(Number(button.dataset.optionIndex)));
  });
  els.undoButton.disabled = state.history.length === 0;
  renderMetrics();
  renderEvidence();
  updateRoundProgress();
}

function chooseOption(optionIndex) {
  if (state.answered) return;
  const scenario = SCENARIOS[state.scenarioIndex];
  const choice = scenario.rounds[state.roundIndex].options[optionIndex];
  state.history.push({
    roundIndex: state.roundIndex,
    metrics: { ...state.metrics },
    evidence: [...state.evidence]
  });
  state.answered = true;
  state.changedMetrics = Object.keys(choice.delta);

  Object.entries(choice.delta).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value);
  });
  choice.evidence.forEach((item) => {
    if (!state.evidence.includes(item)) state.evidence.push(item);
  });

  els.options.querySelectorAll("button").forEach((button, index) => {
    button.disabled = true;
    if (index === optionIndex) button.classList.add("chosen");
  });

  const ratings = {
    excellent: "兼顾临床与关系",
    caution: "有可取之处，但需补足",
    risky: "存在重要风险"
  };
  els.feedback.className = `mobile-feedback ${choice.quality === "excellent" ? "" : choice.quality}`.trim();
  els.feedbackRating.textContent = ratings[choice.quality];
  els.deltaSummary.textContent = Object.entries(choice.delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${METRICS[key].short}${value > 0 ? "+" : ""}${value}`)
    .join(" · ");
  els.actorReply.textContent = `“${choice.reply}”`;
  els.feedbackText.textContent = choice.feedback;
  els.continueButton.textContent = state.roundIndex === scenario.rounds.length - 1 ? "查看会谈复盘" : "继续下一回合";
  els.feedback.hidden = false;
  els.undoButton.disabled = false;
  renderMetrics();
  renderEvidence();
  els.feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function continueCase() {
  if (!state.answered) return;
  const scenario = SCENARIOS[state.scenarioIndex];
  if (state.roundIndex === scenario.rounds.length - 1) {
    finishCase();
    return;
  }
  state.roundIndex += 1;
  renderRound();
  $(".mobile-dialogue-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

function undoChoice() {
  const previous = state.history.pop();
  if (!previous) return;
  state.roundIndex = previous.roundIndex;
  state.metrics = { ...previous.metrics };
  state.evidence = [...previous.evidence];
  renderRound();
}

function updateRoundProgress() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const completed = state.roundIndex < 0 ? 0 : state.roundIndex + (state.answered ? 1 : 0);
  els.progressFill.style.width = `${(completed / scenario.rounds.length) * 100}%`;
}

function renderMetrics() {
  els.metricStrip.innerHTML = Object.entries(METRICS).map(([key, metric]) => `
    <div class="mobile-metric ${state.changedMetrics.includes(key) ? "changed" : ""}">
      <span>${metric.short}</span><strong>${state.metrics[key]}</strong>
    </div>
  `).join("");
}

function renderEvidence() {
  els.evidenceCount.textContent = state.evidence.length;
  els.evidenceList.innerHTML = state.evidence.length
    ? state.evidence.map((item) => `<li>${item}</li>`).join("")
    : "<li>通过有效沟通发现信息</li>";
}

function finishCase() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const total = Math.round(Object.values(state.metrics).reduce((sum, value) => sum + value, 0) / Object.keys(METRICS).length);
  let outcome;
  if (total >= 80) {
    outcome = { seal: "深度倾听", title: "你让事实与感受坐在了同一张桌前", level: "成熟的共同决策者", summary: "温度没有稀释医学判断，反而帮助对方理解风险、表达价值，并形成了可执行的下一步。" };
  } else if (total >= 65) {
    outcome = { seal: "稳健前行", title: "会谈建立了方向，也留下了可改进的缝隙", level: "稳健的沟通实践者", summary: "你抓住了多数关键节点。回看最低维度，会发现下一次最值得改变的一句话。" };
  } else if (total >= 50) {
    outcome = { seal: "继续练习", title: "谈话完成了，共同理解仍不够牢固", level: "正在形成沟通框架", summary: "部分选择推进了医疗任务，却可能让对方在关键处没有真正理解或参与。" };
  } else {
    outcome = { seal: "重新出发", title: "这次会谈出现了需要及时修复的风险", level: "建议进行带教复盘", summary: "这些表达可能造成延误、误解、冲突或信任损伤。请逐回合复盘后再尝试一次。" };
  }

  writeProgress(scenario.id, total);
  updateCompletedCount();
  els.resultBg.src = scenario.background;
  els.resultBg.alt = scenario.scene;
  els.resultSeal.textContent = outcome.seal;
  els.resultTitle.textContent = outcome.title;
  els.totalScore.textContent = total;
  els.resultLevel.textContent = outcome.level;
  els.resultSummary.textContent = outcome.summary;
  els.resultMetrics.innerHTML = Object.entries(METRICS).map(([key, metric]) => `
    <div class="mobile-result-metric"><strong>${state.metrics[key]}</strong><span>${metric.label}</span></div>
  `).join("");
  const ordered = Object.keys(METRICS).sort((a, b) => state.metrics[b] - state.metrics[a]);
  els.debrief.innerHTML = `
    <h2>本次谈话留下了什么</h2>
    <ul>
      <li>相对优势：${METRICS[ordered[0]].label}</li>
      <li>优先复盘：${METRICS[ordered.at(-1)].label}</li>
      <li>通过沟通获得 ${state.evidence.length} 条关键临床或决策信息</li>
      ${scenario.debrief.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
  renderCases();
  showOnly(els.result);
}

function showProgress() {
  const progress = readProgress();
  els.progressList.innerHTML = SCENARIOS.map((scenario) => {
    const record = progress[scenario.id];
    return `
      <div class="mobile-history-item">
        <div><strong>${scenario.title}</strong><small>${record ? `练习 ${record.attempts} 次` : "尚未完成"}</small></div>
        <span class="mobile-history-score">${record ? record.bestScore : "—"}</span>
      </div>
    `;
  }).join("");
  els.progressDialog.showModal();
}

function openHashCase() {
  const match = location.hash.match(/^#case=(.+)$/);
  if (!match) return;
  const index = SCENARIOS.findIndex((scenario) => scenario.id === match[1]);
  if (index >= 0) startCase(index);
}

function bindEvents() {
  $("#mobileHomeButton").addEventListener("click", goHome);
  $("#mobileBackButton").addEventListener("click", goHome);
  $("#mobileRestartButton").addEventListener("click", () => startCase(state.scenarioIndex));
  $("#quickStartButton").addEventListener("click", quickStart);
  $("#filterTrigger").addEventListener("click", () => {
    const nowHidden = !els.filters.hidden;
    els.filters.hidden = nowHidden;
    $("#filterTrigger").setAttribute("aria-expanded", String(!nowHidden));
  });
  els.search.addEventListener("input", renderCases);
  els.continueButton.addEventListener("click", continueCase);
  els.undoButton.addEventListener("click", undoChoice);
  $("#mobileNextCaseButton").addEventListener("click", () => startCase((state.scenarioIndex + 1) % SCENARIOS.length));
  $("#mobileRetryButton").addEventListener("click", () => startCase(state.scenarioIndex));
  $("#mobileResultHomeButton").addEventListener("click", goHome);
  $("#mobileProgressButton").addEventListener("click", showProgress);
  $("#mobileProgressClose").addEventListener("click", () => els.progressDialog.close());
  els.progressDialog.addEventListener("click", (event) => {
    if (event.target === els.progressDialog) els.progressDialog.close();
  });
}

function init() {
  renderFilters();
  renderCases();
  updateCompletedCount();
  bindEvents();
  openHashCase();
}

init();
