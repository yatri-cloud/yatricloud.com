
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, BookOpen, Clock, User, Star, MapPin, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Course {
    id: string;
    courseName: string;
    description: string;
    instructor: string;
    level: string;
    duration: string;
    paymentType: "Free" | "Paid";
    price: string;
    thumbnailUrl: string;
    subType: string;
    mode: "Online" | "On-site";
}

export default function Training() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCertification, setFilterCertification] = useState("All");

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        let result = courses;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.courseName.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q)
            );
        }

        if (filterCertification && filterCertification !== "All") {
            result = result.filter(c => c.subType === filterCertification);
        }

        setFilteredCourses(result);
    }, [courses, searchQuery, filterCertification]);

    const fetchCourses = async () => {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getTrainingStructure' })
            });
            const result = await response.json();
            if (result.success) {
                setCourses(result.structure);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const certifications = ["All", ...Array.from(new Set(courses.map(c => c.subType)))];

    const createSlug = (name: string) => {
        return String(name || '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/-+/g, '-') // remove duplicate hyphens
            .trim();
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            {/* Hero Section */}
            <div className="relative bg-[#0f1115] text-white py-32 overflow-hidden border-b border-white/5">
                {/* Modern Gradient Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0f1115] to-[#0f1115]"></div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                <div className="container relative z-10 px-4 mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 tracking-tight leading-[1.1]">
                            Master Cloud Skills.
                            <br />
                            <span className="text-indigo-400">Build Your Future.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400/80 max-w-2xl mx-auto leading-relaxed">
                            Comprehensive library of cloud certifications, role-based training, and hands-on workshops designed for modern engineering teams.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto flex gap-2 relative">
                        <div className="relative flex-1 group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
                            <div className="relative flex items-center bg-[#0f1115] rounded-lg border border-white/10 overflow-hidden">
                                <Search className="absolute left-4 text-gray-500 w-5 h-5 pointer-events-none" />
                                <Input
                                    placeholder="Search for certifications, skills, or instructors..."
                                    className="pl-12 h-14 bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 text-lg"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12 flex-1">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center mb-8 pb-4 border-b">
                    <div className="flex items-center gap-2 text-muted-foreground mr-auto">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Certifications:</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        {certifications.map(cert => (
                            <Button
                                key={cert}
                                variant={filterCertification === cert ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterCertification(cert)}
                                className="rounded-full"
                            >
                                {cert}
                            </Button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 rounded-xl bg-muted animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No courses found matching your criteria.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(""); setFilterCertification("All"); }}>Clear Filters</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map(course => (
                            <Link to={`/training/${createSlug(course.subType)}/${createSlug(course.courseName)}`} key={course.id} className="group">
                                <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden flex flex-col group-hover:-translate-y-1">
                                    <div className="relative aspect-video bg-muted overflow-hidden">
                                        {course.thumbnailUrl ? (
                                            <img src={course.thumbnailUrl} alt={course.courseName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                                                <BookOpen className="w-12 h-12 text-indigo-500/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex gap-2">
                                            {course.mode === "On-site" && (
                                                <Badge className="bg-amber-500/90 hover:bg-amber-600 text-white border-none shadow-sm">
                                                    On-site
                                                </Badge>
                                            )}
                                            {course.paymentType === "Free" && (
                                                <Badge className="bg-emerald-500/90 hover:bg-emerald-600 text-white border-none shadow-sm">
                                                    Free
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <CardContent className="p-4 flex-1 flex flex-col gap-2">
                                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> {course.subType}
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                            {course.courseName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-auto">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {course.instructor || "Yatri Team"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {course.duration}
                                            </span>
                                            <span className="flex items-center gap-1 ml-auto text-amber-500 font-medium">
                                                <Star className="w-3 h-3 fill-current" /> 4.8
                                            </span>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-4 bg-muted/20 flex items-center justify-between border-t">
                                        <div className="font-bold text-lg">
                                            {course.paymentType === "Paid" ? (
                                                <span className="text-primary">{course.price}</span>
                                            ) : (
                                                <span className="text-emerald-600">Free</span>
                                            )}
                                        </div>
                                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground group-hover:shadow-lg transition-all">
                                            Details <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
