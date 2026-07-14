#!/usr/bin/env node
/**
 * Integration regression test for the trainer/admin course save path.
 *
 * Guards the invariant fixed in D57/D58: saving a course must UPDATE existing
 * modules/lessons in place (stable ids) rather than delete-and-reinsert, so that
 *   • enrolled students' lesson_progress survives an edit, and
 *   • per-lesson content (url/description) the coarse form doesn't manage is kept.
 *
 * It seeds a throwaway course + module + lesson + a progress row, runs the exact
 * saveCurriculum diff/merge logic (kept in sync with src/lib/training-api.ts),
 * asserts the invariants, then deletes the course (cascades everything).
 *
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env (service role bypasses
 * RLS; the SQL operations are identical to the client path). NOT part of the CI
 * unit suite — run manually:  npm run test:integrity
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env"); process.exit(1);
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- mirror of saveCurriculum's persistence body (src/lib/training-api.ts) ---
async function saveCurriculum(trainingId, curriculum) {
  if (!curriculum) return;
  const { data: existingMods } = await db
    .from("course_modules").select("id, course_lessons(id, content)").eq("training_id", trainingId);
  const existingModuleIds = new Set((existingMods || []).map((m) => m.id));
  const existingLessonsByModule = new Map();
  const contentByLesson = new Map();
  for (const m of existingMods || []) {
    existingLessonsByModule.set(m.id, new Set((m.course_lessons || []).map((l) => l.id)));
    for (const l of m.course_lessons || []) contentByLesson.set(l.id, l.content || {});
  }
  const keptModuleIds = new Set();
  let mi = 0;
  for (const mod of curriculum) {
    const name = mod.title || `Module ${mi + 1}`;
    let moduleId;
    if (mod.moduleId && UUID_RE.test(mod.moduleId) && existingModuleIds.has(mod.moduleId)) {
      moduleId = mod.moduleId;
      await db.from("course_modules").update({ name, sort_order: mi }).eq("id", moduleId);
    } else {
      const { data: modRow, error } = await db.from("course_modules")
        .insert({ training_id: trainingId, name, sort_order: mi }).select("id").single();
      if (error || !modRow) { mi++; continue; }
      moduleId = modRow.id;
    }
    keptModuleIds.add(moduleId);
    const existingLessonIds = existingLessonsByModule.get(moduleId) || new Set();
    const keptLessonIds = new Set();
    let li = 0;
    for (const l of mod.lessons || []) {
      const isExisting = !!l.lessonId && UUID_RE.test(l.lessonId) && existingLessonIds.has(l.lessonId);
      const prev = isExisting ? (contentByLesson.get(l.lessonId) || {}) : {};
      const content = {
        ...prev,
        type: l.type || prev.type || "Video",
        duration: l.duration || prev.duration || "",
        ...(l.url !== undefined ? { url: l.url } : {}),
        ...(l.description !== undefined ? { description: l.description } : {}),
      };
      const row = { name: l.title || `Lesson ${li + 1}`, content, sort_order: li };
      if (isExisting) {
        await db.from("course_lessons").update(row).eq("id", l.lessonId);
        keptLessonIds.add(l.lessonId);
      } else {
        await db.from("course_lessons").insert({ module_id: moduleId, ...row });
      }
      li++;
    }
    const removedLessons = [...existingLessonIds].filter((id) => !keptLessonIds.has(id));
    if (removedLessons.length) await db.from("course_lessons").delete().in("id", removedLessons);
    mi++;
  }
  const removedModules = [...existingModuleIds].filter((id) => !keptModuleIds.has(id));
  if (removedModules.length) await db.from("course_modules").delete().in("id", removedModules);
}

let failed = 0;
const assert = (cond, msg) => { if (!cond) { console.error("❌ FAIL:", msg); failed++; } else console.log("✓", msg); };

// A real profile id to satisfy the lesson_progress.user_id FK.
const { data: prof } = await db.from("profiles").select("id").limit(1).single();
if (!prof) { console.error("No profiles row to test with."); process.exit(1); }

const slug = `zz-integrity-${Number(process.hrtime.bigint() % 1000000000n).toString(36)}`;
const { data: tr, error: te } = await db.from("trainings")
  .insert({ name: "ZZ Integrity", slug, provider: "AWS", status: "draft", trainer_id: prof.id }).select("id").single();
if (te) { console.error("setup failed", te); process.exit(1); }
const { data: mod } = await db.from("course_modules")
  .insert({ training_id: tr.id, name: "Module A", sort_order: 0 }).select("id").single();
const { data: les } = await db.from("course_lessons")
  .insert({ module_id: mod.id, name: "Lesson 1", sort_order: 0,
            content: { type: "Video", duration: "10 mins", url: "https://youtu.be/abc", description: "Deep dive" } })
  .select("id").single();
await db.from("lesson_progress").insert({ user_id: prof.id, training_id: tr.id, lesson_id: les.id });

// Coarse-form save: ids round-tripped, title/duration edited, NO url passed.
await saveCurriculum(tr.id, [
  { moduleId: mod.id, title: "Module A — renamed", lessons: [
    { lessonId: les.id, title: "Lesson 1 — renamed", type: "Video", duration: "12 mins" },
  ] },
]);

const { data: after } = await db.from("course_lessons").select("id, name, content").eq("module_id", mod.id);
const same = after?.find((l) => l.id === les.id);
assert(!!same, "lesson id unchanged (updated in place, not recreated)");
assert(same?.name === "Lesson 1 — renamed", "lesson title updated");
assert(same?.content?.duration === "12 mins", "duration updated");
assert(same?.content?.url === "https://youtu.be/abc", "content.url preserved (coarse form didn't manage it)");
assert(same?.content?.description === "Deep dive", "content.description preserved");
const { data: prog } = await db.from("lesson_progress").select("lesson_id").eq("training_id", tr.id);
assert(prog?.length === 1 && prog[0].lesson_id === les.id, "student progress row survived the save");
const { data: modsAfter } = await db.from("course_modules").select("id").eq("training_id", tr.id);
assert(modsAfter?.length === 1 && modsAfter[0].id === mod.id, "module id unchanged, no duplicate");

await db.from("trainings").delete().eq("id", tr.id); // cascades modules/lessons/progress
console.log(failed ? `\n${failed} assertion(s) failed.` : "\n✓ all curriculum-integrity checks passed. cleaned up.");
process.exit(failed ? 1 : 0);
