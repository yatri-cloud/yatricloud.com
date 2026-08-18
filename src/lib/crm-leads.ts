import { supabase } from "./supabase";

export interface CRMLead {
    id: string;
    name: string;
    contact: string;
    email: string | null;
    linkedin_profile: string | null;
    notes: string | null;
    status: 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Lost';
    created_at: string;
    updated_at: string;
}

export type CRMLeadInsert = Omit<CRMLead, 'id' | 'created_at' | 'updated_at' | 'status'>;

/**
 * Submit a new lead from the public form
 */
export async function submitLead(lead: CRMLeadInsert) {
    const { error } = await supabase
        .from('crm_leads')
        .insert([lead]);
    
    if (error) {
        console.error('Error submitting lead:', error);
        throw new Error(error.message);
    }
    
    return true;
}

/**
 * Fetch all leads for the admin dashboard
 */
export async function fetchLeads() {
    const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching leads:', error);
        throw new Error(error.message);
    }
    
    return data as CRMLead[];
}

/**
 * Update the status of a lead
 */
export async function updateLeadStatus(id: string, status: CRMLead['status']) {
    const { data, error } = await supabase
        .from('crm_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating lead status:', error);
        throw new Error(error.message);
    }
    
    return data as CRMLead;
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string) {
    const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);
        
    if (error) {
        console.error('Error deleting lead:', error);
        throw new Error(error.message);
    }
}
