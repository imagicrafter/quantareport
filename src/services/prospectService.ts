
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Prospect {
  id: string;
  email: string;
  name?: string;
  company?: string;
  source: string;
  interest_area?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  followed_up_at?: string;
  domain_id?: string;
}

export interface CreateProspectData {
  email: string;
  name?: string;
  company?: string;
  source?: string;
  interest_area?: string;
}

/**
 * Creates a new prospect (public endpoint for form submissions)
 */
export const createProspect = async (data: CreateProspectData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Creating prospect:', data);
    
    const { error } = await supabase
      .from('prospects')
      .insert([{
        email: data.email,
        name: data.name,
        company: data.company,
        source: data.source || 'website',
        interest_area: data.interest_area,
        status: 'new'
      }]);

    if (error) {
      console.error('Error creating prospect:', error);
      
      // Handle duplicate email error
      if (error.code === '23505') {
        return { success: false, error: 'This email is already registered for updates.' };
      }
      
      return { success: false, error: 'Failed to submit your information. Please try again.' };
    }

    // Send notification email to justin@martins.net
    try {
      console.log('Sending notification email for new prospect:', data.email);
      
      const { error: emailError } = await supabase.functions.invoke('send-signup-invite', {
        body: {
          signupCode: 'PROSPECT_NOTIFICATION',
          recipientEmail: 'justin@martins.net',
          prospectData: {
            email: data.email,
            name: data.name || 'Not provided',
            company: data.company || 'Not provided',
            source: data.source || 'website',
            interest_area: data.interest_area || 'Not specified'
          }
        }
      });

      if (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't fail the prospect creation if email fails
      } else {
        console.log('Notification email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the prospect creation if email fails
    }

    console.log('Prospect created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating prospect:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

/**
 * Gets all prospects (admin only)
 */
export const getProspects = async (): Promise<Prospect[]> => {
  try {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prospects:', error);
      toast.error('Failed to load prospects');
      return [];
    }

    return data as Prospect[];
  } catch (error) {
    console.error('Error fetching prospects:', error);
    toast.error('Failed to load prospects');
    return [];
  }
};

/**
 * Updates a prospect (admin only)
 */
export const updateProspect = async (id: string, updates: Partial<Prospect>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prospects')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating prospect:', error);
      toast.error('Failed to update prospect');
      return false;
    }

    toast.success('Prospect updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating prospect:', error);
    toast.error('Failed to update prospect');
    return false;
  }
};

/**
 * Deletes a prospect (admin only)
 */
export const deleteProspect = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prospect:', error);
      toast.error('Failed to delete prospect');
      return false;
    }

    toast.success('Prospect deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting prospect:', error);
    toast.error('Failed to delete prospect');
    return false;
  }
};
