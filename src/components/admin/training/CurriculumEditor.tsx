import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LESSON_TYPES, type TrainingForm } from "./training-form";

/**
 * Modules + lessons editor for the course builder's Curriculum tab. Uses
 * react-hook-form field arrays; the hidden moduleId/lessonId inputs carry DB
 * ids so a save updates rows in place (preserving student progress) — see
 * saveCurriculum. Extracted from TrainingManager for maintainability; behaviour
 * and data-testids unchanged.
 */
export function CurriculumEditor({ control, register }: { control: Control<TrainingForm>, register: any }) {
    const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
        control,
        name: "curriculum"
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <h3 className="font-display text-lg font-semibold">Modules & Lessons</h3>
                <Button type="button" data-testid="builder-add-module" size="sm" onClick={() => appendModule({ title: "New Module", lessons: [] })} variant="secondary" className="min-h-[44px] rounded-xl">
                    Add Module
                </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {moduleFields.length === 0 && <p className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">No modules yet. Add one or Import from Markdown.</p>}

                {moduleFields.map((field, index) => (
                    <ModuleItem key={field.id} control={control} register={register} moduleIndex={index} removeModule={removeModule} />
                ))}
            </div>
        </div>
    );
}

function ModuleItem({ control, register, moduleIndex, removeModule }: { control: Control<TrainingForm>, register: any, moduleIndex: number, removeModule: (index: number) => void }) {
    const { fields: lessonFields, append: appendLesson, remove: removeLesson } = useFieldArray({
        control,
        name: `curriculum.${moduleIndex}.lessons`
    });

    return (
        <div className="border border-border rounded-xl p-4 bg-card transition-shadow hover:shadow-card">
            {/* Keeps the module's DB id in form state so saving updates it in place. */}
            <input type="hidden" {...register(`curriculum.${moduleIndex}.moduleId` as const)} />
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="h-8 w-8 flex items-center justify-center rounded-full bg-brand-50 border-primary font-bold tabular-nums">
                    {moduleIndex + 1}
                </Badge>
                <div className="flex-1">
                    <Input
                        {...register(`curriculum.${moduleIndex}.title` as const)}
                        data-testid={`module-${moduleIndex}-title`}
                        placeholder="Module Title (e.g. Introduction to AI)"
                        className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0 h-auto rounded-none border-b focus-visible:border-primary"
                    />
                </div>
                <Button type="button" data-testid={`module-${moduleIndex}-remove`} variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    Remove
                </Button>
            </div>

            <div className="ml-10 space-y-2">
                {lessonFields.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="rounded-lg border border-border/70 bg-background/50 p-2 space-y-2">
                        {/* Keeps the lesson's DB id so saving updates it in place, preserving progress + its content url/description. */}
                        <input type="hidden" {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.lessonId` as const)} />
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.title`)} data-testid={`module-${moduleIndex}-lesson-${lessonIndex}-title`} placeholder="Lesson Title" className="h-8 text-sm" />
                            </div>
                            <div className="col-span-3">
                                <select {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.type`)} data-testid={`module-${moduleIndex}-lesson-${lessonIndex}-type`} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                    {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.duration`)} data-testid={`module-${moduleIndex}-lesson-${lessonIndex}-duration`} placeholder="Dur." className="h-8 text-sm" />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeLesson(lessonIndex)} className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                                    Remove
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.url`)} data-testid={`module-${moduleIndex}-lesson-${lessonIndex}-url`} placeholder="Content URL (Vimeo / YouTube / Drive)" className="h-8 text-sm" />
                            </div>
                            <div className="col-span-7">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.description`)} data-testid={`module-${moduleIndex}-lesson-${lessonIndex}-desc`} placeholder="Short description (optional)" className="h-8 text-sm" />
                            </div>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <Button type="button" data-testid={`module-${moduleIndex}-add-lesson`} variant="ghost" size="sm" onClick={() => appendLesson({ title: "", type: "Video", duration: "", url: "", description: "" })} className="text-primary hover:text-primary/80 hover:bg-primary/5">
                        Add Lesson
                    </Button>
                </div>
            </div>
        </div>
    );
}
