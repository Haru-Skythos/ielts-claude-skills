# IELTS v3.0 数据规范（DATA-SCHEMA）

> 这是 8 个 skill 与 Dashboard 之间的数据契约。所有读写 `~/.ielts/` 的代码和提示词都以本文档为准。
> 机器校验的权威定义在 `ielts-dashboard/assets/app/src/schema.mjs`（zod）。

---

## 1. 数据根目录

- 默认：`~/.ielts/`（Windows 上是 `%USERPROFILE%\.ielts\`）
- 如果设置了环境变量 `IELTS_HOME`，则以它为数据根（用于测试、多账号、自定义位置）
- 所有文件都是 **UTF-8 编码的 Markdown + YAML frontmatter**
- 写文件必须用编辑器类工具（Claude Code 的 Write/Edit），不要用 `echo >>` 等 shell 重定向——Windows 下会产生编码问题

```
~/.ielts/
├── profile.md                 # 用户档案（目标分、考期、现状）
├── plan.md                    # 当前备考计划（/ielts-plan 生成，覆盖式更新）
├── writing/                   # 每篇作文批改归档
│   └── 2026-07-26-task2-technology.md
├── reading/                   # 每次阅读练习归档
│   └── 2026-07-26-cam18-t1-p2.md
├── listening/                 # 每次听力练习归档
│   └── 2026-07-26-cam18-t2.md
├── speaking/
│   ├── stories/               # 万能故事库（跨会话复用的核心资产）
│   │   └── travel-hongkong.md
│   └── 2026-07-26-part2-travel.md   # 练习记录
└── vocab/
    ├── synonyms.md            # 同义替换累计库（单文件表格）
    └── words.md               # 生词本（单文件表格，Leitner 间隔重复）
```

## 2. 通用规则

1. **日期永远真实**：写任何 `date` 字段前先运行 `date +%F` 获取今天的日期，不要凭感觉写。
2. **文件命名**：`YYYY-MM-DD-<slug>.md`。slug 全小写、连字符分隔、不超过 5 个词、只用 ASCII。同一天同类型第二篇加 `-2` 后缀。
3. **schema 字段**：每个文件的 frontmatter 第一行是 `schema: <type>.v3`，标识文件类型和版本。
4. **分数字段**：雅思 band 一律 0–9、步长 0.5 的数字（如 `6.5`）。
5. **持久化不阻塞教学**：目录创建失败、文件写入失败时，先完成批改/分析/教学任务，最后用一句话告知用户持久化失败及原因。数据层是增强，不是前置条件。
6. **首次使用**：任何 skill 发现 `profile.md` 不存在时，先用 3 个问题完成摸底（目标分+考期 / 现状 / 今天练什么），创建 `profile.md`，再继续正常流程。
7. **追加不覆盖（防 AI 误删）**：`synonyms.md`、`words.md` 等累计型文件，AI 在日常流程中只能追加行或用 Edit 精确修改目标行，禁止整文件重写（防止丢历史数据）。**但用户显式要求的维护操作不受此限**——用户要改、删、合并、重组时照做，做之前复述将要执行的改动，做完汇报结果。库是用户的，规则防的是意外，不是用户。
8. **可扩展性**：故事的 `group`、词表的列、错误标签都是「推荐标准 + 允许扩展」——标准集保证聚合统计有效，扩展保证与时俱进。扩展时保持命名规范（kebab-case / 表头列名不与标准列冲突），聚合端（dashboard / plan）对未知扩展宽容处理（展示但不强行归类）。

## 3. 各文件 frontmatter 规范

### 3.1 profile.md

```yaml
---
schema: profile.v3
test_type: academic        # academic | general
target_band: 7.0
exam_date: 2026-09-20      # 不确定时可写 null
daily_minutes: 120         # 每天可投入的分钟数
current:                   # 最近一次模考或自评，未知科目写 null
  listening: 6.0
  reading: 6.5
  writing: 5.5
  speaking: 5.5
created: 2026-07-26
updated: 2026-07-26        # 每次修改 profile 时更新
---
（正文自由记录：弱项自述、考试史、约束条件等）
```

### 3.2 writing/*.md（/ielts-writing 写入）

```yaml
---
schema: writing.v3
date: 2026-07-26
task: 2                    # 1 | 2
type: opinion              # Task2: opinion|discussion|adv-disadv|problem-solution|two-part
                           # Task1: bar|line|pie|table|map|process|mixed
topic: "Technology and society"
words: 268
band:
  tr: 5.5                  # Task 1 时该键含义为 TA（Task Achievement）
  cc: 6.0
  lr: 5.5
  gra: 5.0
  overall: 5.5
