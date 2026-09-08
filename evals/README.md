# evals/ — 评测与回归基础设施

本目录存放可复现的评测资产：黄金数据 fixtures、端到端场景定义、以及历次评测结果归档。
目标：README 里关于质量的每一句话，都能在这里找到对应的、可重跑的依据。

## 目录结构

```
evals/
├── README.md               # 本文件
├── fixtures/
│   └── ielts-home/         # 一份完整的 ~/.ielts 黄金样例（可通过 npm run validate）
├── scenarios/              # L2 端到端场景定义（输入 + 初始态 + 断言清单）
└── results/                # 评测结果归档（每次评测一个目录，见下文约定）
```

## fixtures/ielts-home

一份手工维护的黄金数据，覆盖已知边界：

- `listening/2026-09-04-c19t1s3.md`：单 section（`band: null`、`sections: null`，不换算）
- `listening/2026-08-26-c18t2.md`：整卷 40 题（band=6.5，对应 26-29 分档）
- `reading/2026-09-02-c18t2-full.md`：整卷（`band_est: 7.0`）vs 单篇（`band_est: null`）
- `speaking/stories/tech-first-pc-build.md`：自建故事组 `tech`（非 5 个标准组，kebab-case 合法）
- `vocab/words.md`：自定义列「记法」+ `## 已掌握` 毕业分区
- `profile.md`：`speaking: null`（未测过的科目）

验证方式（在 `ielts-dashboard/assets/app/` 下）：

```bash
IELTS_HOME=<仓库根>/evals/fixtures/ielts-home npm run validate
```

要求：**全 PASS 才允许合入**。改了 schema 或 skill 归档格式后，先更新 fixtures 再跑。

## scenarios/ — L2 端到端场景

每个场景是一个 markdown 文件，定义三件事：

1. **输入消息**：模拟用户对 skill 说的原话（含粘贴的题目/答案）
2. **IELTS_HOME 初始态**：从 fixtures/ielts-home 复制（或声明需要的改动，如「删除 plan.md」）
3. **断言清单**：跑完后逐条核对，全部是可机械验证的客观断言

断言怎么写（按可靠性排序，优先靠前的）：

- **归档路径模式**：如「新建文件匹配 `writing/YYYY-MM-DD-*.md`」
- **frontmatter 字段**：schema 名、日期格式、band 步长 0.5、`score <= total`
- **封闭集成员**：`error_tags ⊆ docs/DATA-SCHEMA.md §5 对应科目的标准标签`
- **换算正确性**：整卷 raw 分折算的 band 与 `ielts/SKILL.md` 换算表一致
- **只追加不重写**：`vocab/synonyms.md`、`vocab/words.md` 原有行未被修改
- （弱断言）回复内容包含某类结构（如「总览 → 题型统计 → 逐题错因」）

跑法（当前为人工执行，后续可脚本化）：

```bash
# 1. 准备隔离环境
cp -r evals/fixtures/ielts-home /tmp/eval-home
# 2. 在 Claude Code 里加载对应 skill，按场景文件的「输入消息」发起会话
# 3. 逐条核对断言，把结果记入 evals/results/<date>-<run-id>/scenarios/0X-*.md
```

## results/ — 归档约定

每次评测建一个目录：`results/YYYY-MM-DD-<run-id>/`，内含：

- `summary.md`：环境（模型、日期）、场景清单、每场景 PASS/FAIL、断言通过率
- `scenarios/`：每场景一份记录（断言逐条勾选 + 失败原因 + 关键输出摘录）

归档是 append-only：不修改历史结果目录；重跑同一场景就新建 run-id。

## 相关脚本

- `npm run validate`（`ielts-dashboard/assets/app/`）：数据体检（L1，fixtures 必须全绿）
- `node scripts/lint-sync.mjs`（仓库根）：知识漂移 lint（换算表 / 错误标签集 / 文档路径引用）
