import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/quiz';
import { QuestionList } from './QuestionList';
import { QuestionEditor } from './QuestionEditor';
import { CSVImportDialog } from './CSVImportDialog';
import { useToast } from '@/hooks/use-toast';

interface QuizBuilderProps {
    trainingId: string;
    onSave?: (questions: QuizQuestion[]) => void;
}

export const QuizBuilder = ({ trainingId, onSave }: QuizBuilderProps) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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

    const handleSave = () => {
        if (onSave) {
            onSave(questions);
        }

        toast({
            title: 'Quiz Saved',
            description: `${questions.length} questions saved successfully`,
        });
    };

    return (
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
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </Button>
                    <Button
                        onClick={() => setIsCSVDialogOpen(true)}
                        className="w-full"
                        variant="outline"
                        type="button"
                    >
                        <Upload className="w-4 h-4 mr-2" />
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
                                <Save className="w-4 h-4 mr-2" />
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
    );
};
