import {
  useCallback, useEffect, useId, useRef, useState, type ReactNode,
} from "react";

/// Suportul nativ pentru `popover`. Când există, stratul de sus, închiderea la
/// clic în afară și tasta Escape vin de la browser — nu mai are rost un
/// `useEffect` cu ascultători pe `document` care se scurg.
const NATIVE = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

interface PopoverProps {
  /// Butonul care deschide. Primește starea, ca să-și poată roti săgeata.
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  /// Aliniere față de declanșator.
  align?: "start" | "end";
  width?: number;
  className?: string;
}

export default function Popover({ trigger, children, align = "start", width, className = "" }: PopoverProps) {
  const id = useId().replace(/:/g, "");
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  /// Poziționarea se face după afișare: până când panoul nu e în strat, nu are
  /// dimensiuni, deci nu se poate ști dacă încape sub declanșator.
  const place = useCallback(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 6;

    let left = align === "end" ? rect.right - panelRect.width : rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelRect.width - margin));

    // Sub declanșator dacă încape; altfel deasupra. Un meniu care iese din
    // ecran e un meniu din care nu se poate alege ultima opțiune.
    const below = rect.bottom + margin;
    const top = below + panelRect.height > window.innerHeight - margin
      ? Math.max(margin, rect.top - panelRect.height - margin)
      : below;

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }, [align]);

  const close = useCallback(() => {
    const panel = panelRef.current;
    if (NATIVE && panel?.matches(":popover-open")) panel.hidePopover();
    else setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (NATIVE) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      else {
        panel.showPopover();
        place();
      }
    } else {
      setOpen((previous) => !previous);
    }
  }, [place]);

  // Starea locală urmărește ce face browserul, ca declanșatorul să știe dacă e
  // deschis chiar și când a fost închis prin clic în afară sau Escape.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !NATIVE) return;
    panel.setAttribute("popover", "auto");
    const onToggle = (event: Event) => {
      setOpen((event as ToggleEvent).newState === "open");
    };
    panel.addEventListener("toggle", onToggle);
    return () => panel.removeEventListener("toggle", onToggle);
  }, []);

  // Fără suport nativ, închiderea la clic în afară trebuie făcută de mână.
  useEffect(() => {
    if (NATIVE || !open) return;
    const onDown = (event: MouseEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Panoul e ancorat la coordonate de ecran, deci derularea îl lasă în urmă.
  useEffect(() => {
    if (!open || !NATIVE) return;
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

  return (
    <div ref={anchorRef} className={`relative ${NATIVE ? "" : "inline-block"}`}>
      {trigger({ open, toggle })}
      <div
        ref={panelRef}
        id={id}
        hidden={!NATIVE && !open}
        style={width ? { width } : undefined}
        className={`admin-popover ${NATIVE ? "" : "admin-popover-fallback"} ${className}`}
      >
        {children(close)}
      </div>
    </div>
  );
}

/// Un rând de meniu. Închide singur după acțiune: un meniu care rămâne deschis
/// după ce ai ales din el ascunde tocmai rezultatul alegerii.
export function MenuItem({
  icon, label, onSelect, close, tone = "default", disabled,
}: {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  close: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { onSelect(); close(); }}
      className={`admin-menu-item ${tone === "danger" ? "is-danger" : ""}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
