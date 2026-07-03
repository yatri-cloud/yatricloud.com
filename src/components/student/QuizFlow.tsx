import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizOverview } from "./QuizOverview";
import { QuizTaking } from "./QuizTaking";
import { QuizResults } from "./QuizResults";
import { getMyQuizAttempts, submitQuizAttempt, type QuizRecord } from "@/lib/training-api";
import type { QuizAnswer, QuizAttempt, QuizAttemptSummary, PreviousAttempt } from "@/types/quizAttempt";
import { toast } from "sonner";

/**
 * Orchestrates the full student quiz journey: overview (with past attempts)
 * → taking → results. Attempts persist to quiz_attempts; grading is local so
 * results are instant even if saving fails.
 */
interface QuizFlowProps {
    quiz: QuizRecord;
    trainingId: string;
    onExit: () => void;
}

const emptyAnswers = (quiz: QuizRecord): QuizAnswer[] =>
    quiz.questions.map((q) => ({ questionId: q.id, selectedAnswers: [], flagged: false }));

const newAttempt = (quiz: QuizRecord, trainingId: string): QuizAttempt => ({
    attemptId: crypto.randomUUID(),
    trainingId,
    userId: "",
    quizId: quiz.id,
    quizTitle: quiz.title,
    startTime: new Date(),
    timeSpent: 0,
    answers: emptyAnswers(quiz),
    status: "in-progress",
    totalQuestions: quiz.questions.length,
    timeLimit: quiz.timeLimitMin ?? undefined,
});

export function QuizFlow({ quiz, trainingId, onExit }: QuizFlowProps) {
    const [stage, setStage] = useState<"overview" | "taking" | "results">("overview");
    const [attempt, setAttempt] = useState<QuizAttempt>(() => newAttempt(quiz, trainingId));
    const [summary, setSummary] = useState<QuizAttemptSummary | null>(null);
    const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([]);

    const refreshAttempts = useCallback(() => {
        getMyQuizAttempts(quiz.id).then(setPreviousAttempts);
    }, [quiz.id]);

    useEffect(() => { refreshAttempts(); }, [refreshAttempts]);

    const beginQuiz = () => {
        setAttempt(newAttempt(quiz, trainingId));
        setSummary(null);
        setStage("taking");
    };

    const updateAnswer = (questionIndex: number, answer: QuizAnswer) => {
        setAttempt((prev) => {
            const answers = [...prev.answers];
            answers[questionIndex] = answer;
            return { ...prev, answers };
        });
    };

    const submitQuiz = useCallback(() => {
        setAttempt((prev) => {
            const total = quiz.questions.length;
            let correct = 0;
            let answered = 0;

            const graded: QuizAnswer[] = quiz.questions.map((q, i) => {
                const a = prev.answers[i] || { questionId: q.id, selectedAnswers: [], flagged: false };
                const sel = [...(a.selectedAnswers || [])].sort((x, y) => x - y);
                const cor = [...(q.correctAnswers || [])].sort((x, y) => x - y);
                const isCorrect = sel.length > 0 && sel.length === cor.length && cor.every((c, idx) => sel[idx] === c);
                if (sel.length > 0) answered++;
                if (isCorrect) correct++;
                return { ...a, isCorrect };
            });

            const score = total > 0 ? Math.round((correct / total) * 100) : 0;
            const isPassed = score >= quiz.passingScore;
            const timeSpent = Math.max(0, Math.floor((Date.now() - new Date(prev.startTime).getTime()) / 1000));

            setSummary({
                totalQuestions: total,
                answeredQuestions: answered,
                correctAnswers: correct,
                wrongAnswers: answered - correct,
                unansweredQuestions: total - answered,
                timeSpent,
                score,
                isPassed,
            });

            // Persist in the background — a save hiccup never blocks results.
            submitQuizAttempt({
                quizId: quiz.id,
                trainingId,
                answers: graded,
                score,
                isPassed,
                timeSpentSec: timeSpent,
            })
                .then(refreshAttempts)
                .catch(() => toast.error("Your result is shown below, but it could not be saved this time."));

            return {
                ...prev,
                answers: graded,
                endTime: new Date(),
                timeSpent,
                score,
                isPassed,
                status: "completed",
            };
        });
        setStage("results");
    }, [quiz, trainingId, refreshAttempts]);

    return (
        <div className="space-y-4">
            <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all" onClick={onExit}>
                Back to quizzes
            </Button>

            {stage === "overview" && (
                <QuizOverview
                    quizMetadata={{
                        quizId: quiz.id,
                        title: quiz.title,
                        description: quiz.description || undefined,
                        totalQuestions: quiz.questions.length,
                        timeLimit: quiz.timeLimitMin ?? undefined,
                        passingScore: quiz.passingScore,
                    }}
                    previousAttempts={previousAttempts}
                    onBeginQuiz={beginQuiz}
                />
            )}

            {stage === "taking" && (
                <QuizTaking
                    questions={quiz.questions}
                    attempt={attempt}
                    onUpdateAnswer={updateAnswer}
                    onSubmitQuiz={submitQuiz}
                />
            )}

            {stage === "results" && summary && (
                <QuizResults
                    questions={quiz.questions}
                    attempt={attempt}
                    summary={summary}
                    onRetakeQuiz={beginQuiz}
                    onBackToOverview={() => { refreshAttempts(); setStage("overview"); }}
                />
            )}
        </div>
    );
}
