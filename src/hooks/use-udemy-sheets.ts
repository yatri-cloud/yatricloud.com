import { useState, useEffect } from "react";
import { fetchUdemyCourses, type UdemyCourse } from "@/lib/udemy-sheets";
import type { Course } from "@/data/courses";

interface UseUdemySheetsOptions {
  enabled?: boolean;
}

interface UseUdemySheetsReturn {
  courses: Course[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  creators: string[];
}

/**
 * Hook to fetch Udemy courses from Google Sheets
 */
export function useUdemySheets(options: UseUdemySheetsOptions = {}): UseUdemySheetsReturn {
  const { enabled = true } = options;
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const udemyCourses = await fetchUdemyCourses();
      
      // Transform UdemyCourse to Course format
      const transformedCourses: Course[] = udemyCourses.map((udemyCourse) => ({
        id: udemyCourse.id,
        title: udemyCourse.title,
        udemyUrl: udemyCourse.udemyUrl,
        thumbnail: udemyCourse.imageUrl || '', // Can be URL or base64 image
        creator: udemyCourse.creator,
        certification: udemyCourse.certification || 'General',
        category: udemyCourse.category || 'General',
        enrollments: 0, // Default value, can be updated later if needed
        rating: 0, // Default value, can be updated later if needed
      }));

      setCourses(transformedCourses);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch courses');
      setError(error);
      console.error('Error fetching courses from Google Sheets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [enabled]);

  // Get unique creators
  const creators = Array.from(new Set(courses.map(c => c.creator))).sort();

  return {
    courses,
    isLoading,
    error,
    refetch: fetchCourses,
    creators,
  };
}

