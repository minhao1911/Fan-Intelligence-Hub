import { useEffect, useRef, useCallback, useState } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./contexts/ThemeContext";

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
import Admin from "./pages/Admin";
import MatchPredictionStats from "./pages/MatchPredictionStats";
import Store from "./pages/Store";
import RevenueDashboard from "./pages/RevenueDashboard";
import Activity from "./pages/Activity";
import AppLayout from "./components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthenticatedApp() {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) return null;

  if (!user) {
    window.location.href = "https://replit.com/login";
    return null;
  }

  return (
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
        <Route path="/admin" component={Admin} />
        <Route path="/store" component={Store} />
        <Route path="/admin/revenue" component={RevenueDashboard} />
        <Route path="/discussions" component={Discussions} />
        <Route path="/discussions/:id" component={DiscussionDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/activity" component={Activity} />
        <Route>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-heading text-primary uppercase">Not Found</h2>
            <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
          </div>
        </Route>
      </Switch>
    </AppLayout>
  );
}

function HomeRedirect() {
  const { data: user, isLoading } = useGetMe();
  if (isLoading) return null;
  if (user) return <Redirect to="/feed" />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/match-stats/:matchId" component={MatchPredictionStats} />
      <Route path="/:rest*" component={AuthenticatedApp} />
    </Switch>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <ThemeProvider>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <div style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.3s ease-in" }}>
        <WouterRouter base={basePath}>
          <QueryClientProvider client={queryClient}>
            <AppRoutes />
          </QueryClientProvider>
        </WouterRouter>
      </div>
    </ThemeProvider>
  );
}
