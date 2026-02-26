import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OnboardingScreen from './components/OnboardingScreen';
import ExpenseTracker from './components/ExpenseTracker';
import SavingsGoalTracker from './components/SavingsGoalTracker';
import InvestmentSuggestions from './components/InvestmentSuggestions';
import BudgetCalculator from './components/BudgetCalculator';
import LoginPage from './components/LoginPage';
import ProfileSetup from './components/ProfileSetup';
import Wallet from './components/Wallet';
import AdminPanel from './components/AdminPanel';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// Root route with Layout
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardGuard,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingScreen,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  component: ExpenseTracker,
});

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals',
  component: SavingsGoalTracker,
});

const investRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invest',
  component: InvestmentSuggestions,
});

const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calculator',
  component: BudgetCalculator,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: WalletGuard,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminGuard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  expensesRoute,
  goalsRoute,
  investRoute,
  calculatorRoute,
  walletRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  if (isInitializing || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  if (isFetched && userProfile === null) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
}

function DashboardGuard() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function WalletGuard() {
  return (
    <AuthGuard>
      <Wallet />
    </AuthGuard>
  );
}

function AdminGuard() {
  return (
    <AuthGuard>
      <AdminPanel />
    </AuthGuard>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}
