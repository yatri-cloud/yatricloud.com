import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuizAnswer } from '@/types/quizAttempt';

interface QuizNavigationSidebarProps {
    totalQuestions: number;
    currentQuestionIndex: number;
    answers: QuizAnswer[];
    onNavigateToQuestion: (index: number) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const QuizNavigationSidebar = ({
    totalQuestions,
    currentQuestionIndex,
    answers,
    onNavigateToQuestion,
    isOpen,
    onToggle,
}: QuizNavigationSidebarProps) => {
    const getQuestionStatus = (index: number) => {
        const answer = answers[index];

        if (!answer) return 'unanswered';
        if (answer.flagged) return 'flagged';
        if (answer.selectedAnswers.length > 0) return 'answered';
        return 'unanswered';
    };

    const getStatusColor = (status: string, isCurrent: boolean) => {
        if (isCurrent) return 'bg-[#007CFF] text-[#007CFF]-foreground';

        switch (status) {
            case 'answered':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900';
            case 'flagged':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900';
            default:
                return 'bg-muted text-muted-foreground hover:bg-muted/80';
        }
    };

    const answeredCount = answers.filter(a => a && a.selectedAnswers.length > 0).length;
    const flaggedCount = answers.filter(a => a && a.flagged).length;

    return (
        <>
            {/* Toggle Button for Mobile */}
            <Button
                variant="outline"
                size="sm"
                className="md:hidden fixed top-20 left-4 z-40"
                onClick={onToggle}
            >
                {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Questions
            </Button>

            {/* Sidebar */}
            <div
                className={cn(
                    'fixed md:relative inset-y-0 left-0 z-30 w-64 bg-card border-r transition-transform duration-300',
                    'flex flex-col',
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                {/* Header */}
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm mb-3">All Questions</h3>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <div>
                            <span className="font-semibold text-foreground">{answeredCount}</span>/{totalQuestions} answered
                        </div>
                        {flaggedCount > 0 && (
                            <div className="flex items-center gap-1">
                                <Flag className="w-3 h-3 text-orange-500" />
                                <span className="font-semibold text-foreground">{flaggedCount}</span> flagged
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Grid */}
                <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: totalQuestions }, (_, index) => {
                            const status = getQuestionStatus(index);
                            const isCurrent = index === currentQuestionIndex;

                            return (
                                <button
                                    key={index}
                                    onClick={() => onNavigateToQuestion(index)}
                                    className={cn(
                                        'aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-colors relative',
                                        getStatusColor(status, isCurrent)
                                    )}
                                >
                                    {index + 1}
                                    {status === 'flagged' && !isCurrent && (
                                        <Flag className="w-3 h-3 absolute -top-1 -right-1 fill-orange-500 text-orange-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Legend */}
                <div className="p-4 border-t bg-muted/30">
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950" />
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-muted" />
                            <span>Unanswered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950 relative">
                                <Flag className="w-2 h-2 absolute -top-0.5 -right-0.5 fill-orange-500 text-orange-500" />
                            </div>
                            <span>Flagged</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-20"
                    onClick={onToggle}
                />
            )}
        </>
    );
};
