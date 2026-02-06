import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { logError } from "@/lib/errorLogger";
import { ensureUserBootstrap } from "@/lib/ensureUserBootstrap";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: "candidate" | "employer";
  redirectTo?: string;
}

/**
 * ProtectedRoute component that validates user authentication and type.
 * Performs server-side validation of user type to prevent client-side manipulation.
 */
export const ProtectedRoute = ({ 
  children, 
  allowedUserType,
  redirectTo = "/login"
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  // Track if we've already handled this path to prevent loops
  const handledPath = useRef<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      // Prevent handling the same path multiple times
      if (handledPath.current === location.pathname) return;

      // Wait for auth to finish loading
      if (authLoading) return;

      // If no user, redirect to login
      if (!user) {
        handledPath.current = location.pathname;
        navigate(redirectTo, { replace: true });
        return;
      }

      // If no specific user type required, just check authentication
      if (!allowedUserType) {
        setIsValid(true);
        setValidating(false);
        return;
      }

      // Validate user type based on server-side DB state.
      // Also bootstraps missing rows (profiles/employer_profiles/candidate_test_results)
      // to prevent flows where updates affect 0 rows.
      try {
        const actualType = await ensureUserBootstrap(user);

        if (!actualType) {
          setIsValid(false);
          setValidating(false);
          return;
        }

        if (actualType !== allowedUserType) {
          handledPath.current = location.pathname;
          const correctDashboard = actualType === "employer" 
            ? "/employer/dashboard" 
            : "/candidate/dashboard";
          navigate(correctDashboard, { replace: true });
          return;
        }

        setIsValid(true);
        setValidating(false);
      } catch (error) {
        logError("ProtectedRoute.validateAccess", error);
        setIsValid(false);
        setValidating(false);
      }
    };

    validateAccess();
  }, [user, authLoading, allowedUserType, navigate, redirectTo, location.pathname]);

  // Reset handled path only when location actually changes to a new path
  useEffect(() => {
    return () => {
      // Cleanup on unmount - allow revalidation if component remounts on different path
      handledPath.current = null;
    };
  }, []);

  if (authLoading || validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-accent animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Weryfikacja dostępu...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    // Return null without triggering more navigations
    return null;
  }

  return <>{children}</>;
};
