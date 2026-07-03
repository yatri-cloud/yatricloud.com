import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Clock,
    BarChart3,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { QuizQuestion } from '@/types/quiz';
import { QuizAttempt, QuizAttemptSummary } from '@/types/quizAttempt';
import { cn } from '@/lib/utils';

interface QuizResultsProps {
    questions: QuizQuestion[];
    attempt: QuizAttempt;
    summary: QuizAttemptSummary;
    onRetakeQuiz: () => void;
    onBackToOverview: () => void;
}

export const QuizResults = ({
    questions,
    attempt,
    summary,
    onRetakeQuiz,
    onBackToOverview,
}: QuizResultsProps) => {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const toggleQuestionExpanded = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    const isAnswerCorrect = (questionIndex: number): boolean => {
        const question = questions[questionIndex];
        const answer = attempt.answers[questionIndex];

        if (!answer || answer.selectedAnswers.length === 0) return false;

        const correctAnswers = question.correctAnswers.sort();
        const userAnswers = answer.selectedAnswers.sort();

        return (
            correctAnswers.length === userAnswers.length &&
            correctAnswers.every((val, idx) => val === userAnswers[idx])
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Results Header */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#007CFF]/10 mb-4">
                    {summary.isPassed ? (
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    ) : (
                        <XCircle className="w-10 h-10 text-orange-600" />
                    )}
                </div>

                <h1 className="text-4xl font-bold mb-2">
                    {summary.score.toFixed(1)}%
                </h1>

                <p className="text-xl text-muted-foreground mb-4">
                    {summary.isPassed ? (
                        <span className="text-green-600 font-semibold">Congratulations! You passed!</span>
                    ) : (
                        <span className="text-orange-600 font-semibold">
                            You didn't pass this time. Keep practicing!
                        </span>
                    )}
                </p>

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(summary.timeSpent)}
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {summary.correctAnswers}/{summary.totalQuestions} correct
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid md:grid-cols-4 gap-4"
            >
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                                {summary.correctAnswers}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Correct</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">
                                {summary.wrongAnswers}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Wrong</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600">
                                {summary.unansweredQuestions}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Skipped</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#007CFF]">
                                {summary.score.toFixed(0)}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Score</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Progress Visualization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Correct Answers</span>
                                <span className="font-semibold">
                                    {summary.correctAnswers} / {summary.totalQuestions}
                                </span>
                            </div>
                            <Progress
                                value={(summary.correctAnswers / summary.totalQuestions) * 100}
                                className="h-2"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap gap-4 justify-center"
            >
                <Button onClick={onRetakeQuiz} size="lg">
                    Retake Quiz
                </Button>
                <Button onClick={onBackToOverview} variant="outline" size="lg">
                    Back to Overview
                </Button>
            </motion.div>

            <Separator className="my-8" />

            {/* Question Review */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
            >
                <h2 className="text-2xl font-bold mb-6">Question Review</h2>

                <div className="space-y-4">
                    {questions.map((question, questionIndex) => {
                        const answer = attempt.answers[questionIndex];
                        const isCorrect = isAnswerCorrect(questionIndex);
                        const isExpanded = expandedQuestions.has(questionIndex);
                        const wasAnswered = answer && answer.selectedAnswers.length > 0;

                        return (
                            <Card
                                key={question.id}
                                className={cn(
                                    'overflow-hidden transition-all',
                                    !wasAnswered && 'border-orange-200 dark:border-orange-800',
                                    wasAnswered && isCorrect && 'border-green-200 dark:border-green-800',
                                    wasAnswered && !isCorrect && 'border-red-200 dark:border-red-800'
                                )}
                            >
                                <div
                                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleQuestionExpanded(questionIndex)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {/* Question Number Badge */}
                                            <div
                                                className={cn(
                                                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                                                    !wasAnswered && 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
                                                    wasAnswered && isCorrect && 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                                                    wasAnswered && !isCorrect && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                )}
                                            >
                                                {questionIndex + 1}
                                            </div>

                                            {/* Question Text */}
                                            <div className="flex-1">
                                                <p className="font-medium mb-2">{question.question}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {question.domain && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {question.domain}
                                                        </Badge>
                                                    )}
                                                    {!wasAnswered ? (
                                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                                            Skipped
                                                        </Badge>
                                                    ) : isCorrect ? (
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                                            Correct
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                                                            Wrong
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t"
                                    >
                                        <div className="p-4 space-y-3">
                                            {/* Answer Options */}
                                            {question.options.map((option, optionIndex) => {
                                                const optionNumber = optionIndex + 1;
                                                const isCorrectOption = question.correctAnswers.includes(optionNumber);
                                                const isUserSelected = answer?.selectedAnswers.includes(optionNumber);

                                                return (
                                                    <div
                                                        key={optionIndex}
                                                        className={cn(
                                                            'p-3 rounded-lg border-2',
                                                            isCorrectOption && 'bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-700',
                                                            !isCorrectOption && isUserSelected && 'bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-700',
                                                            !isCorrectOption && !isUserSelected && 'bg-muted/30 border-muted'
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex items-center gap-2">
                                                                {isCorrectOption && (
                                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                )}
                                                                {!isCorrectOption && isUserSelected && (
                                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1">
                                                                <p className="font-medium">{option.text}</p>
                                                                {option.explanation && (
                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                        {option.explanation}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Overall Explanation */}
                                            {question.overallExplanation && (
                                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                                        Explanation
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        {question.overallExplanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};
