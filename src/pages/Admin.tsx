
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SignupCodeManager from '@/components/admin/SignupCodeManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          navigate('/signin');
          return;
        }

        const userEmail = session.session.user.email;
        
        // Check if the user has the admin email
        if (userEmail === 'justin@martins.net') {
          setIsAdmin(true);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Admin Panel" toggleSidebar={() => {}} />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Controls</h1>
        
        <div className="bg-card border rounded-lg p-6">
          <SignupCodeManager />
        </div>
      </div>
    </div>
  );
};

export default Admin;
