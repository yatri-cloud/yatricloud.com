import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/quiz';
import { QuestionList } from './QuestionList';
import { QuestionEditor } from './QuestionEditor';
import { CSVImportDialog } from './CSVImportDialog';
import { useToast } from '@/hooks/use-toast';

export interface QuizSettings {
    title: string;
    passingScore: number;
    /** Minutes; null = no time limit. */
    timeLimitMin: number | null;
}

interface QuizBuilderProps {
    trainingId: string;
    onSave?: (questions: QuizQuestion[]) => void;
    /** Existing questions loaded from the DB when editing a training. */
    initialQuestions?: QuizQuestion[];
    /** Quiz-level settings (title, pass mark, time limit), lifted to the form. */
    settings?: QuizSettings;
    onSettingsChange?: (settings: QuizSettings) => void;
}

export const QuizBuilder = ({ trainingId, onSave, initialQuestions, settings, onSettingsChange }: QuizBuilderProps) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);

    // Hydrate once when the saved quiz arrives (async on edit). Never clobber
    // in-progress authoring: only fill while the builder is still empty.
    useEffect(() => {
        if (initialQuestions?.length) {
            setQuestions((prev) => (prev.length ? prev : initialQuestions));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuestions]);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
    const { toast } = useToast();

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

    const handleAddQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: `q_${Date.now()}`,
            question: '',
            questionType: 'multiple-choice',
            options: [
                { text: '', explanation: '' },
                { text: '', explanation: '' },
                { text: '', explanation: '' },
                { text: '', explanation: '' },
            ],
            correctAnswers: [],
            overallExplanation: '',
            order: questions.length + 1,
        };

        setQuestions([...questions, newQuestion]);
        setSelectedQuestionId(newQuestion.id);
    };

    const handleUpdateQuestion = (updatedQuestion: QuizQuestion) => {
        setQuestions(questions.map(q =>
            q.id === updatedQuestion.id ? updatedQuestion : q
        ));
    };

    const handleDeleteQuestion = (questionId: string) => {
        const filtered = questions.filter(q => q.id !== questionId);
        // Reorder remaining questions
        const reordered = filtered.map((q, idx) => ({ ...q, order: idx + 1 }));
        setQuestions(reordered);

        if (selectedQuestionId === questionId) {
            setSelectedQuestionId(reordered[0]?.id || null);
        }
    };

    const handleDuplicateQuestion = (questionId: string) => {
        const questionToDuplicate = questions.find(q => q.id === questionId);
        if (!questionToDuplicate) return;

        const duplicated: QuizQuestion = {
            ...questionToDuplicate,
            id: `q_${Date.now()}`,
            order: questions.length + 1,
        };

        setQuestions([...questions, duplicated]);
        setSelectedQuestionId(duplicated.id);
    };

    const handleCSVImport = (importedQuestions: QuizQuestion[]) => {
        const withOrder = importedQuestions.map((q, idx) => ({
            ...q,
            order: questions.length + idx + 1,
        }));

        setQuestions([...questions, ...withOrder]);
        setIsCSVDialogOpen(false);

        toast({
            title: 'Questions Imported',
            description: `Successfully imported ${importedQuestions.length} questions`,
        });
    };

    // Lift every change to the parent form so questions are never lost when
    // the trainer publishes without pressing "Save Quiz" first.
    useEffect(() => {
        onSave?.(questions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questions]);

    const handleSave = () => {
        onSave?.(questions);
        toast({
            title: 'Quiz Saved',
            description: `${questions.length} questions ready — they go live when you save the course.`,
        });
    };

    const currentSettings: QuizSettings = settings || { title: "Practice Quiz", passingScore: 70, timeLimitMin: null };
    const patchSettings = (patch: Partial<QuizSettings>) =>
        onSettingsChange?.({ ...currentSettings, ...patch });

    return (
        <div className="space-y-4">
        {/* Quiz-level settings — saved with the course */}
        {onSettingsChange && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
                <div className="space-y-1">
                    <label htmlFor="quiz-title" className="text-sm font-medium">Quiz title</label>
                    <input
                        id="quiz-title"
                        value={currentSettings.title}
                        onChange={(e) => patchSettings({ title: e.target.value })}
                        placeholder="Practice Quiz"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="quiz-pass" className="text-sm font-medium">Passing score (%)</label>
                    <input
                        id="quiz-pass"
                        type="number"
                        min={0}
                        max={100}
                        value={currentSettings.passingScore}
                        onChange={(e) => patchSettings({ passingScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="quiz-time" className="text-sm font-medium">Time limit (minutes, empty = none)</label>
                    <input
                        id="quiz-time"
                        type="number"
                        min={1}
                        value={currentSettings.timeLimitMin ?? ""}
                        onChange={(e) => patchSettings({ timeLimitMin: e.target.value ? Math.max(1, Number(e.target.value) || 1) : null })}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
            </div>
        )}

        <div className="flex h-[calc(100vh-200px)] gap-4">
            {/* Left Sidebar - Question List */}
            <div className="w-80 flex flex-col border-r bg-card">
                <div className="p-4 border-b space-y-2">
                    <Button
                        onClick={handleAddQuestion}
                        className="w-full"
                        variant="default"
                        type="button"
                    >
                        Add Question
                    </Button>
                    <Button
                        onClick={() => setIsCSVDialogOpen(true)}
                        className="w-full"
                        variant="outline"
                        type="button"
                    >
                        Import CSV
                    </Button>
                </div>

                <QuestionList
                    questions={questions}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={setSelectedQuestionId}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                />
            </div>

            {/* Right Panel - Question Editor */}
            <div className="flex-1 flex flex-col">
                {selectedQuestion ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-6">
                            <QuestionEditor
                                question={selectedQuestion}
                                onUpdate={handleUpdateQuestion}
                            />
                        </div>
                        <div className="p-4 border-t bg-card flex justify-end">
                            <Button onClick={handleSave} className="bg-primary" type="button">
                                Save Quiz
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <p className="text-lg mb-2">No question selected</p>
                            <p className="text-sm">Add a question or import from CSV to get started</p>
                        </div>
                    </div>
                )}
            </div>

            {/* CSV Import Dialog */}
            <CSVImportDialog
                isOpen={isCSVDialogOpen}
                onClose={() => setIsCSVDialogOpen(false)}
                onImport={handleCSVImport}
            />
        </div>
        </div>
    );
};
