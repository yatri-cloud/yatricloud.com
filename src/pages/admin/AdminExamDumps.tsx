import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Search, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchExamDumps, ExamDump } from "@/lib/exam-dumps";
import { toast } from "sonner";

const AdminExamDumps = () => {
  const navigate = useNavigate();
  const [dumps, setDumps] = useState<ExamDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDumps();
  }, []);

  const loadDumps = async () => {
    try {
      setIsLoading(true);
      const data = await fetchExamDumps();
      setDumps(data);
    } catch (error) {
      console.error("Error loading dumps:", error);
      toast.error("Failed to load exam dumps");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDumps = dumps.filter(dump =>
    dump.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dump.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold">Manage Exam Dumps</h1>
          <p className="text-muted-foreground">Add and manage certification exam dumps</p>
        </motion.div>
        
        <Button onClick={() => navigate("/admin/exam-dumps/add")} className="w-fit">
          <Plus className="mr-2 h-4 w-4" /> Add New Dump
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dumps by title or provider..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p>Loading exam dumps...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDumps.map((dump) => (
            <Card key={dump.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img src={dump.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{dump.title}</h3>
                      <Badge variant="secondary">{dump.provider}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Price: ₹{dump.price}</span>
                      <span>Original: ₹{dump.originalPrice}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Placeholder for edit/delete functionality if implemented in backend */}
                    <Button variant="ghost" size="icon" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDumps.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No exam dumps found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminExamDumps;
