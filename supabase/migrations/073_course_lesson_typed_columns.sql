-- 073: Typed, queryable columns for lesson metadata.
-- Lesson metadata (type / duration / url / description) lived only inside the
-- `content` jsonb blob, so it could not be queried or aggregated in SQL (e.g.
-- total course duration). Add typed mirror columns and backfill them from the
-- existing blob. The app keeps writing `content` AND these columns in sync
-- (saveCurriculum), so reads are unaffected; the columns just make the data
-- queryable. Additive + nullable — safe, non-destructive.
alter table course_lessons
  add column if not exists lesson_type      text,
  add column if not exists duration_minutes integer,
  add column if not exists content_url      text,
  add column if not exists description      text;

-- Backfill from the content blob. duration_minutes = leading digits of the
-- free-text duration ("15" / "5 mins" -> 15); non-numeric -> null.
update course_lessons set
  lesson_type      = coalesce(lesson_type, content->>'type'),
  content_url      = coalesce(content_url, content->>'url'),
  description      = coalesce(description, content->>'description'),
  duration_minutes = coalesce(
    duration_minutes,
    nullif(regexp_replace(coalesce(content->>'duration', ''), '\D', '', 'g'), '')::int
  )
where content is not null;
