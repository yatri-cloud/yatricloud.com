import { describe, it, expect } from "vitest";
import { canonLessonType } from "@/lib/training-api";

// Locks in the lesson content-type normalization. The coarse (TrainingManager)
// and granular (TrainerCourseEditor) editors write the same field; both must
// canonicalize to Title-case so the coarse form's <select> round-trips.
describe("canonLessonType", () => {
  it("Title-cases the known types regardless of input casing", () => {
    expect(canonLessonType("video")).toBe("Video");
    expect(canonLessonType("Video")).toBe("Video");
    expect(canonLessonType("READING")).toBe("Reading");
    expect(canonLessonType("assignment")).toBe("Assignment");
    expect(canonLessonType("quiz")).toBe("Quiz");
  });

  it("defaults to Video for empty/undefined", () => {
    expect(canonLessonType(undefined)).toBe("Video");
    expect(canonLessonType("")).toBe("Video");
  });

  it("Title-cases an unknown type instead of dropping it", () => {
    expect(canonLessonType("webinar")).toBe("Webinar");
  });
});
