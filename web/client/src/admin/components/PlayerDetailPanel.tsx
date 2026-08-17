import { useEffect, useState } from "react";
import {
  BadgeCheck, ChevronRight, Eye, EyeOff, Gavel, Globe, Loader2, MessageSquare,
  MonitorSmartphone, ShieldCheck, StickyNote, UserRound, X,
} from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import type { PlayerDetail } from "@/lib/playerTypes";
import Avatar from "./Avatar";
import { countryName, relativeTime, statusTone } from "./playerFormat";

interface Props {
  id: string;
  onClose: () => void;
  /// Se cheamă după orice acțiune care schimbă contul, ca lista din stânga să
  /// nu rămână cu o stare pe care panoul a schimbat-o deja.
  onChanged: () => void;
  onNotice: (text: string, tone: "ok" | "error") => void;
}

export default function PlayerDetailPanel({ id, onClose, onChanged, onNotice }: Props) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setEmail(null);
    setError(null);
    setShowProfile(false);
    quizRealmApi.adminPlayerDetail(id)
      .then((data) => { if (alive) setDetail(data as PlayerDetail); })
      .catch((cause) => { if (alive) setError(cause instanceof Error ? cause.message : "Contul nu a putut fi încărcat."); });
    return () => { alive = false; };
  }, [id]);

  const revealEmail = async () => {
    if (email) { setEmail(null); return; }
    try {
      const result = await quizRealmApi.adminRevealEmail(id);
      setEmail(result.email);
      onNotice("E-mailul a fost dezvăluit; acțiunea a fost consemnată în audit.", "ok");
    } catch (cause) {
      onNotice(cause instanceof Error ? cause.message : "Dezvăluirea a eșuat.", "error");
    }
  };

  const runAction = async (action: string, successText: string) => {
    setBusy(true);
    try {
      await quizRealmApi.adminPlayersBulk(action, [id]);
      onNotice(successText, "ok");
      const fresh = await quizRealmApi.adminPlayerDetail(id);
      setDetail(fresh as PlayerDetail);
      onChanged();
    } catch (cause) {
      onNotice(cause instanceof Error ? cause.message : "Acțiunea a eșuat.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <aside className="admin-detail admin-panel flex flex-col">
        <div className="admin-empty flex-1">{error}</div>
      </aside>
    );
  }

  if (!detail) {
    return (
      <aside className="admin-detail admin-panel grid place-items-center">
        <Loader2 size={18} className="animate-spin text-[var(--admin-dim)]" />
      </aside>
    );
  }

  const suspended = detail.status === "SUSPENDED";
  const tone = statusTone(detail.status);

  return (
    <aside className="admin-detail admin-panel flex min-h-0 flex-col">
      <header className="relative shrink-0 px-3 pb-2.5 pt-3">
        <button onClick={onClose} className="admin-detail-close" aria-label="Închide panoul">
          <X size={13} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="relative shrink-0">
            <Avatar name={detail.displayName} id={detail.id} size={52} ring={tone.colour} />
            <span className="admin-level-pip">{detail.level}</span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-[#efe7ff]">{detail.displayName}</span>
              {detail.verified && <BadgeCheck size={13} className="shrink-0 text-[#5eead4]" />}
            </div>
            <div className="truncate text-[10.5px] text-[var(--admin-dim)]">@{detail.username}</div>
          </div>
        </div>

        <dl className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[9.5px] text-[var(--admin-dim)]">Player ID</dt>
            <dd className="font-mono text-[10px] text-[#ded6f0]">{detail.playerId}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[9.5px] text-[var(--admin-dim)]">Email</dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-mono text-[10px] text-[#ded6f0]">
                {email ?? detail.emailMasked}
              </span>
              <button
                onClick={revealEmail}
                title={email ? "Ascunde e-mailul" : "Dezvăluie e-mailul complet (se consemnează în audit)"}
                className="shrink-0 text-[var(--admin-dim)] hover:text-[#b9a3ff]"
              >
                {email ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
            </dd>
          </div>
        </dl>
      </header>

      <div className="admin-scroll min-h-0 flex-1 overflow-y-auto border-t border-[var(--admin-line)] px-3 py-1.5">
        <Field
          icon={<Globe size={11} />}
          label="Country / Language"
          value={
            <>
              {detail.countryCode ? <span className="admin-cc">{detail.countryCode}</span> : "—"}
              <span className="ml-1.5 max-w-[110px] truncate text-[var(--admin-dim)]">
                {countryName(detail.countryCode) ?? detail.continent}
              </span>
            </>
          }
          hint={detail.language.reason}
        />
        <Field icon={<ShieldCheck size={11} />} label="Current Role" value={roleLabel(detail.role)} />
        <Field
          icon={<UserRound size={11} />}
          label="Faction / Campaign"
          value={<span className="text-[var(--admin-dim)]">—</span>}
          hint={detail.faction.reason}
        />
        <Field
          icon={<span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.colour }} />}
          label="Account Status"
          value={<span style={{ color: tone.colour }}>{tone.label}</span>}
        />
        <Field
          icon={<BadgeCheck size={11} />}
          label="Trust Score"
          value={
            <span className="flex items-center gap-1.5">
              <span className="font-mono">{detail.trust.value} / 100</span>
              <span className="admin-trust-track" aria-hidden>
                <span style={{ width: `${detail.trust.value}%`, background: trustColour(detail.trust.value) }} />
              </span>
            </span>
          }
          hint={detail.trust.basis}
        />
        <Field icon={<span className="admin-field-dot" />} label="Joined At" value={formatDateTime(detail.joinedAt)} />
        <Field
          icon={<span className="admin-field-dot" />}
          label="Last Login"
          value={detail.lastLoginAt ? relativeTime(detail.lastLoginAt) : <span className="text-[var(--admin-dim)]">never</span>}
        />
        <Field
          icon={<MonitorSmartphone size={11} />}
          label="Linked Devices"
          value={`${detail.linkedDevices} ${detail.linkedDevices === 1 ? "device" : "devices"}`}
          hint="Sesiuni de autentificare active, grupate după eticheta de dispozitiv."
        />

        {showProfile && (
          <div className="admin-profile-block">
            <div className="admin-eyebrow mb-1.5">Progres în joc</div>
            <div className="grid grid-cols-3 gap-1.5">
              <Stat label="Level" value={detail.level} />
              <Stat label="XP" value={detail.xp} />
              <Stat label="ELO" value={detail.eloRating} />
              <Stat label="Meciuri" value={detail.matches} />
              <Stat label="Coins" value={detail.coins} />
              <Stat label="Gems" value={detail.gems} />
              <Stat label="Rapoarte primite" value={detail.reportsAgainst} />
              <Stat label="Rapoarte făcute" value={detail.reportsMade} />
              <Stat label="Treaptă chat" value={`T${detail.trust.tier}`} />
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 space-y-1.5 border-t border-[var(--admin-line)] p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setShowProfile((on) => !on)}
            className="admin-action-button is-violet"
          >
            <UserRound size={12} /> {showProfile ? "Hide Profile" : "View Profile"}
          </button>
          <button
            disabled
            title="Nu există încă un flux prin care panoul să trimită un mesaj în joc. Vezi ai/needdesign.md."
            className="admin-action-button is-blue"
          >
            <MessageSquare size={12} /> Send Message
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            disabled
            title="Notele de cont n-au model în baza de date. Vezi ai/needdesign.md."
            className="admin-action-button"
          >
            <StickyNote size={12} /> Add Note
          </button>
          <button
            disabled={busy}
            onClick={() => runAction(
              suspended ? "unsuspend" : "suspend",
              suspended ? "Contul a fost reactivat." : "Contul a fost suspendat și sesiunile revocate.",
            )}
            className="admin-action-button is-gold"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Gavel size={12} />}
            {suspended ? "Unsuspend" : "Suspend"}
          </button>
        </div>

        <button
          disabled
          title="Un ban distinct de suspendare cere motiv, durată și legătură cu contestația. Modelul are doar `users.banned_at`. Vezi ai/needdesign.md."
          className="admin-action-button is-danger w-full"
        >
          <Gavel size={12} /> Ban
        </button>
      </footer>
    </aside>
  );
}

function Field({
  icon, label, value, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="admin-field" title={hint}>
      <span className="admin-field-icon">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--admin-muted)]">{label}</span>
      <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#ded6f0]">{value}</span>
      <ChevronRight size={10} className="shrink-0 text-[#3f3952]" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-stat-cell">
      <div className="truncate text-[8px] uppercase tracking-wider text-[var(--admin-dim)]">{label}</div>
      <div className="font-mono text-[11px] font-bold text-[#efe7ff]">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
    </div>
  );
}

function trustColour(value: number): string {
  if (value >= 80) return "#34d399";
  if (value >= 50) return "#e0ba58";
  return "#f87171";
}

function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN": return "Admin";
    case "MODERATOR": return "Moderator";
    case "CONTENT_EDITOR": return "Content Editor";
    case "SUPPORT": return "Support";
    default: return "Player";
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
