import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Search, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchExamDumps, deleteExamDump, ExamDump } from "@/lib/exam-dumps";
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam dump?")) return;
    
    try {
      await deleteExamDump(id);
      toast.success("Exam dump deleted successfully");
      loadDumps(); // Refresh list
    } catch (error) {
      console.error("Error deleting dump:", error);
      toast.error("Failed to delete exam dump");
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header band — distinct blue-tinted workspace panel */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-1.5"
            >
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Manage Exam Dumps</h1>
              <p className="text-muted-foreground">Add, edit, and organize your certification exam dumps.</p>
            </motion.div>

            <Button
              onClick={() => navigate("/admin/exam-dumps/add")}
              className="w-fit min-h-[44px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Dump
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dumps by title or provider..."
            className="pl-10 min-h-[44px] rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading exam dumps...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDumps.map((dump) => (
              <Card
                key={dump.id}
                className="overflow-hidden border border-border rounded-2xl bg-card hover:border-brand-200 hover:shadow-card transition"
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <img src={dump.image} alt={`${dump.title} cover`} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold truncate">{dump.title}</h3>
                        <Badge className="rounded-full bg-primary/10 text-primary text-xs font-medium border-transparent hover:bg-primary/10">{dump.provider}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Price: <span className="tabular-nums text-foreground">₹{dump.price}</span></span>
                        <span className="line-through">Original: <span className="tabular-nums">₹{dump.originalPrice}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-brand-50 hover:text-primary"
                        aria-label={`Edit ${dump.title}`}
                        onClick={() => navigate(`/admin/exam-dumps/edit/${dump.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={`Delete ${dump.title}`}
                        onClick={() => handleDelete(dump.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDumps.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 border border-border rounded-2xl bg-card">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">No exam dumps yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {searchTerm ? "No dumps match your search. Try a different title or provider." : "Add your first certification exam dump to get started."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate("/admin/exam-dumps/add")}
                    className="mt-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add New Dump
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExamDumps;
