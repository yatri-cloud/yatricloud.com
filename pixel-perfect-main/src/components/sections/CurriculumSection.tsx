import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, User, Award, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollReveal from "@/components/ScrollReveal";

const courses = [
  {
    id: 1,
    title: "AWS Certified DevOps Engineer - Professional Exam Prep",
    instructor: "Nensi Ravaliya",
    certification: "AWS",
    category: "Common",
    platform: "Udemy",
  },
  {
    id: 2,
    title: "AWS Solutions Architect Associate SAA-C03: Practice Test",
    instructor: "Nensi Ravaliya",
    certification: "AWS",
    category: "Cloud Computing",
    platform: "Udemy",
  },
  {
    id: 3,
    title: "AWS Certified CloudOps Engineer - Associate Exam Preparation",
    instructor: "Yatharth Chauhan",
    certification: "AWS",
    category: "Cloud Computing",
    platform: "Udemy",
  },
  {
    id: 4,
    title: "AWS Certified AI Practitioner AIF-C01: Exam Preparation",
    instructor: "Yatharth Chauhan",
    certification: "AWS",
    category: "Common",
    platform: "Udemy",
  },
  {
    id: 5,
    title: "AWS Certified Cloud Practitioner - Real Exam Questions",
    instructor: "Yatharth Chauhan",
    certification: "AWS",
    category: "Cloud Computing",
    platform: "Udemy",
  },
  {
    id: 6,
    title: "AZ-400 Azure DevOps Engineer Expert Exam Prep",
    instructor: "Nensi Ravaliya",
    certification: "Azure",
    category: "Common",
    platform: "Udemy",
  },
  {
    id: 7,
    title: "AWS GenAI Developer Professional Certificate | Practice Exam",
    instructor: "Yatharth Chauhan",
    certification: "AWS",
    category: "Common",
    platform: "Udemy",
  },
];

export const CurriculumSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("All");
  const [selectedCertification, setSelectedCertification] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const instructors = ["All", "Nensi Ravaliya", "Yatharth Chauhan"];
  const certifications = ["All", "AWS", "Azure"];
  const categories = ["All", "Common", "Cloud Computing"];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstructor = selectedInstructor === "All" || course.instructor === selectedInstructor;
    const matchesCertification = selectedCertification === "All" || course.certification === selectedCertification;
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    
    return matchesSearch && matchesInstructor && matchesCertification && matchesCategory;
  });

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
              {filteredCourses.length} courses available
            </p>
          </div>
        </ScrollReveal>

        {/* Search and Filters */}
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instructor Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Instructor
                </label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {instructors.map((instructor) => (
                    <option key={instructor} value={instructor}>
                      {instructor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certifications
                </label>
                <select
                  value={selectedCertification}
                  onChange={(e) => setSelectedCertification(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {certifications.map((cert) => (
                    <option key={cert} value={cert}>
                      {cert}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categories
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredCourses.map((course, index) => (
            <ScrollReveal key={course.id} delay={index * 0.1}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/50 transition-all duration-300 flex flex-col"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                      {course.certification}
                    </span>
                    <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">
                      {course.category}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{course.platform}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3 flex-1">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>by {course.instructor}</span>
                </div>
                
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                  size="sm"
                >
                  Enroll Now
                  <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
