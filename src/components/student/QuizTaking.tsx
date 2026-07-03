import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Flag,
    ChevronRight,
    AlertTriangle,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuizQuestion } from '@/types/quiz';
import { QuizAnswer, QuizAttempt } from '@/types/quizAttempt';
import { QuizNavigationSidebar } from './QuizNavigationSidebar';
import { cn } from '@/lib/utils';

interface QuizTakingProps {
    questions: QuizQuestion[];
    attempt: QuizAttempt;
    onUpdateAnswer: (questionIndex: number, answer: QuizAnswer) => void;
    onSubmitQuiz: () => void;
    practiceMode?: boolean; // Show explanations immediately
}

export const QuizTaking = ({
    questions,
    attempt,
    onUpdateAnswer,
    onSubmitQuiz,
    practiceMode = false,
}: QuizTakingProps) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = attempt.answers[currentQuestionIndex] || {
        questionId: currentQuestion.id,
        selectedAnswers: [],
        flagged: false,
    };

    // Timer logic
    useEffect(() => {
        if (!attempt.timeLimit) return;

        const endTime = new Date(attempt.startTime).getTime() + attempt.timeLimit * 60 * 1000;
        const remaining = Math.floor((endTime - Date.now()) / 1000);
        setTimeRemaining(remaining > 0 ? remaining : 0);

        const interval = setInterval(() => {
            const newRemaining = Math.floor((endTime - Date.now()) / 1000);

            if (newRemaining <= 0) {
                setTimeRemaining(0);
                clearInterval(interval);
                // Auto-submit when time expires
                onSubmitQuiz();
            } else {
                setTimeRemaining(newRemaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [attempt.timeLimit, attempt.startTime, onSubmitQuiz]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (optionIndex: number) => {
        let newSelectedAnswers: number[];

        if (currentQuestion.questionType === 'multiple-choice') {
            // Single selection
            newSelectedAnswers = [optionIndex + 1];
        } else {
            // Multi-select
            const currentSelections = currentAnswer.selectedAnswers || [];
            const answerNumber = optionIndex + 1;

            if (currentSelections.includes(answerNumber)) {
                newSelectedAnswers = currentSelections.filter(a => a !== answerNumber);
            } else {
                newSelectedAnswers = [...currentSelections, answerNumber].sort();
            }
        }

        const updatedAnswer: QuizAnswer = {
            ...currentAnswer,
            selectedAnswers: newSelectedAnswers,
        };

        onUpdateAnswer(currentQuestionIndex, updatedAnswer);

        // Show explanation in practice mode immediately after answering
        if (practiceMode && newSelectedAnswers.length > 0) {
            setShowExplanation(true);
        }
    };

    const handleToggleFlag = () => {
        const updatedAnswer: QuizAnswer = {
            ...currentAnswer,
            flagged: !currentAnswer.flagged,
        };
        onUpdateAnswer(currentQuestionIndex, updatedAnswer);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        setShowExplanation(false);

        if (direction === 'prev' && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handleNavigateToQuestion = (index: number) => {
        setShowExplanation(false);
        setCurrentQuestionIndex(index);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const getAnsweredCount = () => {
        return attempt.answers.filter(a => a && a.selectedAnswers.length > 0).length;
    };

    const handleSubmitClick = () => {
        const answeredCount = getAnsweredCount();
        if (answeredCount < questions.length) {
            setShowSubmitDialog(true);
        } else {
            onSubmitQuiz();
        }
    };

    const progress = (getAnsweredCount() / questions.length) * 100;

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({getAnsweredCount()} answered)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {timeRemaining !== null && (
                        <div
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm',
                                timeRemaining < 300
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-muted'
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            {formatTime(timeRemaining)}
                        </div>
                    )}


                    <Button
                        className="bg-[#007CFF] hover:bg-[#0066D6] text-white"
                        onClick={handleSubmitClick}
                    >
                        Finish Test
                    </Button>

                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-2 bg-muted/30">
                <Progress value={progress} className="h-1" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Navigation Sidebar */}
                <QuizNavigationSidebar
                    totalQuestions={questions.length}
                    currentQuestionIndex={currentQuestionIndex}
                    answers={attempt.answers}
                    onNavigateToQuestion={handleNavigateToQuestion}
                    isOpen={isSidebarOpen}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        {currentQuestion.domain && (
                                            <Badge variant="outline" className="mb-3">
                                                {currentQuestion.domain}
                                            </Badge>
                                        )}
                                        <h2 className="text-2xl font-semibold leading-tight">
                                            {currentQuestion.question}
                                        </h2>
                                    </div>

                                    <Button
                                        variant={currentAnswer.flagged ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={handleToggleFlag}
                                        className="ml-4"
                                    >
                                        <Flag
                                            className={cn(
                                                'w-4 h-4',
                                                currentAnswer.flagged && 'fill-current'
                                            )}
                                        />
                                    </Button>
                                </div>

                                {/* Question Type Indicator */}
                                <div className="mb-6 text-sm text-muted-foreground">
                                    {currentQuestion.questionType === 'multiple-choice' ? (
                                        <span>Select one answer</span>
                                    ) : (
                                        <span>Select all that apply</span>
                                    )}
                                </div>

                                {/* Answer Options */}
                                <div className="space-y-3 mb-8">
                                    {currentQuestion.options.map((option, index) => {
                                        const isSelected = currentAnswer.selectedAnswers.includes(index + 1);

                                        return (
                                            <Card
                                                key={index}
                                                className={cn(
                                                    'p-4 cursor-pointer transition-all hover:shadow-md',
                                                    isSelected && 'ring-2 ring-[#007CFF] bg-[#007CFF]/5'
                                                )}
                                                onClick={() => handleAnswerChange(index)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {currentQuestion.questionType === 'multiple-choice' ? (
                                                        <RadioGroup
                                                            value={currentAnswer.selectedAnswers[0]?.toString() || ''}
                                                            onValueChange={() => { }}
                                                        >
                                                            <RadioGroupItem
                                                                value={(index + 1).toString()}
                                                                checked={isSelected}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </RadioGroup>
                                                    ) : (
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}

                                                    <div className="flex-1">
                                                        <Label
                                                            className="text-base cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {option.text}
                                                        </Label>

                                                        {/* Show explanation if in practice mode and this option is selected */}
                                                        {practiceMode && showExplanation && isSelected && option.explanation && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="mt-3 p-3 bg-muted/50 rounded-md text-sm"
                                                            >
                                                                {option.explanation}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Overall Explanation (Practice Mode) */}
                                {practiceMode && showExplanation && currentAnswer.selectedAnswers.length > 0 && currentQuestion.overallExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                                    Explanation
                                                </p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    {currentQuestion.overallExplanation}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleNavigate('prev')}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => handleNavigate('next')}
                                        disabled={currentQuestionIndex === questions.length - 1}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have answered {getAnsweredCount()} out of {questions.length} questions.
                            {getAnsweredCount() < questions.length && (
                                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                                    You still have {questions.length - getAnsweredCount()} unanswered questions.
                                </span>
                            )}
                            <span className="block mt-2">
                                Are you sure you want to submit your quiz?
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Review Answers</AlertDialogCancel>
                        <AlertDialogAction onClick={onSubmitQuiz}>
                            Submit Quiz
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
