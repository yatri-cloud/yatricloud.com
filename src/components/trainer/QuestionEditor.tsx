import { useState, useEffect } from 'react';
import { QuizQuestion, AnswerOption } from '@/types/quiz';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface QuestionEditorProps {
    question: QuizQuestion;
    onUpdate: (question: QuizQuestion) => void;
}

export const QuestionEditor = ({ question, onUpdate }: QuestionEditorProps) => {
    const [localQuestion, setLocalQuestion] = useState<QuizQuestion>(question);

    useEffect(() => {
        setLocalQuestion(question);
    }, [question.id]); // Re-sync when switching questions

    const handleUpdate = (updates: Partial<QuizQuestion>) => {
        const updated = { ...localQuestion, ...updates };
        setLocalQuestion(updated);
        onUpdate(updated);
    };

    const handleOptionChange = (index: number, field: keyof AnswerOption, value: string) => {
        const newOptions = [...localQuestion.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        handleUpdate({ options: newOptions });
    };

    const handleAddOption = () => {
        if (localQuestion.options.length >= 6) return;
        handleUpdate({
            options: [...localQuestion.options, { text: '', explanation: '' }],
        });
    };

    const handleRemoveOption = (index: number) => {
        if (localQuestion.options.length <= 2) return;
        const newOptions = localQuestion.options.filter((_, i) => i !== index);

        // Adjust correct answers if needed
        const newCorrectAnswers = localQuestion.correctAnswers
            .filter(ans => ans !== index + 1)
            .map(ans => ans > index + 1 ? ans - 1 : ans);

        handleUpdate({
            options: newOptions,
            correctAnswers: newCorrectAnswers
        });
    };

    const handleCorrectAnswerToggle = (optionIndex: number) => {
        const answerNumber = optionIndex + 1;

        if (localQuestion.questionType === 'multiple-choice') {
            // Single selection
            handleUpdate({ correctAnswers: [answerNumber] });
        } else {
            // Multi-select
            const isSelected = localQuestion.correctAnswers.includes(answerNumber);
            const newCorrectAnswers = isSelected
                ? localQuestion.correctAnswers.filter(a => a !== answerNumber)
                : [...localQuestion.correctAnswers, answerNumber].sort();

            handleUpdate({ correctAnswers: newCorrectAnswers });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Question Text */}
            <div className="space-y-2">
                <Label htmlFor="question" className="text-base font-semibold">
                    Question
                </Label>
                <Textarea
                    id="question"
                    placeholder="Enter your question here..."
                    value={localQuestion.question}
                    onChange={(e) => handleUpdate({ question: e.target.value })}
                    className="min-h-[100px] text-base"
                />
            </div>

            {/* Question Type and Domain */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="question-type">Question Type</Label>
                    <Select
                        value={localQuestion.questionType}
                        onValueChange={(value: 'multiple-choice' | 'multi-select') => {
                            handleUpdate({
                                questionType: value,
                                correctAnswers: [] // Reset answers when type changes
                            });
                        }}
                    >
                        <SelectTrigger id="question-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice (Single Answer)</SelectItem>
                            <SelectItem value="multi-select">Multiple Select (Multiple Answers)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="domain">Domain/Category (Optional)</Label>
                    <Input
                        id="domain"
                        placeholder="e.g., AWS, Kubernetes, DevOps"
                        value={localQuestion.domain || ''}
                        onChange={(e) => handleUpdate({ domain: e.target.value })}
                    />
                </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Answer Options</Label>
                    {localQuestion.options.length < 6 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOption}
                        >
                            Add Option
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    {localQuestion.options.map((option, index) => {
                        const isCorrect = localQuestion.correctAnswers.includes(index + 1);

                        return (
                            <div
                                key={index}
                                className={`
                  p-4 border rounded-lg transition-colors
                  ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}
                `}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Correct Answer Selector */}
                                    <div className="flex-shrink-0 pt-2">
                                        {localQuestion.questionType === 'multiple-choice' ? (
                                            <RadioGroup
                                                value={localQuestion.correctAnswers[0]?.toString() || ''}
                                                onValueChange={() => handleCorrectAnswerToggle(index)}
                                            >
                                                <RadioGroupItem value={(index + 1).toString()} />
                                            </RadioGroup>
                                        ) : (
                                            <Checkbox
                                                checked={isCorrect}
                                                onCheckedChange={() => handleCorrectAnswerToggle(index)}
                                            />
                                        )}
                                    </div>

                                    {/* Option Content */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground mb-1">
                                                    Option {index + 1}
                                                </Label>
                                                <Input
                                                    placeholder={`Answer option ${index + 1}`}
                                                    value={option.text}
                                                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                />
                                            </div>
                                            {localQuestion.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveOption(index)}
                                                    className="mt-6"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>

                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1">
                                                Explanation for Option {index + 1}
                                            </Label>
                                            <Textarea
                                                placeholder="Explain why this answer is correct or incorrect..."
                                                value={option.explanation}
                                                onChange={(e) => handleOptionChange(index, 'explanation', e.target.value)}
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {localQuestion.correctAnswers.length === 0 && (
                    <p className="text-sm text-destructive">
                        ⚠️ Please select at least one correct answer
                    </p>
                )}
            </div>

            {/* Overall Explanation */}
            <div className="space-y-2">
                <Label htmlFor="overall-explanation" className="text-base font-semibold">
                    Overall Explanation
                </Label>
                <Textarea
                    id="overall-explanation"
                    placeholder="Provide a comprehensive explanation for this question..."
                    value={localQuestion.overallExplanation}
                    onChange={(e) => handleUpdate({ overallExplanation: e.target.value })}
                    className="min-h-[100px]"
                />
            </div>
        </div>
    );
};
