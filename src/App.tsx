import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/test/competency/:competencyCode" element={<CompetencyTest />} />
            <Route path="/candidate/test/culture" element={<CultureTest />} />
            <Route path="/candidate/additional" element={<CandidateAdditional />} />
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/employer/role" element={<EmployerRole />} />
            <Route path="/employer/requirements" element={<EmployerRequirements />} />
            <Route path="/employer/culture" element={<EmployerCulture />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
