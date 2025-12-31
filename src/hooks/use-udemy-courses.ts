import { useState, useEffect } from 'react';
import { fetchAllUdemyCourses, fetchUdemyCourses, transformUdemyCourse, type TransformedCourse } from '@/lib/udemy-api';
import type { Course } from '@/data/courses';

interface UseUdemyCoursesOptions {
  search?: string;
  category?: string;
  creator?: string;
  enabled?: boolean;
}

interface UseUdemyCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  error: Error | null;
  creators: string[];
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch and manage Udemy courses
 */
export function useUdemyCourses(options: UseUdemyCoursesOptions = {}): UseUdemyCoursesReturn {
  const { search, category, creator, enabled = true } = options;
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [creators, setCreators] = useState<string[]>([]);

  const fetchCourses = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const udemyCourses = await fetchAllUdemyCourses(search, category, creator);
      
      // Transform to match Course interface
      const transformedCourses: Course[] = udemyCourses.map((course) => ({
        id: course.id,
        title: course.title,
        category: course.category,
        certification: course.certification,
        creator: course.creator,
        enrollments: course.enrollments,
        rating: course.rating,
        udemyUrl: course.udemyUrl,
        thumbnail: course.thumbnail,
        headline: course.headline,
        price: course.price,
        isPaid: course.isPaid,
      }));

      // Extract unique creators
      const uniqueCreators = Array.from(new Set(transformedCourses.map(c => c.creator).filter(Boolean))).sort();

      setCourses(transformedCourses);
      setCreators(uniqueCreators);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch courses');
      setError(error);
      console.error('Error in useUdemyCourses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, category, creator, enabled]);

  return {
    courses,
    isLoading,
    error,
    creators,
    refetch: fetchCourses,
  };
}

