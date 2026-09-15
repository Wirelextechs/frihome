import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import { useAuthStore } from "./lib/store";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { KycPage } from "./pages/KycPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PackagesPage } from "./pages/PackagesPage";
import { PackageDetailPage } from "./pages/PackageDetailPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { InvestmentDetailPage } from "./pages/InvestmentDetailPage";
import { WalletPage } from "./pages/WalletPage";
import { ReferralDashboardPage } from "./pages/ReferralDashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminKycPage } from "./pages/AdminKycPage";
import { AdminPackagesPage } from "./pages/AdminPackagesPage";
import { AdminPackageEditPage } from "./pages/AdminPackageEditPage";
import { AdminFinancialsPage } from "./pages/AdminFinancialsPage";
import { AdminPaymentsPage } from "./pages/AdminPaymentsPage";
import { AdminPaymentDetailPage } from "./pages/AdminPaymentDetailPage";
import { AdminWithdrawalsPage } from "./pages/AdminWithdrawalsPage";
import { AdminWithdrawalDetailPage } from "./pages/AdminWithdrawalDetailPage";
import { AdminRoiPage } from "./pages/AdminRoiPage";
import { AdminRoiDetailPage } from "./pages/AdminRoiDetailPage";
import { AdminReferralConfigPage } from "./pages/AdminReferralConfigPage";
import { AdminDepositsPage } from "./pages/AdminDepositsPage";
import { AdminDepositDetailPage } from "./pages/AdminDepositDetailPage";
import { AdminRewardsPage } from "./pages/AdminRewardsPage";
import { AdminRewardDetailPage } from "./pages/AdminRewardDetailPage";
import { AdminAnnouncementsPage } from "./pages/AdminAnnouncementsPage";
import { AboutPage } from "./pages/AboutPage";
import { SupportPage } from "./pages/SupportPage";
import { AdminSupportPage } from "./pages/AdminSupportPage";
import { AdminPaymentSettingsPage } from "./pages/AdminPaymentSettingsPage";
import { ChatPage } from "./pages/ChatPage";
import { AdminChatsPage } from "./pages/AdminChatsPage";
import { AdminChatDetailPage } from "./pages/AdminChatDetailPage";
import { AdminSmsSettingsPage } from "./pages/AdminSmsSettingsPage";
import { AdminWithdrawalRequirementsPage } from "./pages/AdminWithdrawalRequirementsPage";
import { AdminTransactionsPage } from "./pages/AdminTransactionsPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Investors who end up with an /admin/* URL (a stale notification, a typed
// link, a bookmark from before a demotion) get bounced to their dashboard
// instead of the admin page shell rendering for them.
function RequireAdmin({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function Landing() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/packages/:id" element={<PackageDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
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
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/referrals"
          element={
            <RequireAuth>
              <ReferralDashboardPage />
            </RequireAuth>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/kyc"
        element={
          <RequireAdmin>
            <AdminKycPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <RequireAdmin>
            <AdminPackagesPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/packages/:packageId"
        element={
          <RequireAdmin>
            <AdminPackageEditPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/financials"
        element={
          <RequireAdmin>
            <AdminFinancialsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RequireAdmin>
            <AdminPaymentsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/payments/:paymentId"
        element={
          <RequireAdmin>
            <AdminPaymentDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <RequireAdmin>
            <AdminWithdrawalsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/withdrawals/:txnId"
        element={
          <RequireAdmin>
            <AdminWithdrawalDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/roi"
        element={
          <RequireAdmin>
            <AdminRoiPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/roi/:investmentId"
        element={
          <RequireAdmin>
            <AdminRoiDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/referrals"
        element={
          <RequireAdmin>
            <AdminReferralConfigPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <RequireAdmin>
            <AdminDepositsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/deposits/:depositId"
        element={
          <RequireAdmin>
            <AdminDepositDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/rewards"
        element={
          <RequireAdmin>
            <AdminRewardsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/rewards/:poolId"
        element={
          <RequireAdmin>
            <AdminRewardDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <RequireAdmin>
            <AdminAnnouncementsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/support"
        element={
          <RequireAdmin>
            <AdminSupportPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/payment-rules"
        element={
          <RequireAdmin>
            <AdminPaymentSettingsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/chats"
        element={
          <RequireAdmin>
            <AdminChatsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/chats/:userId"
        element={
          <RequireAdmin>
            <AdminChatDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/sms"
        element={
          <RequireAdmin>
            <AdminSmsSettingsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/withdrawal-requirements"
        element={
          <RequireAdmin>
            <AdminWithdrawalRequirementsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <RequireAdmin>
            <AdminTransactionsPage />
          </RequireAdmin>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <Toaster />
    </>
  );
}
