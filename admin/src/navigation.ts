import {
  Activity, BarChart3, Bell, Boxes, Briefcase, CalendarDays, Coins, Database,
  FileText, Flag, Gift, HardDrive, HelpCircle, LayoutDashboard, type LucideIcon,
  MonitorDot, ScrollText, Settings, Shield, ShoppingBag, ShoppingCart, Swords,
  Target, ToggleLeft, Users,
} from "lucide-react";

/// În ce stadiu se află ecranul. Se afișează pe pagina fiecărei secțiuni, ca
/// să se vadă dintr-o privire ce e funcțional și ce așteaptă încă backend.
export type AdminStage = "live" | "partial" | "backend" | "planned";

export const STAGE_META: Record<AdminStage, { label: string; tone: string; note: string }> = {
  live: {
    label: "Funcțional",
    tone: "live",
    note: "Ecranul e construit și lucrează pe date reale din backend.",
  },
  partial: {
    label: "Parțial",
    tone: "partial",
    note: "Ecranul e construit, dar o parte din date încă nu există în backend.",
  },
  backend: {
    label: "Backend gata",
    tone: "backend",
    note: "Endpoint-urile există și răspund; mai lipsește doar interfața.",
  },
  planned: {
    label: "Planificat",
    tone: "planned",
    note: "Nici modelul de date, nici ecranul nu sunt construite încă.",
  },
};

export interface AdminNavItem {
  label: string;
  href: string;
  /// Ce face pagina, într-o frază.
  summary: string;
  /// Ce va putea administratorul concret pe ea.
  capabilities: string[];
  stage: AdminStage;
  /// Ce anume lipsește, când stadiul nu e `live`.
  blocker?: string;
}

export interface AdminNavSection {
  /// Cheie stabilă sub care se ține starea de pliere. Nu derivă din etichetă:
  /// redenumirea unei secțiuni n-are voie să reseteze preferința utilizatorului.
  key: string;
  label: string;
  icon: LucideIcon;
  /// Ruta pentru secțiunile-frunză, fără copii.
  href?: string;
  items?: AdminNavItem[];
  badgeKey?: "moderation";
}

export interface AdminNavArea {
  label: string;
  sections: AdminNavSection[];
}

export const DASHBOARD_ITEM = { label: "Dashboard", href: "/admin", icon: LayoutDashboard };

const PLAYERS: AdminNavSection = {
  key: "players", label: "Players", icon: Users,
  items: [
    {
      label: "All Players", href: "/admin/players", stage: "live",
      summary: "Registrul complet de conturi, cu căutare și acțiuni de disciplină.",
      capabilities: [
        "Caută după username, e-mail sau id",
        "Suspendă și reactivează conturi (ban / unban)",
        "Revocă toate sesiunile active ale unui cont",
        "Shadow-ban pe chat și resetare forțată de parolă",
      ],
    },
    {
      label: "Roles & Permissions", href: "/admin/players/roles", stage: "backend",
      summary: "Cine e admin, moderator, editor de conținut sau suport.",
      capabilities: [
        "Schimbă rolul unui cont din enum-ul `AdminRole`",
        "Vezi ce rute de admin deschide fiecare rol",
        "Istoricul schimbărilor de rol din jurnalul de audit",
      ],
      blocker: "Rolurile există în baza de date și în gardă; lipsește doar ecranul de atribuire.",
    },
    {
      label: "Bans / Suspensions", href: "/admin/players/bans", stage: "backend",
      summary: "Lista sancțiunilor active, cu motiv și termen.",
      capabilities: [
        "Conturile suspendate acum, cu data suspendării",
        "Mut temporar pe chat, cu expirare",
        "Ridicare de sancțiune cu urmă în audit",
      ],
      blocker: "`bannedAt` și `chatMutedUntil` sunt aplicate deja la autentificare; lipsește ecranul dedicat.",
    },
    {
      label: "Player Inventory", href: "/admin/players/inventory", stage: "backend",
      summary: "Ce deține un jucător: cosmetice, powerups, monede, gems.",
      capabilities: [
        "Inventarul de cosmetice și powerups pe cont",
        "Soldurile de coins și gems, cu istoricul din registru",
        "Acordare sau retragere manuală, prin WalletService",
      ],
      blocker: "Modelele `UserInventory`, `UserPowerup` și `CurrencyLedger` există; lipsește ecranul.",
    },
    {
      label: "Player Transactions", href: "/admin/players/transactions", stage: "backend",
      summary: "Toate mișcările de valoare ale unui singur cont.",
      capabilities: [
        "Achiziții cu bani reali și starea lor",
        "Fiecare intrare din registrul de monedă, cu motiv",
        "Cine a provocat mișcarea, când n-a fost jucătorul",
      ],
      blocker: "`/admin/store/ledger` răspunde deja; lipsește vizualizarea pe cont.",
    },
  ],
};

