
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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

    // THEN check for existing session
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No active session found, redirecting to sign in');
          navigate('/signin');
        } else {
          console.log('Active session found, user is logged in');
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        setShowCreateProject={setShowCreateProject} 
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
