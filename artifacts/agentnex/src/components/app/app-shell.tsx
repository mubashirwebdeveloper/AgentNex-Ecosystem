import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Bell, ChevronsLeft, LogOut, Menu, Search, Settings, UserRound, Compass, BellOff } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "./theme-sync";
import { WorkspaceSwitcher } from "@/components/org/org-ui";
import { NAV, EXTRA_SEARCH, type NavItem } from "@/lib/nav";
import { useMe } from "@/hooks/use-account";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const GROUPS = ["Workspace", "Network", "Build", "Account"] as const;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "A";
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
      {GROUPS.map((g) => (
        <div key={g} className="mt-4 first:mt-1">
          {!collapsed && <p className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{g}</p>}
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.group === g).map((n) => (
              <li key={n.slug}><SideLink item={n} active={location === n.href || (n.href !== "/dashboard" && location.startsWith(n.href + "/"))} collapsed={collapsed} onNavigate={onNavigate} /></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SideLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      data-testid={`link-nav-${item.slug}`}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" aria-hidden />}
      <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-cyan")} aria-hidden />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {!item.live && <span className="ml-auto rounded-full border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Soon</span>}
        </>
      )}
      {collapsed && <span className="sr-only">{item.label}{!item.live ? " (coming later)" : ""}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}{!item.live && " · coming later"}</TooltipContent>
    </Tooltip>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("agentnex-sidebar") === "1"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const me = useMe();
  const name = me.data?.displayName || user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Member";
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    try { localStorage.setItem("agentnex-sidebar", collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => { setSearchOpen(false); setLocation(href); };

  return (
    <div className="noise flex min-h-[100dvh] bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>

      <aside className={cn("sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex", collapsed ? "w-[72px]" : "w-[248px]")}>
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
          <Link href="/dashboard" aria-label="AGENTNEX overview" data-testid="link-logo">{collapsed ? <LogoMark /> : <Logo />}</Link>
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="button-sidebar-collapse"
            className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground", collapsed && "justify-center")}
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} aria-hidden />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-[280px] flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigate between AGENTNEX sections</SheetDescription>
          <div className="flex h-16 items-center px-4"><Logo /></div>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:px-6">
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-mobile-menu">
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <WorkspaceSwitcher />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            data-testid="button-open-search"
            className="group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0 group-hover:text-cyan" aria-hidden />
            <span className="truncate">Search pages and modules</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Notifications" data-testid="button-notifications" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground hover:text-foreground">
                  <Bell className="h-4 w-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-4 py-3"><p className="text-sm font-semibold">Notifications</p></div>
                <div className="flex flex-col items-center px-6 py-8 text-center" data-testid="status-notifications-empty">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><BellOff className="h-4 w-4" aria-hidden /></span>
                  <p className="text-sm font-medium">You are all caught up</p>
                  <p className="mt-1 text-xs text-muted-foreground">There are no notifications. Alerts for connections, agents and workflows will arrive as those modules launch.</p>
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Account menu" data-testid="button-profile-menu" className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-1 sm:pr-3 hover:border-primary/50">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan font-display text-[11px] font-bold text-primary-foreground">{initials(name)}</span>
                  <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:inline">{name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setLocation("/profile")} data-testid="menu-profile"><UserRound className="mr-2 h-4 w-4" aria-hidden />My profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation("/settings")} data-testid="menu-settings"><Settings className="mr-2 h-4 w-4" aria-hidden />Settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation("/onboarding")} data-testid="menu-onboarding"><Compass className="mr-2 h-4 w-4" aria-hidden />Onboarding</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut({ redirectUrl: basePath || "/" })} data-testid="menu-logout" className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" aria-hidden />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages and modules..." data-testid="input-search" />
        <CommandList>
          <CommandEmpty>No matching pages. Search covers AGENTNEX navigation and module descriptions only.</CommandEmpty>
          <CommandGroup heading="Available now">
            {[...NAV.filter((n) => n.live), ...EXTRA_SEARCH].map((n) => (
              <CommandItem key={n.href} value={`${n.label} ${n.description}`} onSelect={() => go(n.href)} data-testid={`search-result-${n.href.slice(1)}`}>
                <div className="flex flex-col"><span className="text-sm font-medium">{n.label}</span><span className="text-xs text-muted-foreground">{n.description}</span></div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Coming in later phases">
            {NAV.filter((n) => !n.live).map((n) => (
              <CommandItem key={n.href} value={`${n.label} ${n.description}`} onSelect={() => go(n.href)} data-testid={`search-result-${n.slug}`}>
                <n.icon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                <div className="flex flex-col"><span className="text-sm font-medium">{n.label}</span><span className="text-xs text-muted-foreground">{n.description}</span></div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