const QUESTIONS: AdminNavSection = {
  key: "questions", label: "Questions", icon: HelpCircle,
  items: [
    {
      label: "All Questions", href: "/admin/questions", stage: "backend",
      summary: "Banca de întrebări, filtrabilă după stare, categorie și dificultate.",
      capabilities: [
        "Filtrare după `QuestionStatus`, categorie, sursă",
        "Editare de text, variante și răspuns corect",
        "Retragere din circulație fără ștergere",
      ],
      blocker: "`/admin/questions` întoarce deja lista; lipsește tabelul cu filtre.",
    },
    {
      label: "Create Question", href: "/admin/questions/create", stage: "planned",
      summary: "Formular de adăugare care publică direct ca aprobată.",
      capabilities: [
        "Grilă sau răspuns numeric, cu validare de variante",
        "Categorie, dificultate și sursă `CURATED`",
        "Publicare imediată, fără coada comunității",
      ],
      blocker: "Există `POST /questions`, dar e destinat comunității și are limită de 10/oră. Trebuie un endpoint de admin separat.",
    },
    {
      label: "Review Queue", href: "/admin/questions/review", stage: "live",
      summary: "Coada de întrebări trimise de jucători, în așteptarea deciziei.",
      capabilities: [
        "Aprobare sau respingere, cu efect imediat în joc",
        "Statistici pe coadă: câte așteaptă, câte s-au procesat",
        "Textul complet și variantele, înainte de decizie",
      ],
    },
    {
      label: "Reported Questions", href: "/admin/questions/reported", stage: "backend",
      summary: "Întrebări semnalate de jucători ca greșite sau nepotrivite.",
      capabilities: [
        "Motivul raportării și cine a raportat",
        "Corectare pe loc sau retragere din bancă",
        "Închiderea raportului cu urmă în audit",
      ],
      blocker: "Modelul `QuestionReport` există și se populează; lipsește ecranul.",
    },
    {
      label: "Import / Export", href: "/admin/questions/import-export", stage: "planned",
      summary: "Încărcare în masă din CSV sau JSON și export pentru revizuire.",
      capabilities: [
        "Import cu previzualizare și raport de erori pe rând",
        "Detectare de duplicate înainte de scriere",
        "Export filtrat, pentru corectură în afara panoului",
      ],
      blocker: "Nu există încă flux de import în bloc.",
    },
    {
      label: "Categories", href: "/admin/questions/categories", stage: "backend",
      summary: "Categoriile după care se împart întrebările și partidele.",
      capabilities: [
        "Adăugare, redenumire și ordonare",
        "Câte întrebări are fiecare categorie, pe dificultate",
        "Dezactivare fără ștergere, ca istoricul să rămână valid",
      ],
      blocker: "Modelul `Category` există; lipsește ecranul de administrare.",
    },
    {
      label: "Question Analytics", href: "/admin/questions/analytics", stage: "planned",
      summary: "Cât de grea e fiecare întrebare în practică, nu pe hârtie.",
      capabilities: [
        "Rata reală de răspuns corect față de dificultatea declarată",
        "Timpul mediu de răspuns",
        "Întrebări care nu apar niciodată sau apar prea des",
      ],
      blocker: "Datele există în `match_events`; lipsește agregarea și ecranul.",
    },
  ],
};

const GAME_CONTENT: AdminNavSection = {
  key: "game-content", label: "Game Content", icon: Boxes,
  items: [
    {
      label: "Game Modes", href: "/admin/game/modes", stage: "planned",
      summary: "Regulile fiecărui mod de joc: clasic, blitz, duo, privat.",
      capabilities: [
        "Număr de runde, timp pe întrebare, punctaj",
        "Activare și dezactivare fără redeploy",
        "Cine are voie în fiecare mod, după nivel sau rang",
      ],
      blocker: "`MatchMode` e enum fix în cod; parametrii nu sunt încă configurabili.",
    },
    {
      label: "Categories", href: "/admin/game/categories", stage: "backend",
      summary: "Aceleași categorii, privite dinspre joc: ce se poate alege în meci.",
      capabilities: [
        "Ce categorii apar în selecția de dinaintea partidei",
        "Ordinea și pictogramele lor",
        "Categorii sezoniere, active pe interval",
      ],
      blocker: "Modelul există; lipsește ecranul.",
    },
    {
      label: "Difficulty", href: "/admin/game/difficulty", stage: "planned",
      summary: "Pragurile care decid ce întrebare primește cine.",
      capabilities: [
        "Praguri de dificultate pe nivel de jucător",
        "Cum se amestecă dificultățile într-o partidă",
        "Simulare pe date reale înainte de salvare",
      ],
      blocker: "Algoritmul de selecție e în cod; nu are încă parametri în baza de date.",
    },
    {
      label: "Ranks", href: "/admin/game/ranks", stage: "planned",
      summary: "Treptele de rang și pragurile de ELO care le separă.",
      capabilities: ["Denumiri și praguri", "Insigne asociate", "Recompense la promovare"],
      blocker: "Nu există model de rang; există doar `eloRating` pe cont.",
    },
    {
      label: "Levels", href: "/admin/game/levels", stage: "planned",
      summary: "Curba de XP și ce se deblochează la fiecare nivel.",
      capabilities: ["Praguri de XP pe nivel", "Deblocări la nivel", "Previzualizarea curbei"],
      blocker: "`xp` și `level` există pe cont; curba nu e configurabilă.",
    },
    {
      label: "Achievements", href: "/admin/game/achievements", stage: "backend",
      summary: "Realizările pe care le pot debloca jucătorii.",
      capabilities: [
        "Condiție, raritate și recompensă",
        "Câți jucători au deblocat fiecare realizare",
        "Activare pe interval, pentru cele sezoniere",
      ],
      blocker: "`AchievementTemplate` și `UserAchievement` există; lipsește ecranul.",
    },
    {
      label: "Badges", href: "/admin/game/badges", stage: "backend",
      summary: "Insignele care se pot pune pe profil.",
      capabilities: ["Creare și ordonare", "Cum se obțin", "Sloturile de pe profil"],
      blocker: "`UserBadgeSlot` există; lipsește ecranul.",
    },
    {
      label: "Avatars", href: "/admin/game/avatars", stage: "backend",
      summary: "Avatarele disponibile și cum se obțin.",
      capabilities: ["Încărcare și retragere", "Condiție de deblocare", "Preț, când se vând"],
      blocker: "Intră sub `Cosmetic`; lipsește ecranul.",
    },
    {
      label: "Cosmetics", href: "/admin/game/cosmetics", stage: "backend",
      summary: "Tot ce e decorativ: rame, titluri, efecte.",
      capabilities: [
        "Creare pe tipul din `CosmeticType`",
        "Raritate și mod de obținere",
        "Cine le deține, prin `UserInventory`",
      ],
      blocker: "Modelul `Cosmetic` există; lipsește ecranul.",
    },
    {
      label: "Rules & Regulations", href: "/admin/game/rules", stage: "planned",
      summary: "Textul de reguli pe care îl vede jucătorul, cu versionare.",
      capabilities: ["Editor cu versiuni", "Publicare cu dată", "Confirmarea citirii de către jucători"],
      blocker: "Nu există model de conținut editorial.",
    },
  ],
};

