import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { ClerkProvider, Show, useAuth, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { AppShell } from "@/components/app/app-shell";
import { ThemeSync } from "@/components/app/theme-sync";
import { LogoMark } from "@/components/brand/logo";
import { NAV } from "@/lib/nav";
import Landing from "@/pages/landing";
import NetworkPage from "@/pages/network";
import { SignInPage, SignUpPage } from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import ModulePage from "@/pages/module";
import NotFound from "@/pages/not-found";
import OrganizationsPage from "@/pages/organizations";
import OrganizationNewPage from "@/pages/organization-new";
import OrganizationOverviewPage from "@/pages/organization-overview";
import OrganizationSettingsPage from "@/pages/organization-settings";
import OrganizationTeamPage from "@/pages/organization-team";
import InvitePage from "@/pages/invite";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function buildAppearance(mode: "dark" | "light") {
  const d = mode === "dark";
  const c = d
    ? { primary: "#2f7bff", fg: "#e8eefb", muted: "#93a0bd", bg: "#0b1226", input: "#0e1730", border: "#1f2a4a", danger: "#f05252" }
    : { primary: "#1565e6", fg: "#0f1a36", muted: "#55617d", bg: "#fbfcff", input: "#f3f6fc", border: "#cfd8ea", danger: "#d23030" };
  return {
    ...(d ? { theme: dark } : {}),
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: c.primary,
      colorForeground: c.fg,
      colorMutedForeground: c.muted,
      colorDanger: c.danger,
      colorBackground: c.bg,
      colorInput: c.input,
      colorInputForeground: c.fg,
      colorNeutral: d ? "#c7d2ee" : "#1a2440",
      fontFamily: "Manrope, system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: { width: "100%", maxWidth: "440px", minWidth: 0, display: "flex", justifyContent: "center" },
      cardBox: { background: c.bg, border: `1px solid ${c.border}`, borderRadius: "1.25rem", width: "100%", maxWidth: "440px", minWidth: 0, overflow: "hidden", boxShadow: d ? "0 30px 60px -30px rgba(47,123,255,0.45)" : "0 30px 60px -30px rgba(21,101,230,0.25)" },
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: { color: c.fg, fontFamily: "Sora, Manrope, sans-serif", fontWeight: 600, letterSpacing: "-0.02em" },
      headerSubtitle: { color: c.muted },
      socialButtonsBlockButtonText: { color: c.fg, fontWeight: 600 },
      formFieldLabel: { color: c.fg, fontWeight: 600 },
      footerActionLink: { color: c.primary, fontWeight: 600 },
      footerActionText: { color: c.muted },
      dividerText: { color: c.muted },
      identityPreviewEditButton: { color: c.primary },
      formFieldSuccessText: { color: d ? "#22d3ee" : "#0e7490" },
      alertText: { color: c.fg },
      logoBox: { height: "44px", justifyContent: "center" },
      logoImage: { height: "44px", width: "44px" },
      socialButtonsBlockButton: { border: `1px solid ${c.border}`, background: c.input },
      formButtonPrimary: { background: c.primary, color: d ? "#060a17" : "#ffffff", fontWeight: 700, boxShadow: "none" },
      formFieldInput: { background: c.input, borderColor: c.border, color: c.fg },
      footerAction: { justifyContent: "center" },
      dividerLine: { background: c.border },
      alert: { border: `1px solid ${c.border}`, background: c.input },
      otpCodeFieldInput: { borderColor: c.border, color: c.fg },
      formFieldRow: { marginBottom: "4px" },
      main: { gap: "18px" },
    },
  };
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background" role="status" aria-label="Loading">
      <div className="relative">
        <span className="pulse-ring absolute inset-0 rounded-2xl border border-cyan/50" aria-hidden />
        <LogoMark className="h-12 w-12" />
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <Landing />;
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth();
  const [location] = useLocation();
  const signInTarget = location === "/invite"
    ? `/sign-in?returnTo=${encodeURIComponent(location + window.location.search)}`
    : "/sign-in";
  if (!isLoaded) return <Splash />;
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Redirect to={signInTarget} /></Show>
    </>
  );
}

function inShell(Page: ComponentType) {
  return function Wrapped() {
    return <RequireAuth><AppShell><Page /></AppShell></RequireAuth>;
  };
}

const DashboardRoute = inShell(Dashboard);
const ProfileRoute = inShell(ProfilePage);
const SettingsRoute = inShell(SettingsPage);
const OrganizationsRoute = inShell(OrganizationsPage);
const OrganizationNewRoute = inShell(OrganizationNewPage);
const OrganizationOverviewRoute = inShell(OrganizationOverviewPage);
const OrganizationSettingsRoute = inShell(OrganizationSettingsPage);
const OrganizationTeamRoute = inShell(OrganizationTeamPage);
const OnboardingRoute = () => <RequireAuth><Onboarding /></RequireAuth>;
const MODULE_ROUTES = NAV.filter((n) => !n.live).map((n) => ({
  path: n.href,
  component: inShell(() => <ModulePage slug={n.slug} />),
}));

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={buildAppearance(theme)}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Log in to AGENTNEX", subtitle: "Continue to your workspace" } },
        signUp: { start: { title: "Create your AGENTNEX account", subtitle: "Free to start. Set up your identity in three steps." } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ThemeSync />
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/network" component={NetworkPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/onboarding" component={OnboardingRoute} />
              <Route path="/dashboard" component={DashboardRoute} />
              <Route path="/profile" component={ProfileRoute} />
              <Route path="/settings" component={SettingsRoute} />
              <Route path="/organizations" component={OrganizationsRoute} />
              <Route path="/organizations/new" component={OrganizationNewRoute} />
              <Route path="/organizations/:organizationId/settings" component={OrganizationSettingsRoute} />
              <Route path="/organizations/:organizationId/team" component={OrganizationTeamRoute} />
              <Route path="/organizations/:organizationId" component={OrganizationOverviewRoute} />
              <Route path="/invite" component={InvitePage} />
              {MODULE_ROUTES.map((r) => <Route key={r.path} path={r.path} component={r.component} />)}
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
