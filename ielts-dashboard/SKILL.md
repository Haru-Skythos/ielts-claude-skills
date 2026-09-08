---
name: ielts-dashboard
description: |
  雅思备考数据 Dashboard（v3）。启动本地 React 可视化页面（写作趋势图、四科雷达图、错题热力图、同义替换库、考试倒计时、今日建议），并提供数据格式校验、状态栏安装、无 Node 环境的文本版概览。
  用户说「看看我的进度」「打开 dashboard」「数据可视化」「我的错题分布」「装状态栏」「检查数据」时都用这个 skill。
metadata:
  version: 3.1.0
---

# IELTS Dashboard — 备考数据可视化

你负责把 `~/.ielts/` 里的数据变成能看的东西：一个本地网页 Dashboard（首选），或一张终端文本概览卡（降级）。

**Dashboard 应用代码就在本 skill 目录的 `assets/app/` 下**（本 SKILL.md 所在目录，安装后通常是 `~/.claude/skills/ielts-dashboard/assets/app/`）。它是一个 Vite + React 项目，dev server 会通过 `/api/data` 接口读取数据目录并渲染图表。**纯本地运行，数据不出用户电脑。**

数据根 = `IELTS_HOME` 环境变量（如设置），否则 `~/.ielts/`。

---

## 四个功能

| 功能 | 触发 | 做什么 |
|------|------|--------|
| **启动 Dashboard** | 「打开 dashboard」「看进度」 | npm install（首次）→ dev server → 开浏览器 |
| **文本概览** | 没有 Node / 用户只要快速看一眼 | 聚合 frontmatter 输出文本统计卡 |
| **数据体检** | 「检查数据」「数据是不是坏了」 | 跑 zod 校验，报告不合规文件 |
| **状态栏安装** | 「装状态栏」「底部显示备考状态」 | 配置 Claude Code statusLine |

---

## 启动 Dashboard

1. **定位 app 目录**：本 SKILL.md 所在目录下的 `assets/app/`（用你已知的 skill 路径拼出来，下称 `<app>`）
2. **检查环境**：`node --version`。没有 Node → 走文本概览模式，并告知装 Node ≥ 18 后可用完整版
3. **首次安装依赖**（`<app>/node_modules` 不存在时）：
   ```bash
   cd <app> && npm install
   ```
   失败或超时（国内网络常见）→ 换镜像重试：`npm install --registry=https://registry.npmmirror.com`
4. **启动 dev server**（后台运行，不要阻塞会话）：
   ```bash
   cd <app> && npm run dev
   ```
   - 需要传数据目录时（IELTS_HOME 已设置），确保它出现在该命令的环境里
   - 从输出里读实际端口——默认 `http://localhost:5173`，被占用时 Vite 会自动换端口，以输出为准
5. **打开浏览器**：Windows `start http://localhost:<port>`，macOS `open ...`，Linux `xdg-open ...`
6. 告诉用户：页面上有什么（趋势图/雷达图/热力图/替换库/倒计时/今日建议）、server 在后台跑着、说「关掉 dashboard」我就停掉它
7. 用户要求停止时：终止该后台任务

**排错**：
- 页面空白/报错 → 看 dev server 输出；大概率是数据文件 frontmatter 不合规 → 跑一次数据体检定位
- `npm install` 反复失败 → 直接给文本概览，别让用户卡在环境问题上

---

## 文本概览（降级模式 / 快速模式)

不依赖 Node。你自己聚合（只读 frontmatter，方法同 `/ielts-plan` 数据层）：

```markdown
# 备考概览（{date}）
🎯 目标 {x} | 考试 {date}（剩 {n} 天）

## 四科最近水平
写作 {x}（{date}）· 阅读 {x}/{y}（{date}）· 听力 {x}/40（{date}）· 口语 {记录数}

## 最近 14 天练习
写作 ▮▮▮ 3 · 阅读 ▮▮ 2 · 听力 ▮ 1 · 口语 0 ⚠️

## 高频错误 Top 5
1. spelling ×6（听力）  2. tfng-false-vs-ng ×4（阅读） ...

## 资产
同义替换 {n} 对 · 生词本 {n} 词（今日到期 {n}）· 口语故事 {n} 个

**今天建议：{科目}** — {一句话理由}
```

今日建议算法（与 `/ielts` 一致）：差距最大且最近 3 天没练的科目优先，并列选写作；考前 7 天只保手感不开新篇。

---

## 数据体检

```bash
cd <app> && npm run validate
```

脚本会用 zod schema 校验数据目录里所有 md 的 frontmatter，输出每个文件的 PASS/FAIL 和具体字段错误。你把结果翻译成人话：

- FAIL 的文件：哪个字段、期望什么、实际是什么、怎么修（一般是某次手改弄坏的，给出修复 Edit）
- 用户同意后帮他修复，修完再跑一次确认全绿

没有 Node 时：你自己按各 skill 内嵌的 frontmatter 模板逐文件目检（读前 30 行），能查出大部分问题。

---

## 状态栏安装

给 Claude Code 底部状态栏常驻一行备考状态（如 `🎯7.0 | 剩55天 | 今日:写作 ✓`）。

1. 脚本位置：`<app>/scripts/statusline.mjs`（零依赖，直接 node 运行）
2. 先试跑确认输出正常：`node <app>/scripts/statusline.mjs`
3. 向用户展示将写入 `~/.claude/settings.json` 的配置并**取得确认**（这会改动他的全局配置）：
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "node <app 的绝对路径，正斜杠>/scripts/statusline.mjs"
     }
   }
   ```
4. settings.json 已存在 → 用 Edit 只合并 `statusLine` 键，别动其他配置；不存在 → 创建
5. 告知：重启 Claude Code 生效；说「卸载状态栏」我就把这个键删掉

---

## 边界

- 你不做训练、不批改——图表里看到问题，路由到对应 skill
- 你不改训练数据（体检修复除外，且要用户确认）
- 深度诊断和计划 → `/ielts-plan`（你展示数据，它解读数据）
