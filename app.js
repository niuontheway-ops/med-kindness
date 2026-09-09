import { SCENARIOS, METRICS, CATEGORIES } from "./scenarios.js";
import { actorStaging, stagedDoctorAsset, stageCharacter, observeStage } from "./stage-layout.js?v=face-to-face-2";

const STORAGE_KEY = "med-kindness-progress-v1";
const INITIAL_SCORE = 60;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const EMOTION_LABELS = {
  sad: "悲伤未解",
  afraid: "恐惧加深",
  angry: "愤怒加剧",
  relieved: "稍感释然"
};
const DOCTOR_POSES = {
  listen: "主动倾听",
  empathy: "共情承接",
  explain: "解释与共决",
  urgent: "急症评估",
  boundary: "温和设限"
};

function expressionAsset(actor, emotion) {
  if (!Object.hasOwn(EMOTION_LABELS, emotion) || emotion === "sad") return actor;
  const name = actor.split("/").at(-1).replace(/\.png$/i, "");
  return `assets/expressions/${name}-${emotion}.webp`;
}

function doctorAsset(pose) {
  return stagedDoctorAsset(SCENARIOS[state.scenarioIndex], pose);
}

function inferDoctorPose(round) {
  const context = `${round.stage} ${round.prompt} ${round.text}`;
  if (/急症|严重程度|生命支持|迅速恶化|危险信号|立即评估|呼吸循环|急救/.test(context)) return "urgent";
  if (/边界|威胁|冲突|离院|拒绝|代理决策|设限|强制/.test(context)) return "boundary";
  if (/解释|说明|告知|检测|知情|风险|方案|治疗|复述|核对|承接/.test(context)) return "explain";
  if (/回应|感受|担忧|恐惧|悲伤|愤怒|道歉|愿望|希望|目标|价值/.test(context)) return "empathy";
  return "listen";
}

function introDoctorPose(scenario) {
  if (["急诊沟通", "急性传染性疾病"].includes(scenario.category)) return "urgent";
  if (scenario.category === "冲突沟通") return "boundary";
  if (["肿瘤与姑息", "缓和医疗", "ICU与生命末期"].includes(scenario.category)) return "empathy";
  return "listen";
}

const els = {
  homeView: $("#homeView"),
  caseView: $("#caseView"),
  resultView: $("#resultView"),
  progressView: $("#progressView"),
  aboutView: $("#aboutView"),
  caseGrid: $("#caseGrid"),
  filterRow: $("#filterRow"),
  caseSearch: $("#caseSearch"),
  emptyState: $("#emptyState"),
  caseCount: $("#caseCount"),
  roundCount: $("#roundCount"),
  dimensionList: $("#dimensionList"),
  caseCategory: $("#caseCategory"),
  caseTitle: $("#caseTitle"),
  caseGoal: $("#caseGoal"),
  caseBrief: $("#caseBrief"),
  roundIndicator: $("#roundIndicator"),
  progressFill: $("#progressFill"),
  roundDots: $("#roundDots"),
  evidenceCount: $("#evidenceCount"),
  evidenceList: $("#evidenceList"),
  stage: $("#stage"),
  stageBackground: $("#stageBackground"),
  stageDoctor: $("#stageDoctor"),
  stageActor: $("#stageActor"),
  sceneLabel: $("#sceneLabel"),
  doctorTag: $("#doctorTag"),
  actorTag: $("#actorTag"),
  actorEmotionLabel: $("#actorEmotionLabel"),
  roundStage: $("#roundStage"),
  roundNumber: $("#roundNumber"),
  speakerAvatar: $("#speakerAvatar"),
  speakerName: $("#speakerName"),
  dialogueText: $("#dialogueText"),
  coachPrompt: $("#coachPrompt"),
  openingQuote: $("#openingQuote"),
  optionList: $("#optionList"),
  feedbackPanel: $("#feedbackPanel"),
  feedbackRating: $("#feedbackRating"),
  reactionAvatar: $("#reactionAvatar"),
  reactionEmotionLabel: $("#reactionEmotionLabel"),
  deltaList: $("#deltaList"),
  actorReply: $("#actorReply"),
  feedbackText: $("#feedbackText"),
  continueButton: $("#continueButton"),
  metricMeters: $("#metricMeters"),
  clinicalReminder: $("#clinicalReminder"),
  undoButton: $("#undoButton"),
  resultBackground: $("#resultBackground"),
  resultSeal: $("#resultSeal"),
  resultTitle: $("#resultTitle"),
  resultSummary: $("#resultSummary"),
  totalScore: $("#totalScore"),
  resultLevel: $("#resultLevel"),
  resultMetrics: $("#resultMetrics"),
  debriefContent: $("#debriefContent"),
  progressDashboard: $("#progressDashboard"),
  metricDialog: $("#metricDialog"),
  metricExplanations: $("#metricExplanations")
};

