
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
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

// Import the report wizard components
import ReportWizardContainer from './components/report-workflow/ReportWizardContainer';
import Step1Start from './components/report-workflow/steps/Step1Start';
import Step2Files from './components/report-workflow/steps/Step2Files';
import Step3Process from './components/report-workflow/steps/Step3Process';
import Step4Notes from './components/report-workflow/steps/Step4Notes';
import Step5Generate from './components/report-workflow/steps/Step5Generate';
import Step6Review from './components/report-workflow/steps/Step6Review';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
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
