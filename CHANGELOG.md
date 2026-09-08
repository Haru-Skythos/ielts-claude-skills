# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-09-08

### Fixed

- 今日建议算法漂移：`derive.js` 新增 `subjectTargets`，实现与 `ielts/SKILL.md` 文档口径统一，并补单测
- 文档路径漂移：`scripts/lint-sync.mjs` 校验换算表 / 错误标签集多份拷贝及文档相对路径引用

### Added

- `subjectTargets` 单科目标配置算法 + 单元测试
- 词汇复习日志 `vocab/log.md` 全链路（复习结算追加、跨会话回溯、plan/dashboard 可消费）
- 可复现评测 harness `evals/`（黄金 fixtures、端到端场景、结果归档）
- 知识漂移 lint `scripts/lint-sync.mjs`
- 状态栏词汇标记（到期词数提醒）

### Changed

- README 评测段落改为可复现表述（不再引用不可复核的历史评测数字）
- 明确声明当前版本仅支持 Academic；General Training 列入路线图

## [3.0.0] - 2026-07

- 8 skill 完整版：数据持久化（`~/.ielts/` 跨会话记忆）、四科归档与趋势追踪、React Dashboard、统一错题本、Leitner 间隔重复词汇、数据驱动备考计划、状态栏集成、备份迁移；数据契约 `*.v3` + zod schema 校验。
