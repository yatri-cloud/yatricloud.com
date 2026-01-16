import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Linkedin, Calendar, Award, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { fetchCertifications } from "@/lib/google-sheets";

interface CertificationEntry {
  id: string;
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  photoUrl: string;
  additionalNotes?: string;
}

export const WallOfFame = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [filteredCertifications, setFilteredCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterExamCode, setFilterExamCode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCertifications();
  }, []);

  useEffect(() => {
    filterCertifications();
  }, [certifications, filterProvider, filterExamCode, searchQuery]);

  const loadCertifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCertifications();
      setCertifications(data);
    } catch (error) {
      console.error("Error loading certifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCertifications = () => {
    let filtered = [...certifications];

    // Filter by provider
    if (filterProvider !== "all") {
      filtered = filtered.filter((cert) => cert.certificationProvider === filterProvider);
    }

    // Filter by exam code
    if (filterExamCode !== "all") {
      filtered = filtered.filter((cert) => cert.examCode.toLowerCase() === filterExamCode.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cert) =>
          cert.fullName.toLowerCase().includes(query) ||
          cert.certificationName.toLowerCase().includes(query) ||
          cert.examCode.toLowerCase().includes(query)
      );
    }

    setFilteredCertifications(filtered);
  };

  // Get unique providers and exam codes for filters
  const uniqueProviders = Array.from(new Set(certifications.map((c) => c.certificationProvider)));
  const uniqueExamCodes = Array.from(new Set(certifications.map((c) => c.examCode))).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Wall of Fame...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search by name, certification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Provider Filter */}
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger>
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {uniqueProviders.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Exam Code Filter */}
          <Select value={filterExamCode} onValueChange={setFilterExamCode}>
            <SelectTrigger>
              <SelectValue placeholder="Yatri Stars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Yatri Stars</SelectItem>
              {uniqueExamCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredCertifications.length} of {certifications.length} certifications
        </div>
      </div>

      {/* Wall of Fame Grid */}
      {filteredCertifications.length === 0 ? (
        <div className="text-center py-24">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No certifications found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterProvider !== "all" || filterExamCode !== "all"
              ? "Try adjusting your filters"
              : "Be the first to submit your certification!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertifications.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
            >
              {/* Photo and Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img
                    src={cert.photoUrl || "https://via.placeholder.com/80"}
                    alt={cert.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{cert.fullName}</h3>
                  <a
                    href={cert.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* Certification Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium">{cert.certificationName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                    {cert.examCode}
                  </span>
                  <span className="px-2 py-1 bg-muted rounded-md text-xs">
                    {cert.certificationProvider.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(cert.certificationDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Additional Notes */}
              {cert.additionalNotes && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground italic">
                    "{cert.additionalNotes}"
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

