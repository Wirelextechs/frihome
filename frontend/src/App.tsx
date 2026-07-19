import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuthStore } from "./lib/store";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { KycPage } from "./pages/KycPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { InvestmentDetailPage } from "./pages/InvestmentDetailPage";
import { WalletPage } from "./pages/WalletPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Landing() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route
          path="/kyc"
          element={
            <RequireAuth>
              <KycPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/portfolio"
          element={
            <RequireAuth>
              <PortfolioPage />
            </RequireAuth>
          }
        />
        <Route
          path="/portfolio/:id"
          element={
            <RequireAuth>
              <InvestmentDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wallet"
          element={
            <RequireAuth>
              <WalletPage />
            </RequireAuth>
          }
        />
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
