import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
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

// Add these imports at the top
import { useParams } from 'react-router-dom';
import { useWorkflowExit } from '@/hooks/report-workflow/useWorkflowExit';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// This is a wrapper component we'll add to intercept navigation
const NavigationWrapper = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<number | null>(null);
  const isInWorkflow = Boolean(params['*']?.includes('report-wizard') && workflowState && workflowState > 1);
  
  // Fetch current workflow state
  useEffect(() => {
    const fetchWorkflowState = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const { data } = await supabase
          .from('project_workflow')
          .select('workflow_state, project_id')
          .eq('user_id', userData.user.id)
          .order('last_edited_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (data) {
          setWorkflowState(data.workflow_state);
          setProjectId(data.project_id);
        }
      } catch (error) {
        console.error('Error fetching workflow state:', error);
      }
    };
    
    if (params['*']?.includes('report-wizard')) {
      fetchWorkflowState();
    }
  }, [params]);
  
  const { handleExitAttempt, isExitDialogOpen, confirmExit, cancelExit } = useWorkflowExit({
    projectId,
    isInWorkflow
  });
  
  // Clone the children and add the exit handler prop to Sidebar
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Sidebar) {
      return React.cloneElement(child, { 
        onNavigate: isInWorkflow ? handleExitAttempt : undefined
      } as any);
    }
    return child;
  });
  
  return (
    <>
      {childrenWithProps}
      
      {/* Exit Confirmation Dialog - same as in ReportWizardContainer */}
      <AlertDialog open={isExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Report Creation?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave the report creation workflow. 
              Your progress will be saved, but you'll need to restart the workflow to continue.
              Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit Workflow</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Add a prop to track onNavigate in the Sidebar component
const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <NavigationWrapper>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </NavigationWrapper>
    </div>
  );
};

export default DashboardLayout;
