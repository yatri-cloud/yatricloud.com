import { useState } from "react";
import { motion } from "framer-motion";
import { courses, categories } from "@/data/courses";
import { CourseCard } from "./CourseCard";

export const CoursesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCourses =
    activeCategory === "All"
      ? courses
      : courses.filter((course) => course.certification === activeCategory);

  return (
    <section id="courses" className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Free Udemy Practice Tests
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Prepare confidently for your certification exams with our carefully curated practice tests.
          </p>
        </motion.div>

        {/* Filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Course grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>

        {/* Empty state */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No courses found for this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};
