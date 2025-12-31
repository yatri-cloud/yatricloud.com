import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, User, Award, Tag, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollReveal from "@/components/ScrollReveal";
import { useUdemyCourses } from "@/hooks/use-udemy-courses";
import type { Course } from "@/data/courses";

/**
 * Get fallback image URL from course URL
 * Uses proxy server to avoid Access Denied errors
 */
function getFallbackImageUrl(courseUrl: string): string {
  if (!courseUrl) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
  }
  
  const urlMatch = courseUrl.match(/\/course\/([^\/\?]+)/);
  if (urlMatch && urlMatch[1]) {
    const courseSlug = urlMatch[1].trim();
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
    return `${proxyUrl}/api/udemy/image/${courseSlug}`;
  }
  
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
}

export const CurriculumSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("All");
  const [selectedCertification, setSelectedCertification] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch courses from Udemy API
  const { courses, isLoading, error, refetch, creators } = useUdemyCourses({
    enabled: true,
  });

  // Dynamically generate filters from actual courses
  const availableFilters = useMemo(() => {
    const certifications = new Set<string>();
    const categories = new Set<string>();
    
    courses.forEach((course) => {
      if (course.certification && course.certification !== 'General') {
        certifications.add(course.certification);
      }
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

  // Client-side filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = !searchQuery || searchQuery.trim() === "" || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.certification && course.certification.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesInstructor = selectedInstructor === "All" || course.creator === selectedInstructor;
    const matchesCertification = selectedCertification === "All" || course.certification === selectedCertification;
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    
    return matchesSearch && matchesInstructor && matchesCertification && matchesCategory;
  });
  }, [courses, searchQuery, selectedInstructor, selectedCertification, selectedCategory]);

  return (
    <section id="courses" className="py-24 relative">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Practice Tests
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Certification <span className="gradient-text">Courses</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {isLoading ? "Loading..." : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
        </ScrollReveal>

        {/* Error state */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Courses</h3>
            <p className="text-text-secondary text-sm mb-4">{error.message}</p>
            <Button
              onClick={() => refetch()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        {!error && (
        <ScrollReveal delay={0.1}>
          <div className="max-w-4xl mx-auto mb-8 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            {/* Filters - Modern UI with icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instructor Filter */}
                {creators && creators.length > 0 && (
              <div className="group">
                <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Instructor</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    className="w-full bg-gradient-to-br from-card to-card/95 border-2 border-border/60 rounded-xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50"
                  >
                      <option value="All">All Instructors</option>
                      {creators.map((instructor) => (
                    <option key={instructor} value={instructor}>
                      {instructor}
                    </option>
                  ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
                )}

              {/* Certification Filter */}
                {availableFilters.certifications.length > 0 && (
              <div className="group">
                <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <span>Certifications</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCertification}
                    onChange={(e) => setSelectedCertification(e.target.value)}
                    className="w-full bg-gradient-to-br from-card to-card/95 border-2 border-border/60 rounded-xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50"
                  >
                      <option value="All">All Certifications</option>
                      {availableFilters.certifications.map((cert) => (
                    <option key={cert} value={cert}>
                      {cert}
                    </option>
                  ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
                )}

              {/* Category Filter */}
                {availableFilters.categories.length > 0 && (
              <div className="group">
                <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span>Categories</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-gradient-to-br from-card to-card/95 border-2 border-border/60 rounded-xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50"
                  >
                      <option value="All">All Categories</option>
                      {availableFilters.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-lg">Loading courses from Udemy...</p>
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && !error && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredCourses.map((course, index) => (
            <ScrollReveal key={course.id} delay={index * 0.1}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/50 transition-all duration-300 flex flex-col"
                whileHover={{ y: -5 }}
              >
                  {/* Course Image */}
                  {course.thumbnail && (
                    <div className="relative aspect-video overflow-hidden rounded-lg mb-4 bg-muted">
                      <img
                        src={course.thumbnail || getFallbackImageUrl(course.udemyUrl)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getFallbackImageUrl(course.udemyUrl);
                        }}
                      />
                    </div>
                  )}

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {course.certification && course.certification !== 'General' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                      {course.certification}
                    </span>
                      )}
                      {course.category && course.category !== 'General' && (
                    <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">
                      {course.category}
                    </span>
                      )}
                  </div>
                    <span className="text-xs text-muted-foreground">Udemy</span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3 flex-1">
                  {course.title}
                </h3>
                
                  {course.creator && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span>by {course.creator}</span>
                </div>
                  )}
                
                <motion.a
                  href={course.udemyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <span className="relative z-10">Enroll Now</span>
                  <ExternalLink className="relative z-10 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
                </motion.a>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <div className="text-center py-24">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-9 w-9 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No results found</h3>
            <p className="text-muted-foreground text-base">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CurriculumSection;