const CAMPAIGNS: AdminNavSection = {
  key: "campaigns", label: "Campaigns", icon: Flag,
  items: [
    {
      label: "Seasons", href: "/admin/campaigns/seasons", stage: "planned",
      summary: "Sezoanele de cucerire: început, sfârșit, reguli, recompense.",
      capabilities: ["Programarea unui sezon", "Regulile lui de teritoriu", "Închidere cu acordarea premiilor"],
      blocker: "Nu există model de sezon. E prima piesă care lipsește din întregul bloc de campanii.",
    },
    {
      label: "Romania Map", href: "/admin/campaigns/map", stage: "planned",
      summary: "Harta persistentă a țării și cine stăpânește ce.",
      capabilities: ["Starea fiecărui teritoriu", "Intervenție manuală pe un teritoriu", "Istoricul stăpânirii"],
      blocker: "Partidele folosesc hărți hexagonale generate per meci; nu există stăpânire între meciuri.",
    },
    {
      label: "Counties", href: "/admin/campaigns/counties", stage: "planned",
      summary: "Cele 41 de județe plus Bucureștiul, ca unități de cucerit.",
      capabilities: ["Vecinătăți și puncte de valoare", "Grupare pe regiuni", "Blocare temporară"],
      blocker: "Nu există model de județ.",
    },
    {
      label: "Factions", href: "/admin/campaigns/factions", stage: "planned",
      summary: "Taberele între care se împart jucătorii într-un sezon.",
      capabilities: ["Nume, culoare, blazon", "Echilibrarea numărului de membri", "Bonusuri de facțiune"],
      blocker: "Nu există model de facțiune.",
    },
    {
      label: "Territory Rules", href: "/admin/campaigns/territory-rules", stage: "planned",
      summary: "Cum se cucerește, se apără și se pierde un teritoriu.",
      capabilities: ["Costul unui atac", "Durata contestării", "Perioadă de imunitate după cucerire"],
      blocker: "Regulile sunt în motorul de meci, nu în baza de date.",
    },
    {
      label: "Rewards", href: "/admin/campaigns/rewards", stage: "planned",
      summary: "Ce primesc jucătorii la finalul unui sezon.",
      capabilities: ["Praguri de recompensă", "Premii pe facțiune și individuale", "Livrare în bloc"],
      blocker: "Depinde de modelul de sezon.",
    },
    {
      label: "Campaign History", href: "/admin/campaigns/history", stage: "planned",
      summary: "Sezoanele încheiate și cum s-au terminat.",
      capabilities: ["Harta finală a fiecărui sezon", "Câștigători", "Comparație între sezoane"],
      blocker: "Depinde de modelul de sezon.",
    },
  ],
};

const CHALLENGES: AdminNavSection = {
  key: "challenges", label: "Challenges", icon: Target,
  items: [
    {
      label: "Daily", href: "/admin/challenges/daily", stage: "planned",
      summary: "Provocările care se resetează în fiecare zi.",
      capabilities: ["Condiție și recompensă", "Ora de reset", "Rata de finalizare"],
      blocker: "Nu există model de provocare.",
    },
    {
      label: "Weekly", href: "/admin/challenges/weekly", stage: "planned",
      summary: "Provocările de o săptămână, mai grele și mai bine plătite.",
      capabilities: ["Obiective compuse", "Progres parțial", "Recompense în trepte"],
      blocker: "Nu există model de provocare.",
    },
    {
      label: "Seasonal", href: "/admin/challenges/seasonal", stage: "planned",
      summary: "Provocările legate de sezonul de cucerire.",
      capabilities: ["Legarea de un sezon", "Obiective de facțiune", "Contribuție la harta campaniei"],
      blocker: "Depinde de modelele de provocare și de sezon.",
    },
    {
      label: "Special", href: "/admin/challenges/special", stage: "planned",
      summary: "Provocări punctuale, pentru evenimente sau compensații.",
      capabilities: ["Interval propriu", "Public țintit", "Activare imediată"],
      blocker: "Nu există model de provocare.",
    },
    {
      label: "Challenge Builder", href: "/admin/challenges/builder", stage: "planned",
      summary: "Constructorul vizual în care se compune o provocare.",
      capabilities: ["Condiții combinate", "Previzualizare pe date reale", "Salvare ca șablon"],
      blocker: "Depinde de modelul de provocare.",
    },
  ],
};

const EVENTS: AdminNavSection = {
  key: "events", label: "Events", icon: CalendarDays,
  items: [
    {
      label: "Active Events", href: "/admin/events/active", stage: "planned",
      summary: "Ce rulează chiar acum și cât mai are.",
      capabilities: ["Oprire de urgență", "Prelungire", "Participare în timp real"],
      blocker: "Nu există model de eveniment.",
    },
    {
      label: "Scheduled", href: "/admin/events/scheduled", stage: "planned",
      summary: "Evenimentele programate care încă n-au început.",
      capabilities: ["Reprogramare", "Anulare înainte de start", "Verificarea suprapunerilor"],
      blocker: "Nu există model de eveniment.",
    },
    {
      label: "Event Builder", href: "/admin/events/builder", stage: "planned",
      summary: "Unde se compune un eveniment, de la reguli la recompense.",
      capabilities: ["Interval și public", "Multiplicatori activi pe durată", "Bannere și anunțuri legate"],
      blocker: "Nu există model de eveniment.",
    },
    {
      label: "Event Calendar", href: "/admin/events/calendar", stage: "planned",
      summary: "Calendarul lunar cu tot ce e planificat.",
      capabilities: ["Vedere pe lună", "Detectarea suprapunerilor", "Mutare prin tragere"],
      blocker: "Nu există model de eveniment.",
    },
    {
      label: "Event History", href: "/admin/events/history", stage: "planned",
      summary: "Evenimentele încheiate și cum au performat.",
      capabilities: ["Participare și venit", "Comparație între ediții", "Export"],
      blocker: "Nu există model de eveniment.",
    },
  ],
};

