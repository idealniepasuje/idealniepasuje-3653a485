import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// Force rebuild - clean vite cache
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const CandidateDashboard = lazy(() => import("./pages/candidate/CandidateDashboard"));
const CompetencyTest = lazy(() => import("./pages/candidate/CompetencyTest"));
const CultureTest = lazy(() => import("./pages/candidate/CultureTest"));
const CandidateAdditional = lazy(() => import("./pages/candidate/CandidateAdditional"));
const CandidateMatches = lazy(() => import("./pages/candidate/CandidateMatches"));
const CandidateEmployerDetail = lazy(() => import("./pages/candidate/CandidateEmployerDetail"));
const CandidateFeedback = lazy(() => import("./pages/candidate/CandidateFeedback"));
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard"));
const EmployerOffers = lazy(() => import("./pages/employer/EmployerOffers"));
const EmployerOfferForm = lazy(() => import("./pages/employer/EmployerOfferForm"));
const EmployerProfile = lazy(() => import("./pages/employer/EmployerProfile"));
const EmployerRole = lazy(() => import("./pages/employer/EmployerRole"));
const EmployerRequirements = lazy(() => import("./pages/employer/EmployerRequirements"));
const EmployerCulture = lazy(() => import("./pages/employer/EmployerCulture"));
const EmployerOrderDetail = lazy(() => import("./pages/employer/EmployerOrderDetail"));
const EmployerCandidates = lazy(() => import("./pages/employer/EmployerCandidates"));
const EmployerCandidateDetail = lazy(() => import("./pages/employer/EmployerCandidateDetail"));
const EmployerFeedback = lazy(() => import("./pages/employer/EmployerFeedback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Candidate routes - protected and validated */}
              <Route path="/candidate/dashboard" element={<ProtectedRoute allowedUserType="candidate"><CandidateDashboard /></ProtectedRoute>} />
              <Route path="/candidate/test/competency/:competencyCode" element={<ProtectedRoute allowedUserType="candidate"><CompetencyTest /></ProtectedRoute>} />
              <Route path="/candidate/test/culture" element={<ProtectedRoute allowedUserType="candidate"><CultureTest /></ProtectedRoute>} />
              <Route path="/candidate/additional" element={<ProtectedRoute allowedUserType="candidate"><CandidateAdditional /></ProtectedRoute>} />
              <Route path="/candidate/matches" element={<ProtectedRoute allowedUserType="candidate"><CandidateMatches /></ProtectedRoute>} />
              <Route path="/candidate/match/:matchId" element={<ProtectedRoute allowedUserType="candidate"><CandidateEmployerDetail /></ProtectedRoute>} />
              <Route path="/candidate/feedback" element={<ProtectedRoute allowedUserType="candidate"><CandidateFeedback /></ProtectedRoute>} />
              {/* Employer routes - protected and validated */}
              <Route path="/employer/dashboard" element={<ProtectedRoute allowedUserType="employer"><EmployerDashboard /></ProtectedRoute>} />
              <Route path="/employer/offers" element={<ProtectedRoute allowedUserType="employer"><EmployerOffers /></ProtectedRoute>} />
              <Route path="/employer/offer/:offerId" element={<ProtectedRoute allowedUserType="employer"><EmployerOfferForm /></ProtectedRoute>} />
              <Route path="/employer/profile" element={<ProtectedRoute allowedUserType="employer"><EmployerProfile /></ProtectedRoute>} />
              <Route path="/employer/role" element={<ProtectedRoute allowedUserType="employer"><EmployerRole /></ProtectedRoute>} />
              <Route path="/employer/requirements" element={<ProtectedRoute allowedUserType="employer"><EmployerRequirements /></ProtectedRoute>} />
              <Route path="/employer/culture" element={<ProtectedRoute allowedUserType="employer"><EmployerCulture /></ProtectedRoute>} />
              <Route path="/employer/order/:orderId" element={<ProtectedRoute allowedUserType="employer"><EmployerOrderDetail /></ProtectedRoute>} />
              <Route path="/employer/candidates" element={<ProtectedRoute allowedUserType="employer"><EmployerCandidates /></ProtectedRoute>} />
              <Route path="/employer/candidate/:candidateId" element={<ProtectedRoute allowedUserType="employer"><EmployerCandidateDetail /></ProtectedRoute>} />
              <Route path="/employer/feedback" element={<ProtectedRoute allowedUserType="employer"><EmployerFeedback /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
