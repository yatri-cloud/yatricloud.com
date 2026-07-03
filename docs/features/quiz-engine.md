# Practice Quiz Engine

Trainers author practice quizzes inside the course form; enrolled students take them from the training dashboard with instant scoring, pass/fail, explanations, and attempt history.

## User flow (student)
1. Enroll in a training → open its dashboard (`/training/:slug/dashboard`) → **Quizzes** tab.
2. Each quiz card shows title, question count, time limit ("No time limit" when unset), and pass mark.
3. **Start Quiz** → Overview screen (metadata + previous attempts) → **Begin** → question-by-question taking UI (single or multi select, flagging, optional countdown that auto-submits at zero) → **Finish Test** → Results: score, pass/fail, per-question review with explanations. **Retake** starts a fresh attempt.
4. Results persist; the Overview lists past attempts with score, time, and pass state.

## Author flow (trainer/admin)
1. `/admin/training/create` or edit (also the trainer portal — same `TrainingManager`).
2. **Quiz tab** → `QuizBuilder`: add questions manually or **Import CSV** (template in `CSVImportDialog`). Options carry per-option explanations plus an overall explanation and optional domain tag.
3. Questions save **with the course** — publishing without pressing "Save Quiz" no longer loses work (the builder lifts every change to the form continuously). Editing a course hydrates the saved questions back into the builder.
4. Emptying the question list and saving removes the quiz.

## Data model — `supabase/migrations/031_quizzes.sql` (applied live)
- **`quizzes`**: `id`, `training_id` (fk cascade), `title` (default "Practice Quiz"), `description`, `questions jsonb` (the `QuizQuestion[]` shape below), `passing_score` (default 70, 0–100 check), `time_limit_min` (null = untimed), `sort_order`, `status` (`draft|published`), timestamps.
- **`quiz_attempts`**: `id`, `quiz_id` (fk cascade), `training_id`, `user_id` (fk profiles), `answers jsonb` (`QuizAnswer[]`), `score numeric(5,2)`, `is_passed`, `time_spent_sec`, `status`, `created_at`.
- One default quiz per training for now (`saveQuizForTraining` updates the first, creates otherwise); the schema supports many.

## Security (the important part)
Quiz rows **contain the correct answers** inside `questions`, so:
- `quizzes_read`: admin, the training's trainer (`trainings.trainer_id = auth.uid()`), or an **enrolled** student (`training_enrollments` row for `auth.uid()`) on a **published** quiz. Anonymous users read nothing.
- `quizzes_write`: trainer of that training or admin.
- `attempts_insert_own`: `user_id = auth.uid()` — forging an attempt for someone else is rejected.
- `attempts_read`: the owner, the trainer of that training, or admin.
- E2E verified 6/6 (anon blocked, enrolled reads, own attempt insert/read, anon attempts blocked, forgery blocked); test data cleaned.

## Code map
| Piece | File |
|---|---|
| Types | `src/types/quiz.ts` (`QuizQuestion`, `AnswerOption`, CSV row), `src/types/quizAttempt.ts` (`QuizAttempt`, `QuizAnswer`, `QuizMetadata`, `PreviousAttempt`, `QuizAttemptSummary`) |
| API | `src/lib/training-api.ts` → `listQuizzes`, `saveQuizForTraining`, `submitQuizAttempt`, `getMyQuizAttempts`, `QuizRecord` |
| Author UI | `src/components/trainer/QuizBuilder.tsx` (+ `QuestionList`, `QuestionEditor`, `CSVImportDialog`) |
| Save/load with course | `src/components/admin/training/TrainingManager.tsx` (`saveQuizForTraining` after create/update; `listQuizzes` on edit-load) |
| Student flow | `src/components/student/QuizFlow.tsx` (orchestrator: grading, summary, persistence) wrapping `QuizOverview`, `QuizTaking`, `QuizResults` |
| Entry point | `src/pages/StudentTrainingDashboard.tsx` → `QuizzesTab` |

## Grading rules (client-side, in `QuizFlow.submitQuiz`)
- A question is correct only when the selected set **exactly equals** the correct set (1-based indices) and is non-empty.
- `score = round(correct / total * 100)`; `isPassed = score >= passing_score`.
- Results render instantly from local grading; persistence is best-effort (a save hiccup shows a toast but never blocks results).

## Gotchas
- `correctAnswers` and `selectedAnswers` are **1-based** indices — keep it that way everywhere.
- A quiz save failure after the course saves shows "Course saved, but the quiz did not save" and never blocks the course.
- Only `status='published'` quizzes with ≥1 question reach students (filtered in the dashboard load).

## How to test
Create a training with a 2-question quiz → publish → enroll with a second (non-admin) account → take the quiz, check score + explanations → retake → confirm both attempts on the Overview. As a logged-out user, hit the REST endpoint for `quizzes` and confirm `[]`.