target: 6.5                # 本篇的目标分（一般 = profile 目标写作分）
error_tags: [lr-collocation, gra-tense, cc-mechanical-linking]
---
## 题目
## 原文
## 批改报告
（四维评分表、逐句标注、改写对比、提分优先级——完整保留）
```

### 3.3 reading/*.md（/ielts-reading 写入）

```yaml
---
schema: reading.v3
date: 2026-07-26
source: "Cambridge 18 Test 1 Passage 2"
score: 9
total: 13
band_est: null             # 只有做整卷 40 题时才估 band，单篇写 null
time_min: 24               # 用户没提供就写 null
question_types:            # 键必须来自题型表（§5.2）
  tfng: {correct: 3, total: 5}
  matching-headings: {correct: 4, total: 5}
  summary-completion: {correct: 2, total: 3}
error_tags: [tfng-false-vs-ng, syn-missed]
---
（完整分析报告：逐题拆解、同义替换表、错因总结）
```

### 3.4 listening/*.md（/ielts-listening 写入）

```yaml
---
schema: listening.v3
date: 2026-07-26
source: "Cambridge 18 Test 2"
score: 28
total: 40
band: 6.5                  # 整卷才填，非整卷写 null
sections: {s1: 8, s2: 7, s3: 6, s4: 7}   # 各 section 答对数，未知写 null
question_types:            # 键必须来自题型表（§5.3）
  form-completion: {correct: 8, total: 10}
  multiple-choice: {correct: 5, total: 8}
error_tags: [spelling, distractor]
---
（错题分析 + 精听任务清单）
```

### 3.5 speaking/stories/*.md（/ielts-speaking 写入，文件名不带日期：`<group>-<slug>.md`）

```yaml
---
schema: story.v3
date: 2026-07-26           # 创建日期
group: travel              # 推荐标准组：travel | person | object-skill | event | media
                           # 允许自建组（kebab-case，如 tech、current-affairs）——话题库与时俱进
