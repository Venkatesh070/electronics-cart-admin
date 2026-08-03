import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Layout from "./Layout";
import { LoadingState } from "./ui";

export default function ProtectedRoute() {
  const { isAuthenticated, booting } = useAuth();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <LoadingState label="Loading admin…" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
