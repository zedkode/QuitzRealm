import {
  Activity, BarChart3, Bell, Boxes, CalendarClock, Coins, Database, FileQuestion,
  FileText, Flag, Gift, LayoutDashboard, type LucideIcon, Megaphone, ScrollText,
  Server, Shield, ShoppingBag, ShoppingCart, Swords, Target, Timer, ToggleLeft,
  Trophy, Users,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminNavGroup {
  /// Cheia stabilă sub care se ține starea de pliere. Nu derivă din etichetă:
  /// redenumirea unui grup n-are voie să reseteze preferința utilizatorului.
  key: string;
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
  /// Pastilă numerică (ex. coada de moderare).
  badgeKey?: "moderation";
}

export const DASHBOARD_ITEM: AdminNavItem & { icon: LucideIcon } = {
  label: "Dashboard",
  href: "/admin",
  icon: LayoutDashboard,
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    key: "players", label: "Players", icon: Users,
    items: [
      { label: "All Players", href: "/admin/players" },
      { label: "Roles & Permissions", href: "/admin/players/roles" },
      { label: "Bans / Suspensions", href: "/admin/players/bans" },
      { label: "Player Inventory", href: "/admin/players/inventory" },
      { label: "Player Transactions", href: "/admin/players/transactions" },
    ],
  },
  {
    key: "questions", label: "Questions", icon: FileQuestion,
    items: [
      { label: "All Questions", href: "/admin/questions" },
      { label: "Create Question", href: "/admin/questions/create" },
      { label: "Review Queue", href: "/admin/questions/review" },
      { label: "Reported Questions", href: "/admin/questions/reported" },
      { label: "Import / Export", href: "/admin/questions/import-export" },
      { label: "Categories", href: "/admin/questions/categories" },
      { label: "Question Analytics", href: "/admin/questions/analytics" },
    ],
  },
  {
    key: "game-content", label: "Game Content", icon: Boxes,
    items: [
      { label: "Game Modes", href: "/admin/game/modes" },
      { label: "Categories", href: "/admin/game/categories" },
      { label: "Difficulty", href: "/admin/game/difficulty" },
      { label: "Ranks", href: "/admin/game/ranks" },
      { label: "Levels", href: "/admin/game/levels" },
      { label: "Achievements", href: "/admin/game/achievements" },
      { label: "Badges", href: "/admin/game/badges" },
      { label: "Avatars", href: "/admin/game/avatars" },
      { label: "Cosmetics", href: "/admin/game/cosmetics" },
      { label: "Rules & Regulations", href: "/admin/game/rules" },
    ],
  },
  {
    key: "campaigns", label: "Campaigns", icon: Flag,
    items: [
      { label: "Seasons", href: "/admin/campaigns/seasons" },
      { label: "Romania Map", href: "/admin/campaigns/map" },
      { label: "Counties", href: "/admin/campaigns/counties" },
      { label: "Factions", href: "/admin/campaigns/factions" },
      { label: "Territory Rules", href: "/admin/campaigns/territory-rules" },
      { label: "Rewards", href: "/admin/campaigns/rewards" },
      { label: "Campaign History", href: "/admin/campaigns/history" },
    ],
  },
  {
    key: "challenges", label: "Challenges", icon: Target,
    items: [
      { label: "Daily", href: "/admin/challenges/daily" },
      { label: "Weekly", href: "/admin/challenges/weekly" },
      { label: "Seasonal", href: "/admin/challenges/seasonal" },
      { label: "Special", href: "/admin/challenges/special" },
      { label: "Challenge Builder", href: "/admin/challenges/builder" },
    ],
  },
  {
    key: "events", label: "Events", icon: CalendarClock,
    items: [
      { label: "Active Events", href: "/admin/events/active" },
      { label: "Scheduled", href: "/admin/events/scheduled" },
      { label: "Event Builder", href: "/admin/events/builder" },
      { label: "Event Calendar", href: "/admin/events/calendar" },
      { label: "Event History", href: "/admin/events/history" },
    ],
  },
  {
    key: "matches", label: "Matches", icon: Swords,
    items: [
      { label: "Live Matches", href: "/admin/matches/live" },
      { label: "Matchmaking", href: "/admin/matches/matchmaking" },
      { label: "Match History", href: "/admin/matches/history" },
      { label: "Replays", href: "/admin/matches/replays" },
      { label: "Failed Matches", href: "/admin/matches/failed" },
    ],
  },
  {
    key: "moderation", label: "Moderation", icon: Shield, badgeKey: "moderation",
    items: [
      { label: "Player Reports", href: "/admin/moderation/reports" },
      { label: "Chat Moderation", href: "/admin/moderation/chat" },
      { label: "Appeals", href: "/admin/moderation/appeals" },
      { label: "Question Reports", href: "/admin/moderation/questions" },
      { label: "Automated Detection", href: "/admin/moderation/automated" },
    ],
  },
  {
    key: "economy", label: "Economy", icon: Coins,
    items: [
      { label: "Currency", href: "/admin/economy/currency" },
      { label: "Transactions", href: "/admin/economy/transactions" },
      { label: "Economy Analytics", href: "/admin/economy/analytics" },
      { label: "Sinks / Sources", href: "/admin/economy/sinks-sources" },
      { label: "Fraud", href: "/admin/economy/fraud" },
    ],
  },
  {
    key: "store", label: "Store — Real Money", icon: ShoppingCart,
    items: [
      { label: "Products", href: "/admin/store/products" },
      { label: "Battle Pass", href: "/admin/store/battle-pass" },
      { label: "Bundles", href: "/admin/store/bundles" },
      { label: "Premium Currency", href: "/admin/store/premium-currency" },
      { label: "Subscriptions", href: "/admin/store/subscriptions" },
      { label: "Promo Codes", href: "/admin/store/promo-codes" },
      { label: "Refunds", href: "/admin/store/refunds" },
      { label: "Revenue", href: "/admin/store/revenue" },
    ],
  },
  {
    key: "shop", label: "Shop — Game Coins", icon: ShoppingBag,
    items: [
      { label: "Items", href: "/admin/shop/items" },
      { label: "Cosmetics", href: "/admin/shop/cosmetics" },
      { label: "Power-ups", href: "/admin/shop/powerups" },
      { label: "Daily Rotation", href: "/admin/shop/daily-rotation" },
      { label: "Weekly Rotation", href: "/admin/shop/weekly-rotation" },
      { label: "Limited Items", href: "/admin/shop/limited" },
      { label: "Shop History", href: "/admin/shop/history" },
    ],
  },
  {
    key: "rewards", label: "Rewards", icon: Gift,
    items: [
      { label: "Reward Builder", href: "/admin/rewards/builder" },
      { label: "Daily Rewards", href: "/admin/rewards/daily" },
      { label: "Challenge Rewards", href: "/admin/rewards/challenges" },
      { label: "Campaign Rewards", href: "/admin/rewards/campaigns" },
      { label: "Ranking Rewards", href: "/admin/rewards/ranking" },
      { label: "Compensation", href: "/admin/rewards/compensation" },
    ],
  },
  {
    key: "live-ops", label: "Live Ops", icon: Activity,
    items: [
      { label: "Events", href: "/admin/live-ops/events" },
      { label: "Challenges", href: "/admin/live-ops/challenges" },
      { label: "Multipliers", href: "/admin/live-ops/multipliers" },
      { label: "Shop Rotation", href: "/admin/live-ops/shop-rotation" },
      { label: "Announcements", href: "/admin/live-ops/announcements" },
      { label: "Compensation", href: "/admin/live-ops/compensation" },
      { label: "Overrides", href: "/admin/live-ops/overrides" },
    ],
  },
  {
    key: "cms", label: "Content / CMS", icon: FileText,
    items: [
      { label: "Homepage", href: "/admin/cms/homepage" },
      { label: "Banners", href: "/admin/cms/banners" },
      { label: "News", href: "/admin/cms/news" },
      { label: "Codex", href: "/admin/cms/codex" },
      { label: "Patch Notes", href: "/admin/cms/patch-notes" },
      { label: "FAQ", href: "/admin/cms/faq" },
      { label: "Translations", href: "/admin/cms/translations" },
    ],
  },
  {
    key: "notifications", label: "Notifications", icon: Megaphone,
    items: [
      { label: "Push", href: "/admin/notifications/push" },
      { label: "In-game Inbox", href: "/admin/notifications/inbox" },
      { label: "Announcements", href: "/admin/notifications/announcements" },
      { label: "Scheduled Messages", href: "/admin/notifications/scheduled" },
    ],
  },
  {
    key: "analytics", label: "Analytics", icon: BarChart3,
    items: [
      { label: "Players", href: "/admin/analytics/players" },
      { label: "Questions", href: "/admin/analytics/questions" },
      { label: "Matches", href: "/admin/analytics/matches" },
      { label: "Economy", href: "/admin/analytics/economy" },
      { label: "Campaigns", href: "/admin/analytics/campaigns" },
      { label: "Retention", href: "/admin/analytics/retention" },
    ],
  },
  {
    key: "system", label: "System", icon: Server,
    items: [
      { label: "General Settings", href: "/admin/system/settings" },
      { label: "Admin Users", href: "/admin/system/admins" },
      { label: "Roles & Permissions", href: "/admin/system/roles" },
      { label: "Security", href: "/admin/system/security" },
      { label: "Audit", href: "/admin/system/audit" },
    ],
  },
  {
    key: "system-tools", label: "System Tools", icon: ToggleLeft,
    items: [
      { label: "Feature Flags", href: "/admin/tools/feature-flags" },
      { label: "Logs", href: "/admin/tools/logs" },
      { label: "Jobs", href: "/admin/tools/jobs" },
      { label: "Backups", href: "/admin/tools/backups" },
      { label: "Monitoring", href: "/admin/tools/monitoring" },
    ],
  },
];

/// Toate rutele plate, pentru rutare și pentru titlul paginii.
export const ADMIN_ROUTES: Array<AdminNavItem & { group: string }> = ADMIN_NAV.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

/// Grupul care conține ruta dată, ca meniul să se deschidă singur pe pagina
/// curentă în loc să lase utilizatorul să caute unde se află.
export function groupKeyForPath(path: string): string | undefined {
  const match = ADMIN_NAV.find((group) => group.items.some((item) => item.href === path));
  if (match) return match.key;
  // Rute mai adânci decât cele listate: se ia cel mai lung prefix potrivit.
  const prefixed = ADMIN_NAV.find((group) =>
    group.items.some((item) => path.startsWith(`${item.href}/`)),
  );
  return prefixed?.key;
}

export { Bell, Database, ScrollText, Timer, Trophy };
