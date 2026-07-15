/**
 * Shared types + constants for the course builder (TrainingManager and its
 * extracted tab panels + curriculum editor). Kept dependency-free so any of
 * those modules can import from here without a cycle.
 */

export interface Lesson {
    // Present for lessons loaded from an existing course; absent for ones added
    // here. Carried through a hidden field so the save can update the row in
    // place (keeping student progress) instead of recreating it.
    lessonId?: string;
    title: string;
    type: "Video" | "Reading" | "Assignment" | "Quiz";
    duration: string;
    // Rich per-lesson content (merged from the old granular editor). url is the
    // video/reading link students open; description is a short summary.
    url?: string;
    description?: string;
}

export interface Module {
    moduleId?: string;
    title: string;
    lessons: Lesson[];
}

export interface TrainingForm {
    type: string;
    subType: string; // Provider Name
    courseName: string; // Exam Name
    description?: string;
    instructor: string;
    level: string;
    duration: string;
    skills: string;
    outcomes: string;
    curriculum: Module[];
    // Advanced
    mode: "Online" | "On-site";
    meetLink?: string;
    venueName?: string;
    venueAddress?: string;
    venueMapLink?: string;
    capacityType: "Unlimited" | "Limited";
    capacityCount?: string;
    paymentType: string;
    price?: string;
    currency?: string;
    couponCode?: string;
    startDate?: Date;
    startTime?: string;
    certificationId?: string; // provider_certifications.id this course prepares you for
}

export interface ProviderData {
    name: string;
    slug?: string;
    exams: string[];
}

/** Quarter-hour time slots (00:00 … 23:45) for the session-time dropdown. */
export const TIME_SLOTS = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4).toString().padStart(2, "0");
    const minute = ((i % 4) * 15).toString().padStart(2, "0");
    return `${hour}:${minute}`;
});

export const TYPES = ["Certification", "Role-based"];
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Mixed"];
export const LESSON_TYPES = ["Video", "Reading", "Assignment", "Quiz"];
export const STEPS = ["Identity", "Details", "Logistics", "Curriculum", "Quiz", "Resources", "Review"];
