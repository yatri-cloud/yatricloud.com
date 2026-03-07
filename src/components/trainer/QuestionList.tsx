import { ScrollArea } from '@/components/ui/scroll-area';
import { QuizQuestion } from '@/types/quiz';
import { Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionListProps {
    questions: QuizQuestion[];
    selectedQuestionId: string | null;
    onSelectQuestion: (id: string) => void;
    onDeleteQuestion: (id: string) => void;
    onDuplicateQuestion: (id: string) => void;
}

export const QuestionList = ({
    questions,
    selectedQuestionId,
    onSelectQuestion,
    onDeleteQuestion,
    onDuplicateQuestion,
}: QuestionListProps) => {
    if (questions.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
                <p className="text-sm">No questions yet.<br />Add a question to get started.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
                {questions.map((question, index) => {
                    const isSelected = question.id === selectedQuestionId;
                    const questionPreview = question.question || 'Untitled Question';

                    return (
                        <div
                            key={question.id}
                            className={`
                group relative p-3 rounded-lg cursor-pointer transition-all
                ${isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }
              `}
                            onClick={() => onSelectQuestion(question.id)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Question Number */}
                                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  ${isSelected ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                                    {index + 1}
                                </div>

                                {/* Question Text Preview */}
                                <div className="flex-1 min-w-0">
                                    <p className={`
                    text-sm line-clamp-2
                    ${isSelected ? 'text-primary-foreground' : 'text-foreground'}
                  `}>
                                        {questionPreview}
                                    </p>
                                    {question.domain && (
                                        <p className={`
                      text-xs mt-1
                      ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}
                    `}>
                                            {question.domain}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons (visible on hover) */}
                            <div className={`
                absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity
              `}>
                                <Button
                                    size="sm"
                                    variant={isSelected ? "secondary" : "ghost"}
                                    className="h-6 w-6 p-0"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicateQuestion(question.id);
                                    }}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant={isSelected ? "secondary" : "ghost"}
                                    className="h-6 w-6 p-0"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteQuestion(question.id);
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
};
