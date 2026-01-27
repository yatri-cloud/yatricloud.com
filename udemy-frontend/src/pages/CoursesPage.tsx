import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Star, Clock, Users } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  tech: string;
  instructor: string;
  price: number;
  image?: string;
  rating?: number;
  students?: number;
  duration?: string;
}

// Sample courses data - replace with API call later
const SAMPLE_COURSES: Course[] = [
  {
    id: "1",
    title: "AWS Solutions Architect Associate",
    description: "Master AWS architecture patterns and best practices",
    category: "Cloud",
    tech: "AWS",
    instructor: "Expert Instructor",
    price: 99,
    rating: 4.8,
    students: 1250,
    duration: "40 hours",
  },
  {
    id: "2",
    title: "Azure Fundamentals AZ-900",
    description: "Learn Azure cloud services and deployment models",
    category: "Cloud",
    tech: "Azure",
    instructor: "Expert Instructor",
    price: 79,
    rating: 4.7,
    students: 980,
    duration: "25 hours",
  },
  {
    id: "3",
    title: "Google Cloud Essentials",
    description: "Understanding Google Cloud Platform services",
    category: "Cloud",
    tech: "Google Cloud",
    instructor: "Expert Instructor",
    price: 89,
    rating: 4.6,
    students: 750,
    duration: "35 hours",
  },
];

const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTech, setSelectedTech] = useState("");

  const filteredCourses = SAMPLE_COURSES.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesTech = !selectedTech || course.tech === selectedTech;
    return matchesSearch && matchesCategory && matchesTech;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8">

          <h1 className="mb-6 text-3xl font-bold">Explore Courses</h1>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="cloud">Cloud</option>
              <option value="devops">DevOps</option>
              <option value="ai">AI</option>
              <option value="data">Data</option>
              <option value="security">Security</option>
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
            >
              <option value="">All Technologies</option>
              <option value="AWS">AWS</option>
              <option value="Azure">Azure</option>
              <option value="Google Cloud">Google Cloud</option>
              <option value="GitHub">GitHub</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg"
            >
              {course.image && (
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {course.instructor}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.description}
                </p>

                {/* Course Meta */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {course.students} students
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {course.category}
                  </span>
                  <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary">
                    {course.tech}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-lg font-bold">
                    ${course.price}
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/course/${course.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
