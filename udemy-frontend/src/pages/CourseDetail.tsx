import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Clock, Users, Award } from "lucide-react";

const CourseDetail = () => {
  const { id } = useParams();

  // Sample course detail - replace with API later
  const course = {
    id,
    title: "AWS Solutions Architect Associate",
    description: "Master AWS architecture patterns and best practices for designing scalable, reliable, and cost-effective applications.",
    instructor: "Expert Instructor",
    category: "Cloud",
    tech: "AWS",
    price: 99,
    rating: 4.8,
    students: 1250,
    duration: "40 hours",
    image: "https://via.placeholder.com/800x400",
    features: [
      "Comprehensive AWS certification training",
      "Real-world architecture patterns",
      "Hands-on projects",
      "Lifetime access",
      "Certificate of completion",
      "24/7 support",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Course Info */}
          <div className="md:col-span-2">
            {course.image && (
              <img
                src={course.image}
                alt={course.title}
                className="mb-6 w-full rounded-lg"
              />
            )}
            <h1 className="mb-4 text-4xl font-bold">{course.title}</h1>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {course.category}
              </span>

              <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                {course.tech}
              </span>
            </div>

            {/* Course Meta */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{course.rating}</span>
                <span className="text-muted-foreground">({course.students} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span>{course.students} students</span>
              </div>
            </div>

            <div className="mb-6 text-lg text-muted-foreground">
              by {course.instructor}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Course Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
              <ul className="space-y-3">
                {course.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="rounded-lg border border-border bg-card p-6 sticky top-4">
              <div className="mb-6">
                <div className="text-4xl font-bold">${course.price}</div>
                <p className="text-muted-foreground">One-time payment</p>
              </div>

              <Button className="w-full mb-4" size="lg" asChild>
                <Link to="/dashboard">
                  View Dashboard
                </Link>
              </Button>

              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <h3 className="font-semibold mb-3">Includes:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> All video lessons
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Hands-on projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Lifetime access
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Certificate
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
