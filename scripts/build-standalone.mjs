import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = path.join(projectRoot, "downloads", "有温度的问诊室-电脑离线版.html");
const mimeTypes = new Map([
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"]
]);

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  }));
  return nested.flat();
}

function fail(message) {
  throw new Error(`单文件离线版生成失败：${message}`);
}

const [desktopHtml, css, scenariosSource, stageSource, appSource] = await Promise.all([
  fs.readFile(path.join(projectRoot, "desktop.html"), "utf8"),
  fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  fs.readFile(path.join(projectRoot, "scenarios.js"), "utf8"),
  fs.readFile(path.join(projectRoot, "stage-layout.js"), "utf8"),
  fs.readFile(path.join(projectRoot, "app.js"), "utf8")
]);

const assetFiles = (await listFiles(path.join(projectRoot, "assets")))
  .filter((file) => !file.includes(`${path.sep}mobile${path.sep}`));
const assets = {};

for (const file of assetFiles) {
  const extension = path.extname(file).toLowerCase();
  const mime = mimeTypes.get(extension);
  if (!mime) continue;
  const key = path.relative(projectRoot, file).split(path.sep).join("/");
  const data = await fs.readFile(file);
  assets[key] = `data:${mime};base64,${data.toString("base64")}`;
}

let bundledStage = stageSource.replace(/^export\s+/gm, "");
bundledStage = bundledStage
  .replace("return `assets/doctors/standing-${pose}.webp`;", "return assetUrl(`assets/doctors/standing-${pose}.webp`);")
  .replace('return "assets/doctors/seated-urgent.webp";', 'return assetUrl("assets/doctors/seated-urgent.webp");')
  .replace("return `assets/doctors/doctor-${pose}.webp`;", "return assetUrl(`assets/doctors/doctor-${pose}.webp`);");

let bundledApp = appSource.replace(/^import\s+.*?;\r?\n/gm, "");
bundledApp = bundledApp
  .replace('if (!Object.hasOwn(EMOTION_LABELS, emotion) || emotion === "sad") return actor;', 'if (!Object.hasOwn(EMOTION_LABELS, emotion) || emotion === "sad") return assetUrl(actor);')
  .replace("return `assets/expressions/${name}-${emotion}.webp`;", "return assetUrl(`assets/expressions/${name}-${emotion}.webp`);")
  .replace('src="${scenario.background}"', 'src="${assetUrl(scenario.background)}"')
  .replace('src="${scenario.actor}"', 'src="${assetUrl(scenario.actor)}"')
  .replaceAll("els.stageBackground.src = scenario.background;", "els.stageBackground.src = assetUrl(scenario.background);")
  .replaceAll("els.resultBackground.src = scenario.background;", "els.resultBackground.src = assetUrl(scenario.background);");

const bundledScenarios = scenariosSource.replace(/^export\s+/gm, "");
const runtime = [
  `const OFFLINE_ASSETS = ${JSON.stringify(assets)};`,
  "const assetUrl = (source) => OFFLINE_ASSETS[source] || source;",
  bundledScenarios,
  bundledStage,
  bundledApp
].join("\n\n").replaceAll("</script", "<\\/script");

let output = desktopHtml
  .replace(/^\s*<link rel="preconnect"[^>]*>\r?\n/gm, "")
  .replace(/^\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>\r?\n/gm, "")
  .replace(/\s*<link rel="stylesheet" href="styles\.css[^>]*>/, () => `\n  <style>\n${css.replaceAll("</style", "<\\/style")}\n  </style>`)
  .replace(/<script type="module" src="app\.js[^>]*><\/script>/, () => `<script>\n${runtime}\n  </script>`);

output = output.replace(/src="(assets\/[^"]+)"/g, (match, assetPath) => {
  const embedded = assets[assetPath];
  if (!embedded) fail(`找不到页面素材 ${assetPath}`);
  return `src="${embedded}"`;
});

const remainingAssetPaths = [...output.matchAll(/["'`](assets\/[A-Za-z0-9_./${}-]+\.(?:png|webp|svg))["'`]/g)]
  .map((match) => match[1])
  .filter((assetPath) => !assetPath.includes("${"));
for (const assetPath of remainingAssetPaths) {
  if (!assets[assetPath]) fail(`脚本引用了未打包素材 ${assetPath}`);
}

for (const forbidden of ["type=\"module\"", "import {", "styles.css?", "fonts.googleapis.com", "src=\"assets/"]) {
  if (output.includes(forbidden)) fail(`仍包含外部依赖：${forbidden}`);
}
if (!output.includes("壶兰呼吸") || !output.includes("const SCENARIOS") || !output.includes("const OFFLINE_ASSETS")) {
  fail("品牌、病例数据或素材包未完整写入");
}

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, output);
const size = (await fs.stat(outputFile)).size;
console.log(`已生成 ${path.relative(projectRoot, outputFile)}（${(size / 1024 / 1024).toFixed(1)} MB）`);
