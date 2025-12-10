import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthState } from "../authState";

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, initialiseAuth } = useAuthState();

  // Run on page load/refresh to restore localStorage session
  useEffect(() => {
    initialiseAuth();
  }, [initialiseAuth]);

  // If still not authenticated → redirect to dev login
  if (!isAuthenticated) {
    return <Navigate to="/login-dev" replace />;
  }

  return children;
}
