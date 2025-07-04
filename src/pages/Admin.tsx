
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignupCodesTab from '@/components/admin/SignupCodesTab';
import TemplatesTab from '@/components/admin/TemplatesTab';
import AdminProjectsTab from '@/components/admin/AdminProjectsTab';
import AdminReportsTab from '@/components/admin/AdminReportsTab';
import ConfigurationTab from '@/components/admin/ConfigurationTab';
import DocumentationTab from '@/components/admin/DocumentationTab';
import ProspectsTab from '@/components/admin/ProspectsTab';
import CustomReportsTab from '@/components/admin/CustomReportsTab';

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
          toast.error('You must be signed in to access this page');
          navigate('/signin');
          return;
        }

        // Check if the user has the admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.session.user.id)
          .single();
        
        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('You do not have permission to access this page');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast.error('An error occurred while checking permissions');
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
        <Tabs defaultValue="prospects" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
            <TabsTrigger value="signup-codes">Signup Codes</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prospects" className="bg-card border rounded-lg p-6">
            <ProspectsTab />
          </TabsContent>
          
          <TabsContent value="projects" className="bg-card border rounded-lg p-6">
            <AdminProjectsTab />
          </TabsContent>
          
          <TabsContent value="reports" className="bg-card border rounded-lg p-6">
            <AdminReportsTab />
          </TabsContent>
          
          <TabsContent value="custom-reports" className="bg-card border rounded-lg p-6">
            <CustomReportsTab />
          </TabsContent>
          
          <TabsContent value="signup-codes" className="bg-card border rounded-lg p-6">
            <SignupCodesTab />
          </TabsContent>
          
          <TabsContent value="templates" className="bg-card border rounded-lg p-6">
            <TemplatesTab />
          </TabsContent>

          <TabsContent value="configuration" className="bg-card border rounded-lg p-6">
            <ConfigurationTab />
          </TabsContent>

          <TabsContent value="documentation" className="bg-card border rounded-lg p-6">
            <DocumentationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
