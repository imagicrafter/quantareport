
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './integrations/auth/AuthProvider';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import StartNewReport from './pages/StartNewReport';
import Settings from './pages/Settings';
import DashboardLayout from './components/layout/DashboardLayout';
import PublicPageLayout from './layouts/PublicPageLayout';
import Pricing from './pages/Pricing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UploadAndPrepareFiles from './pages/UploadAndPrepareFiles';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

function App() {
  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/signin" />;
    }

    return <>{children}</>;
  };

  const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (isAuthenticated) {
      return <Navigate to="/dashboard" />;
    }

    return <>{children}</>;
  };

  return (
    <div className="App">
      <Suspense fallback={<div>Loading...</div>}>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={
              <PublicRoute>
                <PublicPageLayout>
                  <SignIn />
                </PublicPageLayout>
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <PublicPageLayout>
                  <SignUp />
                </PublicPageLayout>
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <PublicPageLayout>
                  <ForgotPassword />
                </PublicPageLayout>
              </PublicRoute>
            } />
            <Route path="/reset-password" element={
              <PublicRoute>
                <PublicPageLayout>
                  <ResetPassword />
                </PublicPageLayout>
              </PublicRoute>
            } />
            <Route path="/pricing" element={
              <PublicPageLayout>
                <Pricing />
              </PublicPageLayout>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/projects" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/start-new-report" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StartNewReport />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* Add the new route for Step 2 */}
            <Route path="/dashboard/upload-and-prepare-files" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UploadAndPrepareFiles />
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
