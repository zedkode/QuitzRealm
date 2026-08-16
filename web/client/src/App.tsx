import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link, Route, Switch, useLocation } from "wouter";
import { clearQuizRealmSession } from "@/lib/quizrealm";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import { useEffect, useState } from "react";
import { quizRealmApi, type UserIdentity } from "@/lib/quizrealm";
import { LayoutDashboard, LogIn, ScrollText, Shield, Swords, Trophy, UserRound } from "lucide-react";

const nav = [
  { href: "/game", label: "Joacă", icon: Swords },
  { href: "/leaderboard", label: "Clasament", icon: Trophy },
  { href: "/profile", label: "Profil", icon: UserRound },
];

function AppChrome({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [user, setUser] = useState<UserIdentity | null>(null);
  useEffect(() => { if (location === "/auth") return; quizRealmApi.me().then(setUser).catch(() => setUser(null)); }, [location]);
  const isHome = location === "/";
  const logout = async () => { try { await quizRealmApi.logout(); } catch { /* session may already be expired */ } clearQuizRealmSession(); setUser(null); window.location.assign("/"); };
  return (
    <div className="min-h-screen bg-[#07060b] text-[#f7f0df]">
      {!isHome && (
        <header className="sticky top-0 z-40 border-b border-[#d9b45a]/10 bg-[#07060b]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9b45a]/35 bg-[#211933] text-[#e3c36a] shadow-[0_0_26px_rgba(126,92,199,.25)]"><ScrollText size={20} /></div>
              <div><div className="font-display text-sm tracking-wide text-[#f7e7b0]">QUIZREALM</div><div className="eyebrow !text-[.52rem]">Arena arcană</div></div>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${location === href ? "bg-[#d9b45a]/10 text-[#e3c36a]" : "text-[#a69ead] hover:bg-white/5 hover:text-white"}`}><Icon size={16} />{label}</Link>)}
              {["admin","ADMIN","MODERATOR","CONTENT_EDITOR","SUPPORT"].includes(String(user?.role)) && <Link href="/admin" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${location.startsWith("/admin") ? "bg-[#7e5cc7]/15 text-[#c7b3ff]" : "text-[#a69ead] hover:bg-white/5 hover:text-white"}`}><Shield size={16} />Admin</Link>}
            </nav>
            <div className="flex items-center gap-3">
              {user ? <button onClick={logout} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs text-[#a69ead] hover:border-[#d9b45a]/30 hover:text-white sm:block">Ieși din cont</button> : <Link href="/auth" className="flex items-center gap-2 rounded-lg bg-[#d9b45a] px-4 py-2 text-sm font-bold text-[#1a1207] hover:bg-[#f0ce76]"><LogIn size={16} />Intră în tărâm</Link>}
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
      {!isHome && <footer className="border-t border-white/5 py-8 text-center text-xs text-[#6f6875]">QuizRealm · Cunoașterea devine teritoriu.</footer>}
    </div>
  );
}

function AdminGate() {
  const [state, setState] = useState<{ loading: boolean; user?: UserIdentity; error?: string }>({ loading: true });
  useEffect(() => { quizRealmApi.me().then((user) => setState({ loading: false, user })).catch((error) => setState({ loading: false, error: error instanceof Error ? error.message : "Access denied" })); }, []);
  if (state.loading) return <div className="starfield grid min-h-[70vh] place-items-center text-sm text-[#a69ead]">Se verifică accesul în tărâm…</div>;
  if (!state.user || !["admin","ADMIN","MODERATOR","CONTENT_EDITOR","SUPPORT"].includes(String(state.user.role))) return <div className="starfield grid min-h-[70vh] place-items-center px-5"><div className="panel max-w-md rounded-2xl p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#c7779b]/12 text-[#e596a8]"><Shield size={20}/></div><h1 className="mt-5 font-display text-2xl text-[#f7e7b0]">Consiliul îți taie calea</h1><p className="mt-3 text-sm leading-6 text-[#a69ead]">Accesul de administrator e verificat de backendul QuizRealm. Autentifică-te cu un cont de administrator ca să intri în camera de control.</p><Link href="/auth" className="mt-6 inline-flex rounded-xl bg-[#d9b45a] px-5 py-3 text-sm font-bold text-[#1a1207]">Autentifică-te ca admin</Link></div></div>;
  return <Admin />;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/game" component={Game} />
    <Route path="/profile" component={Profile} />
    <Route path="/leaderboard" component={Leaderboard} />
    <Route path="/auth" component={Auth} />
    <Route path="/admin" component={AdminGate} />
    <Route component={Home} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><AppChrome><Router /></AppChrome></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
