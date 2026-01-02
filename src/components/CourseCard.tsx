import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Course } from "@/data/courses";

/**
 * Check if a course is in draft mode
 */
function isDraftCourse(course: Course): boolean {
  return course.title.toLowerCase().includes('draft');
}

/**
 * Get fallback image URL from course URL
 * Uses proxy server to avoid Access Denied errors
 */
function getFallbackImageUrl(courseUrl: string): string {
  if (!courseUrl) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
  }
  
  // Extract course slug from full URL
  const urlMatch = courseUrl.match(/\/course\/([^\/\?]+)/);
  if (urlMatch && urlMatch[1]) {
    const courseSlug = urlMatch[1].trim();
    // Use proxy server to fetch image (avoids Access Denied)
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
    return `${proxyUrl}/api/udemy/image/${courseSlug}`;
  }
  
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
}

interface CourseCardProps {
  course: Course;
  index: number;
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
      }}
      className="group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {isDraftCourse(course) ? (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">Coming Soon</div>
              <div className="text-sm text-muted-foreground">This course is being prepared</div>
            </div>
          </div>
        ) : (
          <motion.img
            src={course.thumbnail || getFallbackImageUrl(course.udemyUrl)}
            alt={course.title}
            className="h-full w-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const currentSrc = target.src;
              
              if (currentSrc.includes('/api/udemy/image/')) {
                const slugMatch = currentSrc.match(/\/api\/udemy\/image\/([^\/]+)/);
                if (slugMatch && slugMatch[1]) {
                  target.src = `https://img-c.udemycdn.com/course/480x270/${slugMatch[1]}/`;
                  return;
                }
              }
              
              target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
            }}
          />
        )}
        
        {/* Platform badge */}
        <div className="absolute top-3 right-3 rounded-md bg-background/95 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground border border-border/50">
          Udemy
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Instructor name */}
        {course.creator && (
          <p className="text-sm text-text-muted mb-4">
            by <span className="font-medium text-text-secondary">{course.creator}</span>
          </p>
        )}

        {/* Category/Certification tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {course.certification && course.certification !== 'General' && (
            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
              {course.certification}
            </span>
          )}
          {course.category && course.category !== 'General' && (
            <span className="inline-flex items-center rounded-md bg-muted text-text-secondary px-2.5 py-1 text-xs font-medium">
              {course.category}
            </span>
          )}
        </div>

        {/* CTA */}
        {isDraftCourse(course) ? (
          <div className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed">
            <span>Coming Soon</span>
          </div>
        ) : (
          <motion.a
            href={course.udemyUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <span className="relative z-10">Enroll Now</span>
            <ExternalLink className="relative z-10 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
          </motion.a>
        )}
      </div>
    </motion.article>
  );
};
