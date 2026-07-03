import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, CheckCircle, History, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QuizMetadata, PreviousAttempt } from '@/types/quizAttempt';
import { useNavigate } from 'react-router-dom';

interface QuizOverviewProps {
    quizMetadata: QuizMetadata;
    previousAttempts?: PreviousAttempt[];
    onBeginQuiz: () => void;
    hasIncompleteAttempt?: boolean;
}

export const QuizOverview = ({
    quizMetadata,
    previousAttempts = [],
    onBeginQuiz,
    hasIncompleteAttempt = false,
}: QuizOverviewProps) => {
    const navigate = useNavigate();

    const defaultInstructions = [
        `This practice test contains ${quizMetadata.totalQuestions} questions`,
        quizMetadata.timeLimit
            ? `You have ${quizMetadata.timeLimit} minutes to complete the test`
            : 'There is no time limit for this practice test',
        'You can navigate between questions using the sidebar',
        'You can flag questions for review and return to them later',
        quizMetadata.passingScore
            ? `Passing score: ${quizMetadata.passingScore}%`
            : 'This is a practice test - there is no pass/fail criteria',
        'Your progress is automatically saved',
    ];

    const instructions = quizMetadata.instructions || defaultInstructions;

    const bestAttempt = previousAttempts.length > 0
        ? previousAttempts.reduce((best, attempt) =>
            attempt.score > best.score ? attempt : best
        )
        : null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{quizMetadata.title}</h1>
                        {quizMetadata.description && (
                            <p className="text-muted-foreground">{quizMetadata.description}</p>
                        )}
                    </div>

                    {bestAttempt && (
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Best Score</div>
                            <div className="text-3xl font-bold text-[#007CFF]">
                                {bestAttempt.score}%
                            </div>
                            {bestAttempt.isPassed && (
                                <Badge variant="default" className="mt-1">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Passed
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            <Separator />

            {/* Main Content */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Instructions Card */}
                <motion.div
                    className="md:col-span-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {instructions.map((instruction, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#007CFF]/10 text-[#007CFF] flex items-center justify-center text-sm font-semibold mt-0.5">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm">{instruction}</span>
                                    </li>
                                ))}
                            </ul>

                            {hasIncompleteAttempt && (
                                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                You have an incomplete attempt
                                            </p>
                                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                                You can resume your previous attempt or start a new one.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <Button
                                    onClick={onBeginQuiz}
                                    size="lg"
                                    className="w-full md:w-auto"
                                >
                                    {hasIncompleteAttempt ? 'Resume Test' : 'Begin Test'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Metadata Sidebar */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    {/* Quiz Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quiz Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#007CFF]/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[#007CFF]" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{quizMetadata.totalQuestions}</div>
                                    <div className="text-xs text-muted-foreground">Questions</div>
                                </div>
                            </div>

                            {quizMetadata.timeLimit && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{quizMetadata.timeLimit}</div>
                                        <div className="text-xs text-muted-foreground">Minutes</div>
                                    </div>
                                </div>
                            )}

                            {quizMetadata.passingScore && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{quizMetadata.passingScore}%</div>
                                        <div className="text-xs text-muted-foreground">Passing Score</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Previous Attempts */}
                    {previousAttempts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Previous Attempts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {previousAttempts.slice(0, 5).map((attempt, index) => (
                                        <div
                                            key={attempt.attemptId}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {attempt.score}%
                                                    {attempt.isPassed && (
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            Passed
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(attempt.date)} • {formatTime(attempt.timeSpent)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