const MATCHES: AdminNavSection = {
  key: "matches", label: "Matches", icon: Swords,
  items: [
    {
      label: "Live Matches", href: "/admin/matches/live", stage: "backend",
      summary: "Partidele în desfășurare, cu jucători și runda curentă.",
      capabilities: ["Lista partidelor `ACTIVE`", "Cine joacă și pe ce hartă", "Încheiere forțată a unei partide blocate"],
      blocker: "`Match` cu status `ACTIVE` se numără deja în tabloul de bord; lipsește ecranul.",
    },
    {
      label: "Matchmaking", href: "/admin/matches/matchmaking", stage: "planned",
      summary: "Cum se împerechează jucătorii și cât așteaptă.",
      capabilities: ["Timp mediu de așteptare", "Lărgimea intervalului de ELO", "Ajustare fără redeploy"],
      blocker: "Parametrii sunt în `backend/realtime`, nu în baza de date.",
    },
    {
      label: "Match History", href: "/admin/matches/history", stage: "backend",
      summary: "Toate partidele încheiate, cu rezultat și participanți.",
      capabilities: ["Filtrare pe mod, dată, jucător", "Rezultatul fiecărui participant", "Legătura către replay"],
      blocker: "`Match` și `MatchPlayer` conțin deja totul; lipsește ecranul.",
    },
    {
      label: "Replays", href: "/admin/matches/replays", stage: "backend",
      summary: "Reconstituirea unei partide, rundă cu rundă.",
      capabilities: ["Fiecare răspuns din `match_events`", "Timpii de răspuns", "Util la verificarea unui raport de trișare"],
      blocker: "Evenimentele se salvează deja; lipsește ecranul de redare.",
    },
    {
      label: "Failed Matches", href: "/admin/matches/failed", stage: "backend",
      summary: "Partide abandonate sau întrerupte de erori.",
      capabilities: ["Motivul întreruperii", "Cine a abandonat", "Compensarea celor afectați"],
      blocker: "Statusurile există; lipsește ecranul.",
    },
  ],
};

const MODERATION: AdminNavSection = {
  key: "moderation", label: "Moderation", icon: Shield, badgeKey: "moderation",
  items: [
    {
      label: "Player Reports", href: "/admin/moderation/reports", stage: "backend",
      summary: "Reclamațiile jucătorilor unii despre alții.",
      capabilities: ["Coada de rapoarte nerezolvate", "Contextul raportării", "Sancțiune direct din raport"],
      blocker: "`ChatReport` acoperă azi doar chatul; rapoartele generale de comportament n-au model separat.",
    },
    {
      label: "Chat Moderation", href: "/admin/moderation/chat", stage: "live",
      summary: "Mesajele raportate în chat și decizia asupra lor.",
      capabilities: [
        "Coada de rapoarte în așteptare",
        "Rezolvare cu motiv (`ChatReportResolution`)",
        "Mut temporar sau shadow-ban pentru autor",
      ],
    },
    {
      label: "Appeals", href: "/admin/moderation/appeals", stage: "planned",
      summary: "Contestațiile jucătorilor sancționați.",
      capabilities: ["Textul contestației", "Istoricul sancțiunilor contului", "Acceptare sau respingere motivată"],
      blocker: "Nu există flux de contestații.",
    },
    {
      label: "Question Reports", href: "/admin/moderation/questions", stage: "backend",
      summary: "Întrebările semnalate ca greșite, văzute dinspre moderare.",
      capabilities: ["Gruparea rapoartelor pe întrebare", "Corectare sau retragere", "Închiderea în bloc"],
      blocker: "`QuestionReport` există; lipsește ecranul.",
    },
    {
      label: "Automated Detection", href: "/admin/moderation/automated", stage: "partial",
      summary: "Ce prinde sistemul singur, înainte să raporteze cineva.",
      capabilities: ["Reguli antispam pe chat", "Tipare de trișare", "Prag de la care se sancționează automat"],
      blocker: "Detecția de spam pe chat funcționează deja și pune `chatMutedUntil`; restul regulilor nu există.",
    },
  ],
};

const ECONOMY: AdminNavSection = {
  key: "economy", label: "Economy", icon: Coins,
  items: [
    {
      label: "Currency", href: "/admin/economy/currency", stage: "backend",
      summary: "Cele două monede: coins câștigați în joc și gems cumpărați.",
      capabilities: [
        "Soldurile totale din economie",
        "Acordare manuală prin `WalletService`, cu urmă în registru",
        "Reconciliere sold față de registru",
      ],
      blocker: "`/admin/store/grant` și `/admin/store/reconcile` răspund deja; lipsește ecranul.",
    },
    {
      label: "Transactions", href: "/admin/economy/transactions", stage: "backend",
      summary: "Registrul complet de mișcări de monedă.",
      capabilities: ["Filtrare pe monedă, motiv, interval", "Cine a provocat mișcarea", "Export pentru contabilitate"],
      blocker: "`/admin/store/ledger` întoarce deja datele; lipsește tabelul.",
    },
    {
      label: "Economy Analytics", href: "/admin/economy/analytics", stage: "backend",
      summary: "Cât intră, cât iese și cât stă în circulație.",
      capabilities: ["Monede emise față de cheltuite", "Inflație pe interval", "Soldul mediu pe jucător activ"],
      blocker: "Registrul conține datele; lipsește agregarea în ecran.",
    },
    {
      label: "Sinks / Sources", href: "/admin/economy/sinks-sources", stage: "backend",
      summary: "De unde vin monedele și pe ce se duc.",
      capabilities: ["Clasament de surse după `LedgerReason`", "Clasament de consumatori", "Echilibrul dintre ele"],
      blocker: "`LedgerReason` e deja pe fiecare mișcare; lipsește raportul.",
    },
    {
      label: "Fraud", href: "/admin/economy/fraud", stage: "planned",
      summary: "Tipare suspecte de mișcare a valorii.",
      capabilities: ["Câștiguri anormal de mari", "Conturi legate prin transferuri", "Blocare preventivă"],
      blocker: "Nu există motor de reguli antifraudă.",
    },
  ],
};

