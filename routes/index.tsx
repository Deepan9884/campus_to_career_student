import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/stores";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const auth = useAuth();
  return <Navigate to={auth.isAuthenticated ? "/dashboard" : "/login"} />;
}
