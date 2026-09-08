# 有温度的问诊室

一个面向住院医师、规培医师与实习医师的医学沟通情境训练项目，同时提供手机扫码版和电脑本地版。两版共用同一套病例数据，内容与评分保持一致。

## 两个版本

### 1. GitHub Pages 手机扫码版

- 在线地址：[https://niuontheway-ops.github.io/med-kindness/](https://niuontheway-ops.github.io/med-kindness/)
- 入口文件：`index.html`
- 针对竖屏、触控和单手操作设计，使用单栏对话、横向能力条和大尺寸选项。
- 使用按手机实际显示尺寸生成的 WebP 素材，并对病例卡图片延迟加载；电脑本地版继续保留高清 PNG。
- 支持病例深链接、本机进度和“第一个未完成病例”快捷入口。

横版二维码文件位于 `assets/hulan-github-mobile-qr.png`，保留“壶兰呼吸”院科标识并指向 GitHub Pages 手机版：

![手机扫码入口](assets/hulan-github-mobile-qr.png)

### 2. 电脑本地版

- 入口文件：`desktop.html`
- 保留三栏沉浸式舞台、病例进度、关键信息和能力仪表。
- 顶部“手机扫码版”按钮可随时显示二维码，在电脑与手机间切换。

在项目目录运行：

```bash
node scripts/serve.mjs
```

然后访问：

```text
http://127.0.0.1:4173/desktop.html
```

## 项目特点

- 12 个深度临床情境，每个病例 8 个连续对话回合。
- 共 96 个决策点、288 个选项，每个选项均有情境回应、能力变化与带教反馈。
- 新增独立“缓和医疗”和“急性传染性疾病”板块，覆盖难治性呼吸困难、隔离沟通、隐私与家庭暴露计划。
- 患者/家属固定在舞台左侧，医生在右侧；选择后人物会在悲伤、害怕、愤怒加剧与释然之间切换。
- 同时评价医学信息、急症安全、患者理解、关系与信任、共同决策五个维度。
- 支持撤回上一回合、关键信息记录、病例复盘、本机最佳成绩和分类搜索。
- 响应式布局，支持键盘操作、减少动态效果和高对比度系统偏好。

## 内容校验

```bash
node scripts/validate.mjs
```

校验会检查病例数量、回合数、选项反馈、评分字段、分类和素材文件。

## 教学边界

本项目用于情境模拟，不替代真实诊疗、伦理会诊、机构流程或所在地法律。病例为虚构组合，不对应任何真实患者。正式用于课程或考核前，应由相关专科医师、医学伦理教师、护理团队及本机构医务/法务部门审阅。

主要内容依据包括《内科学》（第10版）、《诊断学》（第10版），并参考：

- [NICE NG197: Shared decision making](https://www.nice.org.uk/guidance/ng197)
- [SCCM 2024 Guidelines on Family-Centered Care for Adult ICUs](https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-on-family-centered-care-for-adult-icus-2024)
- [AHRQ CANDOR](https://www.ahrq.gov/patient-safety/settings/hospital/candor/index.html)
- [WHO: Palliative care](https://www.who.int/news-room/fact-sheets/detail/palliative-care)
- [CDC: Preventing Transmission of Viral Respiratory Pathogens in Healthcare Settings](https://www.cdc.gov/infection-control/hcp/viral-respiratory-prevention/index.html)

## 素材与隐私

人物、场景图及本次新增的 15 张情绪变体均为项目生成式原创素材。本应用无后端，不收集或上传学习数据；成绩仅保存在浏览器 `localStorage` 中。

页面中的经典名言使用常见中文意译，仅用于叙事情境。若用于正式出版，应核对原始语种、版本与译文。