const views = [els.homeView, els.caseView, els.resultView, els.progressView, els.aboutView];
observeStage(els.stage);
let selectedCategory = "全部";
let state = createEmptyState();

function createEmptyState() {
  return {
    scenarioIndex: -1,
    roundIndex: -1,
    metrics: Object.fromEntries(Object.keys(METRICS).map((key) => [key, INITIAL_SCORE])),
    evidence: [],
    history: [],
    answered: false,
    emotion: "sad",
    doctorPose: "listen"
  };
}

function setStageLayout(scenario) {
  els.stage.dataset.actorSide = scenario.actorSide === "right" ? "right" : "left";
  els.stage.dataset.posture = actorStaging(scenario).posture;
}

function setDoctorPose(pose) {
  state.doctorPose = Object.hasOwn(DOCTOR_POSES, pose) ? pose : "listen";
  const scenario = SCENARIOS[state.scenarioIndex];
  const { posture } = actorStaging(scenario);
  stageCharacter(els.stageDoctor, scenario.actorSide === "left" ? "right" : "left", "left", posture, posture === "standing" ? .13 : .16);
  els.stageDoctor.src = doctorAsset(state.doctorPose);
  els.stageDoctor.alt = `医生，正在${DOCTOR_POSES[state.doctorPose]}`;
  els.doctorTag.textContent = `你 · 接诊医生 · ${DOCTOR_POSES[state.doctorPose]}`;
  els.stageDoctor.classList.remove("pose-shift");
  void els.stageDoctor.offsetWidth;
  els.stageDoctor.classList.add("pose-shift");
}

function preloadDoctorPoses() {
  Object.keys(DOCTOR_POSES).forEach((pose) => {
    const image = new Image();
    image.src = doctorAsset(pose);
  });
}

function setActorEmotion(emotion) {
  const scenario = SCENARIOS[state.scenarioIndex];
  if (!scenario) return;
  const staging = actorStaging(scenario);
  stageCharacter(els.stageActor, scenario.actorSide, staging.facing, staging.posture, staging.eye);
  state.emotion = Object.hasOwn(EMOTION_LABELS, emotion) ? emotion : "sad";
  const source = expressionAsset(scenario.actor, state.emotion);
  els.stageActor.src = source;
  els.stageActor.alt = `${scenario.actorName}，神情${EMOTION_LABELS[state.emotion]}`;
  els.speakerAvatar.style.backgroundImage = `url("${source}")`;
  els.reactionAvatar.style.backgroundImage = `url("${source}")`;
  els.reactionEmotionLabel.textContent = EMOTION_LABELS[state.emotion];
  els.actorEmotionLabel.textContent = `情绪 · ${EMOTION_LABELS[state.emotion]}`;
  els.stage.dataset.emotion = state.emotion;
  els.stageActor.classList.remove("emotion-shift");
  void els.stageActor.offsetWidth;
  els.stageActor.classList.add("emotion-shift");
}

