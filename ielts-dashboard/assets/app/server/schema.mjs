// ~/.ielts/ 数据文件 frontmatter 的 zod schema —— 机器校验的权威定义。
// 人读版规范见仓库 docs/DATA-SCHEMA.md。
import { z } from 'zod'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须是 YYYY-MM-DD')
const band = z
  .number()
  .min(0, 'band 不能小于 0')
  .max(9, 'band 不能大于 9')
  .multipleOf(0.5, 'band 步长是 0.5')
const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, '标签必须是 kebab-case')
const errorTags = z.array(kebab)
const qtCount = z
  .object({ correct: z.number().int().min(0), total: z.number().int().min(1) })
  .refine((d) => d.correct <= d.total, { message: 'correct 不能大于 total' })

export const profileSchema = z
  .object({
    schema: z.literal('profile.v3'),
    // 枚举保留 'general' 以兼容旧数据；v3.1 仅支持 academic（General 见路线图）
    test_type: z.enum(['academic', 'general']),
    target_band: band,
    exam_date: dateStr.nullable(),
    daily_minutes: z.number().int().positive().nullish(),
    current: z.object({
      listening: band.nullable(),
      reading: band.nullable(),
      writing: band.nullable(),
      speaking: band.nullable(),
    }),
    created: dateStr,
    updated: dateStr,
  })
  .passthrough()

export const writingSchema = z
  .object({
    schema: z.literal('writing.v3'),
    date: dateStr,
    task: z.union([z.literal(1), z.literal(2)]),
    type: z.string().min(1),
    topic: z.string().min(1),
    words: z.number().int().positive(),
    band: z.object({ tr: band, cc: band, lr: band, gra: band, overall: band }),
    target: band.nullish(),
    error_tags: errorTags,
  })
  .passthrough()

export const readingSchema = z
  .object({
    schema: z.literal('reading.v3'),
    date: dateStr,
    source: z.string().min(1),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
    band_est: band.nullable(),
    time_min: z.number().positive().nullish(),
    question_types: z.record(z.string(), qtCount).optional(),
    error_tags: errorTags,
  })
  .passthrough()
  .refine((d) => d.score <= d.total, { message: 'score 不能大于 total' })

export const listeningSchema = z
  .object({
    schema: z.literal('listening.v3'),
    date: dateStr,
    source: z.string().min(1),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
    band: band.nullable(),
    sections: z
      .object({
        s1: z.number().int().min(0).nullable(),
        s2: z.number().int().min(0).nullable(),
        s3: z.number().int().min(0).nullable(),
        s4: z.number().int().min(0).nullable(),
      })
      .nullish(),
    question_types: z.record(z.string(), qtCount).optional(),
    error_tags: errorTags,
  })
  .passthrough()
  .refine((d) => d.score <= d.total, { message: 'score 不能大于 total' })

export const storySchema = z
  .object({
    schema: z.literal('story.v3'),
    date: dateStr,
    // 推荐 5 个标准组（travel/person/object-skill/event/media），
    // 但允许用户自建组（如 tech、current-affairs）——只要求 kebab-case
    group: kebab,
    title: z.string().min(1),
    covers: z.array(kebab),
    practiced: z.number().int().min(0),
    last_practiced: dateStr.nullable(),
  })
  .passthrough()

export const speakingSessionSchema = z
  .object({
    schema: z.literal('speaking-session.v3'),
    date: dateStr,
    part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    topic: z.string().min(1),
    story_used: z.string().nullable(),
    self_band: band.nullable(),
    error_tags: errorTags,
  })
  .passthrough()

export const planSchema = z
  .object({
    schema: z.literal('plan.v3'),
    generated: dateStr,
    exam_date: dateStr.nullable(),
    days_left: z.number().int().nullable(),
    target: band,
    focus: z.array(z.enum(['listening', 'reading', 'writing', 'speaking', 'vocab'])),
  })
  .passthrough()

export const synonymsFmSchema = z
  .object({ schema: z.literal('synonyms.v3'), updated: dateStr })
  .passthrough()

export const vocabFmSchema = z
  .object({ schema: z.literal('vocab.v3'), updated: dateStr })
  .passthrough()

export const vocabLogFmSchema = z
  .object({ schema: z.literal('vocab-log.v3'), updated: dateStr })
  .passthrough()

// 目录 → schema 的映射（validate.mjs 用）
export const collectionSchemas = {
  writing: writingSchema,
  reading: readingSchema,
  listening: listeningSchema,
  'speaking/stories': storySchema,
  speaking: speakingSessionSchema,
}
