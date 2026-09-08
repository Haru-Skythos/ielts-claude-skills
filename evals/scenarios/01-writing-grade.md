# 场景 01：写作批改 + 归档

- **Skill**：`/ielts-writing`
- **类型**：L2 端到端（真实会话 + 归档断言）

## 输入消息

> 帮我批改这篇作文。题目：Some people think technology makes people less creative. To what extent do you agree?
>
> （正文：一篇约 270 词的 Task 2 议论文，含若干时态错误和搭配错误——评测时使用固定的评测作文文本，见 results 归档中的摘录）

## IELTS_HOME 初始态

从 `evals/fixtures/ielts-home` 复制。已有历史作文 `writing/2026-08-28-tech-creativity.md`（band overall 6.0，tags: tr-underdeveloped, lr-collocation, gra-tense），用于验证「对比上一篇」行为。

## 断言清单

1. **归档路径**：新建文件匹配 `writing/YYYY-MM-DD-*.md`（日期为当天）
2. **frontmatter schema**：`schema: writing.v3`
3. **frontmatter 完整性**：`date`（YYYY-MM-DD）、`task: 2`、`type`、`topic` 非空、`words` 为正整数、`band.{tr,cc,lr,gra,overall}` 均为 0-9 且步长 0.5、`target` 与 profile.md 的 `target_band` 一致
4. **error_tags 封闭集**：`error_tags` 非空、3-6 个、全部 ⊆ docs/DATA-SCHEMA.md §5.1 写作标准标签、kebab-case
5. **band 一致性**：`band.overall` ≈ 四维均值四舍五入到 0.5
6. **对比上一篇**：回复中提到与 2026-08-28 那篇的分数/标签对比
7. **词汇沉淀**：`vocab/synonyms.md` 只追加行（原有 3 行未变），新增行来源列为 `writing`
8. **评分校准**：回复包含「AI 评分偏高约 0.5」类提醒
9. **收尾**：回复末尾给出归档路径

## 通过标准

9 条断言全部满足 = PASS；断言 1-5 任一失败 = FAIL（数据契约硬断言）。
