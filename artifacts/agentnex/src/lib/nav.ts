import {
  LayoutDashboard, UserRound, Building2, Globe2, Bot, Store, Handshake, PackageSearch,
  Workflow, Network, Code2, CreditCard, Settings, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  slug: string;
  href: string;
  label: string;
  icon: LucideIcon;
  live: boolean;
  phase?: string;
  description: string;
  planned?: string[];
  group: "Workspace" | "Network" | "Build" | "Account";
};

export const NAV: NavItem[] = [
  { slug: "dashboard", href: "/dashboard", label: "Overview", icon: LayoutDashboard, live: true, group: "Workspace", description: "Your personal workspace: onboarding progress, profile completion and getting-started checklist." },
  { slug: "profile", href: "/profile", label: "My Profile", icon: UserRound, live: true, group: "Workspace", description: "View and edit your display name, account type, country, timezone, language and professional description." },
  { slug: "organizations", href: "/organizations", label: "Organizations", icon: Building2, live: true, group: "Workspace", description: "Create organizations, invite members by manual link and manage role-based access for your team." },
  { slug: "global-network", href: "/global-network", label: "Global Network", icon: Globe2, live: false, phase: "Later phase", group: "Network", description: "Discover verified people, businesses and agents across the AGENTNEX network.", planned: ["Search verified identities across regions", "Filter by category, capability and country", "Privacy-respecting public profiles", "Consent-based connection requests"] },
  { slug: "agents", href: "/agents", label: "AI Agents", icon: Bot, live: false, phase: "Later phase", group: "Network", description: "Register AI agents with an Agent Passport: owner, capabilities, permissions and audit trail.", planned: ["Agent Passport with verifiable owner", "Declared capabilities and scoped permissions", "Revocable credentials", "Activity audit log"] },
  { slug: "marketplace", href: "/marketplace", label: "Agent Marketplace", icon: Store, live: false, phase: "Later phase", group: "Network", description: "Publish and install AI agents with transparent permissions and reviewed listings.", planned: ["Listings with declared permissions", "Review and verification process", "Install into your workspace with consent", "Publisher identity and support details"] },
  { slug: "business-network", href: "/business-network", label: "Business Network", icon: Handshake, live: false, phase: "Later phase", group: "Network", description: "Connect with businesses and partners through verified company profiles.", planned: ["Verified company profiles", "Connection requests and introductions", "Shared collaboration spaces", "Partner categories and industries"] },
  { slug: "procurement", href: "/procurement", label: "Procurement", icon: PackageSearch, live: false, phase: "Later phase", group: "Build", description: "Requests for quotation, supplier responses and approval workflows.", planned: ["Create and publish RFQs", "Collect and compare supplier quotations", "Approval steps with human sign-off", "Supplier verification status"] },
  { slug: "workflows", href: "/workflows", label: "Workflows", icon: Workflow, live: false, phase: "Later phase", group: "Build", description: "Design permission-controlled workflows that combine people, agents and approvals.", planned: ["Visual workflow builder", "Human approval checkpoints", "Agent steps with scoped permissions", "Run history and audit"] },
  { slug: "a2a", href: "/a2a", label: "Agent-to-Agent", icon: Network, live: false, phase: "Later phase", group: "Build", description: "Standards-based messaging between agents, with owner consent and traceability.", planned: ["Agent discovery by capability", "Signed agent-to-agent messages", "Owner-approved delegation", "Traceable conversation logs"] },
  { slug: "developers", href: "/developers", label: "Developer Platform", icon: Code2, live: false, phase: "Later phase", group: "Build", description: "API keys, webhooks and documentation for building on AGENTNEX.", planned: ["Scoped API keys", "Webhooks for identity and workflow events", "REST API reference", "Sandbox environment"] },
  { slug: "billing", href: "/billing", label: "Billing", icon: CreditCard, live: false, phase: "Later phase", group: "Account", description: "Plans, usage and invoices. No plans are available for purchase yet.", planned: ["Plan selection", "Usage visibility", "Invoices and receipts", "Payment method management"] },
  { slug: "settings", href: "/settings", label: "Settings", icon: Settings, live: true, group: "Account", description: "Theme, language and timezone preferences, account information and sign out." },
];

export const EXTRA_SEARCH = [
  { href: "/onboarding", label: "Onboarding", description: "Resume or review the three-step setup: identity, location and about you." },
  { href: "/network", label: "How the network works", description: "Public explanation of the AGENTNEX ecosystem concept." },
];

export const ACCOUNT_TYPES = [
  { value: "individual", label: "Individual", hint: "A person building their own verified presence." },
  { value: "business", label: "Business Representative", hint: "You act on behalf of a company or team." },
  { value: "developer", label: "Developer", hint: "You plan to build agents or integrations." },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ar", label: "العربية" },
  { value: "ur", label: "اردو" },
  { value: "zh", label: "中文" },
] as const;

const REGIONS = "AE AR AT AU BD BE BR CA CH CL CN CO CZ DE DK EG ES ET FI FR GB GH GR HK HU ID IE IL IN IQ IR IT JO JP KE KR KW KZ LB LK MA MX MY NG NL NO NP NZ OM PE PH PK PL PT QA RO RS RU SA SE SG TH TN TR TW TZ UA UG US UY VN ZA".split(" ");

export const COUNTRIES: string[] = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return REGIONS.map((r) => dn.of(r) ?? r).sort((a, b) => a.localeCompare(b));
  } catch {
    return REGIONS;
  }
})();

export const TIMEZONES: string[] = (() => {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) return fn("timeZone");
  } catch {
    /* ignore */
  }
  return ["UTC", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney"];
})();

export const detectedTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