const STORE: AdminNavSection = {
  key: "store", label: "Store", icon: ShoppingCart,
  items: [
    {
      label: "Products", href: "/admin/store/products", stage: "backend",
      summary: "Ce se vinde pe bani reali. Azi: pachetele de gems.",
      capabilities: [
        "Creare și editare de pachete (`GemPack`)",
        "Preț în cea mai mică unitate a monedei, niciodată în virgulă mobilă",
        "Retragere din vânzare fără ștergere, ca istoricul să rămână valid",
      ],
      blocker: "CRUD-ul complet există pe `/admin/store/gem-packs`; lipsește ecranul.",
    },
    {
      label: "Battle Pass", href: "/admin/store/battle-pass", stage: "planned",
      summary: "Sezonul plătit cu trepte de recompense.",
      capabilities: ["Treptele și pragurile de XP", "Recompense gratuite față de plătite", "Prețul și durata"],
      blocker: "Nu există model de battle pass.",
    },
    {
      label: "Bundles", href: "/admin/store/bundles", stage: "planned",
      summary: "Pachete combinate, vândute mai ieftin decât suma părților.",
      capabilities: ["Compunere din obiecte existente", "Reducere și durată", "Limită per cont"],
      blocker: "Nu există model de bundle; azi se vând doar pachete de gems.",
    },
    {
      label: "Premium Currency", href: "/admin/store/premium-currency", stage: "backend",
      summary: "Gems: câți s-au vândut, câți s-au dăruit, câți sunt în circulație.",
      capabilities: [
        "Pachetele active și bonusurile lor",
        "Gems vânduți față de gems acordați ca bonus",
        "Soldul total din economie",
      ],
      blocker: "`GemPack` separă deja `gems` de `bonusGems`; lipsește raportul.",
    },
    {
      label: "Subscriptions", href: "/admin/store/subscriptions", stage: "planned",
      summary: "Abonamente recurente și starea lor.",
      capabilities: ["Planuri și prețuri", "Reînnoiri și anulări", "Venit recurent lunar"],
      blocker: "Nu există model de abonament și nici procesator configurat.",
    },
    {
      label: "Promo Codes", href: "/admin/store/promo-codes", stage: "planned",
      summary: "Coduri de reducere sau de acordare directă.",
      capabilities: ["Generare în serie", "Limită de folosire și expirare", "Cine le-a folosit"],
      blocker: "Nu există model de cod promoțional.",
    },
    {
      label: "Refunds", href: "/admin/store/refunds", stage: "backend",
      summary: "Restituiri, cu retragerea a ceea ce s-a livrat.",
      capabilities: [
        "Achizițiile cu status `PAID`, gata de restituit",
        "Retragerea gems prin registru, nu prin scădere directă",
        "Motivul restituirii, salvat pe achiziție",
      ],
      blocker: "`PurchaseStatus.REFUNDED` și `LedgerReason.REFUND` există; lipsește ecranul și legătura cu procesatorul.",
    },
    {
      label: "Revenue", href: "/admin/store/revenue", stage: "backend",
      summary: "Analistul financiar: cât s-a încasat, de la cine, pe ce.",
      capabilities: [
        "Venit pe zi, săptămână și lună",
        "Produsele care aduc cei mai mulți bani",
        "Rata de conversie de la inițiere la plată",
      ],
      blocker: "`/admin/finance/summary` și seria de venit răspund deja; lipsește ecranul cu grafic.",
    },
  ],
};

const SHOP: AdminNavSection = {
  key: "shop", label: "Shop", icon: ShoppingBag,
  items: [
    {
      label: "Items", href: "/admin/shop/items", stage: "backend",
      summary: "Ce se cumpără cu monede câștigate în joc.",
      capabilities: ["Preț în coins sau gems", "Disponibilitate și ordine", "Câte s-au vândut"],
      blocker: "Obiectele există ca `Cosmetic` și `Powerup`; lipsește ecranul unificat de magazin.",
    },
    {
      label: "Cosmetics", href: "/admin/shop/cosmetics", stage: "backend",
      summary: "Cosmeticele puse la vânzare pe monede.",
      capabilities: ["Preț și raritate", "Perioadă de disponibilitate", "Cine le-a cumpărat"],
      blocker: "Modelul există; lipsește ecranul.",
    },
    {
      label: "Power-ups", href: "/admin/shop/powerups", stage: "backend",
      summary: "Powerups vandabile, cu efectul lor exact asupra partidei.",
      capabilities: [
        "Creare pe `PowerupEffect`, ca niciun efect necunoscut motorului să nu poată fi vândut",
        "Mărimea efectului și durata",
        "Preț în coins și în gems, activare și ordonare",
      ],
      blocker: "CRUD-ul complet există pe `/admin/store/powerups`; lipsește ecranul.",
    },
    {
      label: "Daily Rotation", href: "/admin/shop/daily-rotation", stage: "planned",
      summary: "Ce apare azi în magazin și ce se schimbă mâine.",
      capabilities: ["Selecție manuală sau automată", "Ora rotației", "Previzualizarea zilei următoare"],
      blocker: "Nu există model de rotație.",
    },
    {
      label: "Weekly Rotation", href: "/admin/shop/weekly-rotation", stage: "planned",
      summary: "Rotația săptămânală, cu obiecte mai rare.",
      capabilities: ["Programarea săptămânii", "Obiecte garantate", "Istoricul rotațiilor"],
      blocker: "Nu există model de rotație.",
    },
    {
      label: "Limited Items", href: "/admin/shop/limited", stage: "planned",
      summary: "Obiecte cu stoc sau termen limitat.",
      capabilities: ["Stoc total și rămas", "Termen de dispariție", "Limită per cont"],
      blocker: "Nu există câmp de stoc pe obiecte.",
    },
    {
      label: "Shop History", href: "/admin/shop/history", stage: "backend",
      summary: "Ce s-a vândut, cui și pe cât.",
      capabilities: ["Vânzări pe obiect și interval", "Monedă folosită", "Export"],
      blocker: "Registrul conține cheltuielile; lipsește raportul.",
    },
  ],
};

