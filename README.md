# 有温度的问诊室

一个独立的、可直接部署到 GitHub Pages 的医学沟通情境训练网页，面向住院医师、规培医师与实习医师。

## 项目特点

- 10 个深度临床情境，每个病例 8 个连续对话回合。
- 共 80 个决策点、240 个选项，每个选项均有情境回应、能力变化与带教反馈。
- 覆盖急诊胸痛、癌症初次告知、治疗无效、ICU 急剧恶化、代理决策冲突、晚期患者回家愿望、知情拒绝、谵妄与能力评估、死亡告知、言语威胁与人员安全。
- 同时评价医学信息、急症安全、患者理解、关系与信任、共同决策五个维度。
- 支持撤回上一回合、关键信息记录、病例复盘、本机最佳成绩和分类搜索。
- 响应式布局，支持键盘操作、减少动态效果和高对比度系统偏好。

## 本地预览

该项目不依赖框架或构建工具。在项目目录直接启动内置的零依赖预览服务器：

```bash
node scripts/serve.mjs
```

然后访问 `http://127.0.0.1:4173/`。

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

## 素材与隐私

人物与场景图为项目既有的生成式原创素材。本应用无后端，不收集或上传学习数据；成绩仅保存在浏览器 `localStorage` 中。

页面中的经典名言使用常见中文意译，仅用于叙事情境。若用于正式出版，应核对原始语种、版本与译文。
