
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import DashboardHeader from '../dashboard/DashboardHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkRegistrationStatus } from '@/services/userService';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Store sidebar state in localStorage to persist across page navigations
  useEffect(() => {
    const storedSidebarState = localStorage.getItem('sidebarOpen');
    if (storedSidebarState) {
      setSidebarOpen(storedSidebarState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  // Check authentication state on component mount and set up a listener for auth changes
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT' || !session) {
          // User signed out, redirect to sign in page
          navigate('/signin');
        }
      }
    );

    // THEN check for existing session and registration status
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No active session found, redirecting to sign in');
          navigate('/signin');
        } else {
          console.log('Active session found, checking registration status...');
          const { isRegistered, error } = await checkRegistrationStatus(session.user.email!);
          
          if (error) {
            toast.error(error);
            // Sign out to prevent loop if there's a persistent issue.
            await supabase.auth.signOut();
            navigate('/signin');
            return;
          }
          
          if (!isRegistered) {
            console.log('User not fully registered. Redirecting to complete profile.');
            toast.info("Please complete your registration to continue.");
            navigate('/signup');
          } else {
             console.log('User is fully registered and can proceed.');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Authentication error. Please sign in again.');
        navigate('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      // Clean up subscription when component unmounts
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 w-full">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        setShowCreateProject={setShowCreateProject} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          toggleSidebar={toggleSidebar}
          title="Dashboard"
        />
        <div className="flex-1 overflow-auto">
          <Outlet context={[showCreateProject, setShowCreateProject]} />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