const REWARDS: AdminNavSection = {
  key: "rewards", label: "Rewards", icon: Gift,
  items: [
    {
      label: "Reward Builder", href: "/admin/rewards/builder", stage: "planned",
      summary: "Compunerea unui pachet de recompense refolosibil.",
      capabilities: ["Monede, obiecte și cosmetice într-un singur pachet", "Salvare ca șablon", "Previzualizare"],
      blocker: "Nu există model de pachet de recompensă.",
    },
    {
      label: "Daily Rewards", href: "/admin/rewards/daily", stage: "planned",
      summary: "Recompensa de conectare zilnică și seria ei.",
      capabilities: ["Calendarul de șapte zile", "Bonus de serie neîntreruptă", "Reset la ratare"],
      blocker: "Nu există model de recompensă zilnică.",
    },
    {
      label: "Challenge Rewards", href: "/admin/rewards/challenges", stage: "planned",
      summary: "Ce se primește la finalizarea unei provocări.",
      capabilities: ["Legarea de o provocare", "Recompense în trepte", "Livrare automată"],
      blocker: "Depinde de modelul de provocare.",
    },
    {
      label: "Campaign Rewards", href: "/admin/rewards/campaigns", stage: "planned",
      summary: "Premiile de sezon și de teritoriu.",
      capabilities: ["Premii pe facțiune", "Premii individuale după contribuție", "Livrare în bloc la închiderea sezonului"],
      blocker: "Depinde de modelul de sezon.",
    },
    {
      label: "Ranking Rewards", href: "/admin/rewards/ranking", stage: "planned",
      summary: "Recompensele de clasament, la închiderea perioadei.",
      capabilities: ["Praguri de poziție", "Clasamente naționale și globale", "Livrare programată"],
      blocker: "Clasamentul există; recompensele lui nu.",
    },
    {
      label: "Compensation", href: "/admin/rewards/compensation", stage: "backend",
      summary: "Despăgubiri în masă, după o defecțiune.",
      capabilities: [
        "Selecția celor afectați",
        "Acordare prin `WalletService`, cu motiv `ADMIN_GRANT`",
        "Urmă completă în jurnalul de audit",
      ],
      blocker: "Acordarea individuală funcționează deja; lipsește acordarea în masă și ecranul.",
    },
  ],
};

const LIVE_OPS: AdminNavSection = {
  key: "live-ops", label: "Live Ops", icon: Activity,
  items: [
    {
      label: "Events", href: "/admin/live-ops/events", stage: "planned",
      summary: "Pornirea și oprirea evenimentelor în timpul zilei, fără redeploy.",
      capabilities: ["Pornire imediată", "Oprire de urgență", "Efect vizibil în câteva secunde"],
      blocker: "Nu există model de eveniment.",
    },
    {
      label: "Challenges", href: "/admin/live-ops/challenges", stage: "planned",
      summary: "Împingerea unei provocări către jucători, pe loc.",
      capabilities: ["Public țintit", "Durată scurtă", "Anulare imediată"],
      blocker: "Nu există model de provocare.",
    },
    {
      label: "Multipliers", href: "/admin/live-ops/multipliers", stage: "planned",
      summary: "Multiplicatori temporari de XP și monede.",
      capabilities: ["Valoare și interval", "Aplicare pe mod sau global", "Oprire imediată"],
      blocker: "Nu există model de multiplicator global; există doar powerups individuale.",
    },
    {
      label: "Shop Rotation", href: "/admin/live-ops/shop-rotation", stage: "planned",
      summary: "Forțarea unei rotații de magazin înainte de termen.",
      capabilities: ["Rotație imediată", "Selecție manuală", "Revenire la programare"],
      blocker: "Nu există model de rotație.",
    },
    {
      label: "Announcements", href: "/admin/live-ops/announcements", stage: "planned",
      summary: "Mesaje afișate în joc, către toți sau către un segment.",
      capabilities: ["Text și interval", "Public țintit", "Retragere imediată"],
      blocker: "Nu există model de anunț.",
    },
    {
      label: "Compensation", href: "/admin/live-ops/compensation", stage: "backend",
      summary: "Despăgubirea rapidă a jucătorilor afectați de un incident.",
      capabilities: ["Selecție după interval de incident", "Acordare prin registru", "Raport de livrare"],
      blocker: "Acordarea individuală există; lipsește fluxul în masă.",
    },
    {
      label: "Overrides", href: "/admin/live-ops/overrides", stage: "planned",
      summary: "Suprascrieri temporare de configurație, cu expirare obligatorie.",
      capabilities: ["Valoare și termen", "Cine a pus-o și de ce", "Revenire automată la valoarea implicită"],
      blocker: "Nu există magazin de configurație în baza de date.",
    },
  ],
};

