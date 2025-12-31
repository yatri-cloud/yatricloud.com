import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Course } from "@/data/courses";

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
        <motion.a
          href={course.udemyUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Enroll Now
          <ExternalLink className="h-4 w-4" />
        </motion.a>
      </div>
    </motion.article>
  );
};
