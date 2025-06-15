
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import ReportEditor from './pages/ReportEditor';
import Images from './pages/Images';
import Notes from './pages/Notes';
import Admin from './pages/Admin';
import CustomReportViewer from './components/reports/CustomReportViewer';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { supabase } from './integrations/supabase/client';
import { toast } from 'sonner';
import { markSignupCodeAsUsed } from './services/signupCodeService';

// Import the report wizard components
import ReportWizardContainer from './components/report-workflow/ReportWizardContainer';
import Step1Start from './components/report-workflow/steps/Step1Start';
import Step2Files from './components/report-workflow/steps/Step2Files';
import Step3Process from './components/report-workflow/steps/Step3Process';
import Step4Notes from './components/report-workflow/steps/Step4Notes';
import Step5Generate from './components/report-workflow/steps/Step5Generate';
import Step6Review from './components/report-workflow/steps/Step6Review';

const OAUTH_SIGNUP_SESSION_KEY = 'oauth_signup_info';

function App() {
  useEffect(() => {
    const handleOAuthSignup = async () => {
      const signupInfoRaw = sessionStorage.getItem(OAUTH_SIGNUP_SESSION_KEY);
      if (!signupInfoRaw) {
        return;
      }

      sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);

      try {
        const signupInfo = JSON.parse(signupInfoRaw);
        if (!signupInfo.validated) {
          console.log('OAuth signup info not validated, ignoring.');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Could not get user after OAuth login.');
          return;
        }

        if (signupInfo.email && user.email !== signupInfo.email) {
          toast.error(`Email mismatch. Expected ${signupInfo.email}, but logged in as ${user.email}. Signing out.`);
          await supabase.auth.signOut();
          return;
        }

        console.log('Handling OAuth post-signup flow. User:', user.email);

        if (signupInfo.code) {
          console.log(`Updating user metadata with signup code: ${signupInfo.code}`);
          const { error: updateError } = await supabase.auth.updateUser({
            data: { signup_code: signupInfo.code }
          });

          if (updateError) throw updateError;
          
          await markSignupCodeAsUsed(signupInfo.code, user.email!);
          console.log('Signup code associated and marked as used for OAuth user.');
          
          toast.success('Successfully signed up and associated your signup code!');
        } else {
          toast.success('Successfully signed up!');
        }

      } catch (error: any) {
        console.error('Error handling post-OAuth signup:', error);
        toast.error(error.message || 'An error occurred while finalizing your signup.');
      }
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only trigger for OAuth sign-ins, which will have a provider_token.
      if (event === 'SIGNED_IN' && session?.provider_token) {
        console.log('OAuth SIGNED_IN event detected, handling post-signup flow.');
        handleOAuthSignup();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Public route for custom reports */}
        <Route path="/reports/:token" element={<CustomReportViewer />} />
        
        {/* Dashboard and protected routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default redirect to projects when accessing /dashboard */}
          <Route index element={<Navigate to="/dashboard/projects" replace />} />
          <Route path="projects" element={<Dashboard />} />
          <Route path="templates" element={<Templates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/editor/:id" element={<ReportEditor />} />
          <Route path="images" element={<Images />} />
          <Route path="notes" element={<Notes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
          
          {/* Report Wizard Routes */}
          <Route path="report-wizard" element={<ReportWizardContainer />}>
            <Route index element={<Navigate to="/dashboard/report-wizard/start" replace />} />
            <Route path="start" element={<Step1Start />} />
            <Route path="files" element={<Step2Files />} />
            <Route path="process" element={<Step3Process />} />
            <Route path="notes" element={<Step4Notes />} />
            <Route path="generate" element={<Step5Generate />} />
            <Route path="review" element={<Step6Review />} />
          </Route>
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <SonnerToaster position="top-right" />
    </Router>
  );
}

export default App;
