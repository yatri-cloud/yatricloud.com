/**
 * Main Quiz Container Component
 * Manages quiz state and orchestrates the quiz flow
 */

import { useState, useEffect } from 'react';
import { QuizOverview } from './QuizOverview';
import { QuizTaking } from './QuizTaking';
import { QuizResults } from './QuizResults';
import { QuizQuestion } from '@/types/quiz';
import { QuizAnswer, QuizAttempt, QuizAttemptSummary, QuizMetadata, PreviousAttempt } from '@/types/quizAttempt';
import { useToast } from '@/hooks/use-toast';

interface QuizContainerProps {
    trainingId: string;
    quizMetadata: QuizMetadata;
    questions: QuizQuestion[];
    userId: string;
    userName?: string;
}

type QuizScreen = 'overview' | 'taking' | 'results';

export const QuizContainer = ({
    trainingId,
    quizMetadata,
    questions,
    userId,
    userName,
}: QuizContainerProps) => {
    const { toast } = useToast();
    const [currentScreen, setCurrentScreen] = useState<QuizScreen>('overview');
    const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
    const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([]);
    const [quizSummary, setQuizSummary] = useState<QuizAttemptSummary | null>(null);

    // Load previous attempts on mount
    useEffect(() => {
        loadPreviousAttempts();
        checkForIncompleteAttempt();
    }, []);

    const loadPreviousAttempts = async () => {
        // TODO: Fetch from backend
        // For now, load from localStorage as demo
        const stored = localStorage.getItem(`quiz_attempts_${trainingId}_${userId}`);
        if (stored) {
            try {
                const attempts = JSON.parse(stored);
                setPreviousAttempts(attempts);
            } catch (e) {
                console.error('Failed to parse previous attempts', e);
            }
        }
    };

    const checkForIncompleteAttempt = () => {
        // TODO: Check backend for incomplete attempts
        const stored = localStorage.getItem(`quiz_current_${trainingId}_${userId}`);
        if (stored) {
            try {
                const attempt = JSON.parse(stored);
                if (attempt.status === 'in-progress') {
                    setCurrentAttempt(attempt);
                }
            } catch (e) {
                console.error('Failed to parse current attempt', e);
            }
        }
    };

    const handleBeginQuiz = () => {
        // Create new attempt or resume existing
        if (currentAttempt && currentAttempt.status === 'in-progress') {
            setCurrentScreen('taking');
            return;
        }

        const newAttempt: QuizAttempt = {
            attemptId: `attempt_${Date.now()}`,
            trainingId,
            userId,
            userName,
            quizId: quizMetadata.quizId,
            quizTitle: quizMetadata.title,
            startTime: new Date(),
            timeSpent: 0,
            answers: questions.map(q => ({
                questionId: q.id,
                selectedAnswers: [],
                flagged: false,
            })),
            status: 'in-progress',
            totalQuestions: questions.length,
            timeLimit: quizMetadata.timeLimit,
        };

        setCurrentAttempt(newAttempt);
        saveAttemptToStorage(newAttempt);
        setCurrentScreen('taking');

        toast({
            title: 'Quiz Started',
            description: 'Good luck with your practice test!',
        });
    };

    const handleUpdateAnswer = (questionIndex: number, answer: QuizAnswer) => {
        if (!currentAttempt) return;

        const updatedAnswers = [...currentAttempt.answers];
        updatedAnswers[questionIndex] = answer;

        const updatedAttempt: QuizAttempt = {
            ...currentAttempt,
            answers: updatedAnswers,
        };

        setCurrentAttempt(updatedAttempt);
        saveAttemptToStorage(updatedAttempt);
    };

    const handleSubmitQuiz = () => {
        if (!currentAttempt) return;

        // Calculate score
        const endTime = new Date();
        const timeSpent = Math.floor((endTime.getTime() - new Date(currentAttempt.startTime).getTime()) / 1000);

        let correctCount = 0;
        const updatedAnswers = currentAttempt.answers.map((answer, index) => {
            const question = questions[index];
            const correctAnswers = question.correctAnswers.sort();
            const userAnswers = answer.selectedAnswers.sort();

            const isCorrect =
                correctAnswers.length === userAnswers.length &&
                correctAnswers.every((val, idx) => val === userAnswers[idx]);

            if (isCorrect) correctCount++;

            return {
                ...answer,
                isCorrect,
            };
        });

        const score = (correctCount / questions.length) * 100;
        const isPassed = quizMetadata.passingScore ? score >= quizMetadata.passingScore : true;

        const completedAttempt: QuizAttempt = {
            ...currentAttempt,
            answers: updatedAnswers,
            endTime,
            timeSpent,
            score,
            isPassed,
            status: 'completed',
        };

        const summary: QuizAttemptSummary = {
            totalQuestions: questions.length,
            answeredQuestions: updatedAnswers.filter(a => a.selectedAnswers.length > 0).length,
            correctAnswers: correctCount,
            wrongAnswers: updatedAnswers.filter(a => a.selectedAnswers.length > 0 && !a.isCorrect).length,
            unansweredQuestions: updatedAnswers.filter(a => a.selectedAnswers.length === 0).length,
            timeSpent,
            score,
            isPassed,
        };

        setCurrentAttempt(completedAttempt);
        setQuizSummary(summary);

        // Save to previous attempts
        const previousAttempt: PreviousAttempt = {
            attemptId: completedAttempt.attemptId,
            date: endTime,
            score,
            timeSpent,
            isPassed,
        };

        const updatedPreviousAttempts = [previousAttempt, ...previousAttempts];
        setPreviousAttempts(updatedPreviousAttempts);

        // Save to storage
        localStorage.setItem(
            `quiz_attempts_${trainingId}_${userId}`,
            JSON.stringify(updatedPreviousAttempts)
        );
        localStorage.removeItem(`quiz_current_${trainingId}_${userId}`);

        setCurrentScreen('results');

        toast({
            title: 'Quiz Submitted',
            description: `Your score: ${score.toFixed(1)}%`,
        });
    };

    const handleRetakeQuiz = () => {
        setCurrentAttempt(null);
        setQuizSummary(null);
        setCurrentScreen('overview');
    };

    const handleBackToOverview = () => {
        setCurrentAttempt(null);
        setQuizSummary(null);
        setCurrentScreen('overview');
    };

    const saveAttemptToStorage = (attempt: QuizAttempt) => {
        localStorage.setItem(`quiz_current_${trainingId}_${userId}`, JSON.stringify(attempt));
    };

    // Render appropriate screen
    if (currentScreen === 'overview') {
        return (
            <QuizOverview
                quizMetadata={quizMetadata}
                previousAttempts={previousAttempts}
                onBeginQuiz={handleBeginQuiz}
                hasIncompleteAttempt={currentAttempt?.status === 'in-progress'}
            />
        );
    }

    if (currentScreen === 'taking' && currentAttempt) {
        return (
            <QuizTaking
                questions={questions}
                attempt={currentAttempt}
                onUpdateAnswer={handleUpdateAnswer}
                onSubmitQuiz={handleSubmitQuiz}
                practiceMode={true}
            />
        );
    }

    if (currentScreen === 'results' && currentAttempt && quizSummary) {
        return (
            <QuizResults
                questions={questions}
                attempt={currentAttempt}
                summary={quizSummary}
                onRetakeQuiz={handleRetakeQuiz}
                onBackToOverview={handleBackToOverview}
            />
        );
    }

    return null;
};
