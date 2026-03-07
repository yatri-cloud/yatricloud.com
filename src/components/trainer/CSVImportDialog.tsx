import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { QuizQuestion, CSVQuizRow } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: QuizQuestion[]) => void;
}

export const CSVImportDialog = ({ isOpen, onClose, onImport }: CSVImportDialogProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<QuizQuestion[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const parseCSV = (csvFile: File) => {
        Papa.parse<CSVQuizRow>(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const questions = convertCSVToQuestions(results.data);
                    setPreview(questions);
                    setErrors([]);
                } catch (error: any) {
                    setErrors([error.message]);
                    setPreview([]);
                }
            },
            error: (error) => {
                setErrors([`CSV parsing error: ${error.message}`]);
                setPreview([]);
            },
        });
    };

    const convertCSVToQuestions = (rows: CSVQuizRow[]): QuizQuestion[] => {
        const questions: QuizQuestion[] = [];
        const validationErrors: string[] = [];

        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 because index 0 is row 2 (after header)

            // Validate required fields
            if (!row.Question?.trim()) {
                validationErrors.push(`Row ${rowNum}: Question is required`);
                return;
            }

            if (!row['Question Type']?.trim()) {
                validationErrors.push(`Row ${rowNum}: Question Type is required`);
                return;
            }

            // Parse question type
            const questionType = row['Question Type'].toLowerCase().trim();
            let parsedType: 'multiple-choice' | 'multi-select';

            if (questionType === 'multiple-choice') {
                parsedType = 'multiple-choice';
            } else if (questionType === 'multi-select') {
                parsedType = 'multi-select';
            } else {
                validationErrors.push(`Row ${rowNum}: Invalid Question Type "${row['Question Type']}". Must be "multiple-choice" or "multi-select"`);
                return;
            }

            // Parse options
            const options = [];
            for (let i = 1; i <= 6; i++) {
                const optionText = row[`Answer Option ${i}` as keyof CSVQuizRow];
                const optionExplanation = row[`Explanation ${i}` as keyof CSVQuizRow];

                if (optionText?.trim()) {
                    options.push({
                        text: optionText.trim(),
                        explanation: optionExplanation?.trim() || '',
                    });
                }
            }

            if (options.length < 2) {
                validationErrors.push(`Row ${rowNum}: At least 2 answer options are required`);
                return;
            }

            // Parse correct answers
            const correctAnswersStr = row['Correct Answers']?.trim();
            if (!correctAnswersStr) {
                validationErrors.push(`Row ${rowNum}: Correct Answers are required`);
                return;
            }

            const correctAnswers = correctAnswersStr
                .split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n) && n >= 1 && n <= options.length);

            if (correctAnswers.length === 0) {
                validationErrors.push(`Row ${rowNum}: No valid correct answers found`);
                return;
            }

            // Validate correct answer count for question type
            if (parsedType === 'multiple-choice' && correctAnswers.length > 1) {
                validationErrors.push(`Row ${rowNum}: Multiple-choice questions can only have one correct answer`);
                return;
            }

            // Create question
            questions.push({
                id: `csv_${Date.now()}_${index}`,
                question: row.Question.trim(),
                questionType: parsedType,
                options,
                correctAnswers,
                overallExplanation: row['Overall Explanation']?.trim() || '',
                domain: row.Domain?.trim() || undefined,
                order: index + 1,
            });
        });

        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('\n'));
        }

        if (questions.length === 0) {
            throw new Error('No valid questions found in CSV file');
        }

        return questions;
    };

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv')) {
            toast({
                title: 'Invalid File',
                description: 'Please select a CSV file',
                variant: 'destructive',
            });
            return;
        }

        setFile(selectedFile);
        parseCSV(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleImport = () => {
        if (preview.length === 0) return;

        onImport(preview);
        handleClose();
    };

    const handleClose = () => {
        setFile(null);
        setPreview([]);
        setErrors([]);
        onClose();
    };

    const downloadTemplate = () => {
        const template = `Question,Question Type,Answer Option 1,Explanation 1,Answer Option 2,Explanation 2,Answer Option 3,Explanation 3,Answer Option 4,Explanation 4,Answer Option 5,Explanation 5,Answer Option 6,Explanation 6,Correct Answers,Overall Explanation,Domain
What is the name for a 5-sided polygon?,multiple-choice,Hexagon,Hexagons have six sides.,Pentagon,A pentagon has five sides (the root "pent" means "five"),Square,Squares have four sides.,Decagon,Decagons have ten sides.,,,,,2,A pentagon is a five-sided polygon.,Geometry
Which of the following are woodwind instruments?,multi-select,Oboe,,Trumpet,,Flute,,Bassoon,,Violin,,Timpani,,"1,3,4","Clarinets, flutes, oboes, and bassoons are woodwinds.",Music`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Template Downloaded',
            description: 'CSV template has been downloaded',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Questions from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with your quiz questions. You can download a template to get started.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template Button */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={downloadTemplate}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV Template
                    </Button>

                    {/* File Upload Area */}
                    <div
                        className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
              ${!file ? 'cursor-pointer hover:border-primary' : ''}
            `}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => !file && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile) handleFileSelect(selectedFile);
                            }}
                        />

                        {!file ? (
                            <>
                                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm font-medium mb-1">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    CSV file only
                                </p>
                            </>
                        ) : (
                            <>
                                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                                <p className="text-sm font-medium mb-1">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {preview.length} question{preview.length !== 1 ? 's' : ''} found
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setPreview([]);
                                        setErrors([]);
                                    }}
                                >
                                    Choose Different File
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-semibold mb-1">Validation Errors:</div>
                                <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {errors.join('\n')}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && errors.length === 0 && (
                        <Alert>
                            <AlertDescription>
                                <div className="font-semibold mb-2">
                                    ✓ Ready to import {preview.length} question{preview.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm space-y-1 max-h-48 overflow-y-auto">
                                    {preview.slice(0, 5).map((q, idx) => (
                                        <div key={q.id} className="py-1 border-b last:border-0">
                                            <span className="font-medium">{idx + 1}.</span> {q.question.substring(0, 60)}
                                            {q.question.length > 60 ? '...' : ''}
                                        </div>
                                    ))}
                                    {preview.length > 5 && (
                                        <div className="pt-1 text-muted-foreground">
                                            And {preview.length - 5} more...
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={preview.length === 0 || errors.length > 0}
                    >
                        Import {preview.length} Question{preview.length !== 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
