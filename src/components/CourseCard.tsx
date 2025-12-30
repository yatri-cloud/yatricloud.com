import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Course } from "@/data/courses";

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
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Free badge */}
        <div className="absolute top-3 left-3 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          FREE
        </div>
        {/* Platform badge */}
        <div className="absolute top-3 right-3 rounded-md bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          Udemy
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category tag */}
        <div className="mb-3">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {course.certification}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground leading-snug mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-text-muted mt-auto pt-3 border-t border-border/50">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {course.rating}
          </span>
          <span>{course.enrollments.toLocaleString()} enrolled</span>
        </div>

        {/* CTA */}
        <a
          href={course.udemyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
        >
          Enroll on Udemy
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.article>
  );
};
