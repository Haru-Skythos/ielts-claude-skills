# 场景 02：听力整卷诊断 + 报告

- **Skill**：`/ielts-listening`
- **类型**：L2 端到端（真实会话 + 归档断言）

## 输入消息

> 剑 19 Test 1 听力错了 10 个，帮我分析。对错分布：S1 对 8/10，S2 对 7/10，S3 对 6/10，S4 对 9/10。
> 错题情况：Q4 拼错 accommodation；Q12 先说 library 后改口成了 lab 我选了 library；Q18-20 跟丢了。
>
> （评测时使用固定的错题清单文本，见 results 归档中的摘录）

## IELTS_HOME 初始态

从 `evals/fixtures/ielts-home` 复制。已有历史 `listening/2026-08-26-c18t2.md`（band 6.5，tags: spelling, distractor, map-direction）和单 section 记录 `listening/2026-09-04-c19t1s3.md`。

## 断言清单

1. **归档路径**：新建文件匹配 `listening/YYYY-MM-DD-*.md`
2. **frontmatter schema**：`schema: listening.v3`
3. **分数正确**：`score: 30`、`total: 40`（8+7+6+9=30，错 10）
4. **band 换算正确**：`band: 7.0`（30 分落在权威表 30-31→7.0 档，见 ielts/SKILL.md）
5. **sections 正确**：`sections: {s1: 8, s2: 7, s3: 6, s4: 9}`
6. **error_tags 封闭集**：非空、2-4 个、全部 ⊆ docs/DATA-SCHEMA.md §5.3 听力标准标签；预期包含 `spelling`、`distractor`、`speed-lost` 中的至少两个
7. **对比历史**：回复中对比 2026-08-26 那卷的 band / 重复错因（spelling、distractor 是否复发）
8. **报告结构**：回复包含 总览（分数+band）→ 题型统计 → 逐题错因 → 丢分模式 → 精听任务
9. **同义替换入库**：`vocab/synonyms.md` 只追加行，来源列格式如 `C19T1 听力`
10. **收尾**：回复末尾给出归档路径

## 通过标准

10 条断言全部满足 = PASS；断言 1-6 任一失败 = FAIL（数据契约硬断言）。

## 边界备注

对照场景：若输入是单 section（如 fixtures 里的 c19t1s3），断言 4 应改为「`band: null`，不换算」——单 section 不做 raw→band 折算。
