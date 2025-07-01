import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient } from 'react-query';

import Index from './pages/Index';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Admin from './pages/Admin';
import ReportWizard from './pages/ReportWizard';
import Reports from './pages/Reports';
import ReportEditor from './pages/ReportEditor';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PublishedReport from './pages/PublishedReport';

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reports/:token" element={<PublishedReport />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/templates" element={<Templates />} />
            <Route path="/dashboard/admin" element={<Admin />} />
            <Route path="/dashboard/report-wizard/*" element={<ReportWizard />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/reports/editor/:id" element={<ReportEditor />} />
            <Route path="/dashboard/projects" element={<Projects />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