function preloadActorEmotions(scenario) {
  ["relieved", "afraid", "angry"].forEach((emotion) => {
    const image = new Image();
    image.src = expressionAsset(scenario.actor, emotion);
  });
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(scenarioId, score, metrics) {
  const progress = loadProgress();
  const previous = progress[scenarioId];
  const attempts = (previous?.attempts || 0) + 1;
  if (!previous || score >= previous.bestScore) {
    progress[scenarioId] = { bestScore: score, metrics, attempts, completedAt: new Date().toISOString() };
  } else {
    progress[scenarioId] = { ...previous, attempts };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function setView(target) {
  views.forEach((view) => { view.hidden = view !== target; });
  window.scrollTo({ top: 0, behavior: "smooth" });
  $$(".nav-button").forEach((button) => button.classList.remove("active"));
  if (target === els.homeView) $("#caseLibraryButton").classList.add("active");
  if (target === els.progressView) $("#progressButton").classList.add("active");
  if (target === els.aboutView) $("#aboutButton").classList.add("active");
}

function goHome() {
  state = createEmptyState();
  renderCaseGrid();
  setView(els.homeView);
}

function renderDimensions() {
  els.dimensionList.innerHTML = Object.values(METRICS).map((metric) => `
    <div class="dimension-item">
      <span class="dimension-icon" style="background:${metric.color}">${metric.icon}</span>
      <strong>${metric.label}</strong>
      <small>${metric.description.slice(0, 8)}…</small>
    </div>
  `).join("");

  els.metricExplanations.innerHTML = Object.values(METRICS).map((metric) => `
    <div class="metric-explanation">
      <span style="background:${metric.color}">${metric.icon}</span>
      <div><strong>${metric.label}</strong><p>${metric.description}</p></div>
    </div>
  `).join("");
}

function renderFilters() {
  els.filterRow.innerHTML = CATEGORIES.map((category) => `
    <button class="filter-button ${category === selectedCategory ? "active" : ""}" type="button" data-category="${category}">${category}</button>
  `).join("");
  els.filterRow.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      renderFilters();
      renderCaseGrid();
    });
  });
}

