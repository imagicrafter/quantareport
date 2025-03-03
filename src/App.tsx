
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-6">Projects Dashboard</h2>
            </div>} />
            <Route path="images" element={<div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-6">Images Dashboard</h2>
            </div>} />
            <Route path="notes" element={<div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-6">Notes Dashboard</h2>
            </div>} />
            <Route path="templates" element={<Templates />} />
            <Route path="reports" element={<div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-6">Reports Dashboard</h2>
            </div>} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/templates" element={<Navigate to="/dashboard/templates" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
