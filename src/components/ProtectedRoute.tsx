import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { logError } from "@/lib/errorLogger";

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
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    const validateAccess = async () => {
      // Prevent multiple navigations
      if (hasNavigated.current) return;

      // Wait for auth to finish loading
      if (authLoading) return;

      // If no user, redirect to login
      if (!user) {
        hasNavigated.current = true;
        navigate(redirectTo, { replace: true });
        return;
      }

      // If no specific user type required, just check authentication
      if (!allowedUserType) {
        setIsValid(true);
        setValidating(false);
        return;
      }

      // Server-side validation of user type
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", user.id)
          .single();

        if (error) {
          logError("ProtectedRoute.validateAccess", error);
          // Don't redirect in a loop - just show invalid state
          setIsValid(false);
          setValidating(false);
          return;
        }

        if (data?.user_type !== allowedUserType) {
          // User type doesn't match - redirect to appropriate dashboard
          hasNavigated.current = true;
          const correctDashboard = data?.user_type === "employer" 
            ? "/employer/dashboard" 
            : "/candidate/dashboard";
          navigate(correctDashboard, { replace: true });
          return;
        }

        setIsValid(true);
        setValidating(false);
      } catch (error) {
        logError("ProtectedRoute.validateAccess", error);
        // Don't redirect on error - just show invalid state
        setIsValid(false);
        setValidating(false);
      }
    };

    validateAccess();
  }, [user, authLoading, allowedUserType, navigate, redirectTo]);

  // Reset navigation flag when user changes
  useEffect(() => {
    hasNavigated.current = false;
  }, [user]);

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
    // If user exists but validation failed, redirect to login
    if (user && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate(redirectTo, { replace: true });
    }
    return null;
  }

  return <>{children}</>;
};
