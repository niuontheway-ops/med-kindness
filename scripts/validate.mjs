import { access, stat } from "node:fs/promises";
import { SCENARIOS, METRICS, CATEGORIES } from "../scenarios.js";

const failures = [];
const ids = new Set();
const allowedQualities = new Set(["excellent", "caution", "risky"]);
const metricKeys = new Set(Object.keys(METRICS));

for (const required of [
  "../index.html",
  "../mobile.css",
  "../mobile.js",
  "../desktop.html",
  "../styles.css",
  "../app.js",
  "../assets/med-kindness-qr.png",
  "../assets/hulan-github-mobile-qr.png"
]) {
  try {
    await access(new URL(required, import.meta.url));
  } catch {
    failures.push(`缺少双版本必需文件：${required.replace("../", "")}`);
  }
}

if (SCENARIOS.length < 10) failures.push(`病例数不足：${SCENARIOS.length}`);

for (const scenario of SCENARIOS) {
  if (ids.has(scenario.id)) failures.push(`病例 ID 重复：${scenario.id}`);
  ids.add(scenario.id);
  if (!CATEGORIES.includes(scenario.category)) failures.push(`${scenario.id} 使用未知分类：${scenario.category}`);
  if (scenario.rounds.length < 8) failures.push(`${scenario.id} 只有 ${scenario.rounds.length} 回合`);
  if (!scenario.quote || !scenario.quoteBy) failures.push(`${scenario.id} 缺少开场引语或出处说明`);
  if (!scenario.debrief?.length) failures.push(`${scenario.id} 缺少复盘要点`);

  for (const [roundIndex, round] of scenario.rounds.entries()) {
    if (round.options.length !== 3) failures.push(`${scenario.id} 第 ${roundIndex + 1} 回合不是 3 个选项`);
    for (const [optionIndex, choice] of round.options.entries()) {
      if (!allowedQualities.has(choice.quality)) failures.push(`${scenario.id} 第 ${roundIndex + 1} 回合选项 ${optionIndex + 1} 质量标记无效`);
      if (!choice.reply || !choice.feedback) failures.push(`${scenario.id} 第 ${roundIndex + 1} 回合选项 ${optionIndex + 1} 缺少反馈`);
      for (const key of Object.keys(choice.delta)) {
        if (!metricKeys.has(key)) failures.push(`${scenario.id} 第 ${roundIndex + 1} 回合使用未知评分维度：${key}`);
      }
    }
  }

  for (const asset of [scenario.actor, scenario.background]) {
    try {
      await access(new URL(`../${asset}`, import.meta.url));
    } catch {
      failures.push(`${scenario.id} 缺少素材：${asset}`);
    }

    const mobileAsset = asset.replace(/^assets\//, "assets/mobile/").replace(/\.png$/i, ".webp");
    try {
      const mobileStat = await stat(new URL(`../${mobileAsset}`, import.meta.url));
      if (mobileStat.size > 150_000) failures.push(`${scenario.id} 手机素材过大：${mobileAsset}`);
    } catch {
      failures.push(`${scenario.id} 缺少手机素材：${mobileAsset}`);
    }
  }
}

if (failures.length) {
  console.error("校验失败：");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const rounds = SCENARIOS.reduce((sum, scenario) => sum + scenario.rounds.length, 0);
const options = SCENARIOS.reduce((sum, scenario) => sum + scenario.rounds.reduce((count, round) => count + round.options.length, 0), 0);
console.log(`校验通过：手机扫码版 + 电脑本地版；${SCENARIOS.length} 个病例，${rounds} 个回合，${options} 个带教学反馈的选项。`);
