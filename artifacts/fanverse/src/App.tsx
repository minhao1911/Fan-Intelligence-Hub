import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import Landing from "./pages/Landing";
import Feed from "./pages/Feed";
import Pulse from "./pages/Pulse";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Nations from "./pages/Nations";
import NationDetail from "./pages/NationDetail";
import Discussions from "./pages/Discussions";
import DiscussionDetail from "./pages/DiscussionDetail";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Fixtures from "./pages/Fixtures";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Predictions from "./pages/Predictions";
import AppLayout from "./components/layout/AppLayout";

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

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(51 100% 50%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(240 23% 8%)",
    colorInput: "hsl(240 20% 15%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(240 20% 15%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-heading uppercase text-foreground tracking-wide",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-emerald-500",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center mb-6",
    logoImage: "h-14 w-auto",
    socialButtonsBlockButton: "border-border hover:bg-muted/50 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-heading uppercase tracking-wide",
    formFieldInput: "bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary",
    footerAction: "border-t border-border mt-6 pt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive text-destructive-foreground",
    otpCodeFieldInput: "bg-input border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientRef = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientRef.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientRef]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/feed" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AuthenticatedApp() {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Switch>
            <Route path="/feed" component={Feed} />
            <Route path="/pulse" component={Pulse} />
            <Route path="/fixtures" component={Fixtures} />
            <Route path="/matches" component={Matches} />
            <Route path="/matches/:id" component={MatchDetail} />
            <Route path="/nations" component={Nations} />
            <Route path="/nations/:code" component={NationDetail} />
            <Route path="/groups" component={Groups} />
            <Route path="/groups/:id" component={GroupDetail} />
            <Route path="/predictions" component={Predictions} />
            <Route path="/discussions" component={Discussions} />
            <Route path="/discussions/:id" component={DiscussionDetail} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/profile" component={Profile} />
            <Route>
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-heading text-primary uppercase">Not Found</h2>
                <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
              </div>
            </Route>
          </Switch>
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/:rest*" component={AuthenticatedApp} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
