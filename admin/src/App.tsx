import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { authApi, isStaff, type UserIdentity } from "@quizrealm/shared";
import AdminShell from "./AdminShell";
import AdminDashboard from "./Dashboard";
import AdminPlaceholderPage from "./PlaceholderPage";
import PlayersPage from "./pages/PlayersPage";
import ChatModerationPage from "./pages/ChatModerationPage";
import QuestionReviewPage from "./pages/QuestionReviewPage";

/// Panoul de administrare, ca aplicație de sine stătătoare.
///
/// Accesul e verificat de server la fiecare cerere; poarta de aici e doar ca
/// utilizatorul să primească un mesaj clar în loc de o pagină plină de erori.
export default function App() {
  const [location] = useLocation();
  const [state, setState] = useState<{ loading: boolean; user?: UserIdentity; error?: string }>({
    loading: true,
  });
  const [moderationCount, setModerationCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    authApi
      .me()
      .then((user) => setState({ loading: false, user }))
      .catch((error) =>
        setState({ loading: false, error: error instanceof Error ? error.message : "Acces refuzat" }),
      );
  }, []);

  if (state.loading) {
    return (
      <div className="admin-root grid min-h-screen place-items-center text-sm text-[#8b83a3]">
        Se verifică accesul…
      </div>
    );
  }

  if (!state.user || !isStaff(state.user.role)) {
    return <AccessDenied />;
  }

  return (
    <AdminShell user={state.user} moderationCount={moderationCount}>
      {pageFor(location, setModerationCount)}
    </AdminShell>
  );
}

/// Ecranele deja construite. Restul rutelor din meniu primesc pagina care spune
/// ce va face secțiunea și în ce stadiu e, ca navigația să fie completă de la
/// început.
function pageFor(location: string, onModerationCount: (count: number) => void) {
  // Rutele păstrează prefixul `/admin`, la fel ca în `navigation.ts`: panoul e
  // servit sub `/admin`, deci calea din bara de adrese e cea completă.
  switch (location) {
    case "/admin":
      return <AdminDashboard onModerationCount={onModerationCount} />;
    case "/admin/players":
      return <PlayersPage />;
    case "/admin/moderation/chat":
      return <ChatModerationPage />;
    case "/admin/questions/review":
      return <QuestionReviewPage />;
    default:
      return <AdminPlaceholderPage path={location} />;
  }
}

function AccessDenied() {
  return (
    <div className="admin-root grid min-h-screen place-items-center px-5">
      <div className="admin-panel max-w-md p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#c7779b]/12 text-[#e596a8]">
          <Shield size={20} />
        </div>
        <h1 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#e8c56a]">
          Consiliul îți taie calea
        </h1>
        <p className="mt-3 text-[12px] leading-6 text-[var(--admin-muted)]">
          Accesul de administrator e verificat de backendul QuizRealm. Autentifică-te cu un cont de
          administrator ca să intri în camera de control.
        </p>
        <Link
          href="/"
          onClick={(event) => {
            // Autentificarea trăiește în aplicația publică, nu în panou: un al
            // doilea formular de login ar însemna a doua cale de intrare de
            // întreținut și de securizat.
            event.preventDefault();
            window.location.assign("/auth");
          }}
          className="admin-gold-button mt-6 inline-flex rounded-xl px-5 py-3 text-[12px] font-bold"
        >
          Autentifică-te ca admin
        </Link>
      </div>
    </div>
  );
}