function renderCaseGrid() {
  const query = els.caseSearch.value.trim().toLowerCase();
  const progress = loadProgress();
  const filtered = SCENARIOS.filter((scenario) => {
    const categoryMatch = selectedCategory === "全部" || scenario.category === selectedCategory;
    const haystack = [scenario.title, scenario.category, scenario.actorName, scenario.brief, ...scenario.focus].join(" ").toLowerCase();
    return categoryMatch && (!query || haystack.includes(query));
  });

  els.emptyState.hidden = filtered.length > 0;
  els.caseGrid.innerHTML = filtered.map((scenario) => {
    const index = SCENARIOS.indexOf(scenario);
    const completed = progress[scenario.id];
    return `
      <article class="case-card">
        ${completed ? `<span class="completion-badge">最佳 ${completed.bestScore} 分</span>` : ""}
        <div class="case-card-art">
          <img class="case-card-bg" src="${scenario.background}" alt="">
          <img class="case-card-actor" src="${scenario.actor}" alt="">
          <span class="case-number">${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="case-card-body">
          <div class="case-card-meta"><span>${scenario.category}</span><span>${scenario.difficulty}</span></div>
          <h3>${scenario.title}</h3>
          <p>${scenario.brief}</p>
          <div class="case-card-footer">
            <small>${scenario.rounds.length} 回合 · ${scenario.duration}</small>
            <button class="start-case" type="button" data-index="${index}">进入会谈 <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.caseGrid.querySelectorAll(".start-case").forEach((button) => {
    button.addEventListener("click", () => startCase(Number(button.dataset.index)));
  });
}

function startCase(index) {
  state = createEmptyState();
  state.scenarioIndex = index;
  const scenario = SCENARIOS[index];

  els.caseCategory.textContent = `${scenario.category} · ${scenario.difficulty}`;
  els.caseTitle.textContent = scenario.title;
  els.caseGoal.textContent = scenario.goal;
  els.caseBrief.textContent = scenario.brief;
  els.stageBackground.src = scenario.background;
  els.stageBackground.alt = scenario.scene;
  els.sceneLabel.textContent = scenario.scene;
  els.actorTag.textContent = `${scenario.actorName} · ${scenario.actorRole}`;
  els.clinicalReminder.textContent = scenario.reminder;
  setStageLayout(scenario);
  setActorEmotion(scenario.initialEmotion || "sad");
  preloadActorEmotions(scenario);
  preloadDoctorPoses();

  renderMetricMeters();
  renderEvidence();
  renderIntro();
  setView(els.caseView);
}

function renderIntro() {
  const scenario = SCENARIOS[state.scenarioIndex];
  state.roundIndex = -1;
  state.answered = false;
  els.stage.className = "stage";
  els.roundStage.textContent = "场景序幕";
  els.roundNumber.textContent = "会谈开始前";
  els.speakerName.textContent = "场景旁白";
  els.dialogueText.textContent = scenario.setup;
  els.coachPrompt.textContent = "带着这句话，进入今天的会谈";
  els.openingQuote.hidden = false;
  els.openingQuote.innerHTML = `“${scenario.quote}”<cite>—— ${scenario.quoteBy}</cite>`;
  els.optionList.innerHTML = `<button class="continue-button intro-enter" type="button">进入会谈 <span aria-hidden="true">→</span></button>`;
  els.optionList.querySelector("button").addEventListener("click", () => {
    state.roundIndex = 0;
    renderRound();
  });
  els.feedbackPanel.hidden = true;
  setDoctorPose(introDoctorPose(scenario));
  els.undoButton.disabled = true;
  updateProgressRail();
}

function renderRound() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const round = scenario.rounds[state.roundIndex];
  state.answered = false;

  els.roundStage.textContent = round.stage;
  els.roundNumber.textContent = `第 ${state.roundIndex + 1} 回合`;
  els.speakerName.textContent = round.speaker;
  els.dialogueText.textContent = round.text;
  els.coachPrompt.textContent = round.prompt;
  els.openingQuote.hidden = true;
  els.feedbackPanel.hidden = true;
  els.feedbackPanel.className = "feedback-panel";
  els.stage.className = "stage is-speaking-actor";
  setDoctorPose(round.doctorPose || inferDoctorPose(round));

  els.optionList.innerHTML = round.options.map((item, index) => `
    <button class="option-button" type="button" data-option="${index}">
      <span class="option-letter">${String.fromCharCode(65 + index)}</span>
      <span>${item.text}</span>
    </button>
  `).join("");
  els.optionList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => chooseOption(Number(button.dataset.option)));
  });

  updateProgressRail();
  renderMetricMeters();
  renderEvidence();
  els.undoButton.disabled = state.history.length === 0;
  requestAnimationFrame(() => els.dialogueText.focus?.());
}

function chooseOption(optionIndex) {
  if (state.answered) return;
  const scenario = SCENARIOS[state.scenarioIndex];
  const round = scenario.rounds[state.roundIndex];
  const choice = round.options[optionIndex];

  state.history.push({
    roundIndex: state.roundIndex,
    metrics: { ...state.metrics },
    evidence: [...state.evidence],
    emotion: state.emotion
  });
  state.answered = true;

  Object.entries(choice.delta).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value);
  });
  choice.evidence.forEach((item) => {
    if (!state.evidence.includes(item)) state.evidence.push(item);
  });
  setActorEmotion(choice.emotion);

  const buttons = [...els.optionList.querySelectorAll("button")];
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === optionIndex) button.classList.add("chosen");
  });

  const qualityLabels = {
    excellent: "兼顾临床与关系",
    caution: "有可取之处，但需补足",
    risky: "存在重要风险"
  };
  els.feedbackPanel.className = `feedback-panel ${choice.quality === "excellent" ? "" : choice.quality}`.trim();
  els.feedbackRating.textContent = qualityLabels[choice.quality];
  els.actorReply.textContent = `“${choice.reply}”`;
  els.feedbackText.textContent = choice.feedback;
  els.deltaList.innerHTML = Object.entries(choice.delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `<span class="delta ${value < 0 ? "negative" : ""}">${METRICS[key].short} ${value > 0 ? "+" : ""}${value}</span>`)
    .join("");
  els.continueButton.innerHTML = state.roundIndex === scenario.rounds.length - 1
    ? `查看会谈复盘 <span aria-hidden="true">→</span>`
    : `继续下一回合 <span aria-hidden="true">→</span>`;
  els.feedbackPanel.hidden = false;
  els.stage.className = "stage is-speaking-doctor";
  els.undoButton.disabled = false;
  renderMetricMeters();
  renderEvidence();
  els.feedbackPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function continueCase() {
  if (!state.answered) return;
  const scenario = SCENARIOS[state.scenarioIndex];
  if (state.roundIndex >= scenario.rounds.length - 1) {
    finishCase();
    return;
  }
  state.roundIndex += 1;
  renderRound();
}

function undoLastChoice() {
  const previous = state.history.pop();
  if (!previous) return;
  state.roundIndex = previous.roundIndex;
  state.metrics = { ...previous.metrics };
  state.evidence = [...previous.evidence];
  state.emotion = previous.emotion;
  renderRound();
  setActorEmotion(previous.emotion);
}

function updateProgressRail() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const visibleRound = Math.max(0, state.roundIndex);
  const completedRounds = state.roundIndex < 0 ? 0 : state.roundIndex + (state.answered ? 1 : 0);
  els.roundIndicator.textContent = state.roundIndex < 0 ? `0 / ${scenario.rounds.length}` : `${state.roundIndex + 1} / ${scenario.rounds.length}`;
  els.progressFill.style.width = `${(completedRounds / scenario.rounds.length) * 100}%`;
  els.roundDots.innerHTML = scenario.rounds.map((_, index) => `
    <li class="${index < completedRounds ? "done" : ""} ${index === visibleRound && state.roundIndex >= 0 ? "current" : ""}" aria-label="第 ${index + 1} 回合"></li>
  `).join("");
}

function renderEvidence() {
  els.evidenceCount.textContent = state.evidence.length;
  els.evidenceList.innerHTML = state.evidence.length
    ? state.evidence.map((item) => `<li>${item}</li>`).join("")
    : `<li class="evidence-placeholder">通过有效沟通发现信息</li>`;
}

function meterColor(value, fallback) {
  if (value < 35) return "#a94c46";
  if (value < 55) return "#c79a4a";
  return fallback;
}

function renderMetricMeters() {
  els.metricMeters.innerHTML = Object.entries(METRICS).map(([key, metric]) => {
    const value = state.metrics[key];
    const caption = value >= 75 ? "稳定优势" : value >= 55 ? "正在建立" : value >= 35 ? "需要留意" : "显著风险";
    return `
      <div class="metric-row">
        <div class="metric-label"><span>${metric.label}</span><strong>${value}</strong></div>
        <div class="meter-track"><span style="width:${value}%;background:${meterColor(value, metric.color)}"></span></div>
        <div class="metric-caption">${caption}</div>
      </div>
    `;
  }).join("");
}

function finishCase() {
  const scenario = SCENARIOS[state.scenarioIndex];
  const values = Object.values(state.metrics);
  const total = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  let level;
  let title;
  let summary;
  let seal;

  if (total >= 80) {
    level = "成熟的共同决策者";
    title = "你让事实与感受坐在了同一张桌前";
    summary = "这次会谈既保持了临床方向，也给对方留下理解、提问和作出选择的空间。温度没有稀释医学判断，反而让计划更可执行。";
    seal = "深度倾听";
  } else if (total >= 65) {
    level = "稳健的沟通实践者";
    title = "会谈建立了方向，也留下了可改进的缝隙";
    summary = "你抓住了多数关键节点，但个别回应在效率、解释或情绪承接上有所偏斜。复盘最低维度，会发现下一次最值得改变的一句话。";
    seal = "稳健前行";
  } else if (total >= 50) {
    level = "正在形成临床沟通框架";
    title = "你完成了谈话，但共同理解仍不够牢固";
    summary = "部分选择推进了医疗任务，却可能让对方在关键处没有真正理解或参与。不是“态度不好”，而是信息、关系和决策尚未形成闭环。";
    seal = "继续练习";
  } else {
    level = "需要带教复盘";
    title = "这次谈话出现了需要及时修复的风险";
    summary = "在真实临床中，这些沟通方式可能造成延误、误解、冲突或失去信任。建议与带教医师逐回合复盘，再尝试一次不同路径。";
    seal = "重新出发";
  }

  saveProgress(scenario.id, total, state.metrics);
  els.resultBackground.src = scenario.background;
  els.resultBackground.alt = scenario.scene;
  els.resultSeal.textContent = seal;
  els.resultTitle.textContent = title;
  els.resultSummary.textContent = summary;
  els.totalScore.textContent = total;
  els.resultLevel.textContent = level;
  els.resultMetrics.innerHTML = Object.entries(METRICS).map(([key, metric]) => `
    <div class="result-metric"><strong>${state.metrics[key]}</strong><span>${metric.label}</span></div>
  `).join("");

  const ranked = Object.keys(METRICS).sort((a, b) => state.metrics[b] - state.metrics[a]);
  const strength = METRICS[ranked[0]].label;
  const growth = METRICS[ranked.at(-1)].label;
  els.debriefContent.innerHTML = `
    <ul>
      <li><strong>本次相对优势：</strong>${strength}。这表示你在这个具体情境中更稳定地照顾到了这一维度。</li>
      <li><strong>优先复盘：</strong>${growth}。回看带来负分或低增益的选择，尝试说出一个更具体的替代表达。</li>
      <li><strong>关键信息：</strong>你通过沟通获得了 ${state.evidence.length} 条影响临床或决策的信息。</li>
      ${scenario.debrief.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
  setView(els.resultView);
  renderCaseGrid();
}

function renderProgressDashboard() {
  const progress = loadProgress();
  const completed = Object.keys(progress).length;
  const bestScores = Object.values(progress).map((item) => item.bestScore);
  const average = bestScores.length ? Math.round(bestScores.reduce((sum, value) => sum + value, 0) / bestScores.length) : 0;

  els.progressDashboard.innerHTML = `
    <article class="history-card complete">
      <div class="history-card-head"><h3>总体进度</h3><span class="history-score">${completed} / ${SCENARIOS.length}</span></div>
      <p>${completed ? `已完成病例的最佳平均分为 ${average}。` : "还没有完成记录，从任一病例开始即可。"}</p>
    </article>
    ${SCENARIOS.map((scenario) => {
      const item = progress[scenario.id];
      return `
        <article class="history-card ${item ? "complete" : ""}">
          <div class="history-card-head"><h3>${scenario.title}</h3><span class="history-score">${item ? item.bestScore : "—"}</span></div>
          <p>${item ? `练习 ${item.attempts} 次 · 最佳成绩已保存` : `${scenario.category} · 尚未完成`}</p>
        </article>
      `;
    }).join("")}
  `;
}

function showProgress() {
  renderProgressDashboard();
  setView(els.progressView);
}

function showAbout() {
  setView(els.aboutView);
}

function restartCurrent() {
  if (state.scenarioIndex < 0) return;
  startCase(state.scenarioIndex);
}

function goNextCase() {
  const next = (state.scenarioIndex + 1) % SCENARIOS.length;
  startCase(next);
}

function bindEvents() {
  $("#homeButton").addEventListener("click", goHome);
  $("#caseLibraryButton").addEventListener("click", goHome);
  $("#progressButton").addEventListener("click", showProgress);
  $("#aboutButton").addEventListener("click", showAbout);
  $("#backButton").addEventListener("click", goHome);
  $("#restartButton").addEventListener("click", restartCurrent);
  $("#retryButton").addEventListener("click", restartCurrent);
  $("#nextCaseButton").addEventListener("click", goNextCase);
  $("#resultHomeButton").addEventListener("click", goHome);
  els.continueButton.addEventListener("click", continueCase);
  els.undoButton.addEventListener("click", undoLastChoice);
  els.caseSearch.addEventListener("input", renderCaseGrid);
  $$('[data-go-home]').forEach((button) => button.addEventListener("click", goHome));
  $("#metricHelpButton").addEventListener("click", () => els.metricDialog.showModal());
  $("#metricDialogClose").addEventListener("click", () => els.metricDialog.close());
  els.metricDialog.addEventListener("click", (event) => {
    if (event.target === els.metricDialog) els.metricDialog.close();
  });
  $("#mobileQrButton").addEventListener("click", () => $("#qrDialog").showModal());
  $("#qrDialogClose").addEventListener("click", () => $("#qrDialog").close());
  $("#qrDialog").addEventListener("click", (event) => {
    if (event.target === $("#qrDialog")) $("#qrDialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if (els.caseView.hidden || state.answered || state.roundIndex < 0) return;
    const index = ["1", "2", "3"].indexOf(event.key);
    if (index >= 0) els.optionList.querySelectorAll("button")[index]?.click();
  });
}

function init() {
  els.caseCount.textContent = SCENARIOS.length;
  els.roundCount.textContent = SCENARIOS.reduce((sum, scenario) => sum + scenario.rounds.length, 0);
  renderDimensions();
  renderFilters();
  renderCaseGrid();
  bindEvents();
}

init();
