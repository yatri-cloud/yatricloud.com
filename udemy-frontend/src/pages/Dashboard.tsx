import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { userAPI } from "@/lib/api";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: () => userAPI.getEnrolledCourses(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userAPI.getProfile(),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="mb-12 rounded-lg border border-border bg-card p-6">
          <h1 className="mb-2 text-2xl font-bold">Welcome, {profile?.data?.name}!</h1>
          <p className="text-muted-foreground">{profile?.data?.email}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/edit-profile">Edit Profile</Link>
          </Button>
        </div>

        {/* Enrolled Courses */}
        <h2 className="mb-6 text-2xl font-bold">Your Courses</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses?.data?.map((course: any) => (
              <div
                key={course.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                {course.image && (
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold">{course.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {course.progress}% Complete
                  </p>
                  <div className="mt-4 h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <Button className="mt-4 w-full" asChild>
                    <Link to={`/course/${course.id}`}>Continue Learning</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && enrolledCourses?.data?.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">No courses enrolled yet</p>
            <Button asChild>
              <Link to="/courses">Explore Courses</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
