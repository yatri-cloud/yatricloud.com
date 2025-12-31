import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUdemyCourses } from "@/hooks/use-udemy-courses";
import { CourseCard } from "./CourseCard";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { testUdemyAPI } from "@/lib/udemy-api-debug";

/**
 * CoursesSection component that fetches courses from Udemy API
 * New clean UI design matching static layout
 */
export const CoursesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCreator, setActiveCreator] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch ALL courses from Udemy API (from all instructors) - no filters, fetch once
  const { courses, isLoading, error, refetch, creators } = useUdemyCourses({
    enabled: true,
  });

  // Debug: Log API test function to console
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('🔧 Debug: Run testUdemyAPI() in console to test API connection');
      (window as any).testUdemyAPI = testUdemyAPI;
    }
  }, []);

  // Dynamically generate available filters from actual courses
  const availableFilters = useMemo(() => {
    const certifications = new Set<string>();
    const categories = new Set<string>();
    
    courses.forEach((course) => {
      // Certifications: AWS, Azure, GCP, Terraform, Kubernetes, etc.
      if (course.certification && course.certification !== 'General') {
        certifications.add(course.certification);
      }
      // Categories: Cloud Computing, DevOps, AI, Containers, Infrastructure, Common, etc.
      if (course.category && course.category !== 'General') {
        categories.add(course.category);
      }
    });
    
    // Sort categories alphabetically
    const sortedCategories = Array.from(categories).sort((a, b) => {
      return a.localeCompare(b);
    });
    
    return {
      certifications: Array.from(certifications).sort(),
      categories: sortedCategories,
    };
  }, [courses]);

  // Client-side filtering for better UX (instant filtering)
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Filter by creator/instructor
      if (activeCreator !== "All") {
        if (course.creator !== activeCreator) {
          return false;
        }
      }

      // Filter by category/certification
      if (activeCategory === "All") {
        const matchesSearch = !searchQuery || searchQuery.trim() === "" || 
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (course.certification && course.certification.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      }
      
      // Check if filter matches certification or category
      const matchesCertification = course.certification === activeCategory;
      const matchesCategory = course.category === activeCategory;
      const matchesFilter = matchesCertification || matchesCategory;
      
      const matchesSearch = !searchQuery || searchQuery.trim() === "" || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.certification && course.certification.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });
  }, [courses, activeCategory, activeCreator, searchQuery]);

  return (
    <section id="courses" className="py-20 md:py-28 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Practice Tests
          </h2>
          <p className="text-lg text-text-secondary mb-4">
            Certification Courses
          </p>
          <p className="text-sm text-text-muted">
            {isLoading ? "Loading..." : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12 space-y-6">
          {/* Instructor Filter */}
          {creators && creators.length > 0 && (
            <div>
              <div className="text-sm font-medium text-foreground mb-3">
                Instructor
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCreator("All");
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeCreator === "All"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-text-secondary hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {creators.map((creator) => (
                  <button
                    key={creator}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveCreator(creator);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeCreator === creator
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-text-secondary hover:bg-muted/80"
                    }`}
                  >
                    {creator}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Filter */}
          {availableFilters.certifications.length > 0 && (
            <div>
              <div className="text-sm font-medium text-foreground mb-3">
                Certifications
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCategory("All");
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeCategory === "All"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-text-secondary hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {availableFilters.certifications.map((cert) => (
                  <button
                    key={cert}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveCategory(cert);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeCategory === cert
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-text-secondary hover:bg-muted/80"
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Filter */}
          {availableFilters.categories.length > 0 && (
            <div>
              <div className="text-sm font-medium text-foreground mb-3">
                Categories
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCategory("All");
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeCategory === "All"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-text-secondary hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {availableFilters.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveCategory(category);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-text-secondary hover:bg-muted/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-12 rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Courses</h3>
            <p className="text-text-secondary text-sm mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-text-secondary text-lg">Loading courses from Udemy...</p>
          </div>
        )}

        {/* Course grid */}
        {!isLoading && !error && (
          <AnimatePresence mode="wait">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <div className="text-center py-24">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-9 w-9 text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No results found</h3>
            <p className="text-text-muted text-base">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
};
