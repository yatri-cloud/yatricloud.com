import { motion } from "framer-motion";
import { ExternalLink, Users, Star } from "lucide-react";
import type { Course } from "@/data/courses";

interface CourseCardProps {
  course: Course;
  index: number;
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm transition-shadow duration-500 hover:shadow-lg hover:border-primary/20"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <motion.img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover"
          loading="lazy"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        
        {/* Free badge */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/25"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          Free Course
        </motion.div>
        
        {/* Platform badge */}
        <div className="absolute top-4 right-4 rounded-full bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm border border-border/50">
          Udemy
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col p-6">
        {/* Category tag */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/8 border border-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {course.certification}
          </span>
          <span className="text-xs text-text-muted">{course.category}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground leading-snug mb-4 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {course.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-5 text-sm text-text-secondary mt-auto">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="font-medium">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-text-muted" />
            <span>{course.enrollments.toLocaleString()}</span>
          </div>
        </div>

        {/* CTA */}
        <motion.a
          href={course.udemyUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          Enroll Now – It's Free
          <ExternalLink className="h-4 w-4" />
        </motion.a>
      </div>
    </motion.article>
  );
};