const CMS: AdminNavSection = {
  key: "cms", label: "Content / CMS", icon: FileText,
  items: [
    {
      label: "Homepage", href: "/admin/cms/homepage", stage: "planned",
      summary: "Secțiunile paginii publice, editabile fără deploy.",
      capabilities: ["Titluri și texte", "Ordinea secțiunilor", "Previzualizare înainte de publicare"],
      blocker: "Pagina publică e azi statică în cod.",
    },
    {
      label: "Banners", href: "/admin/cms/banners", stage: "planned",
      summary: "Bannerele din joc și de pe site.",
      capabilities: ["Imagine, link și interval", "Public țintit", "Ordinea de afișare"],
      blocker: "Nu există model de banner.",
    },
    {
      label: "News", href: "/admin/cms/news", stage: "planned",
      summary: "Anunțurile și noutățile pentru jucători.",
      capabilities: ["Editor cu previzualizare", "Publicare programată", "Fixare în capul listei"],
      blocker: "Nu există model de articol.",
    },
    {
      label: "Codex", href: "/admin/cms/codex", stage: "planned",
      summary: "Enciclopedia lumii de joc.",
      capabilities: ["Intrări pe categorii", "Deblocare prin progres", "Legături între intrări"],
      blocker: "Nu există model de codex.",
    },
    {
      label: "Patch Notes", href: "/admin/cms/patch-notes", stage: "planned",
      summary: "Notele de versiune, legate de versiunea aplicației.",
      capabilities: ["Structură pe categorii de schimbări", "Legare de versiunea publicată", "Afișare la prima pornire"],
      blocker: "Nu există model de notă de versiune.",
    },
    {
      label: "FAQ", href: "/admin/cms/faq", stage: "planned",
      summary: "Întrebările frecvente, grupate pe teme.",
      capabilities: ["Întrebare și răspuns", "Grupare și ordonare", "Căutare"],
      blocker: "Nu există model de conținut editorial.",
    },
    {
      label: "Translations", href: "/admin/cms/translations", stage: "planned",
      summary: "Textele traduse, pe limbă și pe cheie.",
      capabilities: ["Editare pe cheie", "Chei netraduse, evidențiate", "Import și export"],
      blocker: "Traducerile sunt azi în cod, nu în baza de date.",
    },
  ],
};

const NOTIFICATIONS: AdminNavSection = {
  key: "notifications", label: "Notifications", icon: Bell,
  items: [
    {
      label: "Push", href: "/admin/notifications/push", stage: "planned",
      summary: "Notificări către telefoanele jucătorilor.",
      capabilities: ["Titlu, text și acțiune la deschidere", "Segmentare", "Programare și raport de livrare"],
      blocker: "Nu există furnizor de push configurat și nici model de campanie.",
    },
    {
      label: "In-game Inbox", href: "/admin/notifications/inbox", stage: "planned",
      summary: "Mesajele care ajung în cutia poștală din joc.",
      capabilities: ["Mesaj cu atașament de recompensă", "Expirare", "Rata de citire"],
      blocker: "Nu există model de cutie poștală.",
    },
    {
      label: "Announcements", href: "/admin/notifications/announcements", stage: "planned",
      summary: "Anunțurile scurte, afișate în interfață.",
      capabilities: ["Text și interval", "Nivel de urgență", "Retragere imediată"],
      blocker: "Nu există model de anunț.",
    },
    {
      label: "Scheduled Messages", href: "/admin/notifications/scheduled", stage: "planned",
      summary: "Ce urmează să plece și când.",
      capabilities: ["Coada de trimiteri programate", "Anulare înainte de plecare", "Istoricul trimiterilor"],
      blocker: "Depinde de modelul de notificare.",
    },
  ],
};

const ANALYTICS: AdminNavSection = {
  key: "analytics", label: "Analytics", icon: BarChart3,
  items: [
    {
      label: "Players", href: "/admin/analytics/players", stage: "backend",
      summary: "Cine joacă, cât de des și de unde.",
      capabilities: ["Jucători activi zilnic și lunar", "Conturi noi pe zi", "Distribuție pe țară și pe nivel"],
      blocker: "`/admin/overview` calculează deja DAU, MAU și seria zilnică; lipsește ecranul dedicat.",
    },
    {
      label: "Questions", href: "/admin/analytics/questions", stage: "planned",
      summary: "Cum se comportă banca de întrebări în joc.",
      capabilities: ["Dificultate reală față de cea declarată", "Acoperire pe categorii", "Întrebări nefolosite"],
      blocker: "Datele există în `match_events`; lipsește agregarea.",
    },
    {
      label: "Matches", href: "/admin/analytics/matches", stage: "backend",
      summary: "Câte partide, în ce moduri, cu ce durată.",
      capabilities: ["Partide pe zi și pe mod", "Durata medie", "Rata de abandon"],
      blocker: "`Match` conține datele; lipsește ecranul.",
    },
    {
      label: "Economy", href: "/admin/analytics/economy", stage: "backend",
      summary: "Sănătatea economiei, pe termen lung.",
      capabilities: ["Emisiune față de consum", "Sold în circulație", "Venit pe jucător plătitor"],
      blocker: "Registrul conține datele; lipsește ecranul.",
    },
    {
      label: "Campaigns", href: "/admin/analytics/campaigns", stage: "planned",
      summary: "Cum au mers sezoanele de cucerire.",
      capabilities: ["Participare pe facțiune", "Teritorii schimbate pe zi", "Comparație între sezoane"],
      blocker: "Depinde de modelul de sezon.",
    },
    {
      label: "Retention", href: "/admin/analytics/retention", stage: "planned",
      summary: "Câți jucători se întorc după o zi, o săptămână, o lună.",
      capabilities: ["Cohorte pe săptămâna de înregistrare", "D1, D7, D30", "Unde anume se pierd jucătorii"],
      blocker: "Datele brute există; lipsește calculul de cohorte.",
    },
  ],
};

