import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CompetencyTest from "./pages/candidate/CompetencyTest";
import CultureTest from "./pages/candidate/CultureTest";
import CandidateAdditional from "./pages/candidate/CandidateAdditional";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerRole from "./pages/employer/EmployerRole";
import EmployerRequirements from "./pages/employer/EmployerRequirements";
import EmployerCulture from "./pages/employer/EmployerCulture";
import EmployerCandidates from "./pages/employer/EmployerCandidates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Candidate routes - protected and validated */}
            <Route path="/candidate/dashboard" element={<ProtectedRoute allowedUserType="candidate"><CandidateDashboard /></ProtectedRoute>} />
            <Route path="/candidate/test/competency/:competencyCode" element={<ProtectedRoute allowedUserType="candidate"><CompetencyTest /></ProtectedRoute>} />
            <Route path="/candidate/test/culture" element={<ProtectedRoute allowedUserType="candidate"><CultureTest /></ProtectedRoute>} />
            <Route path="/candidate/additional" element={<ProtectedRoute allowedUserType="candidate"><CandidateAdditional /></ProtectedRoute>} />
            {/* Employer routes - protected and validated */}
            <Route path="/employer/dashboard" element={<ProtectedRoute allowedUserType="employer"><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/role" element={<ProtectedRoute allowedUserType="employer"><EmployerRole /></ProtectedRoute>} />
            <Route path="/employer/requirements" element={<ProtectedRoute allowedUserType="employer"><EmployerRequirements /></ProtectedRoute>} />
            <Route path="/employer/culture" element={<ProtectedRoute allowedUserType="employer"><EmployerCulture /></ProtectedRoute>} />
            <Route path="/employer/candidates" element={<ProtectedRoute allowedUserType="employer"><EmployerCandidates /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
