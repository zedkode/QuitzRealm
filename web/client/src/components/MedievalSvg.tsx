import type { SVGProps } from "react";

export function RealmCrest({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className} {...props}>
    <path d="M32 4 55 13v18c0 13-9.9 23.9-23 29C18.9 54.9 9 44 9 31V13L32 4Z" fill="url(#crest-fill)" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 24h26l-3 6v12H22V30l-3-6Zm7-8 6 6 6-6 4 5H22l4-5Z" fill="currentColor"/>
    <path d="M25 47h14M32 14v33" stroke="#F8E7B0" strokeWidth="1.5" strokeLinecap="round" opacity=".72"/>
    <defs><linearGradient id="crest-fill" x1="10" y1="6" x2="54" y2="59" gradientUnits="userSpaceOnUse"><stop stopColor="#3B245F"/><stop offset=".5" stopColor="#151020"/><stop offset="1" stopColor="#21172D"/></linearGradient></defs>
  </svg>;
}

export function RuneDivider({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 560 30" fill="none" preserveAspectRatio="none" aria-hidden="true" className={className} {...props}>
    <path d="M0 15h205l15-10 15 10h90l15-10 15 10h205" stroke="currentColor" strokeWidth="1" opacity=".48"/>
    <path d="m260 15 20-14 20 14-20 14-20-14Z" fill="#151020" stroke="currentColor"/>
    <circle cx="280" cy="15" r="4" fill="currentColor"/>
  </svg>;
}

export function CornerFiligree({ flip = false, className, ...props }: SVGProps<SVGSVGElement> & { flip?: boolean }) {
  return <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className={className} style={{ transform: flip ? "scaleX(-1)" : undefined, ...props.style }} {...props}>
    <path d="M4 110C38 110 8 76 46 76c38 0 8-38 70-38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 92c18 0 8-25 29-25 21 0 11-26 52-26" stroke="currentColor" strokeWidth="1" opacity=".72"/>
    <circle cx="12" cy="110" r="5" fill="currentColor"/><circle cx="46" cy="76" r="4" fill="currentColor"/><circle cx="116" cy="38" r="5" fill="currentColor"/>
  </svg>;
}

export function AvatarRuneRing({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className} {...props}>
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2"/>
    <circle cx="50" cy="50" r="40" stroke="#F8E7B0" strokeWidth="1" strokeDasharray="2 7" opacity=".8"/>
    <path d="m50 1 4 8-4 8-4-8 4-8ZM99 50l-8 4-8-4 8-4 8 4ZM50 99l-4-8 4-8 4 8-4 8ZM1 50l8-4 8 4-8 4-8-4Z" fill="currentColor"/>
  </svg>;
}

export function HeraldicAvatar({ variant = "astromancer", className, ...props }: SVGProps<SVGSVGElement> & { variant?: "astromancer" | "runeknight" | "oracle" }) {
  const palette = variant === "runeknight" ? { main: "#D9B45A", cloak: "#2B2638", glow: "#F6D27F" } : variant === "oracle" ? { main: "#9D7FE6", cloak: "#211A38", glow: "#CBB9FF" } : { main: "#2BC7B4", cloak: "#20253A", glow: "#A7F8EB" };
  return <svg viewBox="0 0 120 120" fill="none" aria-label={`${variant} heraldic avatar`} className={className} {...props}>
    <defs><radialGradient id={`avatar-${variant}`} cx=".35" cy=".22" r=".9"><stop stopColor="#4A3C62"/><stop offset=".58" stopColor="#161724"/><stop offset="1" stopColor="#07080F"/></radialGradient></defs>
    <circle cx="60" cy="60" r="58" fill={`url(#avatar-${variant})`}/><path d="M21 104c6-25 20-37 39-37s33 12 39 37" fill={palette.cloak} stroke={palette.main} strokeOpacity=".7"/>
    {variant === "runeknight" && <><path d="M37 61V41l12-15h22l12 15v20l-10 17H47L37 61Z" fill="#C2B8A2" stroke={palette.main} strokeWidth="3"/><path d="M45 50h30M60 31v39" stroke="#21202B" strokeWidth="3"/><path d="m50 79 10 10 10-10" stroke={palette.main} strokeWidth="3"/></>}
    {variant === "oracle" && <><path d="M28 67c2-29 16-47 32-47s30 18 32 47l-12 17H40L28 67Z" fill="#332654" stroke={palette.main} strokeWidth="2"/><ellipse cx="60" cy="54" rx="18" ry="22" fill="#EBDCC6"/><path d="M42 47c11-14 27-15 36 1" stroke="#171521" strokeWidth="8"/><path d="M51 58h18" stroke="#8A6BC9" strokeWidth="2"/><circle cx="60" cy="52" r="5" fill={palette.glow}/><path d="M25 40c10-12 21-17 35-17s25 5 35 17" stroke={palette.main} strokeDasharray="3 5" strokeWidth="2"/></>}
    {variant === "astromancer" && <><path d="M31 76c0-30 13-53 29-53s29 23 29 53l-12 10H43L31 76Z" fill="#20334D" stroke={palette.main} strokeWidth="2"/><ellipse cx="60" cy="53" rx="17" ry="21" fill="#E6D8C0"/><path d="M42 43c8-14 28-16 36 0" stroke="#151B2D" strokeWidth="9"/><path d="M43 60c7 6 27 6 34 0" stroke="#2BC7B4" strokeOpacity=".8"/><circle cx="72" cy="52" r="4" fill={palette.glow}/><path d="m80 33 11 7-7 11-11-7 7-11Z" fill="none" stroke={palette.main} strokeWidth="2"/></>}
  </svg>;
}

export function TerritoryMapSvg({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 760 420" fill="none" aria-label="Tactical territory map" className={className} {...props}>
    <defs>
      <linearGradient id="board" x1="40" y1="40" x2="720" y2="390" gradientUnits="userSpaceOnUse"><stop stopColor="#241B31"/><stop offset=".55" stopColor="#0F0D18"/><stop offset="1" stopColor="#21152E"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="7" y="7" width="746" height="406" rx="28" fill="url(#board)" stroke="#D9B45A" strokeOpacity=".45" strokeWidth="2"/>
    <path d="M70 125 160 58l118 35 97-48 116 48 124-9 76 79-43 101-125 59-105-26-114 56-117-49-115 29-61-92 64-116Z" fill="#14111F" stroke="#7E5CC7" strokeOpacity=".75" strokeWidth="2"/>
    <g stroke="#E3C36A" strokeOpacity=".38" strokeWidth="1.2">
      <path d="m160 58 31 104-121 79M278 93l-87 69 83 137M375 45l-101 254 144-2M491 93l-73 204 105 26M615 84l-92 239 125-59M691 163 523 323"/>
      <path d="M70 125h305l240-41M68 241l350 56 230-33M187 353l87-54 30 54M304 353l114-56 105 26"/>
    </g>
    <g filter="url(#glow)">
      <circle cx="191" cy="162" r="13" fill="#7E5CC7" stroke="#F8E7B0" strokeWidth="2"/><circle cx="418" cy="297" r="18" fill="#D9B45A" stroke="#FFF2C7" strokeWidth="2"/>
      <circle cx="523" cy="323" r="13" fill="#22B8A7" stroke="#CBFFF4" strokeWidth="2"/><circle cx="615" cy="84" r="12" fill="#7E5CC7" stroke="#F8E7B0" strokeWidth="2"/>
    </g>
    <path d="M191 162 418 297 523 323" stroke="#22B8A7" strokeWidth="2" strokeDasharray="5 8" filter="url(#glow)"/>
    <g fill="#D9B45A" opacity=".8"><circle cx="97" cy="83" r="2"/><circle cx="302" cy="73" r="2"/><circle cx="562" cy="155" r="2"/><circle cx="663" cy="275" r="2"/><circle cx="128" cy="310" r="2"/></g>
  </svg>;
}
