import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Trash,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";

import { fetchLeads, updateLeadStatus, deleteLead, CRMLead } from "@/lib/crm-leads";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminLeads() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const data = await fetchLeads();
      setLeads(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: CRMLead['status']) => {
    try {
      // Optimistic update
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, status: newStatus } : lead
      ));
      
      await updateLeadStatus(id, newStatus);
      toast.success("Status updated");
    } catch (error: any) {
      // Revert on error
      loadLeads();
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteLead(leadToDelete);
      setLeads(leads.filter(lead => lead.id !== leadToDelete));
      toast.success("Lead deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: CRMLead['status']) => {
    switch (status) {
      case 'New': return 'default';
      case 'Contacted': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Closed': return 'default';
      case 'Lost': return 'destructive';
      default: return 'outline';
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Leads CRM</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or contact..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No leads found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery || statusFilter !== "All" 
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "When users submit the /leads form, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Lead Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                      <br />
                      {format(new Date(lead.created_at), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      {lead.linkedin_profile && (
                        <a 
                          href={lead.linkedin_profile} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          LinkedIn <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.contact}</div>
                      {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] text-sm text-muted-foreground line-clamp-2" title={lead.notes || ""}>
                        {lead.notes || <span className="italic text-muted-foreground/50">No notes</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={lead.status} 
                        onValueChange={(value: any) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent hover:bg-muted/50 focus:ring-0 px-2 shadow-none">
                          <SelectValue>
                            <Badge variant={getStatusBadgeVariant(lead.status)} className="font-normal">
                              {lead.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full p-0 bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                        onClick={() => setLeadToDelete(lead.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