title: "香港之旅"
covers: [describe-a-city, happy-experience, trip-with-friends]  # 可覆盖的话题 slug
practiced: 0               # 每次用它练习后 +1
last_practiced: null
---
（Part 2 话题卡 + 完整回答 + 关键表达标注 + Part 3 预测）
```

故事支持全生命周期维护（用户提出即执行）：改写内容、更新表达、合并/拆分故事、换组、删除。维护时保留 `practiced` 计数（改内容不清零练习历史）。

### 3.6 speaking/*.md 练习记录（/ielts-speaking 写入）

```yaml
---
schema: speaking-session.v3
date: 2026-07-26
part: 2                    # 1 | 2 | 3
topic: "Describe a trip you enjoyed"
story_used: travel-hongkong   # 用了哪个故事，没用写 null
self_band: null            # 用户自评或 AI 估分
error_tags: [fluency-pause, lr-basic]
---
（练习内容 / 表达升级记录）
```

### 3.7 vocab/synonyms.md（/ielts-reading、/ielts-listening、/ielts-writing 追加；/ielts-vocab 消费）

```yaml
---
schema: synonyms.v3
updated: 2026-07-26
---
| 考点词 | 替换词 | 来源 | 日期 |
|--------|--------|------|------|
| significant | substantial | C18T1P2 Q3 | 2026-07-26 |
```

追加规则：先查重（考点词+替换词都相同 → 不加新行，在原行「来源」列追加 `; 新来源`）；新词对 → 表格末尾追加一行；同时更新 frontmatter 的 `updated`。

### 3.8 vocab/words.md（/ielts-vocab 管理；其他 skill 遇到用户生词时可追加 box=1 的行）

```yaml
---
schema: vocab.v3
updated: 2026-07-26
---
| 词 | 释义与搭配 | 例句 | box | next_review | added | source |
|----|-----------|------|-----|-------------|-------|--------|
| detrimental | 有害的；~ impact/effect | Smoking has a detrimental effect on health. | 2 | 2026-07-28 | 2026-07-26 | writing |
```

**Leitner 盒子规则**（/ielts-vocab 执行）：
- 间隔：box1=1 天，box2=2 天，box3=4 天，box4=7 天，box5=15 天
- 复习答对 → box+1（上限 5），`next_review = 今天 + 新box对应间隔`
- 答错 → 回到 box1，`next_review = 明天`
- 今日队列 = 所有 `next_review <= 今天` 的词
- box5 连续答对两轮的词视为掌握，移入文末「已掌握」表格（不再进队列）

**可扩展与用户习惯**：
- 标准 7 列之外允许用户增加自定义列（如「记法」「音标」），列名不与标准列重名即可；解析端按表头名取列，天然兼容
- 「释义与搭配」「例句」的内容以用户自己的写法为准——用户手改过的词条内容，AI 复习时引用它、不「纠正」它
- 用户可随时：删词、手动调 box（「这词我熟了」→ 直接升箱或移已掌握）、批量导入外部词表（AI 负责补全缺失列并逐条入库）

### 3.9 plan.md（/ielts-plan 生成，整文件覆盖）

```yaml
---
schema: plan.v3
generated: 2026-07-26
exam_date: 2026-09-20
days_left: 56
target: 7.0
focus: [writing, listening]   # 当前阶段重点科目
---
# 诊断
（必须引用真实数据：各科最近成绩、练习频次、高频错误标签）
# 训练计划
（按周拆分，落实到每天做什么）
```

## 4. 读取约定（控制上下文消耗）

聚合分析时不要把所有归档全文读进来。约定：

- 趋势/统计类需求：只读各文件的 **frontmatter**（文件前 30 行以内）
- 需要细节时：只精读用户当前关心的那 1-2 个文件
- `/ielts-plan` 和 `/ielts-dashboard` 是仅有的两个「全量聚合」消费者，它们也应优先读 frontmatter
- 文件数量很多时用 Glob 按文件名中的日期过滤（如只看最近 30 天）

## 5. 错误标签体系（error_tags）

**标签是错题本和热力图的数据源，只有全库统一才能聚合。** 优先使用下面的标准标签；确实不够用时可自造，但必须 kebab-case 且复用已出现过的自造标签。

### 5.1 写作

| 标签 | 含义 |
|------|------|
| tr-off-topic | 跑题 / 漏答题目某部分 |
| tr-underdeveloped | 论证展开不足 |
| tr-position-unclear | 立场不清晰或摇摆 |
| tr-word-count | 字数不足 |
| cc-mechanical-linking | 连接词机械堆砌 |
| cc-paragraph-logic | 段落内部/之间逻辑混乱 |
| cc-referencing | 指代不清 |
| lr-repetition | 用词重复 |
| lr-collocation | 搭配错误 |
| lr-word-choice | 用词不当 / 过于口语化 |
| lr-spelling | 拼写错误 |
| gra-simple-sentences | 句型单一 |
| gra-subject-verb | 主谓一致错误 |
| gra-tense | 时态错误 |
| gra-article | 冠词错误 |
| gra-word-form | 词性错误 |
| gra-run-on | 流水句 / 断句错误 |

### 5.2 阅读（题型键也在此定义）

**题型键（question_types 用）**：`tfng`、`ynng`、`matching-headings`、`matching-information`、`matching-features`、`sentence-completion`、`summary-completion`、`multiple-choice`、`table-flowchart`、`short-answer`

| 标签 | 含义 |
|------|------|
| loc-wrong-place | 定位到错误段落/句子 |
| syn-missed | 同义替换没识别出来 |
| tfng-false-vs-ng | False 和 Not Given 混淆 |
| tfng-overinference | 过度推断（用了脑补不是原文） |
| detail-qualifier | 限定词陷阱（all/only/比较级最高级） |
| heading-detail-trap | 主旨题被细节带偏 |
| match-wrong-entity | 人物/理论张冠李戴 |
| word-limit | 超出字数限制 |
| careless | 粗心（看错题、抄错词） |
| timeout | 时间不够导致乱选 |

### 5.3 听力（题型键也在此定义）

**题型键**：`form-completion`、`note-completion`、`table-completion`、`sentence-completion`、`multiple-choice`、`matching`、`map-plan`、`short-answer`、`flowchart`

| 标签 | 含义 |
|------|------|
| spelling | 听出来了但拼错 |
| plural-s | 单复数没听到/没写 |
| number | 数字、日期、价格听错 |
| distractor | 被干扰项骗（先说后改口） |
| paraphrase-missed | 题目同义替换没反应过来 |
| speed-lost | 跟丢了（速度跟不上） |
| map-direction | 地图题方位词混乱 |
| pre-read | 没来得及提前审题 |
| accent | 口音不适应 |
| careless | 粗心（顺序错位、漏填） |

### 5.4 口语

| 标签 | 含义 |
|------|------|
| fluency-pause | 明显卡顿 |
| fluency-repetition | 重复和自我修正过多 |
| lr-basic | 词汇过于基础 |
| lr-misuse | 词汇误用 |
| gra-tense | 时态错误 |
| gra-simple | 句型单一 |
| pron-unclear | 发音影响理解 |
| content-thin | 内容单薄撑不满时长 |
| off-topic | 答非所问 |

## 6. 换算表（共享参考）

听力与学术阅读的「答对数 → band」换算表见 `ielts/SKILL.md` 的核心策略章节，各 skill 直接引用，不要另造数字。