const SYSTEM: AdminNavSection = {
  key: "system", label: "System", icon: Settings,
  items: [
    {
      label: "General Settings", href: "/admin/system/settings", stage: "planned",
      summary: "Setările globale ale platformei.",
      capabilities: ["Mod de mentenanță", "Versiunea minimă de client acceptată", "Limite globale"],
      blocker: "Configurația e azi în variabile de mediu, nu în baza de date.",
    },
    {
      label: "Admin Users", href: "/admin/system/admins", stage: "backend",
      summary: "Cine are acces la acest panou.",
      capabilities: ["Lista conturilor cu rol de personal", "Acordare și retragere de rol", "Ultima activitate"],
      blocker: "Rolurile există în `AdminRole`; lipsește ecranul.",
    },
    {
      label: "Roles & Permissions", href: "/admin/system/roles", stage: "partial",
      summary: "Ce poate face fiecare rol, rută cu rută.",
      capabilities: [
        "Matricea rol × rută",
        "Rutele restrânse prin `@AdminRoles(...)`",
        "Verificare că nicio rută nu rămâne fără gardă",
      ],
      blocker: "Garda pe rol funcționează deja în backend; matricea nu e vizibilă în panou.",
    },
    {
      label: "Security", href: "/admin/system/security", stage: "partial",
      summary: "Autentificare, sesiuni și apărare împotriva abuzului.",
      capabilities: [
        "Sesiunile active ale personalului",
        "Obligativitatea 2FA pentru conturile cu rol",
        "Limitele de rată și originile permise",
      ],
      blocker: "2FA, revocarea de sesiuni și lista de origini funcționează; lipsește ecranul care le adună.",
    },
    {
      label: "Audit", href: "/admin/system/audit", stage: "backend",
      summary: "Urma fiecărei acțiuni făcute din acest panou.",
      capabilities: [
        "Cine, ce, când și de la ce adresă",
        "Ce s-a trimis, cu secretele curățate înainte de scriere",
        "Filtrare pe actor, acțiune și interval",
      ],
      blocker: "`/admin/finance/audit` întoarce deja jurnalul; lipsește vizualizatorul.",
    },
  ],
};

const SYSTEM_TOOLS: AdminNavSection[] = [
  {
    key: "feature-flags", label: "Feature Flags", icon: ToggleLeft, href: "/admin/tools/feature-flags",
    items: [{
      label: "Feature Flags", href: "/admin/tools/feature-flags", stage: "planned",
      summary: "Pornirea și oprirea funcțiilor fără redeploy.",
      capabilities: ["Comutator pe funcție", "Activare pentru un procent de jucători", "Istoricul comutărilor"],
      blocker: "Nu există magazin de flag-uri.",
    }],
  },
  {
    key: "logs", label: "Logs", icon: ScrollText, href: "/admin/tools/logs",
    items: [{
      label: "Logs", href: "/admin/tools/logs", stage: "planned",
      summary: "Jurnalele serviciilor, căutabile din panou.",
      capabilities: ["Filtrare pe serviciu și nivel", "Căutare în text", "Legătura către cererea care a produs eroarea"],
      blocker: "Jurnalele stau azi în Docker; nu sunt colectate central.",
    }],
  },
  {
    key: "jobs", label: "Jobs", icon: Briefcase, href: "/admin/tools/jobs",
    items: [{
      label: "Jobs", href: "/admin/tools/jobs", stage: "planned",
      summary: "Sarcinile programate și starea lor.",
      capabilities: ["Ultima rulare și rezultatul", "Pornire manuală", "Sarcini eșuate, cu reîncercare"],
      blocker: "Nu există coadă de sarcini expusă în panou.",
    }],
  },
  {
    key: "backups", label: "Backups", icon: HardDrive, href: "/admin/tools/backups",
    items: [{
      label: "Backups", href: "/admin/tools/backups", stage: "planned",
      summary: "Copiile de siguranță ale bazei de date.",
      capabilities: ["Ultima copie reușită și mărimea ei", "Pornire manuală", "Verificarea posibilității de restaurare"],
      blocker: "Copiile se fac pe server; nu sunt raportate către panou.",
    }],
  },
  {
    key: "monitoring", label: "Monitoring", icon: MonitorDot, href: "/admin/tools/monitoring",
    items: [{
      label: "Monitoring", href: "/admin/tools/monitoring", stage: "partial",
      summary: "Starea serviciilor și latențele lor.",
      capabilities: ["Verificare de sănătate pe serviciu", "Latența reală a bazei de date", "Alerte la degradare"],
      blocker: "Latența bazei se măsoară deja la fiecare încărcare a tabloului; restul serviciilor n-au sondă.",
    }],
  },
];

export const ADMIN_AREAS: AdminNavArea[] = [
  {
    label: "Main Navigation",
    sections: [
      PLAYERS, QUESTIONS, GAME_CONTENT, CAMPAIGNS, CHALLENGES, EVENTS, MATCHES,
      MODERATION, ECONOMY, STORE, SHOP, REWARDS, LIVE_OPS, CMS, NOTIFICATIONS,
      ANALYTICS, SYSTEM,
    ],
  },
  { label: "System Tools", sections: SYSTEM_TOOLS },
];

export const ALL_SECTIONS: AdminNavSection[] = ADMIN_AREAS.flatMap((area) => area.sections);

/// Toate rutele plate, pentru rutare și pentru antetul paginii.
export const ADMIN_ROUTES: Array<AdminNavItem & { section: string; sectionKey: string }> =
  ALL_SECTIONS.flatMap((section) =>
    (section.items ?? []).map((item) => ({ ...item, section: section.label, sectionKey: section.key })),
  );

export function routeFor(path: string) {
  return ADMIN_ROUTES.find((entry) => entry.href === path);
}

/// Prima rută a unei secțiuni: unde duce clicul pe capul de secțiune.
export function entryHref(section: AdminNavSection): string {
  return section.href ?? section.items?.[0]?.href ?? "/admin";
}

/// Secțiunea care conține ruta dată, ca meniul să se deschidă singur pe pagina
/// curentă în loc să lase utilizatorul să caute unde se află.
export function sectionKeyForPath(path: string): string | undefined {
  const exact = ALL_SECTIONS.find((section) =>
    (section.items ?? []).some((item) => item.href === path),
  );
  if (exact) return exact.key;
  // Rute mai adânci decât cele listate: se ia cel mai lung prefix potrivit.
  return ALL_SECTIONS.find((section) =>
    (section.items ?? []).some((item) => path.startsWith(`${item.href}/`)),
  )?.key;
}

export { Database, ScrollText };
